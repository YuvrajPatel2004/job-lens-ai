const express = require('express');
const router = express.Router();
const {
  coverLetter,
  improveResume,
  matchScore,
  interviewPrep,
  rateAndPrepHandler,
  parseJobUrl,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/cover-letter', protect, coverLetter);
router.post('/improve-resume', protect, improveResume);
router.post('/match-score', protect, matchScore);
router.post('/interview-prep', protect, interviewPrep);
router.post('/rate-and-prep', protect, rateAndPrepHandler);
router.post('/parse-job-url', protect, parseJobUrl);

module.exports = router;
