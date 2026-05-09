// Services/emailService.js - Birthday email sender via Resend HTTP API
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Sends the birthday HTML email to a friend.
 * @param {string} toEmail
 * @param {string} toName
 * @param {string} subject
 * @param {string} htmlContent
 */
const sendBirthdayEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  // Initialize INSIDE function to ensure process.env.RESEND_API_KEY is ready
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      // IMPORTANT: In Resend Free Tier (unverified domain), you MUST use onboarding@resend.dev
      from: 'Birthday Wisher 🎂 <onboarding@resend.dev>',
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error(`❌ Resend error for ${toEmail}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Birthday email sent to ${toEmail} | Id: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error(`❌ Failed to send birthday email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default sendBirthdayEmail;
