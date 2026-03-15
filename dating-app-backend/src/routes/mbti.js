const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getQuestions, submitAnswers } = require('../controllers/mbtiController');

const router = express.Router();

router.use(authenticate);
router.get('/questions', getQuestions);
router.post('/submit', submitAnswers);

module.exports = router;
