const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    extractedText: {
      type: String,
    },
    // Version management fields
    versionLabel: {
      type: String,
      default: 'Default',
      trim: true,
      maxlength: [60, 'Version label cannot exceed 60 characters'],
    },
    versionNumber: {
      type: Number,
      default: 1,
    },
    tags: [{ type: String, trim: true }],
    isPrimary: {
      type: Boolean,
      default: false,
    },
    targetRole: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    analysisResults: {
      matchScore: Number,
      missingKeywords: [String],
      presentKeywords: [String],
      strengths: [String],
      weaknesses: [String],
      suggestions: [String],
      formatting: {
        score: Number,
        issues: [String],
      },
      sectionAnalysis: {
        hasContactInfo: Boolean,
        hasSummary: Boolean,
        hasExperience: Boolean,
        hasEducation: Boolean,
        hasSkills: Boolean,
      },
    },
    jobDescription: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

resumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
