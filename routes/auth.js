const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, asyncHandler } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({
  id: u._id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone,
  role: u.role,
});

// POST /api/auth/signup   (fields from signup.html)
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ firstName, lastName, email, phone, password });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

// POST /api/auth/login   (login.html)
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
