const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMyProfile, createMyProfile, updateMyProfile, getUserProfile } = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);
router.get('/me', getMyProfile);
router.post('/me', createMyProfile);
router.put('/me', updateMyProfile);
router.get('/:userId', getUserProfile);

module.exports = router;
