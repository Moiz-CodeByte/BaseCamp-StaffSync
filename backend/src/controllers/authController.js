const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { register, login };