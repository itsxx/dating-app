const express = require('express');
const { registerController, loginController, getMeController } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.get('/me', authenticate, getMeController);

module.exports = router;