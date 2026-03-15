const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getRecommendations, getSettings, updateSettings } = require('../controllers/recommendationController');

const router = express.Router();

router.use(authenticate);
router.get('/', getRecommendations);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
