import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineTrophy,
  HiOutlineClipboardDocumentCheck,
  HiOutlinePlusCircle,
  HiOutlineArrowUpRight,
  HiOutlineSparkles,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { getStats, getRecentActivity } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          getStats(),
          getRecentActivity(),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = stats
    ? [
        {
          label: 'Total Applications',
          value: stats.totalJobs,
          icon: HiOutlineBriefcase,
          color: 'from-primary-500 to-primary-700',
          glow: 'shadow-primary-500/20',
        },
        {
          label: 'Upcoming Interviews',
          value: stats.upcomingInterviews,
          icon: HiOutlineCalendar,
          color: 'from-accent-400 to-accent-600',
          glow: 'shadow-accent-500/20',
        },
        {
          label: 'Offers Received',
          value: stats.offers,
          icon: HiOutlineTrophy,
          color: 'from-success to-success',
          glow: 'shadow-success/20',
        },
        {
          label: 'Response Rate',
          value: `${stats.responseRate}%`,
          icon: HiOutlineClipboardDocumentCheck,
          color: 'from-warning to-warning',
          glow: 'shadow-warning/20',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
        <div className="h-64 skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-100">
            {greeting()},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-surface-200/60 mt-1">
            Here&apos;s what&apos;s happening with your job search
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/jobs">
            <Button variant="accent" size="md">
              <HiOutlinePlusCircle className="text-lg" />
              Add Job
            </Button>
          </Link>
          <Link to="/resumes">
            <Button variant="secondary" size="md">
              <HiOutlineDocumentText className="text-lg" />
              Upload Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card hover className="relative overflow-hidden">
              <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-xl`} />
              <div className="flex items-start justify-between relative">
                <div>
                  <p className="text-sm text-surface-200/60">{card.label}</p>
                  <p className="text-3xl font-bold text-surface-100 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-lg ${card.glow}`}>
                  <card.icon className="text-xl text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-surface-100">
                Recent Applications
              </h2>
              <Link
                to="/jobs"
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
              >
                View All <HiOutlineArrowUpRight className="text-sm" />
              </Link>
            </div>
            {activity?.recentJobs?.length > 0 ? (
              <div className="space-y-3">
                {activity.recentJobs.slice(0, 6).map((job, i) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-sm font-bold text-primary-400">
                        {job.company?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-100">
                          {job.position}
                        </p>
                        <p className="text-xs text-surface-200/50">
                          {job.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={job.status} />
                      <span className="text-xs text-surface-200/40 hidden sm:inline">
                        {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HiOutlineBriefcase className="text-4xl text-surface-200/20 mx-auto mb-3" />
                <p className="text-surface-200/50 text-sm">No applications yet</p>
                <Link to="/jobs">
                  <Button variant="ghost" size="sm" className="mt-3">
                    Add your first job
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions + Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-surface-100 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { to: '/jobs', icon: HiOutlinePlusCircle, label: 'Track New Application', color: 'text-primary-400' },
                { to: '/resumes', icon: HiOutlineDocumentText, label: 'Analyze Resume', color: 'text-accent-400' },
                { to: '/ai-tools', icon: HiOutlineSparkles, label: 'Generate Cover Letter', color: 'text-warning' },
                { to: '/interviews', icon: HiOutlineCalendar, label: 'Schedule Interview', color: 'text-success' },
              ].map((action) => (
                <Link
                  key={action.to + action.label}
                  to={action.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <action.icon className={`text-xl ${action.color}`} />
                  <span className="text-sm text-surface-200/70 group-hover:text-surface-100 transition-colors">
                    {action.label}
                  </span>
                  <HiOutlineArrowUpRight className="text-sm text-surface-200/30 ml-auto group-hover:text-surface-200/60 transition-colors" />
                </Link>
              ))}
            </div>
          </Card>

          {/* Upcoming Interviews */}
          <Card>
            <h2 className="text-lg font-semibold text-surface-100 mb-4">
              Upcoming Interviews
            </h2>
            {activity?.recentInterviews?.filter((i) => i.status === 'scheduled' && new Date(i.scheduledAt) >= new Date()).length > 0 ? (
              <div className="space-y-3">
                {activity.recentInterviews
                  .filter((i) => i.status === 'scheduled' && new Date(i.scheduledAt) >= new Date())
                  .slice(0, 3)
                  .map((interview) => (
                    <div
                      key={interview._id}
                      className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10"
                    >
                      <p className="text-sm font-medium text-surface-100">
                        {interview.job?.position}
                      </p>
                      <p className="text-xs text-surface-200/50">
                        {interview.job?.company}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-primary-400">
                        <HiOutlineCalendar />
                        <span>
                          {format(new Date(interview.scheduledAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-surface-200/40 text-center py-6">
                No upcoming interviews
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
