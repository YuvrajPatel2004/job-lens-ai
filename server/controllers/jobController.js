const Job = require('../models/Job');
const User = require('../models/User');
const { logActivity } = require('../services/activityService');

// @desc    Get all jobs for user
// @route   GET /api/jobs
// @access  Private
const getJobs = async (req, res) => {
  try {
    const {
      status,
      jobType,
      priority,
      search,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { user: req.user._id };

    // Filters
    if (status && status !== 'all') query.status = status;
    if (jobType && jobType !== 'all') query.jobType = jobType;
    if (priority && priority !== 'all') query.priority = priority;

    // Search
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'company-az') sortOption = { company: 1 };
    if (sort === 'company-za') sortOption = { company: -1 };
    if (sort === 'position-az') sortOption = { position: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('resume', 'fileName versionLabel versionNumber');

    res.json({
      jobs,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
const getJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id }).populate('resume', 'fileName versionLabel versionNumber');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
const createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      user: req.user._id,
    };

    // Auto-calculate follow-up date if status is 'applied'
    if (jobData.status === 'applied') {
      if (!jobData.appliedDate) jobData.appliedDate = new Date();
      const days = jobData.followUp?.daysAfterApplying || 7;
      jobData.followUp = {
        ...jobData.followUp,
        enabled: true,
        daysAfterApplying: days,
        nextFollowUpDate: new Date(
          (jobData.appliedDate ? new Date(jobData.appliedDate) : new Date()).getTime() +
            days * 24 * 60 * 60 * 1000
        ),
        followUpCount: 0,
        maxFollowUps: 3,
      };
    }

    const job = await Job.create(jobData);

    await logActivity(req.user._id, {
      job: job._id,
      type: 'job_created',
      title: `Added ${job.position} at ${job.company}`,
      description: `Status: ${job.status}`,
      metadata: { company: job.company, position: job.position, status: job.status },
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await job.deleteOne();
    res.json({ message: 'Job removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update job status
// @route   PATCH /api/jobs/:id/status
// @access  Private
const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const oldStatus = job.status;
    job.status = status;

    if (status === 'applied' && !job.appliedDate) {
      job.appliedDate = new Date();
      // Set up follow-up
      const days = job.followUp?.daysAfterApplying || 7;
      job.followUp = {
        ...job.followUp?.toObject?.() || {},
        enabled: true,
        daysAfterApplying: days,
        nextFollowUpDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        followUpCount: 0,
        maxFollowUps: job.followUp?.maxFollowUps || 3,
      };
    }

    // Clear follow-up for terminal statuses
    if (['offer', 'rejected', 'withdrawn'].includes(status)) {
      job.followUp = { ...job.followUp?.toObject?.() || {}, enabled: false, nextFollowUpDate: null };
    }

    await job.save();

    await logActivity(req.user._id, {
      job: job._id,
      type: 'status_changed',
      title: `${job.company}: ${oldStatus} → ${status}`,
      description: `${job.position} status updated`,
      metadata: { oldStatus, newStatus: status, company: job.company },
    });

    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add note to job
// @route   POST /api/jobs/:id/notes
// @access  Private
const addNote = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.notes.push({ text: req.body.text });
    await job.save();

    await logActivity(req.user._id, {
      job: job._id,
      type: 'note_added',
      title: `Note added to ${job.company}`,
      description: req.body.text.substring(0, 100),
    });

    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete note from job
// @route   DELETE /api/jobs/:id/notes/:noteId
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.notes = job.notes.filter(
      (note) => note._id.toString() !== req.params.noteId
    );
    await job.save();

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get follow-up queue (jobs due for follow-up)
// @route   GET /api/jobs/follow-ups
// @access  Private
const getFollowUpQueue = async (req, res) => {
  try {
    const now = new Date();
    const jobs = await Job.find({
      user: req.user._id,
      status: 'applied',
      'followUp.enabled': true,
      'followUp.nextFollowUpDate': { $lte: now },
      $or: [
        { 'followUp.snoozedUntil': null },
        { 'followUp.snoozedUntil': { $lte: now } },
      ],
    })
      .sort({ 'followUp.nextFollowUpDate': 1 })
      .select('company position status appliedDate followUp');

    // Calculate days since applied
    const enriched = jobs.map((job) => {
      const obj = job.toObject();
      obj.daysSinceApplied = job.appliedDate
        ? Math.floor((now - new Date(job.appliedDate)) / (1000 * 60 * 60 * 24))
        : 0;
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Snooze follow-up for N days
// @route   PATCH /api/jobs/:id/follow-up/snooze
// @access  Private
const snoozeFollowUp = async (req, res) => {
  try {
    const { days = 3 } = req.body;
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.followUp.snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await job.save();

    await logActivity(req.user._id, {
      job: job._id,
      type: 'follow_up_snoozed',
      title: `Follow-up snoozed: ${job.company}`,
      description: `Snoozed for ${days} days`,
    });

    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark follow-up as done
// @route   PATCH /api/jobs/:id/follow-up/done
// @access  Private
const markFollowedUp = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.followUp.followUpCount = (job.followUp.followUpCount || 0) + 1;
    job.followUp.lastFollowUpAt = new Date();
    job.followUp.snoozedUntil = null;

    // Calculate next follow-up date (if under max)
    if (job.followUp.followUpCount < (job.followUp.maxFollowUps || 3)) {
      const days = job.followUp.daysAfterApplying || 7;
      job.followUp.nextFollowUpDate = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000
      );
    } else {
      job.followUp.enabled = false;
      job.followUp.nextFollowUpDate = null;
    }

    await job.save();

    await logActivity(req.user._id, {
      job: job._id,
      type: 'follow_up_done',
      title: `Follow-up completed: ${job.company}`,
      description: `Follow-up #${job.followUp.followUpCount}`,
    });

    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  addNote,
  deleteNote,
  getFollowUpQueue,
  snoozeFollowUp,
  markFollowedUp,
};
