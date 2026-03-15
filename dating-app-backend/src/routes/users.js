const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Placeholder route for users
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Users endpoint - to be implemented' });
});

module.exports = router;