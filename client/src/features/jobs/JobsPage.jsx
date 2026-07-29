import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEllipsisVertical,
  HiOutlineMapPin,
  HiOutlineCurrencyDollar,
  HiOutlineLink,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowUpRight,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineTrophy,
} from 'react-icons/hi2';
import { getJobs, createJob, updateJob, deleteJob, updateJobStatus, addJobNote, deleteJobNote, getResumes, parseJobUrl, rateAndPrepJob } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';

const statusOptions = ['all', 'saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'];
const typeOptions = ['all', 'full-time', 'part-time', 'contract', 'internship', 'remote', 'hybrid'];
const priorityOptions = ['all', 'low', 'medium', 'high'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'company-az', label: 'Company A-Z' },
  { value: 'company-za', label: 'Company Z-A' },
];

const emptyForm = {
  company: '', position: '', status: 'saved', jobType: 'full-time', location: '',
  salary: '', jobUrl: '', contactEmail: '', contactName: '', companyWebsite: '',
  companyNotes: '', description: '', priority: 'medium', tags: '', resume: '',
};

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [resumes, setResumes] = useState([]);
  const [scraping, setScraping] = useState(false);

  // AI Match & Prep states
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedResumeForAnalysis, setSelectedResumeForAnalysis] = useState('');
  const [selectBestOption, setSelectBestOption] = useState(false);
  const [analysisTab, setAnalysisTab] = useState('overview'); // overview | improvements | questions

  useEffect(() => {
    const fetchResumesList = async () => {
      try {
        const { data } = await getResumes();
        setResumes(data);
      } catch (err) {
        console.error('Failed to load resumes', err);
      }
    };
    fetchResumesList();
  }, []);

  const handleAutoFill = async () => {
    if (!formData.jobUrl) return toast.error('Please enter a Job URL first');
    setScraping(true);
    try {
      const { data } = await parseJobUrl(formData.jobUrl);
      setFormData((prev) => ({
        ...prev,
        company: data.company || prev.company,
        position: data.position || prev.position,
        description: data.description || prev.description,
        location: data.location || prev.location,
        salary: data.salary || prev.salary,
        jobType: data.jobType || prev.jobType,
      }));
      toast.success('Job details extracted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extract job details. Please paste details manually.', { duration: 6000 });
      setTimeout(() => document.getElementById('job-description-input')?.focus(), 100);
    } finally {
      setScraping(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedJob) return;
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const { data } = await rateAndPrepJob({
        resumeId: selectBestOption ? undefined : selectedResumeForAnalysis || undefined,
        jobDescription: selectedJob.description || '',
        companyName: selectedJob.company || '',
        selectBest: selectBestOption,
      });
      setAnalysisResult(data);
      toast.success('AI Deep Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze resume for this job');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleOpenAIAnalysis = (job) => {
    setSelectedJob(job);
    setShowAnalysis(true);
    setAnalysisResult(null);
    setSelectedResumeForAnalysis(job.resume?._id || job.resume || '');
    setSelectBestOption(false);
    setAnalysisTab('overview');
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getJobs({ search, status, jobType, priority, sort, page });
      setJobs(data.jobs);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [search, status, jobType, priority, sort, page]);

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const openAddModal = () => {
    setEditingJob(null);
    setFormData(emptyForm);
    setFormModal(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setFormData({
      ...emptyForm,
      ...job,
      resume: job.resume?._id || job.resume || '',
      tags: job.tags?.join(', ') || '',
    });
    setFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editingJob) {
        await updateJob(editingJob._id, payload);
        toast.success('Job updated');
      } else {
        await createJob(payload);
        toast.success('Job added');
      }
      setFormModal(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job application?')) return;
    try {
      await deleteJob(id);
      toast.success('Job deleted');
      setDetailModal(false);
      fetchJobs();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateJobStatus(id, newStatus);
      fetchJobs();
      if (selectedJob?._id === id) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedJob) return;
    try {
      const { data } = await addJobNote(selectedJob._id, noteText);
      setSelectedJob(data);
      setNoteText('');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const { data } = await deleteJobNote(selectedJob._id, noteId);
      setSelectedJob(data);
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const openDetail = (job) => {
    setSelectedJob(job);
    setDetailModal(true);
  };

  const inputHandler = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Job Applications</h1>
          <p className="text-sm text-surface-200/50 mt-0.5">
            Tracking {total} application{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="accent" onClick={openAddModal}>
          <HiOutlinePlusCircle className="text-lg" />
          Add Job
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              icon={HiOutlineMagnifyingGlass}
              placeholder="Search companies, positions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <HiOutlineFunnel className="text-lg" />
            Filters
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-200/60">Status</label>
                  <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                    {statusOptions.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-200/60">Job Type</label>
                  <select value={jobType} onChange={(e) => { setJobType(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                    {typeOptions.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-200/60">Priority</label>
                  <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                    {priorityOptions.map((p) => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-200/60">Sort By</label>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                    {sortOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 skeleton" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-16">
          <HiOutlinePlusCircle className="text-5xl text-surface-200/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-100 mb-2">No jobs found</h3>
          <p className="text-sm text-surface-200/50 mb-4">
            {search || status !== 'all' ? 'Try adjusting your filters' : 'Start tracking your first application'}
          </p>
          <Button variant="accent" onClick={openAddModal}>Add Job</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {jobs.map((job, i) => (
              <motion.div
                key={job._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card hover onClick={() => openDetail(job)} className="group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-surface-800 flex items-center justify-center text-lg font-bold text-primary-400 flex-shrink-0">
                        {job.company?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-surface-100 truncate group-hover:text-primary-400 transition-colors">
                          {job.position}
                        </h3>
                        <p className="text-sm text-surface-200/60">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {job.location && (
                            <span className="flex items-center gap-1 text-xs text-surface-200/40">
                              <HiOutlineMapPin className="text-sm" /> {job.location}
                            </span>
                          )}
                          {job.salary && (
                            <span className="flex items-center gap-1 text-xs text-surface-200/40">
                              <HiOutlineCurrencyDollar className="text-sm" /> {job.salary}
                            </span>
                          )}
                          {job.jobUrl && (
                            <a href={job.jobUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                              onClick={(e) => e.stopPropagation()}>
                              <HiOutlineLink className="text-sm" /> Link
                            </a>
                          )}
                          {job.resume && (
                            <span className="flex items-center gap-1 text-xs text-surface-200/40" title={job.resume.fileName}>
                              <HiOutlineDocumentText className="text-sm" /> {job.resume.versionLabel || 'Resume'}
                            </span>
                          )}
                          {job.notes?.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-surface-200/40">
                              <HiOutlineChatBubbleLeftRight className="text-sm" /> {job.notes.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge status={job.status} />
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(job); }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-surface-200/40 hover:text-surface-100 transition-colors">
                          <HiOutlinePencilSquare className="text-sm" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(job._id); }}
                          className="p-1.5 rounded-lg hover:bg-danger/10 text-surface-200/40 hover:text-danger transition-colors">
                          <HiOutlineTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    page === i + 1 ? 'bg-primary-500 text-white' : 'bg-surface-800/60 text-surface-200/60 hover:bg-surface-800'
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editingJob ? 'Edit Job' : 'Add Job Application'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company *" placeholder="Google" value={formData.company} onChange={inputHandler('company')} required />
            <Input label="Position *" placeholder="Software Engineer" value={formData.position} onChange={inputHandler('position')} required />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-200/80">Status</label>
              <select value={formData.status} onChange={inputHandler('status')}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                {statusOptions.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-200/80">Job Type</label>
              <select value={formData.jobType} onChange={inputHandler('jobType')}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                {typeOptions.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Location" placeholder="San Francisco, CA" value={formData.location} onChange={inputHandler('location')} />
            <Input label="Salary" placeholder="$120,000 - $150,000" value={formData.salary} onChange={inputHandler('salary')} />
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-sm font-medium text-surface-200/80">Job URL</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input placeholder="https://..." value={formData.jobUrl} onChange={inputHandler('jobUrl')} className="w-full" />
                </div>
                <Button type="button" variant="secondary" onClick={handleAutoFill} loading={scraping} disabled={!formData.jobUrl} className="self-end h-[42px]">
                  <HiOutlineSparkles className="text-lg" /> Auto-fill Details
                </Button>
              </div>
            </div>
            <Input label="Contact Email" placeholder="recruiter@company.com" value={formData.contactEmail} onChange={inputHandler('contactEmail')} />
            <Input label="Contact Name" placeholder="Jane Smith" value={formData.contactName} onChange={inputHandler('contactName')} />
            <Input label="Company Website" placeholder="https://company.com" value={formData.companyWebsite} onChange={inputHandler('companyWebsite')} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-200/80">Priority</label>
              <select value={formData.priority} onChange={inputHandler('priority')}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                {priorityOptions.filter(p => p !== 'all').map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Tags" placeholder="react, frontend, startup" value={formData.tags} onChange={inputHandler('tags')} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-200/80">Applied with Resume</label>
              <select value={formData.resume || ''} onChange={(e) => setFormData({ ...formData, resume: e.target.value || '' })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                <option value="">None (Select a resume...)</option>
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.versionLabel} ({r.fileName})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200/80">Job Description</label>
            <textarea id="job-description-input" value={formData.description} onChange={inputHandler('description')} rows={4} placeholder="Paste the job description here..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button variant="accent" type="submit" loading={saving}>{editingJob ? 'Update' : 'Add Job'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => { setDetailModal(false); setShowAnalysis(false); setAnalysisResult(null); }} title={showAnalysis ? "AI Match & Interview Prep" : "Job Details"} size="lg">
        {selectedJob && (
          showAnalysis ? (
            <div className="space-y-6">
              {/* Back button */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <button onClick={() => setShowAnalysis(false)} className="flex items-center gap-1.5 text-sm text-surface-200/60 hover:text-surface-100 transition-colors">
                  <HiOutlineArrowLeft className="text-lg" /> Back to Job Details
                </button>
                <span className="text-xs text-primary-400 font-semibold flex items-center gap-1">
                  <HiOutlineSparkles /> Powered by Gemini
                </span>
              </div>

              {analysisLoading ? (
                <div className="py-12 space-y-4 text-center">
                  <div className="w-10 h-10 rounded-full border-3 border-primary-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-sm text-surface-200/60">Analyzing resume against job description...</p>
                  <p className="text-xs text-surface-200/40">Evaluating skills match and formatting, generating customized interview prep questions...</p>
                </div>
              ) : !analysisResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-800/40 border border-white/5 space-y-2">
                    <h4 className="font-semibold text-surface-100 text-sm">Select Resume for Comparison</h4>
                    <p className="text-xs text-surface-200/60 leading-relaxed">
                      Choose which resume version to analyze against this job description. We will calculate a match score, evaluate categories, and generate interview preparation.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/40 border border-white/5">
                      <input
                        type="checkbox"
                        id="selectBestOption"
                        checked={selectBestOption}
                        onChange={(e) => setSelectBestOption(e.target.checked)}
                        className="w-4 h-4 text-primary-500 focus:ring-primary-500 bg-surface-800 border-white/10 rounded"
                      />
                      <label htmlFor="selectBestOption" className="text-sm font-medium text-surface-100 cursor-pointer">
                        Let AI scan and select my best matching resume version
                      </label>
                    </div>

                    {!selectBestOption && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-surface-200/80">Or Choose Specific Version</label>
                        <select
                          value={selectedResumeForAnalysis}
                          onChange={(e) => setSelectedResumeForAnalysis(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50"
                        >
                          <option value="">Select a resume...</option>
                          {resumes.map((r) => (
                            <option key={r._id} value={r._id}>{r.versionLabel} ({r.fileName})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!selectedJob.description && (
                      <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                        Warning: This job posting has no job description text. Paste the JD in the edit screen first to get an accurate match score.
                      </div>
                    )}

                    <Button
                      variant="accent"
                      className="w-full"
                      onClick={handleRunAnalysis}
                      disabled={!selectBestOption && !selectedResumeForAnalysis}
                    >
                      <HiOutlineSparkles /> Run AI Match & Prep
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Score and Verdict Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-surface-800/40 border border-white/5">
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary-500/20 text-xl font-extrabold text-primary-400 bg-primary-500/5">
                      {analysisResult.overallScore}%
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <h4 className="font-bold text-surface-100 text-base">Match Score Verdict</h4>
                      <p className="text-xs text-surface-200/60 leading-relaxed">{analysisResult.verdict}</p>
                      <p className="text-[10px] text-surface-200/40 italic">
                        Compared using resume: <span className="font-semibold text-primary-400">{analysisResult.selectedResumeName || 'Default'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex gap-1 bg-surface-900 p-1 rounded-lg">
                    {[
                      { id: 'overview', label: 'Match Breakdown' },
                      { id: 'keywords', label: 'Keyword Analyzer' },
                      { id: 'improvements', label: 'Resume Tuning' },
                      { id: 'questions', label: 'Interview Q&A' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setAnalysisTab(t.id)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          analysisTab === t.id ? 'bg-surface-800 text-primary-400 shadow-sm' : 'text-surface-200/50 hover:text-surface-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Panels */}
                  {analysisTab === 'overview' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">Category Scores</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Skills Alignment', val: analysisResult.categoryScores?.skillsMatch },
                          { label: 'Experience Relevance', val: analysisResult.categoryScores?.experienceRelevance },
                          { label: 'Education Match', val: analysisResult.categoryScores?.educationFit },
                          { label: 'Keywords Density', val: analysisResult.categoryScores?.keywordOptimization },
                          { label: 'Culture & Tone Fit', val: analysisResult.categoryScores?.cultureFit },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-surface-100">{item.label}</span>
                              <span className="text-primary-400">{item.val?.score ?? 0}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary-500 h-full transition-all duration-500" style={{ width: `${item.val?.score ?? 0}%` }} />
                            </div>
                            {item.val?.details && <p className="text-[10px] text-surface-200/40 leading-relaxed">{item.val.details}</p>}
                          </div>
                        ))}
                      </div>

                      {analysisResult.companyInsights && (
                        <div className="border-t border-white/5 pt-4 space-y-2">
                          <h4 className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">Company Insights</h4>
                          <p className="text-xs text-surface-100">{analysisResult.companyInsights.overview}</p>
                          {analysisResult.companyInsights.culture?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {analysisResult.companyInsights.culture.map((val, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-surface-200/60 border border-white/5">{val}</span>
                              ))}
                            </div>
                          )}
                          {analysisResult.companyInsights.interviewStyle && (
                            <p className="text-[11px] text-surface-200/50 mt-1">
                              <span className="font-semibold text-surface-100">Process:</span> {analysisResult.companyInsights.interviewStyle}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {analysisTab === 'keywords' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">ATS Keyword Gap Analysis</h4>
                        <p className="text-xs text-surface-200/50">Ensure key skills and terms from the job posting are represented in your resume.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Matching Keywords */}
                        <div className="p-4 rounded-xl bg-success/5 border border-success/15 space-y-3">
                          <h5 className="text-xs font-semibold text-success flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                            Matched Keywords ({analysisResult.keywordGap?.matching?.length || 0})
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.keywordGap?.matching?.length > 0 ? (
                              analysisResult.keywordGap.matching.map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-success/10 text-success border border-success/20">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-surface-200/40 italic">No matching keywords identified</span>
                            )}
                          </div>
                        </div>

                        {/* Missing Keywords */}
                        <div className="p-4 rounded-xl bg-danger/5 border border-danger/15 space-y-3">
                          <h5 className="text-xs font-semibold text-danger flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
                            Missing Keywords ({analysisResult.keywordGap?.missing?.length || 0})
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.keywordGap?.missing?.length > 0 ? (
                              analysisResult.keywordGap.missing.map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-surface-200/40 italic">No critical missing keywords identified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {analysisResult.keywordGap?.missing?.length > 0 && (
                        <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 space-y-2">
                          <h5 className="text-xs font-bold text-primary-400 uppercase tracking-wide">Resume Optimization Strategy</h5>
                          <p className="text-xs text-surface-200/70 leading-relaxed">
                            Integrate the missing keywords like <strong className="text-surface-100">{analysisResult.keywordGap.missing.slice(0, 3).join(', ')}</strong> naturally into the experience bullets of your resume. Avoid list stuffing; describe projects where you applied these skills to pass both automated parsers and human screeners.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {analysisTab === 'improvements' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">Tailoring Suggestions</h4>
                      {analysisResult.resumeImprovements?.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {analysisResult.resumeImprovements.map((imp, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-surface-800/20 space-y-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/5 text-surface-100">{imp.section}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  imp.priority === 'high' ? 'bg-danger/10 text-danger' :
                                  imp.priority === 'medium' ? 'bg-warning/10 text-warning' :
                                  'bg-success/10 text-success'
                                }`}>
                                  {imp.priority} Priority
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 rounded bg-danger/5 border border-danger/10 text-surface-200/70">
                                  <span className="font-bold text-danger text-[9px] block uppercase mb-1">Current Resume</span>
                                  &quot;{imp.current}&quot;
                                </div>
                                <div className="p-2.5 rounded bg-success/5 border border-success/10 text-surface-100">
                                  <span className="font-bold text-success text-[9px] block uppercase mb-1">Suggested Update</span>
                                  &quot;{imp.suggested}&quot;
                                </div>
                              </div>
                              <p className="text-[10px] text-surface-200/40 leading-relaxed"><span className="font-semibold text-surface-200/60">Reason:</span> {imp.reason}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-surface-200/40 text-center py-6">Your resume is fully optimized for this job description!</p>
                      )}
                    </div>
                  )}

                  {analysisTab === 'questions' && (
                    <div className="space-y-4">
                      {analysisResult.interviewPrep?.likelyQuestions?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">Likely Interview Questions</h4>
                          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {analysisResult.interviewPrep.likelyQuestions.map((q, idx) => (
                              <details key={idx} className="group border border-white/5 rounded-xl bg-surface-800/10 overflow-hidden">
                                <summary className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/3 transition-colors text-xs font-semibold text-surface-100">
                                  <span className="flex-1 pr-4">{idx + 1}. {q.question}</span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-surface-200/50 uppercase tracking-wider">{q.type}</span>
                                    <span className="text-[9px] bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded text-surface-200/50 uppercase tracking-wider">{q.difficulty}</span>
                                  </div>
                                </summary>
                                <div className="px-3.5 pb-3.5 space-y-3 text-xs border-t border-white/5 pt-3">
                                  <div className="p-3 rounded-lg bg-primary-500/5 text-surface-100">
                                    <p className="font-bold text-primary-400 text-[10px] uppercase mb-1">Suggested Answer Strategy</p>
                                    {q.suggestedAnswer}
                                  </div>
                                  {q.keyPoints?.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="font-bold text-surface-200/60 text-[9px] uppercase">Key Talking Points</p>
                                      <ul className="list-disc pl-4 text-[11px] text-surface-200/50 space-y-0.5">
                                        {q.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisResult.interviewPrep?.talkingPoints?.length > 0 && (
                        <div className="border-t border-white/5 pt-4 space-y-2">
                          <h4 className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">Key Strengths to Highlight</h4>
                          <ul className="list-disc pl-4 text-xs text-surface-100 space-y-1">
                            {analysisResult.interviewPrep.talkingPoints.map((val, idx) => <li key={idx}>{val}</li>)}
                          </ul>
                        </div>
                      )}

                      {analysisResult.interviewPrep?.weaknessMitigation?.length > 0 && (
                        <div className="border-t border-white/5 pt-4 space-y-2">
                          <h4 className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">Mitigating Gaps / Weaknesses</h4>
                          <div className="space-y-2">
                            {analysisResult.interviewPrep.weaknessMitigation.map((val, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-surface-800/40 text-xs">
                                <p className="font-semibold text-danger">{val.weakness}</p>
                                <p className="text-[11px] text-surface-200/50 mt-1">{val.strategy}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center text-2xl font-bold text-primary-400">
                  {selectedJob.company?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-surface-100">{selectedJob.position}</h3>
                  <p className="text-surface-200/60">{selectedJob.company}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge status={selectedJob.status} size="md" />
                    {selectedJob.priority && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border priority-${selectedJob.priority}`}>
                        {selectedJob.priority}
                      </span>
                    )}
                    {selectedJob.jobType && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-800 text-surface-200/70">
                        {selectedJob.jobType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Quick Change */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-surface-200/60 uppercase tracking-wide">Change Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.filter(s => s !== 'all').map((s) => (
                    <button key={s} onClick={() => handleStatusChange(selectedJob._id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedJob.status === s ? 'bg-primary-500 text-white' : 'bg-surface-800/60 text-surface-200/60 hover:bg-surface-800'
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedJob.location && <div><span className="text-surface-200/40">Location</span><p className="text-surface-100">{selectedJob.location}</p></div>}
                {selectedJob.salary && <div><span className="text-surface-200/40">Salary</span><p className="text-surface-100">{selectedJob.salary}</p></div>}
                {selectedJob.contactName && <div><span className="text-surface-200/40">Contact</span><p className="text-surface-100">{selectedJob.contactName}</p></div>}
                {selectedJob.contactEmail && <div><span className="text-surface-200/40">Email</span><p className="text-primary-400">{selectedJob.contactEmail}</p></div>}
                {selectedJob.jobUrl && (
                  <div>
                    <span className="text-surface-200/40">Job Link</span>
                    <a href={selectedJob.jobUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary-400 hover:text-primary-300">
                      Open <HiOutlineArrowUpRight className="text-xs" />
                    </a>
                  </div>
                )}
                {selectedJob.appliedDate && <div><span className="text-surface-200/40">Applied</span><p className="text-surface-100">{format(new Date(selectedJob.appliedDate), 'MMM d, yyyy')}</p></div>}
                {selectedJob.resume && (
                  <div>
                    <span className="text-surface-200/40">Resume Used</span>
                    <p className="text-surface-100">
                      {selectedJob.resume.versionLabel || 'Resume'} ({selectedJob.resume.fileName || 'Linked file'})
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-surface-200/60 uppercase tracking-wide">Notes</h4>
                <div className="flex gap-2">
                  <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..."
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
                  <Button variant="primary" size="sm" onClick={handleAddNote}>Add</Button>
                </div>
                {selectedJob.notes?.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedJob.notes.map((note) => (
                      <div key={note._id} className="flex items-start justify-between p-3 rounded-lg bg-surface-800/40 text-sm">
                        <div>
                          <p className="text-surface-100">{note.text}</p>
                          <p className="text-xs text-surface-200/40 mt-1">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</p>
                        </div>
                        <button onClick={() => handleDeleteNote(note._id)}
                          className="text-surface-200/30 hover:text-danger transition-colors ml-2">
                          <HiOutlineTrash className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <Button variant="danger" size="sm" onClick={() => handleDelete(selectedJob._id)}>
                  <HiOutlineTrash /> Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setDetailModal(false); openEditModal(selectedJob); }}>
                  <HiOutlinePencilSquare /> Edit
                </Button>
                <Button variant="accent" size="sm" onClick={() => handleOpenAIAnalysis(selectedJob)}>
                  <HiOutlineSparkles /> AI Match & Prep
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default JobsPage;
