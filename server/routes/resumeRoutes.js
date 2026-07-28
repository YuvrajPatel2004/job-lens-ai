const express = require('express');
const router = express.Router();
const {
  uploadResume,
  getResumes,
  getResume,
  deleteResume,
  analyzeResumeHandler,
  downloadResume,
  setPrimaryResume,
  updateResumeVersion,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router
  .route('/')
  .get(protect, getResumes)
  .post(protect, upload.single('resume'), uploadResume);

router
  .route('/:id')
  .get(protect, getResume)
  .delete(protect, deleteResume);

router.post('/:id/analyze', protect, analyzeResumeHandler);
router.get('/:id/download', protect, downloadResume);
router.patch('/:id/set-primary', protect, setPrimaryResume);
router.put('/:id/version', protect, updateResumeVersion);

module.exports = router;
