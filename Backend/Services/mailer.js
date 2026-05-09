// Services/mailer.js - Nodemailer transporter singleton (Gmail SMTP)
// Works on Render, Railway, VPS — any long-running server environment.
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Gmail SMTP credentials:
//   SMTP_USER  → your Gmail address (e.g. you@gmail.com)
//   SMTP_PASS  → your Gmail App Password (16-char, from Google Account → Security → App Passwords)
//                NOT your regular Gmail password — must be an App Password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup (logs success/failure — doesn't crash the server)
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP ready — connected to Brevo');
  }
});

export default transporter;
