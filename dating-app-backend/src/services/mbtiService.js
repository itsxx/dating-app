const db = require('../config/database');
const { calculateMBTI } = require('../utils/mbti');
const { ValidationError } = require('../middleware/errorHandler');
const { updateProfile } = require('./userService');

async function submitMBTI(userId, answers) {
  const result = calculateMBTI(answers);

  await db.query(
    `INSERT INTO mbti_tests (user_id, answers, result_type)
     VALUES (?, ?, ?)`,
    [userId, JSON.stringify(answers), result]
  );

  const profile = await updateProfile(userId, { mbtiType: result });

  return { mbtiType: result, profile };
}

module.exports = {
  submitMBTI
};
