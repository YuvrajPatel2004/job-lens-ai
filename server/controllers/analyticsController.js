const Job = require('../models/Job');
const Interview = require('../models/Interview');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard stats
// @route   GET /api/analytics/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalJobs, statusCounts, typeCounts, upcomingInterviews] =
      await Promise.all([
        Job.countDocuments({ user: userId }),
        Job.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Job.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$jobType', count: { $sum: 1 } } },
        ]),
        Interview.countDocuments({
          user: userId,
          scheduledAt: { $gte: new Date() },
          status: 'scheduled',
        }),
      ]);

    // Calculate response rate
    const applied = statusCounts.find((s) => s._id === 'applied')?.count || 0;
    const screening =
      statusCounts.find((s) => s._id === 'screening')?.count || 0;
    const interview =
      statusCounts.find((s) => s._id === 'interview')?.count || 0;
    const offer = statusCounts.find((s) => s._id === 'offer')?.count || 0;
    const rejected =
      statusCounts.find((s) => s._id === 'rejected')?.count || 0;

    const totalApplied = applied + screening + interview + offer + rejected;
    const responded = screening + interview + offer + rejected;
    const responseRate =
      totalApplied > 0 ? Math.round((responded / totalApplied) * 100) : 0;

    res.json({
      totalJobs,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      typeCounts: typeCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      upcomingInterviews,
      responseRate,
      offers: offer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly application trends
// @route   GET /api/analytics/trends
// @access  Private
const getTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await Job.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const formattedTrends = trends.map((t) => ({
      month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
      count: t.count,
    }));

    res.json(formattedTrends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get status distribution
// @route   GET /api/analytics/status-distribution
// @access  Private
const getStatusDistribution = async (req, res) => {
  try {
    const distribution = await Job.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(distribution.map((d) => ({ status: d._id, count: d.count })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent activity
// @route   GET /api/analytics/recent-activity
// @access  Private
const getRecentActivity = async (req, res) => {
  try {
    const recentJobs = await Job.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('company position status updatedAt createdAt');

    const recentInterviews = await Interview.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('job', 'company position')
      .select('type scheduledAt status updatedAt');

    res.json({ recentJobs, recentInterviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get global activity feed
// @route   GET /api/analytics/activity-feed
// @access  Private
const getActivityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      ActivityLog.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('job', 'company position'),
      ActivityLog.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      activities,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get timeline for a specific job
// @route   GET /api/analytics/job-timeline/:jobId
// @access  Private
const getJobTimeline = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify job belongs to user
    const job = await Job.findOne({ _id: jobId, user: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const activities = await ActivityLog.find({
      user: req.user._id,
      job: jobId,
    }).sort({ createdAt: 1 }); // chronological order

    // Also get interviews for this job
    const interviews = await Interview.find({
      user: req.user._id,
      job: jobId,
    }).sort({ scheduledAt: 1 });

    res.json({ activities, interviews, job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats,
  getTrends,
  getStatusDistribution,
  getRecentActivity,
  getActivityFeed,
  getJobTimeline,
};
