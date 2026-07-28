const { google } = require('googleapis');
const EmailTracker = require('../models/EmailTracker');
const Job = require('../models/Job');
const { logActivity } = require('./activityService');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];



/**
 * Generate Google OAuth2 authorization URL
 */
const getAuthUrl = async (userId, redirectUri) => {
  let tracker = await EmailTracker.findOne({ user: userId });
  if (!tracker) {
    tracker = new EmailTracker({ user: userId });
  }
  tracker.redirectUri = redirectUri;
  await tracker.save();

  const clientId = tracker.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = tracker.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google Client ID and Client Secret are not configured. Please save your credentials in Settings first.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId.toString(),
    prompt: 'consent',
  });
};

/**
 * Handle OAuth callback — exchange code for tokens
 */
const handleCallback = async (userId, code) => {
  let tracker = await EmailTracker.findOne({ user: userId });
  if (!tracker) {
    tracker = new EmailTracker({ user: userId });
  }

  const clientId = tracker.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = tracker.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google Client ID and Client Secret are not configured. Please save your credentials in Settings first.');
  }

  const redirectUri = tracker.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email-tracker/gmail/callback';

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);

  // Get user email from Gmail profile
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  tracker.gmailConnected = true;
  tracker.gmailAccessToken = tokens.access_token;
  tracker.gmailRefreshToken = tokens.refresh_token || tracker.gmailRefreshToken;
  tracker.gmailEmail = profile.data.emailAddress;
  await tracker.save();

  return tracker;
};

/**
 * Get an authenticated Gmail client for a user
 */
const getGmailClient = async (userId) => {
  const tracker = await EmailTracker.findOne({ user: userId });
  if (!tracker || !tracker.gmailConnected) {
    throw new Error('Gmail not connected');
  }

  const clientId = tracker.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = tracker.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google Client ID and Client Secret are not configured. Please save your credentials in Settings first.');
  }

  const redirectUri = tracker.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email-tracker/gmail/callback';

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({
    access_token: tracker.gmailAccessToken,
    refresh_token: tracker.gmailRefreshToken,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      tracker.gmailAccessToken = tokens.access_token;
      await tracker.save();
    }
  });

  return {
    gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
    tracker,
  };
};

/**
 * Use Gemini AI to classify an email's job application status
 */
const classifyEmailWithAI = async (subject, body) => {
  // Import lazily to avoid circular dependency
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert at analyzing job application emails. Classify the following email and extract information.

Return ONLY a JSON object (no markdown, no code blocks):
{
  "status": "rejected" | "accepted" | "interview" | "follow_up" | "unknown",
  "confidence": <number 0-100>,
  "companyName": "<detected company name or null>",
  "reasoning": "<one sentence explanation>"
}

Classification guide:
- "rejected": Application declined, position filled, not moving forward
- "accepted": Offer made, congratulations, welcome aboard
- "interview": Interview invitation, scheduling, next round
- "follow_up": Request for additional info, assignment, assessment
- "unknown": Marketing emails, newsletters, unrelated

EMAIL SUBJECT: ${subject || 'No subject'}

EMAIL BODY (first 1000 chars): ${(body || '').substring(0, 1000)}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { status: 'unknown', confidence: 0, companyName: null, reasoning: 'Failed to parse' };
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Email classification error:', error.message);
    return { status: 'unknown', confidence: 0, companyName: null, reasoning: 'AI error' };
  }
};

/**
 * Fuzzy match a detected company name to user's tracked jobs
 */
const matchEmailToJob = (companyDetected, jobs) => {
  if (!companyDetected) return null;
  const normalizedCompany = companyDetected.toLowerCase().trim();

  // Exact match
  let match = jobs.find(
    (j) => j.company.toLowerCase().trim() === normalizedCompany
  );
  if (match) return match._id;

  // Partial match (company name contains or is contained by)
  match = jobs.find((j) => {
    const jobCompany = j.company.toLowerCase().trim();
    return (
      jobCompany.includes(normalizedCompany) ||
      normalizedCompany.includes(jobCompany)
    );
  });
  if (match) return match._id;

  return null;
};

/**
 * Map email detected status to job status
 */
const emailStatusToJobStatus = (emailStatus) => {
  const map = {
    rejected: 'rejected',
    accepted: 'offer',
    interview: 'interview',
  };
  return map[emailStatus] || null;
};

/**
 * Sync emails from Gmail for a user
 */
