// Services/mailer.js - Nodemailer transporter singleton (Gmail SMTP)
import nodemailer from 'nodemailer';
import dns from 'node:dns';
import dotenv from 'dotenv';
dotenv.config();

// Force IPv4 to prevent ENETUNREACH errors on networks without IPv6 (like Render)
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Timeout settings to handle network latency
  connectionTimeout: 10000, 
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP ready — connected to Gmail (IPv4)');
  }
});

export default transporter;

