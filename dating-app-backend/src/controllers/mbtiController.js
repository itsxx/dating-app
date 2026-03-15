const { getMBTIQuestions } = require('../utils/mbti');
const { submitMBTI } = require('../services/mbtiService');

async function getQuestions(req, res, next) {
  try {
    const questions = getMBTIQuestions();
    res.json({ data: questions });
  } catch (err) {
    next(err);
  }
}

async function submitAnswers(req, res, next) {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        error: { code: 'MBTI_INVALID_ANSWER', message: 'Answers must be an array' }
      });
    }

    const result = await submitMBTI(req.user.userId, answers);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuestions,
  submitAnswers
};
