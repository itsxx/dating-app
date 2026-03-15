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

  const row = result.rows[0];
  if (!row) return null;

  // 将数据库字段映射为前端期望的字段名
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.display_name || '',
    avatar: row.avatar_url || '',
    bio: row.bio || '',
    birthday: row.birthday || '',
    mbtiType: row.mbti_type || '',
    zodiac: row.zodiac_sign || '',
    email: row.email,
    age: row.age || null,
    gender: row.gender || '',
  };
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

  if (updates.birthday !== undefined) {
    fields.push(`birthday = ?`);
    values.push(updates.birthday);
  }

  // age 和 gender 字段在当前数据库结构中不存在，忽略它们

  if (fields.length === 0) {
    throw new ValidationError('没有要更新的字段');
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
