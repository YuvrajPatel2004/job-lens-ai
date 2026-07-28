const express = require('express');
const router = express.Router();
const {
  connectGmail,
  gmailCallback,
  getStatus,
  triggerSync,
  linkEmail,
  dismissEmail,
  updateSettings,
  disconnectGmail,
} = require('../controllers/emailTrackerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/connect-gmail', protect, connectGmail);
router.get('/gmail/callback', gmailCallback); // Public callback
router.get('/status', protect, getStatus);
router.post('/sync', protect, triggerSync);
router.put('/emails/:emailId/link', protect, linkEmail);
router.put('/emails/:emailId/dismiss', protect, dismissEmail);
router.put('/settings', protect, updateSettings);
router.delete('/disconnect', protect, disconnectGmail);

module.exports = router;
