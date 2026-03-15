const db = require('../config/database');
const crypto = require('crypto');
const { getZodiacSign } = require('../utils/zodiac');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

function generateUUID() {
  return crypto.randomUUID();
}

async function getProfile(userId) {
  const result = await db.query(
    `SELECT p.*, u.email
     FROM profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ?`,
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
  const profileId = generateUUID();

  const result = await db.query(
    `INSERT INTO profiles (id, user_id, display_name, bio, birthday, mbti_type, zodiac_sign)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [profileId, userId, displayName, bio || '', birthday, mbtiType || null, zodiacSign]
  );

  return {
    id: profileId,
    user_id: userId,
    display_name: displayName,
    avatar_url: null,
    bio: bio || '',
    birthday: birthday,
    mbti_type: mbtiType || null,
    zodiac_sign: zodiacSign
  };
}

async function updateProfile(userId, updates) {
  const fields = [];
  const values = [];

  if (updates.displayName !== undefined) {
    fields.push(`display_name = ?`);
    values.push(updates.displayName);
  }

  if (updates.bio !== undefined) {
    fields.push(`bio = ?`);
    values.push(updates.bio);
  }

  if (updates.mbtiType !== undefined) {
    fields.push(`mbti_type = ?`);
    values.push(updates.mbtiType);
  }

  if (updates.avatarUrl !== undefined) {
    fields.push(`avatar_url = ?`);
    values.push(updates.avatarUrl);
  }

  if (fields.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(userId);
  const query = `
    UPDATE profiles
    SET ${fields.join(', ')}, updated_at = datetime('now')
    WHERE user_id = ?
  `;

  await db.query(query, values);

  // Fetch updated profile
  const updated = await getProfile(userId);
  return updated;
}

module.exports = {
  getProfile,
  createProfile,
  updateProfile
};
