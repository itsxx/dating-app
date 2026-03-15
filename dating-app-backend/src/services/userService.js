const db = require('../config/database');
const { getZodiacSign } = require('../utils/zodiac');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

async function getProfile(userId) {
  const result = await db.query(
    `SELECT p.*, u.email
     FROM profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

async function createProfile(userId, profileData) {
  const { displayName, bio, birthday, mbtiType } = profileData;

  if (!birthday) {
    throw new ValidationError('Birthday is required');
  }

  const zodiacSign = getZodiacSign(birthday);

  const result = await db.query(
    `INSERT INTO profiles (user_id, display_name, bio, birthday, mbti_type, zodiac_sign)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, displayName, bio, birthday, mbtiType, zodiacSign]
  );

  return result.rows[0];
}

async function updateProfile(userId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.displayName !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(updates.displayName);
  }

  if (updates.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(updates.bio);
  }

  if (updates.mbtiType !== undefined) {
    fields.push(`mbti_type = $${paramIndex++}`);
    values.push(updates.mbtiType);
  }

  if (updates.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(updates.avatarUrl);
  }

  if (fields.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(userId);
  const query = `
    UPDATE profiles
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE user_id = $${paramIndex}
    RETURNING *
  `;

  const result = await db.query(query, values);
  return result.rows[0] || null;
}

module.exports = {
  getProfile,
  createProfile,
  updateProfile
};
