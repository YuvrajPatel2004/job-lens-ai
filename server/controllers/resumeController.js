const Resume = require('../models/Resume');
const { extractTextFromPDF } = require('../services/resumeParser');
const { analyzeResume, getATSScore } = require('../services/geminiService');
const { logActivity } = require('../services/activityService');
const fs = require('fs');
const path = require('path');

// @desc    Upload resume
// @route   POST /api/resumes/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Extract text from PDF
    let extractedText = '';
    try {
      extractedText = await extractTextFromPDF(req.file.path);
    } catch (err) {
      console.error('Text extraction failed:', err.message);
    }

    // Auto-increment version number
    const existingCount = await Resume.countDocuments({ user: req.user._id });
    const versionNumber = existingCount + 1;

    // If first resume, set as primary
    const isPrimary = existingCount === 0;

    const resume = await Resume.create({
      user: req.user._id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      versionLabel: req.body.versionLabel || `Version ${versionNumber}`,
      versionNumber,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)) : [],
      isPrimary,
      targetRole: req.body.targetRole || '',
      notes: req.body.notes || '',
    });

    // Quick ATS score
    if (extractedText) {
      try {
        const quickScore = await getATSScore(extractedText);
        resume.atsScore = quickScore.score;
        await resume.save();
      } catch (err) {
        console.error('Quick ATS score failed:', err.message);
      }
    }

    await logActivity(req.user._id, {
      type: 'resume_uploaded',
      title: `Resume uploaded: ${resume.versionLabel}`,
      description: `${resume.fileName} (v${versionNumber})`,
      metadata: { resumeId: resume._id, versionLabel: resume.versionLabel },
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all resumes for user
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res) => {
  try {
    const query = { user: req.user._id };

    // Filter by tag
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (req.query.sort === 'version') sortOption = { versionNumber: -1 };
    if (req.query.sort === 'ats') sortOption = { atsScore: -1 };
    if (req.query.sort === 'name') sortOption = { versionLabel: 1 };

    const resumes = await Resume.find(query)
      .sort(sortOption)
      .select('-extractedText');
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const wasPrimary = resume.isPrimary;

    // Delete file from disk
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    await resume.deleteOne();

    // If deleted resume was primary, promote the most recent one
    if (wasPrimary) {
      const latest = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (latest) {
        latest.isPrimary = true;
        await latest.save();
      }
    }

    res.json({ message: 'Resume deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Analyze resume against job description
// @route   POST /api/resumes/:id/analyze
// @access  Private
const analyzeResumeHandler = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (!resume.extractedText) {
      return res
        .status(400)
        .json({ message: 'No text extracted from resume. Please re-upload.' });
    }

    const { jobDescription } = req.body;

    const analysis = await analyzeResume(resume.extractedText, jobDescription);

    resume.analysisResults = {
      matchScore: analysis.matchScore,
      missingKeywords: analysis.missingKeywords,
      presentKeywords: analysis.presentKeywords,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      formatting: analysis.formatting,
      sectionAnalysis: analysis.sectionAnalysis,
    };
    resume.atsScore = analysis.atsScore;
    resume.jobDescription = jobDescription;
    await resume.save();

    await logActivity(req.user._id, {
      type: 'resume_analyzed',
      title: `Resume analyzed: ${resume.versionLabel}`,
      description: `ATS Score: ${analysis.atsScore}, Match Score: ${analysis.matchScore}`,
      metadata: { resumeId: resume._id, atsScore: analysis.atsScore },
    });

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download resume file
// @route   GET /api/resumes/:id/download
// @access  Private
const downloadResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (!fs.existsSync(resume.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(resume.filePath, resume.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set resume as primary
// @route   PATCH /api/resumes/:id/set-primary
// @access  Private
const setPrimaryResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Unset all other primary resumes for this user
    await Resume.updateMany(
      { user: req.user._id, isPrimary: true },
      { isPrimary: false }
    );

    resume.isPrimary = true;
    await resume.save();

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update resume version info
// @route   PUT /api/resumes/:id/version
// @access  Private
const updateResumeVersion = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const { versionLabel, tags, targetRole, notes } = req.body;

    if (versionLabel !== undefined) resume.versionLabel = versionLabel;
    if (tags !== undefined) {
      resume.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (targetRole !== undefined) resume.targetRole = targetRole;
    if (notes !== undefined) resume.notes = notes;

    await resume.save();

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResume,
  deleteResume,
  analyzeResumeHandler,
  downloadResume,
  setPrimaryResume,
  updateResumeVersion,
};
