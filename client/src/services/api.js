import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const changePassword = (data) => API.put('/auth/password', data);

// Jobs
export const getJobs = (params) => API.get('/jobs', { params });
export const getJob = (id) => API.get(`/jobs/${id}`);
export const createJob = (data) => API.post('/jobs', data);
export const updateJob = (id, data) => API.put(`/jobs/${id}`, data);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);
export const updateJobStatus = (id, status) => API.patch(`/jobs/${id}/status`, { status });
export const addJobNote = (id, text) => API.post(`/jobs/${id}/notes`, { text });
export const deleteJobNote = (id, noteId) => API.delete(`/jobs/${id}/notes/${noteId}`);

// Resumes
export const uploadResume = (formData) =>
  API.post('/resumes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getResumes = () => API.get('/resumes');
export const getResume = (id) => API.get(`/resumes/${id}`);
export const deleteResume = (id) => API.delete(`/resumes/${id}`);
export const analyzeResume = (id, jobDescription) =>
  API.post(`/resumes/${id}/analyze`, { jobDescription });
export const downloadResume = (id) =>
  API.get(`/resumes/${id}/download`, { responseType: 'blob' });

// AI
export const generateCoverLetter = (data) => API.post('/ai/cover-letter', data);
export const getImproveSuggestions = (data) => API.post('/ai/improve-resume', data);
export const getMatchScore = (data) => API.post('/ai/match-score', data);
export const getInterviewPrep = (data) => API.post('/ai/interview-prep', data);
export const parseJobUrl = (url) => API.post('/ai/parse-job-url', { url });
export const rateAndPrepJob = (data) => API.post('/ai/rate-and-prep', data);
export const buildResumeLatex = (data) => API.post('/ai/build-resume', data);
export const compileLatexToPdf = (latex) => API.post('/ai/compile-latex', { latex }, { responseType: 'blob' });

// Interviews
export const getInterviews = (params) => API.get('/interviews', { params });
export const getInterview = (id) => API.get(`/interviews/${id}`);
export const createInterview = (data) => API.post('/interviews', data);
export const updateInterview = (id, data) => API.put(`/interviews/${id}`, data);
export const deleteInterview = (id) => API.delete(`/interviews/${id}`);
export const addInterviewFeedback = (id, data) => API.patch(`/interviews/${id}/feedback`, data);

// Analytics
export const getStats = () => API.get('/analytics/stats');
export const getTrends = () => API.get('/analytics/trends');
export const getStatusDistribution = () => API.get('/analytics/status-distribution');
export const getRecentActivity = () => API.get('/analytics/recent-activity');

// Email Tracker
export const connectGmail = (redirectUri) => API.get('/email-tracker/connect-gmail', { params: { redirectUri } });
export const getEmailTrackerStatus = (params) => API.get('/email-tracker/status', { params });
export const syncEmails = () => API.post('/email-tracker/sync');
export const linkTrackedEmail = (emailId, jobId) => API.put(`/email-tracker/emails/${emailId}/link`, { jobId });
export const dismissTrackedEmail = (emailId) => API.put(`/email-tracker/emails/${emailId}/dismiss`);
export const updateEmailTrackerSettings = (data) => API.put('/email-tracker/settings', data);
export const disconnectGmail = () => API.delete('/email-tracker/disconnect');

export default API;
