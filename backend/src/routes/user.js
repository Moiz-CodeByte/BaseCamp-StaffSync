const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');

// simple "me" route
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// example HR-only route
router.get('/hr-only', authenticate, authorize('HR', 'Admin'), (req, res) => {
  res.json({ message: 'Hello HR/Admin' });
});

module.exports = router;