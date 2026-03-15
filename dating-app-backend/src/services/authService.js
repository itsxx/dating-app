const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { ValidationError } = require('../middleware/errorHandler');

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

async function register(email, password) {
  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (!validatePassword(password)) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('Email already registered', { code: 'AUTH_USER_EXISTS' });
  }

  const passwordHash = await hashPassword(password);

  const result = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash]
  );

  return result.rows[0];
}

async function login(email, password) {
  const result = await db.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
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
