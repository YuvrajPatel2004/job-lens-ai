const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const cron = require('node-cron');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Cron Jobs
const startInterviewCronJob = require('./cron/interviewReminders');
startInterviewCronJob();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (for resume downloads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/email-tracker', require('./routes/emailTrackerRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Interview reminder cron job - runs every 30 minutes
const Interview = require('./models/Interview');
const User = require('./models/User');
const Job = require('./models/Job');
const { sendInterviewReminder } = require('./services/emailService');

cron.schedule('*/30 * * * *', async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Find interviews scheduled within the next hour that haven't been reminded
    const upcomingInterviews = await Interview.find({
      scheduledAt: { $gte: now, $lte: oneHourLater },
      status: 'scheduled',
      reminder: true,
      reminderSentAt: null,
    }).populate('job', 'company position');

    for (const interview of upcomingInterviews) {
      const user = await User.findById(interview.user);
      if (user && interview.job) {
        const sent = await sendInterviewReminder(
          user.email,
          user.name,
          interview,
          interview.job
        );
        if (sent) {
          interview.reminderSentAt = new Date();
          await interview.save();
          console.log(`Reminder sent for interview ${interview._id}`);
        }
      }
    }
  } catch (error) {
    console.error('Cron job error:', error.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
