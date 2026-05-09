// Cron/birthdayCron.js - Runs every minute, sends emails when date+time match the schedule
import cron from 'node-cron';
import Schedule from '../Models/Schedule.js';
import sendBirthdayEmail from '../Services/emailService.js';

const buildHtmlEmail = (message, friendName) => {
  const personalizedMessage = message.replace(/\{\{name\}\}/g, friendName);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday!</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:50px 40px;text-align:center;">
              <div style="font-size:64px;margin-bottom:16px;">🎂</div>
              <h1 style="color:#fff;font-size:32px;font-weight:700;margin:0 0 8px;">Happy Birthday!</h1>
              <p style="color:#999;font-size:16px;margin:0;">Wishing you the most wonderful day</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="color:#ccc;font-size:16px;line-height:1.8;white-space:pre-wrap;">${personalizedMessage}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 40px;text-align:center;border-top:1px solid #222;">
              <p style="color:#555;font-size:13px;margin:0;">Sent with ❤️ via Birthday Wisher</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Runs every minute.
 * Finds all active schedules whose birthdayMMDD matches today and sendTime matches current HH:MM (IST).
 * Sends email if not already sent this year.
 */
const runBirthdayCheck = async () => {
  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5h30m in ms
  const istNow = new Date(now.getTime() + istOffset);

  const mm = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istNow.getUTCDate()).padStart(2, '0');
  const hh = String(istNow.getUTCHours()).padStart(2, '0');
  const min = String(istNow.getUTCMinutes()).padStart(2, '0');

  const todayMMDD = `${mm}-${dd}`;
  const currentTime = `${hh}:${min}`;
  const currentYear = istNow.getUTCFullYear();

  try {
    // Find schedules matching today's date AND current minute
    const schedules = await Schedule.find({
      birthdayMMDD: todayMMDD,
      sendTime: currentTime,
      active: true,
    })
      .populate('friendId', 'name email')
      .populate('templateId', 'name subject message')
      .populate('userId', 'name email');

    if (schedules.length === 0) return;

    console.log(`🎉 [BirthdayCron] ${schedules.length} birthday email(s) to send at ${currentTime} IST`);

    for (const schedule of schedules) {
      try {
        // Skip if already sent this year
        if (schedule.lastSentYear === currentYear) {
          console.log(`⏭️  Already sent to ${schedule.friendId?.name} in ${currentYear}, skipping.`);
          continue;
        }

        const { friendId: friend, templateId: template } = schedule;
        if (!friend || !template) continue;

        const htmlContent = buildHtmlEmail(template.message, friend.name);
        const result = await sendBirthdayEmail({
          toEmail: friend.email,
          toName: friend.name,
          subject: template.subject.replace(/\{\{name\}\}/g, friend.name),
          htmlContent,
        });

        if (result.success) {
          schedule.lastSentYear = currentYear;
          await schedule.save();
          console.log(`✅ Birthday email sent to ${friend.name} (${friend.email})`);
        }
      } catch (innerError) {
        console.error(`❌ Failed for schedule ${schedule._id}:`, innerError.message);
      }
    }
  } catch (error) {
    console.error('❌ [BirthdayCron] Error during birthday check:', error.message);
  }
};

// Every minute: * * * * *
const startBirthdayCron = () => {
  cron.schedule('* * * * *', runBirthdayCheck, {
    timezone: 'Asia/Kolkata',
  });
  console.log('🕗 Birthday cron started — checks every minute for scheduled emails (IST)');
};

export { startBirthdayCron, runBirthdayCheck };
