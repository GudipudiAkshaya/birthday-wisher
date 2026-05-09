// Services/otpEmailService.js - OTP email sender via Brevo HTTP API
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OTP_EMAIL_TEMPLATES = {
  verify_email: {
    subject: '🎂 Verify your Birthday Wisher email',
    buildHtml: (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Email</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🎂</div>
            <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 6px;">Verify your email</h1>
            <p style="color:#999;font-size:14px;margin:0;">Enter the code below to activate your account</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:#1a1a2e;border:1px solid #2a2a5e;border-radius:12px;padding:20px 40px;margin:0 auto;">
              <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#a78bfa;font-family:monospace;">${otp}</div>
            </div>
            <p style="color:#666;font-size:13px;margin:20px 0 0;">This code expires in <strong style="color:#ccc;">10 minutes</strong>.</p>
            <p style="color:#555;font-size:12px;margin:8px 0 0;">If you didn't sign up for Birthday Wisher, ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;text-align:center;border-top:1px solid #1e1e1e;">
            <p style="color:#444;font-size:12px;margin:0;">Sent by Birthday Wisher · Do not reply</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },

  forgot_password: {
    subject: '🔑 Reset your Birthday Wisher password',
    buildHtml: (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🔑</div>
            <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 6px;">Password Reset</h1>
            <p style="color:#999;font-size:14px;margin:0;">Use the code below to reset your password</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:#1a1a2e;border:1px solid #2a2a5e;border-radius:12px;padding:20px 40px;margin:0 auto;">
              <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#f472b6;font-family:monospace;">${otp}</div>
            </div>
            <p style="color:#666;font-size:13px;margin:20px 0 0;">This code expires in <strong style="color:#ccc;">10 minutes</strong>.</p>
            <p style="color:#555;font-size:12px;margin:8px 0 0;">If you didn't request this, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;text-align:center;border-top:1px solid #1e1e1e;">
            <p style="color:#444;font-size:12px;margin:0;">Sent by Birthday Wisher · Do not reply</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
};

/**
 * Sends an OTP email via Brevo HTTP API.
 */
const sendOtpEmail = async ({ toEmail, toName, otp, purpose }) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  try {
    const template = OTP_EMAIL_TEMPLATES[purpose];
    if (!template) throw new Error(`Unknown OTP purpose: ${purpose}`);

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Birthday Wisher 🎂', email: process.env.SENDER_EMAIL },
        to: [{ email: toEmail, name: toName || toEmail }],
        subject: template.subject,
        htmlContent: template.buildHtml(otp),
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log(`✅ OTP email [${purpose}] sent to ${toEmail} | MessageId: ${response.data.messageId}`);
    return { success: true };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`❌ OTP email [${purpose}] failed for ${toEmail}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
};

export default sendOtpEmail;
