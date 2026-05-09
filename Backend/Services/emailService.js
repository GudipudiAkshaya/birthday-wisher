// Services/emailService.js - Birthday email sender via Nodemailer
import transporter from './mailer.js';

/**
 * Sends the birthday HTML email to a friend.
 */
const sendBirthdayEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Birthday Wisher 🎂" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: subject,
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
