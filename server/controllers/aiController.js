const Resume = require('../models/Resume');
const {
  generateCoverLetter,
  getImprovementSuggestions,
  analyzeResume,
  generateInterviewPrep,
  rateResumeForJob,
  parseJobDetailsFromHtml,
} = require('../services/geminiService');

// @desc    Generate cover letter
// @route   POST /api/ai/cover-letter
// @access  Private
const coverLetter = async (req, res) => {
  try {
    const { resumeId, jobDescription, companyName } = req.body;

    let resumeText = req.body.resumeText || '';

    if (resumeId) {
      const resume = await Resume.findOne({
        _id: resumeId,
        user: req.user._id,
      });
      if (resume && resume.extractedText) {
        resumeText = resume.extractedText;
      }
    }

    if (!resumeText) {
      return res.status(400).json({ message: 'No resume text provided' });
    }

    if (!jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    const result = await generateCoverLetter(
      resumeText,
      jobDescription,
      companyName
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get resume improvement suggestions
// @route   POST /api/ai/improve-resume
// @access  Private
const improveResume = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    let resumeText = req.body.resumeText || '';

    if (resumeId) {
      const resume = await Resume.findOne({
        _id: resumeId,
        user: req.user._id,
      });
      if (resume && resume.extractedText) {
        resumeText = resume.extractedText;
      }
    }

    if (!resumeText) {
      return res.status(400).json({ message: 'No resume text provided' });
    }

    const suggestions = await getImprovementSuggestions(
      resumeText,
      jobDescription
    );

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get match score between resume and job
// @route   POST /api/ai/match-score
// @access  Private
const matchScore = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    let resumeText = req.body.resumeText || '';

    if (resumeId) {
      const resume = await Resume.findOne({
        _id: resumeId,
        user: req.user._id,
      });
      if (resume && resume.extractedText) {
        resumeText = resume.extractedText;
      }
    }

    if (!resumeText) {
      return res.status(400).json({ message: 'No resume text provided' });
    }

    if (!jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    const analysis = await analyzeResume(resumeText, jobDescription);

    res.json({
      matchScore: analysis.matchScore,
      missingKeywords: analysis.missingKeywords,
      presentKeywords: analysis.presentKeywords,
      strengths: analysis.strengths,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate interview prep questions
// @route   POST /api/ai/interview-prep
// @access  Private
const interviewPrep = async (req, res) => {
  try {
    const { resumeId, jobDescription, companyName } = req.body;

    let resumeText = req.body.resumeText || '';

    if (resumeId) {
      const resume = await Resume.findOne({
        _id: resumeId,
        user: req.user._id,
      });
      if (resume && resume.extractedText) {
        resumeText = resume.extractedText;
      }
    }

    if (!resumeText) {
      return res.status(400).json({ message: 'No resume text provided' });
    }

    const questions = await generateInterviewPrep(
      resumeText,
      jobDescription,
      companyName
    );

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rate resume against job + company and generate deep interview prep
// @route   POST /api/ai/rate-and-prep
// @access  Private
const rateAndPrepHandler = async (req, res) => {
  try {
    const { resumeId, jobDescription, companyName, selectBest } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    let resumeText = '';
    let selectedResumeId = resumeId;
    let selectedResumeName = '';

    if (selectBest) {
      // Get all user resumes and find the best match
      const allResumes = await Resume.find({
        user: req.user._id,
        extractedText: { $exists: true, $ne: '' },
      }).select('_id versionLabel extractedText atsScore');

      if (allResumes.length === 0) {
        return res.status(400).json({ message: 'No resumes found. Upload a resume first.' });
      }

      // Quick analysis on each resume to find best match
      let bestScore = -1;
      let bestResume = allResumes[0];

      for (const resume of allResumes) {
        try {
          const analysis = await analyzeResume(resume.extractedText, jobDescription);
          if (analysis.matchScore > bestScore) {
            bestScore = analysis.matchScore;
            bestResume = resume;
          }
        } catch (err) {
          console.error(`Quick analysis failed for ${resume._id}:`, err.message);
        }
      }

      resumeText = bestResume.extractedText;
      selectedResumeId = bestResume._id;
      selectedResumeName = bestResume.versionLabel;
    } else {
      if (!resumeId) {
        // Fall back to primary resume
        const primary = await Resume.findOne({
          user: req.user._id,
          isPrimary: true,
        });
        if (!primary || !primary.extractedText) {
          return res.status(400).json({ message: 'No resume selected. Choose a resume or upload one.' });
        }
        resumeText = primary.extractedText;
        selectedResumeId = primary._id;
        selectedResumeName = primary.versionLabel;
      } else {
        const resume = await Resume.findOne({
          _id: resumeId,
          user: req.user._id,
        });
        if (!resume || !resume.extractedText) {
          return res.status(400).json({ message: 'Resume not found or has no text' });
        }
        resumeText = resume.extractedText;
        selectedResumeName = resume.versionLabel;
      }
    }

    const result = await rateResumeForJob(resumeText, jobDescription, companyName);

    res.json({
      ...result,
      selectedResumeId,
      selectedResumeName,
      selectBestUsed: !!selectBest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Parse job details from URL
// @route   POST /api/ai/parse-job-url
// @access  Private
const parseJobUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // Fetch URL content
    let htmlContent = '';
    let fetchedViaJina = false;

    // Try fetching via Jina Reader first (free scraper designed for LLMs)
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const response = await fetch(jinaUrl, {
        headers: {
          'X-Return-Format': 'text',
        },
      });

      if (response.ok) {
        htmlContent = await response.text();
        fetchedViaJina = true;
      }
    } catch (err) {
      console.warn('Jina Reader fetch failed, falling back to direct fetch:', err.message);
    }

    // Fallback to direct fetch if Jina Reader failed
    if (!htmlContent) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        if (response.ok) {
          htmlContent = await response.text();
        }
      } catch (err) {
        console.error('Direct fetch failed:', err.message);
      }
    }

    if (!htmlContent) {
      return res.status(400).json({
        message: 'Could not fetch job URL directly or via proxy. Please make sure the link is accessible and try again, or paste details manually.',
      });
    }

    // Clean HTML content (remove scripts, styles, SVGs, etc. to save tokens)
    const cleanedHtml = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<path\b[^<]*(?:(?!<\/path>)<[^<]*)*<\/path>/gi, '')
      .replace(/\s+/g, ' ')
      .slice(0, 30000) // limit characters to stay safe with token limits
      .trim();

    if (!cleanedHtml) {
      return res.status(400).json({ message: 'No content found on the page to parse.' });
    }

    const parsedDetails = await parseJobDetailsFromHtml(cleanedHtml);
    res.json(parsedDetails);
  } catch (error) {
    console.error('Parse job URL error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { coverLetter, improveResume, matchScore, interviewPrep, rateAndPrepHandler, parseJobUrl };
