const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'job_created',
        'status_changed',
        'note_added',
        'interview_scheduled',
        'interview_completed',
        'email_detected',
        'follow_up_sent',
        'follow_up_snoozed',
        'follow_up_done',
        'resume_uploaded',
        'resume_analyzed',
        'document_added',
        'offer_received',
        'application_withdrawn',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, job: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
