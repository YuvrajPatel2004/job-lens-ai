# JobLens AI 🚀

AI-Powered Job Application Tracker, ATS Resume Optimizer, and Gmail Sync Suite. JobLens AI helps job seekers track their pipeline, optimize their resumes, and prepare for interviews using state-of-the-art AI.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Auth** | JWT, bcrypt |
| **AI Integration** | Google Gemini API (gemini-2.5-flash & gemini-3.6-flash) |
| **Email & Cron** | Nodemailer, node-cron |
| **APIs & Scrapers** | Google APIs (Gmail Sync), Jina Reader (Job URL Scraping Proxy) |

---

## ✨ Latest Features

### 1. In-Context AI Resume Match & Interview Prep Dashboard 🧠
Compare any of your resume versions against a job posting directly inside the Job Details view:
* **Match Breakdown**: Category score progress bars (Skills Alignment, Experience Relevance, Education Fit, Keywords Density, Culture Fit) and custom verdicts.
* **ATS Keyword Analyzer**: Visual green/red tag clouds showing matching vs. missing keywords with optimization suggestions.
* **Resume Tuning**: Side-by-side comparison showing current resume bullets vs. suggested AI-tailored bullet points.
* **Interview Q&A**: Predicted behavioral, technical, and situational questions, suggested STAR-method answer strategies, key talking points, weakness mitigation advice, and candidate questions to ask the interviewer.

### 2. Dynamic Job URL Auto-fill Scraper 🌐
* Instantly auto-fill details (company, position, description, salary, location) by pasting any job portal URL.
* Powered by the **Jina Reader API** proxy to bypass anti-scraping walls (such as LinkedIn, Indeed, ZipRecruiter) with a native fallback text parser.

### 3. AI Resume Builder (LaTeX) 📜
* Generate ATS-friendly PDF resumes from scratch using the Gemini AI model.
* Uses standard `article` and `geometry` packages to formulate beautiful, highly professional templates similar to "Jake's Resume".
* Integrated interactive Code Editor with `framer-motion` animations, allowing you to preview and manually tweak the LaTeX syntax before compilation.
* Instant compiling via public LaTeX endpoints with secure, in-app PDF previews.

### 4. Smart Interview Tracking & Auto-Join ⏱️
* **Email Reminders:** Background cron jobs track upcoming interviews and fire off timely reminders 1-hour prior to the meeting.
* **Meeting Auto-Join:** If you keep JobLens open in a tab, the system watches the clock and automatically opens your meeting link exactly when the interview starts!
* Track behavioral, technical, panel, and HR interviews efficiently with attached feedback and star ratings.

### 5. Multiple Resume Version Management 📄
* Manage multiple resume versions (e.g., Frontend, Backend, general Full-Stack).
* Link specific resume versions (filename, label, and version number) directly with job applications to track which version was submitted.

### 6. Gmail Auto-Sync & Email Tracking 📨
* Connect to your Gmail account via secure OAuth in the web settings panel.
* Auto-sync email headers to identify and track recruiter emails as Interview requests, Offers, or Rejections.
* **Self-Serve OAuth Credentials**: Set up custom Client IDs & Secrets directly in the settings UI.
* **Dynamic Redirect URIs**: Real-time callback origin sync to completely prevent `redirect_uri_mismatch` errors on custom hosted servers.

### 7. Advanced Analytics & CSV Export 📈
* **Conversion Funnel**: Horizontal charts mapping stage-to-stage transition rates (Applications ➔ Screenings ➔ Interviews ➔ Offers).
* **Resume Version Leaderboard**: Analytics table listing total applications, positive response rates, and offer rates grouped by specific resume versions.
* **Spreadsheet Exporter**: Download your entire career database as a CSV spreadsheet with one click.
* **Shareable Brag Sheet**: Open a printable layout (styled for PDF/Paper print layouts) to share job hunt progress with coaches, mentors, or family.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* MongoDB (Local or Atlas)
* Google Gemini API Key ([Get one here](https://aistudio.google.com/))

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd JobLensAI
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/JobLensAI
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   GEMINI_API_KEY=your_gemini_api_key
   CLIENT_URL=http://localhost:5173
   
   # Optional: Outbox mail server setup for email reminders
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM=no-reply@joblensai.com
   ```

3. **Install Dependencies**
   Run the following single command in the project root directory. It will automatically install all root, backend (`server`), and frontend (`client`) packages:
   ```bash
   npm install
   ```

4. **Run Locally**
   Start both the backend server and the frontend Vite server concurrently with a single command from the project root:
   ```bash
   npm run dev
   ```

5. **Access the App**
   Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

---

## 📁 Project Structure

```
JobLensAI/
├── client/              # React Frontend (Vite + Tailwind CSS v4)
│   └── src/
│       ├── components/  # Layout and Shared UI (Card, Button, Modal, Badge)
│       ├── features/    # Feature modules (jobs, resumes, email-tracker, etc.)
│       ├── context/     # Auth Context
│       └── services/    # Axios client and API endpoints helper
│
├── server/              # Express Backend
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers & logic controllers
│   ├── middleware/      # Auth security & Multer file uploads handler
│   ├── models/          # Mongoose Database schemas
│   ├── routes/          # Express routing mounts
│   ├── services/        # AI, Gmail Sync, and PDF text parsers
│   └── server.js        # Server entry & background Cron reminders
```

---

## 🔑 API Endpoints

### Authentication
* `POST /api/auth/register` — Register a new account.
* `POST /api/auth/login` — Login user.
* `GET /api/auth/me` — Retrieve active profile info.

### Job Applications
* `GET /api/jobs` — List jobs (with filter, search, and populated resume metadata).
* `POST /api/jobs` — Add a new job application.
* `PUT /api/jobs/:id` — Update job details.
* `DELETE /api/jobs/:id` — Delete a job.
* `PATCH /api/jobs/:id/status` — Quick status update.
* `POST /api/jobs/:id/notes` — Add job timeline notes.

### Resume Management
* `POST /api/resumes` — Upload a resume (PDF/Word).
* `GET /api/resumes` — List all resume versions.
* `GET /api/resumes/:id` — Get single resume text/meta.
* `DELETE /api/resumes/:id` — Delete a resume version.
* `GET /api/resumes/:id/download` — Download resume file from disk.

### AI Operations
* `POST /api/ai/parse-job-url` — Scrapes webpage via Jina and parses job fields using Gemini.
* `POST /api/ai/rate-and-prep` — Runs overall Match rating, category scores, resume bullet modifications, and likely interview questions.
* `POST /api/ai/cover-letter` — Generate tailored cover letters.

### Email Tracker
* `GET /api/email-tracker/connect-gmail` — Generates a Google OAuth authorization URL.
* `GET /api/email-tracker/status` — Get Gmail connection state & credentials.
* `PUT /api/email-tracker/settings` — Update sync frequencies, auto-statuses, and custom OAuth client credentials.
* `POST /api/email-tracker/sync` — Sync mail headers in background.
* `PUT /api/email-tracker/emails/:emailId/link` — Link recruiter email notification to a job application.

### Analytics
* `GET /api/analytics/stats` — Total count stats.
* `GET /api/analytics/trends` — Monthly trend metrics.
* `GET /api/analytics/status-distribution` — Status proportions.

---

## 📄 License

MIT
