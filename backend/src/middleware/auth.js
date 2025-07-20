const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      // Check if session exists in database
      const sessionResult = await query(
        'SELECT us.*, u.email, u.first_name, u.last_name, u.role, u.department_id FROM user_sessions us JOIN users u ON us.user_id = u.id WHERE us.token_hash = $1 AND us.expires_at > NOW()',
        [token]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid or expired session.',
        });
      }

      const user = sessionResult.rows[0];
      
      // Update last used timestamp
      await query(
        'UPDATE user_sessions SET last_used_at = NOW() WHERE token_hash = $1',
        [token]
      );

      req.user = {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        departmentId: user.department_id,
      };

      next();
    } catch (jwtError) {
      logger.error('JWT verification error:', jwtError.message);
      return res.status(401).json({
        error: 'Invalid token.',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication.',
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient privileges.',
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
};
