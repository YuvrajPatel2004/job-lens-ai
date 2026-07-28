const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'behavioral', 'panel', 'hr', 'other'],
      default: 'video',
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Please provide interview date and time'],
    },
    duration: {
      type: Number, // minutes
      default: 60,
    },
    location: {
      type: String,
      trim: true,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    interviewerName: {
      type: String,
      trim: true,
    },
    interviewerEmail: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    feedback: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    reminder: {
      type: Boolean,
      default: true,
    },
    reminderSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ user: 1, scheduledAt: 1 });
interviewSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