const syncEmails = async (userId) => {
  const { gmail, tracker } = await getGmailClient(userId);

  // Build search query for job-related emails
  const searchQuery =
    'subject:(application OR interview OR offer OR rejection OR position OR role OR opportunity OR hiring OR recruiter OR "thank you for applying" OR "we regret" OR "congratulations" OR "next steps")';

  // Determine date range — either from last sync or last 7 days
  const afterDate = tracker.lastSyncAt
    ? new Date(tracker.lastSyncAt.getTime() - 60000) // 1 minute overlap for safety
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const afterEpoch = Math.floor(afterDate.getTime() / 1000);
  const fullQuery = `${searchQuery} after:${afterEpoch}`;

  // Fetch message list
  let messages = [];
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: fullQuery,
      maxResults: 20,
    });
    messages = response.data.messages || [];
  } catch (error) {
    console.error('Gmail list error:', error.message);
    throw new Error('Failed to fetch emails from Gmail');
  }

  // Get existing message IDs to avoid duplicates
  const existingIds = new Set(
    tracker.trackedEmails.map((e) => e.gmailMessageId)
  );

  // Get user's jobs for matching
  const userJobs = await Job.find({ user: userId }).select('company position status');

  const newEmails = [];

  for (const msg of messages) {
    if (existingIds.has(msg.id)) continue;

    try {
      // Fetch full message
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = fullMsg.data.payload.headers;
      const subject =
        headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '';
      const from =
        headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
      const to =
        headers.find((h) => h.name.toLowerCase() === 'to')?.value || '';
      const dateStr =
        headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

      // Extract body text
      let bodyText = '';
      const extractText = (part) => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
          part.parts.forEach(extractText);
        }
      };
      extractText(fullMsg.data.payload);

      // Fallback to snippet
      if (!bodyText) {
        bodyText = fullMsg.data.snippet || '';
      }

      // Classify with AI
      const classification = await classifyEmailWithAI(subject, bodyText);

      // Skip clearly non-job emails
      if (
        classification.status === 'unknown' &&
        classification.confidence < 20
      ) {
        continue;
      }

      // Match to job
      const matchedJobId = matchEmailToJob(
        classification.companyName,
        userJobs
      );

      const trackedEmail = {
        gmailMessageId: msg.id,
        from,
        to,
        subject,
        snippet: fullMsg.data.snippet || '',
        body: bodyText.substring(0, 2000),
        receivedAt: dateStr ? new Date(dateStr) : new Date(),
        detectedStatus: classification.status,
        confidence: classification.confidence,
        matchedJob: matchedJobId,
        companyDetected: classification.companyName,
        isProcessed: false,
        isRead: false,
      };

      newEmails.push(trackedEmail);
      tracker.trackedEmails.push(trackedEmail);

      // Auto-update job status if enabled and confidence is high
      if (
        tracker.autoUpdateJobStatus &&
        matchedJobId &&
        classification.confidence >= 80
      ) {
        const newJobStatus = emailStatusToJobStatus(classification.status);
        if (newJobStatus) {
          const job = userJobs.find(
            (j) => j._id.toString() === matchedJobId.toString()
          );
          if (job && job.status !== newJobStatus) {
            await Job.findByIdAndUpdate(matchedJobId, {
              status: newJobStatus,
            });
            await logActivity(userId, {
              job: matchedJobId,
              type: 'email_detected',
              title: `Status auto-updated to ${newJobStatus}`,
              description: `Email detected: "${subject}" — AI classified as ${classification.status} (${classification.confidence}% confidence)`,
              metadata: {
                oldStatus: job.status,
                newStatus: newJobStatus,
                emailSubject: subject,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing message ${msg.id}:`, error.message);
    }
  }

  tracker.lastSyncAt = new Date();
  await tracker.save();

  return { newCount: newEmails.length, total: tracker.trackedEmails.length };
};

/**
 * Revoke Gmail access for a user
 */
const revokeAccess = async (userId) => {
  const tracker = await EmailTracker.findOne({ user: userId });
  if (!tracker) return;

  if (tracker.gmailAccessToken) {
    try {
      const clientId = tracker.clientId || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = tracker.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Google Client ID and Client Secret are not configured. Please save your credentials in Settings first.');
      }

      const redirectUri = tracker.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email-tracker/gmail/callback';

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      await oauth2Client.revokeToken(tracker.gmailAccessToken);
    } catch (error) {
      console.error('Token revoke error:', error.message);
    }
  }

  tracker.gmailConnected = false;
  tracker.gmailAccessToken = undefined;
  tracker.gmailRefreshToken = undefined;
  tracker.gmailEmail = undefined;
  tracker.lastSyncAt = undefined;
  await tracker.save();
};

module.exports = {
  getAuthUrl,
  handleCallback,
  syncEmails,
  revokeAccess,
  classifyEmailWithAI,
};
