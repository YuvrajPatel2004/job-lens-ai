const cron = require('node-cron');
const Interview = require('../models/Interview');
const sendEmail = require('../utils/sendEmail');

// Run every minute
const startInterviewCronJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Look for interviews in the next 60 minutes
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Find upcoming interviews that need a reminder
      const upcomingInterviews = await Interview.find({
        status: 'scheduled',
        reminder: true,
        reminderSentAt: { $exists: false }, // Hasn't been sent yet
        scheduledAt: {
          $gt: now,
          $lte: oneHourFromNow,
        },
      }).populate('user', 'name email').populate('job', 'company position');

      for (const interview of upcomingInterviews) {
        if (!interview.user || !interview.user.email) continue;

        const timeString = new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const meetingLinkText = interview.meetingLink ? `Meeting Link: ${interview.meetingLink}\n\n` : '';
        const message = `Hello ${interview.user.name},\n\nThis is a friendly reminder that you have an upcoming ${interview.type} interview for the ${interview.job?.position || 'role'} position at ${interview.job?.company || 'the company'}.\n\nIt is scheduled to start at ${timeString}.\n\n${meetingLinkText}Good luck!\n\n- JobLens AI Team`;

        await sendEmail({
          email: interview.user.email,
          subject: `Interview Reminder: ${interview.job?.company || 'Upcoming Interview'}`,
          message,
        });

        // Mark reminder as sent
        interview.reminderSentAt = now;
        await interview.save();
      }
    } catch (error) {
      console.error('Error in interview reminder cron job:', error.message);
    }
  });
  console.log('Interview reminder cron job initialized');
};

module.exports = startInterviewCronJob;
