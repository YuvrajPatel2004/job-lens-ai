const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getModel = () => {
  return getGenAI().getGenerativeModel({ model: 'gemini-3.6-flash' });
};

// Analyze resume against a job description
const analyzeResume = async (resumeText, jobDescription) => {
  const model = getModel();

  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume against the provided job description.

Return your analysis as a JSON object with this exact structure (no markdown, just raw JSON):
{
  "matchScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "missingKeywords": ["keyword1", "keyword2"],
  "presentKeywords": ["keyword1", "keyword2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "formatting": {
    "score": <number 0-100>,
    "issues": ["issue1", "issue2"]
  },
  "sectionAnalysis": {
    "hasContactInfo": <boolean>,
    "hasSummary": <boolean>,
    "hasExperience": <boolean>,
    "hasEducation": <boolean>,
    "hasSkills": <boolean>
  }
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription || 'No specific job description provided. Analyze for general ATS compatibility.'}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  return JSON.parse(jsonMatch[0]);
};

// Get ATS score only (quick analysis)
const getATSScore = async (resumeText) => {
  const model = getModel();

  const prompt = `You are an ATS expert. Rate this resume's ATS compatibility from 0-100.
Consider: keyword density, formatting, section structure, clarity, and readability.

Return ONLY a JSON object (no markdown): {"score": <number>, "summary": "<one sentence>"}

RESUME:
${resumeText}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
};

// Get improvement suggestions
const getImprovementSuggestions = async (resumeText, jobDescription) => {
  const model = getModel();

  const prompt = `You are a professional resume coach. Provide specific, actionable improvement suggestions for this resume.
${jobDescription ? `Target role based on this job description: ${jobDescription}` : ''}

Return ONLY a JSON array of objects (no markdown): 
[{"category": "Content|Format|Keywords|Impact", "priority": "high|medium|low", "suggestion": "<specific actionable suggestion>", "example": "<example of improved text if applicable>"}]

Provide 5-8 suggestions sorted by priority.

RESUME:
${resumeText}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch[0]);
};

// Generate cover letter
const generateCoverLetter = async (resumeText, jobDescription, companyName) => {
  const model = getModel();

  const prompt = `You are an expert career advisor. Write a professional, compelling cover letter based on the candidate's resume and the job description.

Requirements:
- Professional but personable tone
- Highlight relevant experience and skills from the resume
- Show enthusiasm for the role and company
- Keep it concise (3-4 paragraphs)
- Include a strong opening and call to action

Return ONLY a JSON object (no markdown):
{"coverLetter": "<the full cover letter text>", "highlights": ["key point 1", "key point 2", "key point 3"]}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

COMPANY: ${companyName || 'the company'}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
};

// Generate interview prep questions
const generateInterviewPrep = async (resumeText, jobDescription, companyName) => {
  const model = getModel();

  const prompt = `You are an interview coach. Based on the resume and job description, generate likely interview questions and suggested answers.

Return ONLY a JSON array (no markdown):
[{"question": "<question>", "type": "behavioral|technical|situational|general", "suggestedAnswer": "<a strong answer based on the candidate's resume>", "tips": "<brief tips>"}]

Generate 8-10 questions covering different types.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

COMPANY: ${companyName || 'the company'}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch[0]);
};

// Rate resume against a specific job and company (deep analysis)
const rateResumeForJob = async (resumeText, jobDescription, companyName) => {
  const model = getModel();

  const prompt = `You are an elite career coach and hiring expert. Perform a comprehensive analysis of this resume against the job description at ${companyName || 'the company'}.

Return ONLY a JSON object (no markdown, no code blocks):
{
  "overallScore": <number 0-100>,
  "verdict": "<one sentence verdict e.g. 'Strong Match — with targeted improvements you'd be a top candidate'>",
  "keywordGap": {
    "matching": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"]
  },
  "categoryScores": {
    "skillsMatch": { "score": <0-100>, "details": "<1-2 sentences>" },
    "experienceRelevance": { "score": <0-100>, "details": "<1-2 sentences>" },
    "educationFit": { "score": <0-100>, "details": "<1-2 sentences>" },
    "keywordOptimization": { "score": <0-100>, "details": "<1-2 sentences>" },
    "cultureFit": { "score": <0-100>, "details": "<1-2 sentences>" }
  },
  "companyInsights": {
    "overview": "<brief company profile if known, else general industry insight>",
    "culture": ["value1", "value2", "value3"],
    "interviewStyle": "<expected interview process>",
    "tips": "<1-2 sentences of insider tips>"
  },
  "resumeImprovements": [
    {
      "section": "<resume section>",
      "priority": "high" | "medium" | "low",
      "current": "<current text from resume>",
      "suggested": "<improved text>",
      "reason": "<why this improvement matters for this job>"
    }
  ],
  "interviewPrep": {
    "likelyQuestions": [
      {
        "question": "<question>",
        "type": "technical" | "behavioral" | "situational",
        "difficulty": "easy" | "medium" | "hard",
        "suggestedAnswer": "<strong answer based on candidate's resume>",
        "keyPoints": ["point1", "point2"],
        "followUpQuestions": ["follow-up 1"]
      }
    ],
    "talkingPoints": ["<key talking point from resume to emphasize>"],
    "weaknessMitigation": [
      {
        "weakness": "<identified gap>",
        "strategy": "<how to address it>"
      }
    ],
    "questionsToAsk": [
      {
        "question": "<question to ask interviewer>",
        "why": "<why this shows engagement>"
      }
    ]
  }
}

Provide 5-7 resume improvements sorted by priority.
Provide 8-10 interview questions covering all types.
Provide 4-5 talking points, 2-3 weakness mitigations, and 3-4 questions to ask.
Identify 5-10 matched keywords (relevant skills/tools found in both) and 5-10 missing keywords (required skills/tools in the JD that are not in the resume) under "keywordGap".

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

COMPANY: ${companyName || 'Not specified'}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response for resume rating');
  }
  return JSON.parse(jsonMatch[0]);
};

// Extract job details from webpage HTML
const parseJobDetailsFromHtml = async (htmlContent) => {
  const model = getModel();

  const prompt = `You are an expert at extracting structured job details from raw webpage HTML content of a job post.
Analyze the following HTML content and extract the job details.

Return ONLY a JSON object with the following structure (do not include any markdown styling like \`\`\`json, just return raw JSON):
{
  "company": "<company name or null>",
  "position": "<job position/title or null>",
  "description": "<complete job description, requirements, responsibilities, and benefits or null>",
  "location": "<job location or null>",
  "salary": "<salary or compensation range if mentioned, otherwise null>",
  "jobType": "<full-time | part-time | contract | internship | remote | hybrid or null>"
}

HTML CONTENT:
${htmlContent}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response for job details');
  }
  return JSON.parse(jsonMatch[0]);
};

module.exports = {
  analyzeResume,
  getATSScore,
  getImprovementSuggestions,
  generateCoverLetter,
  generateInterviewPrep,
  rateResumeForJob,
  parseJobDetailsFromHtml,
};

