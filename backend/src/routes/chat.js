const express = require('express');
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// SSE stream route (no auth)
router.get('/stream', chatController.sseHandler.bind(chatController));

// All other chat routes require authentication
router.use(authMiddleware);

router.post('/session', chatController.startSession);
router.post('/message', chatController.sendMessage.bind(chatController));

module.exports = router;
