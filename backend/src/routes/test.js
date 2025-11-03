const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ ok: true, message: 'API is working' });
});

module.exports = router;