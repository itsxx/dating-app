const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const { ValidationError } = require('../middleware/errorHandler');

function generateUUID() {
  return crypto.randomUUID();
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

function getPasswordValidationError() {
  return '密码至少需要 8 位';
}

async function register(email, password) {
  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (!validatePassword(password)) {
    throw new ValidationError(getPasswordValidationError());
  }

  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('Email already registered', { code: 'AUTH_USER_EXISTS' });
  }

  const passwordHash = await hashPassword(password);
  const userId = generateUUID();

  const result = await db.query(
    'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
    [userId, email, passwordHash]
  );

  // 自动创建默认 profile
  await db.query(
    'INSERT INTO profiles (id, user_id, display_name, bio, zodiac_sign) VALUES (?, ?, ?, ?, ?)',
    [generateUUID(), userId, '', '', '']
  );

  return { id: userId, email };
}

async function login(email, password) {
  const result = await db.query(
    'SELECT id, email, password_hash FROM users WHERE email = ?',
    [email]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('Invalid email or password', { code: 'AUTH_INVALID_CREDENTIALS' });
  }

  const user = result.rows[0];
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    throw new ValidationError('Invalid email or password', { code: 'AUTH_INVALID_CREDENTIALS' });
  }

  // 检查是否存在 profile，不存在则创建
  const profileCheck = await db.query('SELECT id FROM profiles WHERE user_id = ?', [user.id]);
  if (profileCheck.rows.length === 0) {
    await db.query(
      'INSERT INTO profiles (id, user_id, display_name, bio, zodiac_sign, birthday) VALUES (?, ?, ?, ?, ?, ?)',
      [generateUUID(), user.id, '', '', '', '2000-01-01']
    );
  }

  return { id: user.id, email: user.email };
}

module.exports = {
  register,
  login,
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePassword
};
