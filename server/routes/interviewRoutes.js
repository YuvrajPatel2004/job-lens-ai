const express = require('express');
const router = express.Router();
const {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  addFeedback,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getInterviews).post(protect, createInterview);
router
  .route('/:id')
  .get(protect, getInterview)
  .put(protect, updateInterview)
  .delete(protect, deleteInterview);
router.patch('/:id/feedback', protect, addFeedback);

module.exports = router;
