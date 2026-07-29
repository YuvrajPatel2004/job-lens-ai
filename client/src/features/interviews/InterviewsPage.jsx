import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlineLink,
  HiOutlineStar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMapPin,
  HiOutlineCheckCircle,
  HiOutlineBolt,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiOutlineComputerDesktop,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { getInterviews, getJobs, createInterview, updateInterview, deleteInterview, addInterviewFeedback } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const typeBadgeStyles = {
  video: { icon: HiOutlineVideoCamera, color: 'bg-primary-500/15 text-primary-400 border-primary-500/30', label: 'Video Call' },
  phone: { icon: HiOutlineClock, color: 'bg-accent-500/15 text-accent-400 border-accent-500/30', label: 'Phone Screen' },
  onsite: { icon: HiOutlineBuildingOffice2, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Onsite' },
  technical: { icon: HiOutlineComputerDesktop, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'Technical' },
  behavioral: { icon: HiOutlineAcademicCap, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Behavioral' },
  panel: { icon: HiOutlineUserGroup, color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', label: 'Panel' },
  hr: { icon: HiOutlineSparkles, color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', label: 'HR Round' },
  other: { icon: HiOutlineCalendar, color: 'bg-surface-700/40 text-surface-200 border-surface-600/30', label: 'General' },
};

// Safe date helpers
const safeFormatDate = (dateStr, formatPattern, fallback = '') => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return format(d, formatPattern);
  } catch (e) {
    return fallback;
  }
};

const safeFormatDistance = (dateStr, fallback = '') => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (e) {
    return fallback;
  }
};

const safeIsUpcoming = (interview) => {
  if (interview.status !== 'scheduled' || !interview.scheduledAt) return false;
  try {
    const d = new Date(interview.scheduledAt);
    return !isNaN(d.getTime()) && !isPast(d);
  } catch (e) {
    return false;
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 25 }
  }
};

const InterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [filter, setFilter] = useState('upcoming');

  const emptyForm = {
    job: '', type: 'video', scheduledAt: '', duration: 60, location: '',
    meetingLink: '', interviewerName: '', interviewerEmail: '', notes: '', autoJoin: false
  };
  const [formData, setFormData] = useState(emptyForm);
  const [feedbackData, setFeedbackData] = useState({ feedback: '', rating: 3 });

  const fetchData = useCallback(async () => {
    try {
      const [intRes, jobRes] = await Promise.all([
        getInterviews(filter === 'upcoming' ? { upcoming: 'true' } : {}),
        getJobs({ limit: 100 }),
      ]);
      setInterviews(intRes.data);
      setJobs(jobRes.data.jobs);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-join meeting watcher
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      interviews.forEach(interview => {
        if (interview.status === 'scheduled' && interview.autoJoin && interview.meetingLink) {
          const scheduledTime = new Date(interview.scheduledAt);
          if (!isNaN(scheduledTime.getTime())) {
            const diffMs = scheduledTime.getTime() - now.getTime();
            // Trigger if meeting is starting in <= 1 minute (and not past by more than 1 minute to avoid late popups)
            if (diffMs > -60000 && diffMs <= 60000) {
              const joinKey = `joined_${interview._id}`;
              if (!sessionStorage.getItem(joinKey)) {
                sessionStorage.setItem(joinKey, 'true');
                window.open(interview.meetingLink, '_blank');
                toast.success(`Auto-joining interview: ${interview.job?.company || 'Upcoming Interview'}`);
              }
            }
          }
        }
      });
    }, 15000); // Check every 15 seconds
    
    return () => clearInterval(interval);
  }, [interviews]);

  const openAddModal = () => {
    setEditingInterview(null);
    setFormData(emptyForm);
    setFormModal(true);
  };

  const openEditModal = (interview) => {
    setEditingInterview(interview);
    let formattedDate = '';
    if (interview.scheduledAt) {
      try {
        const d = new Date(interview.scheduledAt);
        if (!isNaN(d.getTime())) {
          formattedDate = format(d, "yyyy-MM-dd'T'HH:mm");
        }
      } catch (e) {
        formattedDate = '';
      }
    }

    setFormData({
      job: interview.job?._id || interview.job || '',
      type: interview.type || 'video',
      scheduledAt: formattedDate,
      duration: interview.duration || 60,
      location: interview.location || '',
      meetingLink: interview.meetingLink || '',
      interviewerName: interview.interviewerName || '',
      interviewerEmail: interview.interviewerEmail || '',
      notes: interview.notes || '',
      autoJoin: Boolean(interview.autoJoin),
    });
    setFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.job) return toast.error('Please select a job application');
    if (!formData.scheduledAt) return toast.error('Please select date and time');

    setSaving(true);
    try {
      const payload = { ...formData };
      
      // EXPLICIT LOCAL DATETIME PARSING:
      // Prevents JavaScript Date constructor from accidentally parsing datetime-local strings as UTC
      if (payload.scheduledAt) {
        const [datePart, timePart] = payload.scheduledAt.split('T');
        if (datePart && timePart) {
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes] = timePart.split(':').map(Number);
          const localDate = new Date(year, month - 1, day, hours, minutes);
          payload.scheduledAt = localDate.toISOString();
        } else {
          payload.scheduledAt = new Date(payload.scheduledAt).toISOString();
        }
      }

      if (editingInterview) {
        await updateInterview(editingInterview._id, payload);
        toast.success('Interview updated');
      } else {
        await createInterview(payload);
        toast.success('Interview scheduled');
      }
      setFormModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await deleteInterview(id);
      toast.success('Interview deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openFeedback = (interview) => {
    setSelectedInterview(interview);
    setFeedbackData({ feedback: interview.feedback || '', rating: interview.rating || 3 });
    setFeedbackModal(true);
  };

  const handleFeedback = async () => {
    setSaving(true);
    try {
      await addInterviewFeedback(selectedInterview._id, feedbackData);
      toast.success('Feedback saved');
      setFeedbackModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  const inputHandler = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const upcomingList = interviews.filter(safeIsUpcoming);
  const pastList = interviews.filter((i) => !safeIsUpcoming(i));
  const autoJoinCount = interviews.filter((i) => i.autoJoin && safeIsUpcoming(i)).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-surface-900 via-surface-850 to-surface-900 p-6 sm:p-8 rounded-3xl border border-white/8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold">
            <HiOutlineSparkles className="text-sm animate-pulse" /> Interview Command Center
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interviews</h1>
          <p className="text-sm text-surface-200/70 max-w-xl">
            Schedule, manage, and auto-join your upcoming interview rounds with built-in email reminders.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button variant="accent" onClick={openAddModal} className="shadow-lg shadow-accent-500/20 px-6 py-3">
            <HiOutlinePlusCircle className="text-xl mr-2" />
            Schedule Interview
          </Button>
        </motion.div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-surface-900/60 border border-white/8 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-surface-200/50 uppercase tracking-wider">Upcoming Rounds</p>
            <h3 className="text-2xl font-bold text-white mt-1">{upcomingList.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400 text-xl">
            <HiOutlineCalendar />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-surface-900/60 border border-white/8 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-surface-200/50 uppercase tracking-wider">Total Tracked</p>
            <h3 className="text-2xl font-bold text-white mt-1">{interviews.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-700/40 border border-surface-600/30 flex items-center justify-center text-surface-200 text-xl">
            <HiOutlineCheckCircle />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-surface-900/60 border border-white/8 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-surface-200/50 uppercase tracking-wider">Auto-Join Armed</p>
            <h3 className="text-2xl font-bold text-accent-400 mt-1">{autoJoinCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-400 text-xl">
            <HiOutlineBolt className="animate-bounce" />
          </div>
        </motion.div>
      </div>

      {/* Filter Switcher */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-surface-900/80 border border-white/8 backdrop-blur-md">
          {['upcoming', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                filter === f ? 'text-white' : 'text-surface-200/60 hover:text-surface-100'
              }`}
            >
              {filter === f && (
                <motion.div
                  layoutId="activeFilterTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/25 to-accent-500/25 border border-primary-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2 capitalize">
                {f === 'upcoming' ? '⚡ Upcoming' : '📂 All Interviews'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-surface-800/40 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <Card className="text-center py-20 bg-surface-900/40 border border-white/8 backdrop-blur-xl">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <HiOutlineCalendar className="text-6xl text-surface-200/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No interviews scheduled</h3>
            <p className="text-sm text-surface-200/60 max-w-md mx-auto mb-6">
              Track your upcoming screenings, technical rounds, and behavioral interviews with automatic meeting auto-join!
            </p>
            <Button variant="accent" onClick={openAddModal} className="px-6 py-2.5">
              Schedule Your First Interview
            </Button>
          </motion.div>
        </Card>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          {filter === 'all' && upcomingList.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-primary-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping" /> Upcoming Rounds ({upcomingList.length})
              </h2>
              <div className="space-y-3">
                {upcomingList.map((interview, i) => (
                  <InterviewCard key={interview._id} interview={interview} index={i}
                    onEdit={openEditModal} onDelete={handleDelete} onFeedback={openFeedback} />
                ))}
              </div>
            </div>
          )}

          {filter === 'upcoming' && (
            <div className="space-y-3">
              {(filter === 'upcoming' ? interviews : upcomingList).map((interview, i) => (
                <InterviewCard key={interview._id} interview={interview} index={i}
                  onEdit={openEditModal} onDelete={handleDelete} onFeedback={openFeedback} />
              ))}
            </div>
          )}

          {filter === 'all' && pastList.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xs font-bold text-surface-200/50 uppercase tracking-widest">
                Completed & Past ({pastList.length})
              </h2>
              <div className="space-y-3">
                {pastList.map((interview, i) => (
                  <InterviewCard key={interview._id} interview={interview} index={i}
                    onEdit={openEditModal} onDelete={handleDelete} onFeedback={openFeedback} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Form Modal */}
      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editingInterview ? 'Edit Interview Details' : 'Schedule New Interview'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-surface-200/70">Job Application *</label>
            <select value={formData.job} onChange={inputHandler('job')} required
              className="w-full px-4 py-3 rounded-xl bg-surface-800/90 border border-white/10 text-surface-100 text-sm focus:outline-none focus:border-primary-500 transition-colors">
              <option value="">Select a job application...</option>
              {jobs.map((j) => <option key={j._id} value={j._id}>{j.position} — {j.company}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-surface-200/70">Interview Type</label>
              <select value={formData.type} onChange={inputHandler('type')}
                className="w-full px-4 py-3 rounded-xl bg-surface-800/90 border border-white/10 text-surface-100 text-sm focus:outline-none focus:border-primary-500 transition-colors capitalize">
                {Object.keys(typeBadgeStyles).map((t) => (
                  <option key={t} value={t}>{typeBadgeStyles[t].label}</option>
                ))}
              </select>
            </div>
            <Input label="Duration (minutes)" type="number" value={formData.duration} onChange={inputHandler('duration')} min={15} max={480} />
          </div>

          <div className="space-y-1.5">
            <Input label="Date & Time (Local Time) *" type="datetime-local" value={formData.scheduledAt} onChange={inputHandler('scheduledAt')} required />
            <p className="text-[11px] text-surface-200/50">Your exact local timezone will be automatically saved.</p>
          </div>

          <Input label="Location (if physical)" placeholder="e.g., HQ Office 4th Floor" value={formData.location} onChange={inputHandler('location')} />
          
          <div className="space-y-2">
            <Input label="Meeting Link (Video/Call)" placeholder="https://zoom.us/j/... or Google Meet URL" value={formData.meetingLink} onChange={inputHandler('meetingLink')} />
            
            {formData.type === 'video' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-1">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  formData.autoJoin ? 'bg-accent-500/10 border-accent-500/30' : 'bg-surface-800/50 border-white/8'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={formData.autoJoin} 
                    onChange={(e) => setFormData({ ...formData, autoJoin: e.target.checked })} 
                    className="w-4 h-4 mt-0.5 rounded border-white/20 bg-surface-900 text-accent-500 focus:ring-accent-500/50"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <HiOutlineBolt className="text-accent-400" /> Auto-join meeting when it starts
                    </span>
                    <p className="text-xs text-surface-200/60 mt-0.5">
                      If JobLens AI is open in your browser tab, the meeting link will automatically launch when the interview begins!
                    </p>
                  </div>
                </label>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Interviewer Name" placeholder="e.g. Jane Smith" value={formData.interviewerName} onChange={inputHandler('interviewerName')} />
            <Input label="Interviewer Email" type="email" placeholder="jane@company.com" value={formData.interviewerEmail} onChange={inputHandler('interviewerEmail')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-surface-200/70">Preparation Notes</label>
            <textarea value={formData.notes} onChange={inputHandler('notes')} rows={3} placeholder="Key talking points, questions to ask..."
              className="w-full px-4 py-3 rounded-xl bg-surface-800/90 border border-white/10 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="secondary" type="button" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button variant="accent" type="submit" loading={saving} className="px-6">
              {editingInterview ? 'Update Interview' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={feedbackModal} onClose={() => setFeedbackModal(false)} title="Interview Reflection & Feedback" size="sm">
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-surface-200/70">Performance Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button key={star} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                  type="button" onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  className={`p-1.5 rounded-lg transition-colors ${feedbackData.rating >= star ? 'text-amber-400 bg-amber-400/10' : 'text-surface-200/20 hover:text-surface-200/40'}`}>
                  <HiOutlineStar className="text-2xl" style={feedbackData.rating >= star ? { fill: 'currentColor' } : {}} />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-surface-200/70">How did it go?</label>
            <textarea value={feedbackData.feedback} onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
              rows={4} placeholder="Questions asked, topics covered, areas for improvement..."
              className="w-full px-4 py-3 rounded-xl bg-surface-800/90 border border-white/10 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setFeedbackModal(false)}>Cancel</Button>
            <Button variant="accent" loading={saving} onClick={handleFeedback} className="px-5">Save Notes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const InterviewCard = ({ interview, index, onEdit, onDelete, onFeedback }) => {
  const isUpcoming = safeIsUpcoming(interview);
  const badgeInfo = typeBadgeStyles[interview.type] || typeBadgeStyles.other;
  const BadgeIcon = badgeInfo.icon;

  const formattedDate = safeFormatDate(interview.scheduledAt, 'MMM d, yyyy');
  const formattedTime = safeFormatDate(interview.scheduledAt, 'h:mm a');
  const distanceText = safeFormatDistance(interview.scheduledAt);

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
      <Card hover className={`relative overflow-hidden transition-all duration-300 ${
        isUpcoming 
          ? 'border-primary-500/25 bg-gradient-to-r from-surface-900/90 via-surface-850/80 to-surface-900/90 shadow-[0_4px_25px_rgba(99,102,241,0.06)]' 
          : 'border-white/5 opacity-80 hover:opacity-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border ${badgeInfo.color}`}>
              <BadgeIcon />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {interview.job?.position || 'Interview Round'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeInfo.color}`}>
                  {badgeInfo.label}
                </span>

                {interview.autoJoin && isUpcoming && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-500/15 text-accent-400 border border-accent-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-ping" /> Auto-Join Armed
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-surface-200/70">
                {interview.job?.company || 'Company'}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-surface-200/60">
                {formattedDate && (
                  <span className="flex items-center gap-1 text-surface-100 font-medium">
                    <HiOutlineCalendar className="text-primary-400" /> {formattedDate}
                  </span>
                )}
                {formattedTime && (
                  <span className="flex items-center gap-1 text-surface-100 font-medium">
                    <HiOutlineClock className="text-primary-400" /> {formattedTime}
                  </span>
                )}
                {interview.duration && (
                  <span className="text-surface-200/50">({interview.duration} mins)</span>
                )}
                {interview.location && (
                  <span className="flex items-center gap-1">
                    <HiOutlineMapPin className="text-rose-400" /> {interview.location}
                  </span>
                )}
              </div>

              {isUpcoming && distanceText && (
                <p className="text-xs text-accent-400 font-semibold pt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" /> Starting {distanceText}
                </p>
              )}

              {interview.meetingLink && (
                <motion.div whileHover={{ x: 3 }} className="pt-1">
                  <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20 transition-colors">
                    <HiOutlineLink className="text-sm" /> Join Meeting Link
                  </a>
                </motion.div>
              )}

              {interview.rating && (
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-xs font-medium text-surface-200/50 mr-1">Feedback:</span>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <HiOutlineStar key={s} className={`text-sm ${interview.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-surface-200/15'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center justify-end gap-1 flex-shrink-0 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
            {!isUpcoming && (
              <Button variant="secondary" size="sm" onClick={() => onFeedback(interview)} className="text-xs py-1.5 px-3">
                <HiOutlineChatBubbleLeftRight className="mr-1 text-sm" /> Notes
              </Button>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(interview)}
                className="p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-surface-200/60 hover:text-white border border-white/5 transition-all" title="Edit Interview">
                <HiOutlinePencilSquare className="text-lg" />
              </button>
              <button onClick={() => onDelete(interview._id)}
                className="p-2 rounded-xl bg-surface-800/80 hover:bg-danger/20 text-surface-200/60 hover:text-danger border border-white/5 transition-all" title="Delete Interview">
                <HiOutlineTrash className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default InterviewsPage;
