const db = require('../config/database');
const { getComplementaryZodiac } = require('../utils/zodiac');
const { getComplementaryMBTI } = require('../utils/mbti');
const { NotFoundError } = require('../middleware/errorHandler');
const crypto = require('crypto');

function generateUUID() {
  return crypto.randomUUID();
}

async function getRecommendations(userId, settings = {}) {
  const { zodiacFilter, mbtiFilter, sortBy = 'birthday' } = settings;

  // Get current user's profile
  const userResult = await db.query(
    'SELECT birthday, mbti_type, zodiac_sign FROM profiles WHERE user_id = ?',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User profile not found');
  }

  const user = userResult.rows[0];
  const filters = [];
  const values = [userId, userId];

  // Apply zodiac filter
  if (zodiacFilter === 'same') {
    filters.push(`zodiac_sign = ?`);
    values.push(user.zodiac_sign);
  } else if (zodiacFilter === 'complementary') {
    const complements = getComplementaryZodiac(user.zodiac_sign);
    const placeholders = complements.map(() => '?').join(',');
    filters.push(`zodiac_sign IN (${placeholders})`);
    values.push(...complements);
  }

  // Apply MBTI filter
  if (mbtiFilter === 'same') {
    filters.push(`mbti_type = ?`);
    values.push(user.mbti_type);
  } else if (mbtiFilter === 'complementary') {
    const complement = getComplementaryMBTI(user.mbti_type);
    filters.push(`mbti_type = ?`);
    values.push(complement);
  }

  // Build order by clause
  let orderBy = '';
  if (sortBy === 'birthday') {
    orderBy = `ABS(julianday(birthday) - julianday(?))`;
    values.push(user.birthday);
  } else if (sortBy === 'zodiac') {
    orderBy = `CASE WHEN zodiac_sign = '${user.zodiac_sign}' THEN 0 ELSE 1 END`;
  } else if (sortBy === 'mbti') {
    orderBy = `CASE WHEN mbti_type = '${user.mbti_type}' THEN 0 ELSE 1 END`;
  }

  const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

  const query = `
    SELECT user_id, display_name, avatar_url, bio, birthday, mbti_type, zodiac_sign
    FROM profiles
    WHERE user_id != ?
    AND user_id NOT IN (
      SELECT DISTINCT CASE
        WHEN user1_id = ? THEN user2_id
        ELSE user1_id
      END FROM matches
    )
    AND user_id NOT IN (
      SELECT receiver_id FROM likes WHERE sender_id = ?
    )
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 20
  `;

  const result = await db.query(query, values);
  return result.rows;
}

async function getSettings(userId) {
  const result = await db.query(
    'SELECT * FROM recommendation_settings WHERE user_id = ?',
    [userId]
  );

  return result.rows[0] || {
    user_id: userId,
    zodiac_filter: 'none',
    mbti_filter: 'none',
    sort_by: 'birthday'
  };
}

async function updateSettings(userId, settings) {
  const { zodiacFilter, mbtiFilter, sortBy } = settings;

  // Check if settings exist
  const existing = await db.query(
    'SELECT * FROM recommendation_settings WHERE user_id = ?',
    [userId]
  );

  if (existing.rows.length > 0) {
    await db.query(
      `UPDATE recommendation_settings
       SET zodiac_filter = ?, mbti_filter = ?, sort_by = ?, updated_at = datetime('now')
       WHERE user_id = ?`,
      [zodiacFilter || 'none', mbtiFilter || 'none', sortBy || 'birthday', userId]
    );
  } else {
    await db.query(
      `INSERT INTO recommendation_settings (user_id, zodiac_filter, mbti_filter, sort_by)
       VALUES (?, ?, ?, ?)`,
      [userId, zodiacFilter || 'none', mbtiFilter || 'none', sortBy || 'birthday']
    );
  }

  return {
    user_id: userId,
    zodiac_filter: zodiacFilter || 'none',
    mbti_filter: mbtiFilter || 'none',
    sort_by: sortBy || 'birthday'
  };
}

module.exports = {
  getRecommendations,
  getSettings,
  updateSettings
};
