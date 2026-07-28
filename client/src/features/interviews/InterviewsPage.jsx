import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
} from 'react-icons/hi2';
import { getInterviews, getJobs, createInterview, updateInterview, deleteInterview, addInterviewFeedback } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const typeIcons = {
  phone: '📞', video: '📹', onsite: '🏢', technical: '💻', behavioral: '🧠', panel: '👥', hr: '🤝', other: '📋',
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
    meetingLink: '', interviewerName: '', interviewerEmail: '', notes: '',
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

  const openAddModal = () => {
    setEditingInterview(null);
    setFormData(emptyForm);
    setFormModal(true);
  };

  const openEditModal = (interview) => {
    setEditingInterview(interview);
    setFormData({
      job: interview.job?._id || interview.job,
      type: interview.type,
      scheduledAt: interview.scheduledAt ? format(new Date(interview.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
      duration: interview.duration,
      location: interview.location || '',
      meetingLink: interview.meetingLink || '',
      interviewerName: interview.interviewerName || '',
      interviewerEmail: interview.interviewerEmail || '',
      notes: interview.notes || '',
    });
    setFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingInterview) {
        await updateInterview(editingInterview._id, formData);
        toast.success('Interview updated');
      } else {
        await createInterview(formData);
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

  const upcoming = interviews.filter((i) => i.status === 'scheduled' && !isPast(new Date(i.scheduledAt)));
  const past = interviews.filter((i) => i.status !== 'scheduled' || isPast(new Date(i.scheduledAt)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Interviews</h1>
          <p className="text-sm text-surface-200/50 mt-0.5">Schedule and track your interviews</p>
        </div>
        <Button variant="accent" onClick={openAddModal}>
          <HiOutlinePlusCircle className="text-lg" />
          Schedule Interview
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['upcoming', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'bg-surface-800/40 text-surface-200/60 border border-transparent hover:bg-surface-800/60'
            }`}>
            {f === 'upcoming' ? 'Upcoming' : 'All Interviews'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton" />)}</div>
      ) : interviews.length === 0 ? (
        <Card className="text-center py-16">
          <HiOutlineCalendar className="text-5xl text-surface-200/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-100 mb-2">No interviews scheduled</h3>
          <p className="text-sm text-surface-200/50 mb-4">Schedule your first interview to get started</p>
          <Button variant="accent" onClick={openAddModal}>Schedule Interview</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {filter === 'all' && upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-surface-200/60 uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((interview, i) => (
                  <InterviewCard key={interview._id} interview={interview} index={i}
                    onEdit={openEditModal} onDelete={handleDelete} onFeedback={openFeedback} />
                ))}
              </div>
            </div>
          )}
          {filter === 'upcoming' && (
            <div className="space-y-3">
              {(filter === 'upcoming' ? interviews : upcoming).map((interview, i) => (
                <InterviewCard key={interview._id} interview={interview} index={i}
                  onEdit={openEditModal} onDelete={handleDelete} onFeedback={openFeedback} />
              ))}
            </div>
          )}
          {filter === 'all' && past.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-surface-200/60 uppercase tracking-wide mb-3">Past</h2>
              <div className="space-y-3">
                {past.map((interview, i) => (
                  <InterviewCard key={interview._id} interview={interview} index={i}
                    onEdit={openEditModal} onDelete={handleDelete} onFeedback={openFeedback} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editingInterview ? 'Edit Interview' : 'Schedule Interview'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200/80">Job Application *</label>
            <select value={formData.job} onChange={inputHandler('job')} required
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
              <option value="">Select a job...</option>
              {jobs.map((j) => <option key={j._id} value={j._id}>{j.position} — {j.company}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-200/80">Interview Type</label>
              <select value={formData.type} onChange={inputHandler('type')}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50">
                {Object.keys(typeIcons).map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Duration (min)" type="number" value={formData.duration} onChange={inputHandler('duration')} min={15} max={480} />
          </div>
          <Input label="Date & Time *" type="datetime-local" value={formData.scheduledAt} onChange={inputHandler('scheduledAt')} required />
          <Input label="Location" placeholder="Office address or room" value={formData.location} onChange={inputHandler('location')} />
          <Input label="Meeting Link" placeholder="https://zoom.us/..." value={formData.meetingLink} onChange={inputHandler('meetingLink')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Interviewer Name" placeholder="Jane Smith" value={formData.interviewerName} onChange={inputHandler('interviewerName')} />
            <Input label="Interviewer Email" type="email" placeholder="jane@company.com" value={formData.interviewerEmail} onChange={inputHandler('interviewerEmail')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200/80">Notes</label>
            <textarea value={formData.notes} onChange={inputHandler('notes')} rows={3} placeholder="Preparation notes..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button variant="accent" type="submit" loading={saving}>{editingInterview ? 'Update' : 'Schedule'}</Button>
          </div>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={feedbackModal} onClose={() => setFeedbackModal(false)} title="Interview Feedback" size="sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-200/80">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  className={`p-1 transition-colors ${feedbackData.rating >= star ? 'text-warning' : 'text-surface-200/20'}`}>
                  <HiOutlineStar className="text-2xl" style={feedbackData.rating >= star ? { fill: 'currentColor' } : {}} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200/80">How did it go?</label>
            <textarea value={feedbackData.feedback} onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
              rows={4} placeholder="Share your experience..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFeedbackModal(false)}>Cancel</Button>
            <Button variant="accent" loading={saving} onClick={handleFeedback}>Save Feedback</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const InterviewCard = ({ interview, index, onEdit, onDelete, onFeedback }) => {
  const isUpcoming = interview.status === 'scheduled' && !isPast(new Date(interview.scheduledAt));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card hover className={`${isUpcoming ? 'border-primary-500/15' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-surface-800 flex items-center justify-center text-xl flex-shrink-0">
              {typeIcons[interview.type] || '📋'}
            </div>
            <div>
              <h3 className="font-medium text-surface-100">
                {interview.job?.position || 'Interview'}
              </h3>
              <p className="text-sm text-surface-200/50">{interview.job?.company}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-200/40">
                <span className="flex items-center gap-1">
                  <HiOutlineCalendar /> {format(new Date(interview.scheduledAt), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineClock /> {format(new Date(interview.scheduledAt), 'h:mm a')}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineVideoCamera /> {interview.type}
                </span>
                {interview.duration && (
                  <span>{interview.duration} min</span>
                )}
              </div>
              {isUpcoming && (
                <p className="text-xs text-primary-400 mt-1.5 font-medium">
                  {formatDistanceToNow(new Date(interview.scheduledAt), { addSuffix: true })}
                </p>
              )}
              {interview.meetingLink && (
                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-1">
                  <HiOutlineLink /> Join Meeting
                </a>
              )}
              {interview.location && (
                <span className="flex items-center gap-1 text-xs text-surface-200/40 mt-1">
                  <HiOutlineMapPin /> {interview.location}
                </span>
              )}
              {interview.rating && (
                <div className="flex items-center gap-0.5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <HiOutlineStar key={s} className={`text-sm ${interview.rating >= s ? 'text-warning' : 'text-surface-200/15'}`}
                      style={interview.rating >= s ? { fill: 'currentColor' } : {}} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {!isUpcoming && (
              <button onClick={() => onFeedback(interview)}
                className="p-2 rounded-lg hover:bg-white/5 text-surface-200/40 hover:text-surface-100 transition-colors" title="Add Feedback">
                <HiOutlineChatBubbleLeftRight className="text-lg" />
              </button>
            )}
            <button onClick={() => onEdit(interview)}
              className="p-2 rounded-lg hover:bg-white/5 text-surface-200/40 hover:text-surface-100 transition-colors" title="Edit">
              <HiOutlinePencilSquare className="text-lg" />
            </button>
            <button onClick={() => onDelete(interview._id)}
              className="p-2 rounded-lg hover:bg-danger/10 text-surface-200/40 hover:text-danger transition-colors" title="Delete">
              <HiOutlineTrash className="text-lg" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default InterviewsPage;
