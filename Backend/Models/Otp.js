// Models/Otp.js - Dedicated OTP collection with hashed code, TTL auto-expiry, and upsert support
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  // bcrypt-hashed OTP code — raw code never stored
  hashedCode: {
    type: String,
    required: true,
  },
  // 'verify_email' | 'forgot_password'
  purpose: {
    type: String,
    required: true,
    enum: ['verify_email', 'forgot_password'],
  },
  // TTL index: MongoDB auto-deletes document 10 minutes after createdAt.
  // On resend, createdAt is overwritten → TTL clock resets to fresh 10 min.
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 600 seconds = 10 minutes
  },
});

// One record per email+purpose. Upsert on resend instead of duplicating.
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
