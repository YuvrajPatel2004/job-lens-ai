const mongoose = require('mongoose');

const trackedEmailSchema = new mongoose.Schema({
  gmailMessageId: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    trim: true,
  },
  to: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
  },
  snippet: {
    type: String,
  },
  body: {
    type: String,
  },
  receivedAt: {
    type: Date,
  },
  detectedStatus: {
    type: String,
    enum: ['rejected', 'accepted', 'interview', 'follow_up', 'unknown'],
    default: 'unknown',
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  matchedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
  },
  companyDetected: {
    type: String,
    trim: true,
  },
  isProcessed: {
    type: Boolean,
    default: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  processedAt: {
    type: Date,
  },
});

const emailTrackerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    gmailConnected: {
      type: Boolean,
      default: false,
    },
    gmailAccessToken: {
      type: String,
    },
    gmailRefreshToken: {
      type: String,
    },
    gmailEmail: {
      type: String,
      trim: true,
    },
    lastSyncAt: {
      type: Date,
    },
    autoUpdateJobStatus: {
      type: Boolean,
      default: true,
    },
    syncFrequencyMinutes: {
      type: Number,
      default: 15,
    },
    clientId: {
      type: String,
    },
    clientSecret: {
      type: String,
    },
    redirectUri: {
      type: String,
    },
    trackedEmails: [trackedEmailSchema],
  },
  {
    timestamps: true,
  }
);

emailTrackerSchema.index({ 'trackedEmails.gmailMessageId': 1 });

module.exports = mongoose.model('EmailTracker', emailTrackerSchema);
