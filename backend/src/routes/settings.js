const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Settings for admins
router.get('/department-policies', requireRole(['admin', 'supervisor']), async (req, res) => {
  try {
    res.json({
      message: 'Department policies feature coming soon',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch settings',
    });
  }
});

module.exports = router;
