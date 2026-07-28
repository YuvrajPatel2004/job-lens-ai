const EmailTracker = require('../models/EmailTracker');
const Job = require('../models/Job');
const {
  getAuthUrl,
  handleCallback,
  syncEmails,
  revokeAccess,
} = require('../services/gmailService');

// @desc    Get Gmail connect URL
// @route   GET /api/email-tracker/connect-gmail
// @access  Private
const connectGmail = async (req, res) => {
  try {
    const { redirectUri } = req.query;
    if (!redirectUri) {
      return res.status(400).json({ message: 'redirectUri query parameter is required' });
    }
    const url = await getAuthUrl(req.user._id, redirectUri.trim());
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle Gmail OAuth callback
// @route   GET /api/email-tracker/gmail/callback
// @access  Public (has state param with userId)
const gmailCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({ message: 'Invalid callback parameters' });
    }

    await handleCallback(userId, code);

    // Redirect to client email tracker page
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/email-tracker?connected=true`);
  } catch (error) {
    console.error('Gmail callback error:', error.message);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/email-tracker?error=auth_failed`);
  }
};

// @desc    Get email tracker status and tracked emails
// @route   GET /api/email-tracker/status
// @access  Private
const getStatus = async (req, res) => {
  try {
    let tracker = await EmailTracker.findOne({ user: req.user._id });

    if (!tracker) {
      tracker = { gmailConnected: false, trackedEmails: [], lastSyncAt: null };
    }

    // Populate matched jobs
    const populatedEmails = await EmailTracker.findOne({ user: req.user._id })
      ?.populate('trackedEmails.matchedJob', 'company position status');

    const { page = 1, limit = 20 } = req.query;
    const emails = populatedEmails?.trackedEmails || [];
    const sorted = [...emails].sort(
      (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)
    );
    const paginated = sorted.slice(
      (page - 1) * limit,
      page * limit
    );

    // Stats
    const stats = {
      total: emails.length,
      rejected: emails.filter((e) => e.detectedStatus === 'rejected').length,
      accepted: emails.filter((e) => e.detectedStatus === 'accepted').length,
      interview: emails.filter((e) => e.detectedStatus === 'interview').length,
      follow_up: emails.filter((e) => e.detectedStatus === 'follow_up').length,
      unknown: emails.filter((e) => e.detectedStatus === 'unknown').length,
      unprocessed: emails.filter((e) => !e.isProcessed).length,
    };

    res.json({
      gmailConnected: tracker.gmailConnected || false,
      gmailEmail: tracker.gmailEmail || null,
      lastSyncAt: tracker.lastSyncAt || null,
      autoUpdateJobStatus: tracker.autoUpdateJobStatus ?? true,
      clientId: tracker.clientId || '',
      clientSecret: tracker.clientSecret ? '••••••••••••••••' : '',
      trackedEmails: paginated,
      stats,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(emails.length / limit),
        total: emails.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Trigger manual email sync
// @route   POST /api/email-tracker/sync
// @access  Private
const triggerSync = async (req, res) => {
  try {
    const result = await syncEmails(req.user._id);
    res.json({
      message: `Sync complete. ${result.newCount} new emails found.`,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Link tracked email to a job
// @route   PUT /api/email-tracker/emails/:emailId/link
// @access  Private
const linkEmail = async (req, res) => {
  try {
    const { jobId } = req.body;
    const tracker = await EmailTracker.findOne({ user: req.user._id });

    if (!tracker) {
      return res.status(404).json({ message: 'Email tracker not found' });
    }

    const email = tracker.trackedEmails.id(req.params.emailId);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Verify job belongs to user
    if (jobId) {
      const job = await Job.findOne({ _id: jobId, user: req.user._id });
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
    }

    email.matchedJob = jobId || null;
    email.isProcessed = true;
    email.processedAt = new Date();
    await tracker.save();

    res.json(email);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Dismiss tracked email
// @route   PUT /api/email-tracker/emails/:emailId/dismiss
// @access  Private
const dismissEmail = async (req, res) => {
  try {
    const tracker = await EmailTracker.findOne({ user: req.user._id });

    if (!tracker) {
      return res.status(404).json({ message: 'Email tracker not found' });
    }

    const email = tracker.trackedEmails.id(req.params.emailId);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    email.isProcessed = true;
    email.processedAt = new Date();
    await tracker.save();

    res.json(email);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update email tracker settings
// @route   PUT /api/email-tracker/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    let tracker = await EmailTracker.findOne({ user: req.user._id });

    if (!tracker) {
      tracker = new EmailTracker({ user: req.user._id });
    }

    const { autoUpdateJobStatus, syncFrequencyMinutes, clientId, clientSecret } = req.body;

    if (autoUpdateJobStatus !== undefined) {
      tracker.autoUpdateJobStatus = autoUpdateJobStatus;
    }
    if (syncFrequencyMinutes !== undefined) {
      tracker.syncFrequencyMinutes = syncFrequencyMinutes;
    }
    if (clientId !== undefined) {
      tracker.clientId = clientId.trim();
    }
    if (clientSecret !== undefined && clientSecret !== '••••••••••••••••') {
      tracker.clientSecret = clientSecret.trim();
    }

    await tracker.save();

    res.json({
      autoUpdateJobStatus: tracker.autoUpdateJobStatus,
      syncFrequencyMinutes: tracker.syncFrequencyMinutes,
      clientId: tracker.clientId || '',
      clientSecret: tracker.clientSecret ? '••••••••••••••••' : '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Disconnect Gmail
// @route   DELETE /api/email-tracker/disconnect
// @access  Private
const disconnectGmail = async (req, res) => {
  try {
    await revokeAccess(req.user._id);
    res.json({ message: 'Gmail disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  connectGmail,
  gmailCallback,
  getStatus,
  triggerSync,
  linkEmail,
  dismissEmail,
  updateSettings,
  disconnectGmail,
};
