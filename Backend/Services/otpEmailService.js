// Services/otpEmailService.js - OTP email sender via Resend HTTP API
import { Resend } from 'resend';
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
 * Sends an OTP email via Resend SDK.
 * @param {string} toEmail
 * @param {string} toName
 * @param {string} otp
 * @param {'verify_email'|'forgot_password'} purpose
 */
const sendOtpEmail = async ({ toEmail, toName, otp, purpose }) => {
  // Initialize INSIDE function to ensure process.env.RESEND_API_KEY is ready
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const template = OTP_EMAIL_TEMPLATES[purpose];
    if (!template) throw new Error(`Unknown OTP purpose: ${purpose}`);

    const { data, error } = await resend.emails.send({
      from: 'Birthday Wisher 🎂 <onboarding@resend.dev>',
      to: toEmail,
      subject: template.subject,
      html: template.buildHtml(otp),
    });

    if (error) {
      console.error(`❌ Resend OTP error for ${toEmail}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ OTP email [${purpose}] sent to ${toEmail} | Id: ${data.id}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ OTP email [${purpose}] failed for ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default sendOtpEmail;
