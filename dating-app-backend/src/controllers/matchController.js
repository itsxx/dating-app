const matchService = require('../services/matchService');

async function sendLike(req, res, next) {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'targetUserId is required' }
      });
    }

    const result = await matchService.sendLike(req.user.userId, targetUserId);
    res.json({ data: result });
  } catch (err) {
    if (err.message === 'Already liked this user') {
      return res.status(400).json({
        error: { code: 'MATCH_ALREADY_LIKED', message: '您已经喜欢过这位用户了，等待缘分发生吧～' }
      });
    }
    next(err);
  }
}

async function getLikes(req, res, next) {
  try {
    const likes = await matchService.getLikes(req.user.userId);
    res.json({ data: likes });
  } catch (err) {
    next(err);
  }
}

async function getMatches(req, res, next) {
  try {
    const matches = await matchService.getMatches(req.user.userId);
    res.json({ data: matches });
  } catch (err) {
    next(err);
  }
}

async function deleteMatch(req, res, next) {
  try {
    await matchService.deleteMatch(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendLike,
  getLikes,
  getMatches,
  deleteMatch
};
