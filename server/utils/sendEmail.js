const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer
 * If SMTP environment variables are missing, it falls back to console logging the email.
 * @param {Object} options - { email: string, subject: string, message: string }
 */
const sendEmail = async (options) => {
  const isSmtpConfigured =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS;

  if (isSmtpConfigured) {
    // Create a transporter using the SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `JobLens AI <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${options.email}`);
    } catch (error) {
      console.error('Email sending failed:', error.message);
    }
  } else {
    // Fallback: log to console if SMTP is not configured
    console.log('\n======================================');
    console.log(`[DEV MODE] Email to: ${options.email}`);
    console.log(`[DEV MODE] Subject: ${options.subject}`);
    console.log(`[DEV MODE] Message:\n${options.message}`);
    console.log('======================================\n');
  }
};

module.exports = sendEmail;
