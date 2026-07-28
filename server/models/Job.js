const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide company name'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    position: {
      type: String,
      required: [true, 'Please provide position title'],
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'],
      default: 'saved',
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote', 'hybrid'],
      default: 'full-time',
    },
    location: {
      type: String,
      trim: true,
    },
    salary: {
      type: String,
      trim: true,
    },
    jobUrl: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    companyWebsite: {
      type: String,
      trim: true,
    },
    companyNotes: {
      type: String,
    },
    description: {
      type: String,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    appliedDate: {
      type: Date,
    },
    notes: [noteSchema],
    tags: [String],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    // Follow-up reminder system
    followUp: {
      enabled: { type: Boolean, default: true },
      daysAfterApplying: { type: Number, default: 7 },
      nextFollowUpDate: { type: Date },
      followUpCount: { type: Number, default: 0 },
      lastFollowUpAt: { type: Date },
      snoozedUntil: { type: Date },
      maxFollowUps: { type: Number, default: 3 },
    },
    deadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
jobSchema.index({ user: 1, status: 1, createdAt: -1 });
jobSchema.index({ user: 1, company: 'text', position: 'text' });

module.exports = mongoose.model('Job', jobSchema);
