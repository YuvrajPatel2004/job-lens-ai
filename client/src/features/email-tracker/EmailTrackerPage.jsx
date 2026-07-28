import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineEnvelope,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineLink,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCalendar,
  HiOutlineTrophy,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2';
import {
  connectGmail,
  getEmailTrackerStatus,
  syncEmails,
  linkTrackedEmail,
  dismissTrackedEmail,
  updateEmailTrackerSettings,
  disconnectGmail,
  getJobs,
} from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { format } from 'date-fns';

const EmailTrackerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [linkJobIds, setLinkJobIds] = useState({}); // emailId -> selectedJobId
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fetchStatus = async (pageNum = 1) => {
    try {
      const { data } = await getEmailTrackerStatus({ page: pageNum, limit: 10 });
      setStatus(data);
      setClientId(data.clientId || '');
      setClientSecret(data.clientSecret || '');
    } catch (err) {
      toast.error('Failed to fetch email tracker status');
    }
  };

  const fetchAllJobs = async () => {
    try {
      const { data } = await getJobs({ limit: 100 });
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(page), fetchAllJobs()]);
      setLoading(false);
    };

    init();

    // Check URL parameters from redirect
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'true') {
      toast.success('Gmail connected successfully!');
      // Remove query params
      setSearchParams({}, { replace: true });
    } else if (error === 'auth_failed') {
      toast.error('Failed to connect Gmail. Please try again.');
      setSearchParams({}, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);

  const handleConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/api/email-tracker/gmail/callback`;
      const { data } = await connectGmail(redirectUri);
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to get connection link');
      }
    } catch (err) {
      toast.error('Gmail connection request failed');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Gmail? We will stop syncing emails.')) return;
    try {
      await disconnectGmail();
      toast.success('Gmail disconnected');
      fetchStatus(page);
    } catch (err) {
      toast.error('Failed to disconnect Gmail');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await syncEmails();
      toast.success(data.message || 'Sync complete');
      fetchStatus(page);
    } catch (err) {
      toast.error('Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const handleLink = async (emailId) => {
    const jobId = linkJobIds[emailId];
    if (!jobId) return toast.error('Please select a job application');
    try {
      await linkTrackedEmail(emailId, jobId);
      toast.success('Email linked to job successfully');
      fetchStatus(page);
    } catch (err) {
      toast.error('Failed to link email');
    }
  };

  const handleDismiss = async (emailId) => {
    try {
      await dismissTrackedEmail(emailId);
      toast.success('Email dismissed');
      fetchStatus(page);
    } catch (err) {
      toast.error('Failed to dismiss email');
    }
  };

  const handleToggleAutoUpdate = async () => {
    try {
      const currentSetting = status?.autoUpdateJobStatus;
      await updateEmailTrackerSettings({ autoUpdateJobStatus: !currentSetting });
      toast.success(`Auto status updates ${!currentSetting ? 'enabled' : 'disabled'}`);
      fetchStatus(page);
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const handleSaveCredentials = async () => {
    if (!clientId) return toast.error('Google Client ID is required');
    setSavingCredentials(true);
    try {
      await updateEmailTrackerSettings({ clientId, clientSecret });
      toast.success('Credentials saved successfully!');
      fetchStatus(page);
    } catch (err) {
      toast.error('Failed to save credentials');
    } finally {
      setSavingCredentials(false);
    }
  };

  const getStatusBadgeType = (detectedStatus) => {
    // Map email statuses to Badge-supported status types
    const mapping = {
      rejected: 'rejected',
      accepted: 'offer',
      interview: 'interview',
      follow_up: 'screening',
      unknown: 'saved',
    };
    return mapping[detectedStatus] || 'saved';
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton" />
        <div className="h-48 skeleton" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
            <HiOutlineEnvelope className="text-primary-400" /> Job Application Email Tracker
          </h1>
          <p className="text-sm text-surface-200/50 mt-0.5">
            Sync your emails and automatically parse job status updates with AI
          </p>
        </div>

        {status?.gmailConnected ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSync} loading={syncing}>
              <HiOutlineArrowPath className="text-lg" /> Sync Now
            </Button>
            <Button variant="danger" onClick={handleDisconnect}>
              <HiOutlineArrowRightOnRectangle className="text-lg" /> Disconnect
            </Button>
          </div>
        ) : (
          <Button variant="accent" onClick={handleConnect}>
            Connect Gmail Account
          </Button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status / Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="space-y-4">
            <h3 className="font-semibold text-surface-100 flex items-center gap-2">
              Connection Status
            </h3>

            {status?.gmailConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium">
                  <HiOutlineCheckCircle className="text-xl" /> Connected to Gmail
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-surface-200/40">Linked Email Address</p>
                  <p className="text-surface-100 font-medium">{status.gmailEmail}</p>
                </div>
                {status.lastSyncAt && (
                  <div className="text-sm space-y-1">
                    <p className="text-surface-200/40">Last Synced At</p>
                    <p className="text-surface-100 font-medium">
                      {format(new Date(status.lastSyncAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20 text-warning text-sm font-medium">
                  <HiOutlineExclamationCircle className="text-xl" /> Gmail Disconnected
                </div>
                <p className="text-xs text-surface-200/60 leading-relaxed">
                  Connect your Gmail inbox to automatically pull updates from recruiters. We only sync email headers and job-related keywords.
                </p>
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                Google OAuth Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <HiOutlineQuestionMarkCircle className="text-base" /> Setup Guide
              </button>
            </div>
            <p className="text-xs text-surface-200/50 leading-relaxed">
              To connect your Gmail on a custom server, supply your own Google OAuth Client credentials.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-surface-200/60">Authorized Redirect URI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/email-tracker/gmail/callback`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-surface-900 border border-white/5 text-surface-200/40 outline-none select-all font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/email-tracker/gmail/callback`);
                      toast.success('Copied Redirect URI!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-surface-200/80">Google Client ID</label>
                <input
                  type="text"
                  placeholder="392178233707-..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 focus:outline-none focus:border-primary-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-surface-200/80">Google Client Secret</label>
                <input
                  type="password"
                  placeholder={status?.clientSecret ? '••••••••••••••••' : 'Enter Secret'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 focus:outline-none focus:border-primary-500/50"
                />
              </div>

              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleSaveCredentials}
                loading={savingCredentials}
                className="w-full"
              >
                Save Credentials
              </Button>
            </div>
          </Card>

          {status?.gmailConnected && (
            <Card className="space-y-4">
              <h3 className="font-semibold text-surface-100">Automation Settings</h3>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-800/40 border border-white/5">
                <div>
                  <p className="text-sm font-medium text-surface-100">Auto-Update Job Status</p>
                  <p className="text-xs text-surface-200/40 mt-0.5">Let AI automatically update job status when a match is found</p>
                </div>
                <button
                  onClick={handleToggleAutoUpdate}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    status.autoUpdateJobStatus ? 'bg-primary-500' : 'bg-surface-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      status.autoUpdateJobStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>
          )}

          {/* Stats card */}
          {status?.gmailConnected && status.stats && (
            <Card className="space-y-3">
              <h3 className="font-semibold text-surface-100 mb-2">Sync Statistics</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-surface-800/40 rounded-xl">
                  <span className="text-xs text-surface-200/40 font-medium">Total Tracked</span>
                  <p className="text-2xl font-bold text-surface-100 mt-1">{status.stats.total}</p>
                </div>
                <div className="p-3 bg-surface-800/40 rounded-xl">
                  <span className="text-xs text-surface-200/40 font-medium">Unprocessed</span>
                  <p className="text-2xl font-bold text-warning mt-1">{status.stats.unprocessed}</p>
                </div>
              </div>
              <div className="space-y-2 mt-4 text-xs font-medium text-surface-200/70">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="flex items-center gap-1"><HiOutlineCalendar className="text-primary-400" /> Interview Requests</span>
                  <span className="text-surface-100 font-semibold">{status.stats.interview}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="flex items-center gap-1"><HiOutlineTrophy className="text-success" /> Offers</span>
                  <span className="text-surface-100 font-semibold">{status.stats.accepted}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="flex items-center gap-1"><HiOutlineXCircle className="text-danger" /> Rejections</span>
                  <span className="text-surface-100 font-semibold">{status.stats.rejected}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Emails List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg text-surface-100">Recent Inbox Updates</h3>

          {!status?.gmailConnected ? (
            <Card className="text-center py-20">
              <HiOutlineEnvelope className="text-5xl text-surface-200/15 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-100 mb-2">Connect Gmail to Track Emails</h3>
              <p className="text-sm text-surface-200/50 mb-6 max-w-sm mx-auto">
                Integrate with your Google workspace or personal email account to parse incoming job alerts and decisions instantly.
              </p>
              <Button variant="accent" onClick={handleConnect}>Connect Now</Button>
            </Card>
          ) : status.trackedEmails.length === 0 ? (
            <Card className="text-center py-20">
              <HiOutlineArrowPath className="text-5xl text-surface-200/15 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-surface-100 mb-2">No Tracking Emails Found Yet</h3>
              <p className="text-sm text-surface-200/50 mb-6 max-w-sm mx-auto">
                Try clicking "Sync Now" to download headers or adjust search parameters.
              </p>
              <Button variant="secondary" onClick={handleSync} loading={syncing}>Sync Now</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {status.trackedEmails.map((email) => (
                  <motion.div
                    key={email._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className={`border ${email.isProcessed ? 'opacity-70 border-white/5' : 'border-primary-500/20 shadow-md bg-surface-900/50'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge status={getStatusBadgeType(email.detectedStatus)} />
                            <span className="text-xs text-surface-200/40">
                              {email.confidence}% match confidence
                            </span>
                            {email.companyDetected && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/5 text-primary-400">
                                {email.companyDetected}
                              </span>
                            )}
                            {email.isProcessed && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-success/10 text-success">
                                Processed
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="font-semibold text-surface-100 text-sm leading-tight sm:text-base">
                              {email.subject}
                            </h4>
                            <p className="text-xs text-surface-200/60 mt-1">
                              From: {email.from} | {format(new Date(email.receivedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>

                          <p className="text-xs text-surface-200/50 leading-relaxed italic bg-black/10 p-2.5 rounded-lg border border-white/4">
                            &quot;{email.snippet}...&quot;
                          </p>
                        </div>

                        {/* Linking Controls */}
                        {!email.isProcessed && (
                          <div className="flex flex-col gap-2 min-w-[200px] flex-shrink-0 pt-2 sm:pt-0">
                            <label className="text-xs font-medium text-surface-200/50">Link to Application</label>
                            <select
                              value={linkJobIds[email._id] || (email.matchedJob?._id || email.matchedJob || '')}
                              onChange={(e) => setLinkJobIds({ ...linkJobIds, [email._id]: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-surface-800 border border-white/8 text-surface-100 text-xs focus:outline-none"
                            >
                              <option value="">Select a job application...</option>
                              {jobs.map((j) => (
                                <option key={j._id} value={j._id}>
                                  {j.position} at {j.company}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <Button
                                variant="accent"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleLink(email._id)}
                                disabled={!linkJobIds[email._id] && !email.matchedJob}
                              >
                                <HiOutlineLink /> Link
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-surface-200/60 hover:bg-white/5"
                                onClick={() => handleDismiss(email._id)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        )}

                        {email.isProcessed && email.matchedJob && (
                          <div className="text-xs font-medium text-surface-200/40 pt-2 sm:pt-0 self-start">
                            Linked to: <span className="text-surface-100">{email.matchedJob.position} at {email.matchedJob.company}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Pagination */}
              {status.pagination && status.pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  {Array.from({ length: status.pagination.pages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                        page === i + 1 ? 'bg-primary-500 text-white' : 'bg-surface-800/60 text-surface-200/60 hover:bg-surface-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Help / Setup Guide Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Gmail Connection Setup Guide" size="lg">
        <div className="space-y-4 text-sm text-surface-100 leading-relaxed max-h-[75vh] overflow-y-auto pr-1">
          <p className="text-xs text-surface-200/60">
            To automatically sync your job emails on this custom deployment, Google requires you to configure an OAuth client. Follow these steps to obtain your credentials:
          </p>

          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <span className="font-bold text-primary-400">Open Google Cloud Console</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline font-semibold">Google Cloud Console</a>. Log in with the Google Account you wish to sync.
              </p>
            </li>

            <li>
              <span className="font-bold text-primary-400">Create a New Project</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Click on the project dropdown at the top navigation bar, click <strong className="text-surface-100">New Project</strong>, name it (e.g. <code>JobLensAI</code>), and click Create.
              </p>
            </li>

            <li>
              <span className="font-bold text-primary-400">Setup OAuth Consent Screen</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Navigate to <strong className="text-surface-100">APIs & Services &gt; OAuth consent screen</strong> from the side menu. Choose <strong className="text-surface-100">External</strong> user type, then click Create. Enter the App Name, User support email, and Developer contact information. Click Save and Continue.
              </p>
            </li>

            <li>
              <span className="font-bold text-primary-400">Add Gmail Read Scope</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Under the Scopes step, click <strong className="text-surface-100">Add or Remove Scopes</strong>. Search for and check the box for <code>.../auth/gmail.readonly</code>. Click Save and Continue.
              </p>
            </li>

            <li>
              <span className="font-bold text-primary-400">Register Test Users (CRITICAL)</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Under the Test Users step, click <strong className="text-surface-100">+ Add Users</strong>. Enter your personal Gmail address that you intend to connect to this app. Click Save and Continue.
              </p>
            </li>

            <li>
              <span className="font-bold text-primary-400">Create OAuth Web Credentials</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Go to the <strong className="text-surface-100">Credentials</strong> tab on the side menu. Click <strong className="text-surface-100">+ Create Credentials &gt; OAuth client ID</strong>. Set the Application type to <strong className="text-surface-100">Web application</strong>.
              </p>
            </li>

            <li>
              <span className="font-bold text-primary-400">Add Authorized Redirect URI</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Scroll to <strong className="text-surface-100">Authorized redirect URIs</strong> and click <strong className="text-surface-100">Add URI</strong>. Copy the URI shown on the settings card:
                <code className="block bg-surface-900 px-3 py-1.5 rounded border border-white/5 text-[11px] font-mono mt-1 text-primary-400">{window.location.origin}/api/email-tracker/gmail/callback</code>
              </p>
            </li>

            <li>
              <span className="font-bold text-primary-400">Save and Copy Credentials</span>
              <p className="text-xs text-surface-200/50 mt-0.5">
                Click <strong className="text-surface-100">Create</strong>. Copy the generated <strong className="text-surface-100">Client ID</strong> and <strong className="text-surface-100">Client Secret</strong>. Paste them into the OAuth settings on this page, click <strong className="text-surface-100">Save Credentials</strong>, and finally click <strong className="text-surface-100">Connect Gmail Account</strong>.
              </p>
            </li>
          </ol>
        </div>
      </Modal>
    </div>
  );
};

export default EmailTrackerPage;
