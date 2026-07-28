const Interview = require('../models/Interview');
const Job = require('../models/Job');

// @desc    Get all interviews for user
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (upcoming === 'true') {
      query.scheduledAt = { $gte: new Date() };
      query.status = 'scheduled';
    }

    const interviews = await Interview.find(query)
      .populate('job', 'company position status')
      .sort({ scheduledAt: 1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('job', 'company position status jobUrl');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create interview
// @route   POST /api/interviews
// @access  Private
const createInterview = async (req, res) => {
  try {
    // Verify job belongs to user
    const job = await Job.findOne({
      _id: req.body.job,
      user: req.user._id,
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const interview = await Interview.create({
      ...req.body,
      user: req.user._id,
    });

    // Update job status to interview if not already
    if (!['interview', 'offer'].includes(job.status)) {
      job.status = 'interview';
      await job.save();
    }

    const populated = await interview.populate('job', 'company position status');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const updated = await Interview.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('job', 'company position status');

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private
const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    await interview.deleteOne();
    res.json({ message: 'Interview removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add feedback to interview
// @route   PATCH /api/interviews/:id/feedback
// @access  Private
const addFeedback = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.feedback = req.body.feedback;
    interview.rating = req.body.rating;
    interview.status = 'completed';
    await interview.save();

    const populated = await interview.populate('job', 'company position status');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  addFeedback,
};
