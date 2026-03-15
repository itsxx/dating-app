const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const db = require('../config/database');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
}

async function registerController(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    const token = generateToken(user.id);

    res.status(201).json({
      data: {
        user: { id: user.id, email: user.email },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    const token = generateToken(user.id);

    res.json({
      data: {
        user: { id: user.id, email: user.email },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMeController(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, email FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerController,
  loginController,
  getMeController,
  generateToken
};
