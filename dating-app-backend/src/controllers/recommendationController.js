const recommendationService = require('../services/recommendationService');

async function getRecommendations(req, res, next) {
  try {
    const settings = await recommendationService.getSettings(req.user.userId);
    const recommendations = await recommendationService.getRecommendations(
      req.user.userId,
      settings
    );
    res.json({ data: recommendations });
  } catch (err) {
    next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await recommendationService.getSettings(req.user.userId);
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const settings = await recommendationService.updateSettings(
      req.user.userId,
      req.body
    );
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRecommendations,
  getSettings,
  updateSettings
};
