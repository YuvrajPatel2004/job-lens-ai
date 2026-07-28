const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendInterviewReminder = async (userEmail, userName, interview, job) => {
  try {
    const transporter = createTransporter();
    const interviewDate = new Date(interview.scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `🔔 Interview Reminder: ${job.position} at ${job.company}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">Interview Reminder</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px;">Hi ${userName},</p>
            <p style="font-size: 16px;">This is a reminder for your upcoming interview:</p>
            <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <p style="margin: 8px 0;"><strong>Company:</strong> ${job.company}</p>
              <p style="margin: 8px 0;"><strong>Position:</strong> ${job.position}</p>
              <p style="margin: 8px 0;"><strong>Type:</strong> ${interview.type}</p>
              <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${interviewDate}</p>
              <p style="margin: 8px 0;"><strong>Duration:</strong> ${interview.duration} minutes</p>
              ${interview.location ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${interview.location}</p>` : ''}
              ${interview.meetingLink ? `<p style="margin: 8px 0;"><strong>Meeting Link:</strong> <a href="${interview.meetingLink}" style="color: #818cf8;">${interview.meetingLink}</a></p>` : ''}
            </div>
            <p style="font-size: 14px; color: #94a3b8;">Good luck! — JobLens AI</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

const sendFollowUpReminder = async (userEmail, userName, jobs) => {
  try {
    const transporter = createTransporter();

    const jobListHtml = jobs
      .map(
        (job) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <strong style="color: #e2e8f0;">${job.position}</strong><br/>
            <span style="color: #94a3b8; font-size: 13px;">${job.company}</span>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <span style="color: #fbbf24; font-size: 13px;">${job.daysSinceApplied} days ago</span>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <span style="font-size: 13px; color: #94a3b8;">Follow-up #${(job.followUp?.followUpCount || 0) + 1}</span>
          </td>
        </tr>`
      )
      .join('');

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `📋 Follow-Up Reminder: ${jobs.length} application${jobs.length > 1 ? 's' : ''} need attention`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">Follow-Up Reminder</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px;">Hi ${userName},</p>
            <p style="font-size: 16px;">The following application${jobs.length > 1 ? 's are' : ' is'} due for a follow-up:</p>
            <table style="width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; margin: 24px 0;">
              <thead>
                <tr style="background: rgba(255,255,255,0.05);">
                  <th style="padding: 12px 16px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Position</th>
                  <th style="padding: 12px 16px; text-align: center; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Applied</th>
                  <th style="padding: 12px 16px; text-align: center; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Follow-Up</th>
                </tr>
              </thead>
              <tbody>${jobListHtml}</tbody>
            </table>
            <p style="font-size: 14px; color: #94a3b8;">A timely follow-up shows initiative and genuine interest. Good luck! — JobLens AI</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Follow-up email error:', error.message);
    return false;
  }
};

module.exports = { sendInterviewReminder, sendFollowUpReminder };
