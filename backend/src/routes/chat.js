const express = require('express');
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

router.post('/session', chatController.startSession);
// router.post('/message', chatController.sendMessage);
router.post('/message', chatController.sendMessage.bind(chatController));

module.exports = router;
