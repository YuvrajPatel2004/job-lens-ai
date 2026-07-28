const express = require('express');
const router = express.Router();
const {
  getStats,
  getTrends,
  getStatusDistribution,
  getRecentActivity,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/trends', protect, getTrends);
router.get('/status-distribution', protect, getStatusDistribution);
router.get('/recent-activity', protect, getRecentActivity);

module.exports = router;
