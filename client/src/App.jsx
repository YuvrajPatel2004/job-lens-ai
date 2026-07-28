import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import JobsPage from './features/jobs/JobsPage';
import ResumePage from './features/resume/ResumePage';
import AIToolsPage from './features/ai/AIToolsPage';
import EmailTrackerPage from './features/email-tracker/EmailTrackerPage';
import InterviewsPage from './features/interviews/InterviewsPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import ProfilePage from './features/profile/ProfilePage';
import LandingPage from './features/landing/LandingPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(30, 32, 52, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0f172a' },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/resumes" element={<ResumePage />} />
            <Route path="/ai-tools" element={<AIToolsPage />} />
            <Route path="/email-tracker" element={<EmailTrackerPage />} />
            <Route path="/interviews" element={<InterviewsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
