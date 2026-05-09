// Services/emailService.js - Birthday email sender via Brevo HTTP API
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Sends the birthday HTML email to a friend via Brevo HTTP API.
 */
const sendBirthdayEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Birthday Wisher 🎂', email: process.env.SENDER_EMAIL },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log(`✅ Birthday email sent to ${toEmail} | MessageId: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`❌ Failed to send birthday email to ${toEmail}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
};

export default sendBirthdayEmail;
