const db = require('../config/database');
const { getComplementaryZodiac } = require('../utils/zodiac');
const { getComplementaryMBTI } = require('../utils/mbti');
const { NotFoundError } = require('../middleware/errorHandler');

async function getRecommendations(userId, settings = {}) {
  const { zodiacFilter, mbtiFilter, sortBy = 'birthday' } = settings;

  // Get current user's profile
  const userResult = await db.query(
    'SELECT birthday, mbti_type, zodiac_sign FROM profiles WHERE user_id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User profile not found');
  }

  const user = userResult.rows[0];
  const filters = [];
  const values = [userId, userId];
  let paramIndex = 3;

  // Apply zodiac filter
  if (zodiacFilter === 'same') {
    filters.push(`zodiac_sign = $${paramIndex++}`);
    values.push(user.zodiac_sign);
  } else if (zodiacFilter === 'complementary') {
    const complements = getComplementaryZodiac(user.zodiac_sign);
    filters.push(`zodiac_sign = ANY($${paramIndex++}::text[])`);
    values.push(complements);
  }

  // Apply MBTI filter
  if (mbtiFilter === 'same') {
    filters.push(`mbti_type = $${paramIndex++}`);
    values.push(user.mbti_type);
  } else if (mbtiFilter === 'complementary') {
    const complement = getComplementaryMBTI(user.mbti_type);
    filters.push(`mbti_type = $${paramIndex++}`);
    values.push(complement);
  }

  // Build order by clause
  let orderBy = '';
  if (sortBy === 'birthday') {
    orderBy = `ABS(EXTRACT(EPOCH FROM (birthday - $${paramIndex++})))`;
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
    WHERE user_id != $1
    AND user_id NOT IN (
      SELECT DISTINCT CASE
        WHEN user1_id = $2 THEN user2_id
        ELSE user1_id
      END FROM matches
    )
    AND user_id NOT IN (
      SELECT receiver_id FROM likes WHERE sender_id = $2
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
    'SELECT * FROM recommendation_settings WHERE user_id = $1',
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

  const result = await db.query(
    `INSERT INTO recommendation_settings (user_id, zodiac_filter, mbti_filter, sort_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id)
     UPDATE SET zodiac_filter = $2, mbti_filter = $3, sort_by = $4, updated_at = NOW()
     RETURNING *`,
    [userId, zodiacFilter || 'none', mbtiFilter || 'none', sortBy || 'birthday']
  );

  return result.rows[0];
}

module.exports = {
  getRecommendations,
  getSettings,
  updateSettings
};
