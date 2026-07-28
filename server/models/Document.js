const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
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
      enum: ['cover_letter', 'offer_letter', 'contract', 'referral', 'portfolio', 'other'],
      default: 'other',
    },
    title: {
      type: String,
      required: [true, 'Please provide a document title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
    },
    fileName: {
      type: String,
    },
    filePath: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    tags: [{ type: String, trim: true }],
    isGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, job: 1 });
documentSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Document', documentSchema);
