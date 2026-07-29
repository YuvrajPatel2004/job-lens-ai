const Resume = require('../models/Resume');
const {
  generateCoverLetter,
  getImprovementSuggestions,
  analyzeResume,
  generateInterviewPrep,
  rateResumeForJob,
  parseJobDetailsFromHtml,
  generateResumeLatex,
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

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Site-specific URL transformations for better scraping
    let scrapingUrl = url;

    // LinkedIn: Rewrite to guest-accessible embed view
    if (hostname.includes('linkedin.com')) {
      const jobIdMatch = url.match(/(?:jobs\/view|currentJobId=)\/?(\d+)/);
      if (jobIdMatch) {
        // LinkedIn embed view is publicly accessible without login
        scrapingUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobIdMatch[1]}`;
      }
    }

    // Naukri: Clean URL to remove login-gated parameters
    if (hostname.includes('naukri.com')) {
      scrapingUrl = url.split('?')[0]; // Remove query parameters that trigger login walls
    }

    let pageContent = '';
    let source = '';

    // Strategy 1: Jina Reader (best for JS-heavy sites)
    try {
      const jinaUrl = `https://r.jina.ai/${scrapingUrl}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const jinaHeaders = {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
        'X-No-Cache': 'true',
      };

      // Support optional Jina API key for higher rate limits
      if (process.env.JINA_API_KEY) {
        jinaHeaders['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
      }

      const response = await fetch(jinaUrl, {
        headers: jinaHeaders,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 200 && !text.includes('Unable to retrieve') && !text.includes('403 Forbidden') && !text.includes('Sign in') && !text.includes('Log in to')) {
          pageContent = text;
          source = 'jina';
        }
      }
    } catch (err) {
      console.warn('Jina Reader fetch failed:', err.message);
    }

    // Strategy 2: Direct fetch (for LinkedIn guest API and simple sites)
    if (!pageContent) {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      ];

      for (const ua of userAgents) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(scrapingUrl, {
            headers: {
              'User-Agent': ua,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
            },
            redirect: 'follow',
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (response.ok) {
            const text = await response.text();
            if (text && text.length > 300) {
              pageContent = text;
              source = 'direct';
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }
    }

    // Strategy 3: Google Webcache fallback (for sites that block direct access)
    if (!pageContent) {
      try {
        const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(cacheUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          const text = await response.text();
          if (text && text.length > 500) {
            pageContent = text;
            source = 'cache';
          }
        }
      } catch (err) {
        console.warn('Google cache fetch failed:', err.message);
      }
    }

    if (!pageContent) {
      return res.status(400).json({
        message: 'Could not fetch content from this job URL. The site may require login or block automated access. Try copying the job description and pasting it manually.',
      });
    }

    // Clean content based on source type
    let cleanedContent;
    if (source === 'jina') {
      cleanedContent = pageContent
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1')
        .slice(0, 50000)
        .trim();
    } else {
      cleanedContent = pageContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<path\b[^<]*(?:(?!<\/path>)<[^<]*)*<\/path>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 50000)
        .trim();
    }

    if (!cleanedContent || cleanedContent.length < 100) {
      return res.status(400).json({ message: 'The page content was too short or empty to extract job details. Try copying the job description and pasting it manually.' });
    }

    const parsedDetails = await parseJobDetailsFromHtml(cleanedContent);

    // Check if all critical fields came back null
    if (!parsedDetails.company && !parsedDetails.position && !parsedDetails.description) {
      return res.status(400).json({
        message: 'Could not extract meaningful job details from this page. The site may require login. Try copying the job description and pasting it manually.',
      });
    }

    res.json(parsedDetails);
  } catch (error) {
    console.error('Parse job URL error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Build resume LaTeX from user data
// @route   POST /api/ai/build-resume
// @access  Private
const buildResume = async (req, res) => {
  try {
    const userData = req.body;
    if (!userData || Object.keys(userData).length === 0) {
      return res.status(400).json({ message: 'User data is required to build a resume' });
    }

    const latex = await generateResumeLatex(userData);
    res.json({ latex });
  } catch (error) {
    console.error('Build resume error:', error.message);
    res.status(500).json({ message: 'Failed to generate resume LaTeX' });
  }
};

// @desc    Compile LaTeX to PDF via latexonline.cc
// @route   POST /api/ai/compile-latex
// @access  Private
const compileLatex = async (req, res) => {
  try {
    const { latex } = req.body;
    if (!latex) {
      return res.status(400).json({ message: 'LaTeX content is required' });
    }

    // Call Formatex API
    const response = await fetch('https://api.formatex.io/api/v1/compile', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.FORMATEX_API_KEY || 'fex_4b6f834a9241ce033a3a151f2a29f87b4a69cc5bca280d69eab894597fc4c5f8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engine: 'pdflatex',
        latex: latex,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LaTeX compilation failed:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return res.status(400).json({ message: errorJson.error || errorJson.message || 'LaTeX compilation failed' });
      } catch (e) {
        return res.status(400).json({ message: `LaTeX compilation failed: ${errorText.slice(0, 300)}` });
      }
    }

    // Pass the PDF directly to the client
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Compile LaTeX error:', error.message);
    res.status(500).json({ message: 'Failed to compile LaTeX to PDF' });
  }
};

module.exports = { coverLetter, improveResume, matchScore, interviewPrep, rateAndPrepHandler, parseJobUrl, buildResume, compileLatex };
