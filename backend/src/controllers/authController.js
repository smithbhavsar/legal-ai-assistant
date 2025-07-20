const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        badgeNumber,
        departmentId,
        role = 'officer'
      } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: 'Email, password, first name, and last name are required',
        });
      }

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'User already exists with this email',
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userResult = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, badge_number, role, department_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, first_name, last_name, role, badge_number, department_id, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName, badgeNumber, role, departmentId]
      );

      const user = userResult.rows[0];

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          badgeNumber: user.badge_number,
          departmentId: user.department_id,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration',
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      // Find user with department info
      const userResult = await query(
        `SELECT u.*, d.name as department_name, d.code as department_code
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.email = $1 AND u.is_active = true`,
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        logger.warn('Failed login attempt', {
          email: email,
          ip: req.ip,
        });
        
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      // Store session in database
      await query(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [user.id, token]
      );

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          badgeNumber: user.badge_number,
          department: user.department_name ? {
            id: user.department_id,
            name: user.department_name,
            code: user.department_code,
          } : null,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login',
      });
    }
  }

  async logout(req, res) {
    try {
      const token = req.headers.authorization?.substring(7);
      
      if (token) {
        // Remove session from database
        await query(
          'DELETE FROM user_sessions WHERE token_hash = $1',
          [token]
        );
      }

      logger.info('User logged out', { userId: req.user?.id });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error during logout',
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userResult = await query(
        `SELECT u.*, d.name as department_name, d.code as department_code, d.jurisdiction, d.state
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      const user = userResult.rows[0];

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          badgeNumber: user.badge_number,
          department: user.department_name ? {
            id: user.department_id,
            name: user.department_name,
            code: user.department_code,
            jurisdiction: user.jurisdiction,
            state: user.state,
          } : null,
          lastLogin: user.last_login_at,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async getDepartments(req, res) {
    try {
      const departmentsResult = await query(
        'SELECT id, name, code, jurisdiction, state FROM departments ORDER BY name'
      );

      res.json({
        departments: departmentsResult.rows,
      });
    } catch (error) {
      logger.error('Get departments error:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

module.exports = new AuthController();
