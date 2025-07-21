const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// All history routes require authentication
router.use(authMiddleware);

router.get('/sessions', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.title, s.jurisdiction, s.created_at, s.updated_at,
        (
          SELECT content FROM messages m
          WHERE m.session_id = s.id AND m.type = 'user'
          ORDER BY m.created_at ASC
          LIMIT 1
        ) AS first_message
       FROM chat_sessions s
       WHERE s.user_id = $1 AND s.is_active = true
       ORDER BY s.updated_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      sessions: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch chat history',
    });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const sessionResult = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    // Get messages for session
    const messagesResult = await query(
      `SELECT id, type, content, citations, confidence_score, processing_time, created_at
       FROM messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    res.json({
      session: sessionResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch session details',
    });
  }
});

// Delete a chat session and all its messages
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Verify session belongs to user
    const sessionResult = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    // Delete messages first (to avoid FK constraint)
    await query('DELETE FROM messages WHERE session_id = $1', [sessionId]);
    // Delete the session
    await query('DELETE FROM chat_sessions WHERE id = $1', [sessionId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

module.exports = router;
