const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

router.use(authMiddleware);

// Analytics for supervisors and admins
router.get('/usage', requireRole(['supervisor', 'admin']), async (req, res) => {
  try {
    // Total users
    const usersResult = await query('SELECT COUNT(*) FROM users');
    // Total chat sessions
    const sessionsResult = await query('SELECT COUNT(*) FROM chat_sessions');
    // Average confidence (from messages)
    const confidenceResult = await query('SELECT AVG(confidence_score) FROM messages WHERE confidence_score IS NOT NULL');
    // Average response time (from messages)
    const responseTimeResult = await query('SELECT AVG(processing_time) FROM messages WHERE processing_time IS NOT NULL');

    // Debug logging
    console.log('usersResult:', usersResult.rows);
    console.log('sessionsResult:', sessionsResult.rows);
    console.log('confidenceResult:', confidenceResult.rows);
    console.log('responseTimeResult:', responseTimeResult.rows);

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count, 10),
      totalSessions: parseInt(sessionsResult.rows[0].count, 10),
      averageConfidence: confidenceResult.rows[0].avg ? parseFloat(confidenceResult.rows[0].avg) : null,
      averageResponseTime: responseTimeResult.rows[0].avg ? parseFloat(responseTimeResult.rows[0].avg) : null,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch analytics',
    });
  }
});

module.exports = router;
