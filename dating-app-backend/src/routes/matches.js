const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendLike, getLikes, getMatches, deleteMatch } = require('../controllers/matchController');

const router = express.Router();

router.use(authenticate);
router.post('/likes', sendLike);
router.get('/likes/received', getLikes);
router.get('/', getMatches);
router.delete('/:id', deleteMatch);

module.exports = router;
