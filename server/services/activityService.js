const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity event for a user.
 * @param {string} userId - The user's ObjectId
 * @param {Object} data - Activity data
 * @param {string} [data.job] - Optional job ObjectId
 * @param {string} data.type - Activity type enum
 * @param {string} data.title - Short title
 * @param {string} [data.description] - Longer description
 * @param {Object} [data.metadata] - Any extra data
 */
const logActivity = async (userId, { job, type, title, description, metadata }) => {
  try {
    await ActivityLog.create({
      user: userId,
      job: job || null,
      type,
      title,
      description,
      metadata,
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
    // Don't throw — activity logging should never break the main flow
  }
};

module.exports = { logActivity };
