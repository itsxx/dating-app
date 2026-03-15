const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  const token = authHeader.substring(7);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    req.user = decoded;
    next();
  });
}

module.exports = { authenticate };
