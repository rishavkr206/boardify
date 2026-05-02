const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { getBoardAnalytics } = require('../controllers/analytics.controller');

router.get('/boards/:boardId/analytics', requireAuth, getBoardAnalytics);

module.exports = router;
