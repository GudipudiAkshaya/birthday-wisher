// Routes/AuthRoutes.js - Full authentication: signup, verify-email, login, forgot-password, reset-password
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../Models/User.js';
import Otp from '../Models/Otp.js';
import sendOtpEmail from '../Services/otpEmailService.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// ─── Helper: generate a 6-digit OTP ────────────────────────────────────────
const generateOtp = () => String(crypto.randomInt(100000, 999999));

// ─── Helper: upsert OTP record (hash + store, reset TTL clock) ─────────────
const upsertOtp = async (email, rawOtp, purpose) => {
  const hashedCode = await bcrypt.hash(rawOtp, 10);
  // findOneAndUpdate with upsert — also overwrites createdAt to reset TTL window
  await Otp.findOneAndUpdate(
    { email, purpose },
    { hashedCode, createdAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// ─── POST /auth/signup ───────────────────────────────────────────────────────
// Creates account (unverified), sends email verification OTP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      // Account exists but not verified — allow re-signup by updating it
      existing.name = name;
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await new User({ name, email, password: hashedPassword }).save();
    }

    // Generate OTP, hash and upsert into Otp collection
    const rawOtp = generateOtp();
    await upsertOtp(email, rawOtp, 'verify_email');

    // Send email (raw OTP only goes into email, never stored plaintext)
    await sendOtpEmail({ toEmail: email, toName: name, otp: rawOtp, purpose: 'verify_email' });

    return res.status(201).json({
      success: true,
      message: 'Account created. Check your email for the verification code.',
      requiresVerification: true,
      email,
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /auth/verify-email ─────────────────────────────────────────────────
// Verifies email with OTP, returns JWT on success
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await Otp.findOne({ email, purpose: 'verify_email' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please resend.' });
    }

    const isMatch = await bcrypt.compare(String(otp), otpRecord.hashedCode);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Mark user as verified and delete the OTP record
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );
    await Otp.deleteOne({ email, purpose: 'verify_email' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({
      success: true,
      message: 'Email verified! Welcome to Birthday Wisher 🎂',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Verify email error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /auth/resend-otp ───────────────────────────────────────────────────
// Resends OTP for any purpose — updates existing record, resets TTL
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ success: false, message: 'Email and purpose are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (purpose === 'verify_email' && user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const rawOtp = generateOtp();
    await upsertOtp(email, rawOtp, purpose); // updates existing record → TTL clock resets

    await sendOtpEmail({ toEmail: email, toName: user.name, otp: rawOtp, purpose });

    return res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      // Auto-resend verification OTP so user can complete signup
      const rawOtp = generateOtp();
      await upsertOtp(email, rawOtp, 'verify_email');
      await sendOtpEmail({ toEmail: email, toName: user.name, otp: rawOtp, purpose: 'verify_email' });
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new code has been sent to your inbox.',
        requiresVerification: true,
        email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /auth/forgot-password ─────────────────────────────────────────────
// Sends password-reset OTP to registered email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    // Return 200 even if user not found — prevents email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset code has been sent.',
      });
    }

    const rawOtp = generateOtp();
    await upsertOtp(email, rawOtp, 'forgot_password');
    await sendOtpEmail({ toEmail: email, toName: user.name, otp: rawOtp, purpose: 'forgot_password' });

    return res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email.',
      email,
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /auth/verify-reset-otp ────────────────────────────────────────────
// Validates the reset OTP (does NOT reset password yet — just confirms code is valid)
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await Otp.findOne({ email, purpose: 'forgot_password' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(String(otp), otpRecord.hashedCode);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified. You may now set a new password.' });
  } catch (error) {
    console.error('Verify reset OTP error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /auth/reset-password ──────────────────────────────────────────────
// Verifies OTP once more and sets the new password atomically
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const otpRecord = await Otp.findOne({ email, purpose: 'forgot_password' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(String(otp), otpRecord.hashedCode);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword, isVerified: true });
    await Otp.deleteOne({ email, purpose: 'forgot_password' }); // cleanup

    return res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /auth/me ────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;
