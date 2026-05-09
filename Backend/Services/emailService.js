// Services/emailService.js - Birthday email sender via Nodemailer
import transporter from './mailer.js';
import dotenv from 'dotenv';
dotenv.config();

const SENDER = `"Birthday Wisher 🎂" <${process.env.SMTP_USER}>`;

/**
 * Sends the birthday HTML email to a friend.
 * @param {string} toEmail
 * @param {string} toName
 * @param {string} subject
 * @param {string} htmlContent
 */
const sendBirthdayEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  try {
    const info = await transporter.sendMail({
      from: SENDER,
      to: `"${toName}" <${toEmail}>`,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Birthday email sent to ${toEmail} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send birthday email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default sendBirthdayEmail;
