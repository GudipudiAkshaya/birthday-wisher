// Services/mailer.js - Nodemailer transporter singleton (Gmail SMTP)
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Force IPv4 to prevent ENETUNREACH errors on networks without IPv6 (like Render)
  family: 4,
  connectionTimeout: 20000, 
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP ready — connected to Gmail (Port 465 SSL)');
  }
});

export default transporter;
