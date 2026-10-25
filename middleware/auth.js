const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Wraps async handlers so errors reach the error middleware
exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Requires a valid "Authorization: Bearer <token>" header
exports.protect = exports.asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'Not authorized, token missing' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }

  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });
  req.user = user;
  next();
});

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required' });
};
