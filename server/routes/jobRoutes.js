const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  addNote,
  deleteNote,
  getFollowUpQueue,
  snoozeFollowUp,
  markFollowedUp,
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

// Follow-up routes (must be before /:id to avoid conflicts)
router.get('/follow-ups', protect, getFollowUpQueue);

router.route('/').get(protect, getJobs).post(protect, createJob);
router
  .route('/:id')
  .get(protect, getJob)
  .put(protect, updateJob)
  .delete(protect, deleteJob);
router.patch('/:id/status', protect, updateJobStatus);
router
  .route('/:id/notes')
  .post(protect, addNote);
router.delete('/:id/notes/:noteId', protect, deleteNote);
router.patch('/:id/follow-up/snooze', protect, snoozeFollowUp);
router.patch('/:id/follow-up/done', protect, markFollowedUp);

module.exports = router;
