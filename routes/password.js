const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const router = express.Router();
const Token = require('../models/Token');

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: true }); // Don't reveal if user exists

  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  await Token.create({ userId: user._id, token, createdAt: new Date() });

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  await transporter.sendMail({
    to: user.email,
    subject: 'Password Reset',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
  });
  res.json({ success: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ success: false, message: 'Token and password required.' });
  const tokenDoc = await Token.findOne({ token });
  if (!tokenDoc) return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
  if (Date.now() - tokenDoc.createdAt.getTime() > 3600000) {
    await tokenDoc.deleteOne();
    return res.status(400).json({ success: false, message: 'Token expired.' });
  }
  const user = await User.findById(tokenDoc.userId);
  if (!user) return res.status(400).json({ success: false, message: 'User not found.' });
  user.password = password;
  await user.save();
  await tokenDoc.deleteOne();
  res.json({ success: true });
});

module.exports = router;
