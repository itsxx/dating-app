const userService = require('../services/userService');
const db = require('../config/database');

async function getMyProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.userId);

    if (!profile) {
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' }
      });
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function createMyProfile(req, res, next) {
  try {
    const profile = await userService.createProfile(req.user.userId, req.body);
    res.status(201).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const profile = await userService.updateProfile(req.user.userId, req.body);

    if (!profile) {
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' }
      });
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function getUserProfile(req, res, next) {
  try {
    const result = await db.query(
      `SELECT display_name, avatar_url, bio, birthday, mbti_type, zodiac_sign
       FROM profiles WHERE user_id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  getUserProfile
};
