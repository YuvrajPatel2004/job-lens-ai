import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineChartBar,
  HiOutlineBriefcase,
  HiOutlineTrophy,
  HiOutlineCalendar,
  HiOutlineClipboardDocumentCheck,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { getStats, getTrends, getStatusDistribution, getJobs } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { format, parse } from 'date-fns';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  saved: '#94a3b8',
  applied: '#60a5fa',
  screening: '#fbbf24',
  interview: '#818cf8',
  offer: '#34d399',
  rejected: '#f87171',
  withdrawn: '#64748b',
};

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes, distRes, jobsRes] = await Promise.all([
          getStats(),
          getTrends(),
          getStatusDistribution(),
          getJobs({ limit: 10000 }),
        ]);
        setStats(statsRes.data);
        setTrends(
          trendsRes.data.map((t) => ({
            ...t,
            label: format(parse(t.month, 'yyyy-MM', new Date()), 'MMM yyyy'),
          }))
        );
        setDistribution(distRes.data);
        setJobs(jobsRes.data.jobs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const { data } = await getJobs({ limit: 10000 });
      const exportJobs = data.jobs || [];

      if (!exportJobs.length) {
        toast.error('No jobs to export');
        return;
      }

      const headers = [
        'Company',
        'Position',
        'Status',
        'Job Type',
        'Location',
        'Salary',
        'Job URL',
        'ATS Score',
        'Applied Date',
        'Resume Version',
        'Notes Count',
        'Priority',
        'Created At'
      ];

      const rows = exportJobs.map((job) => {
        const resumeLabel = job.resume
          ? `${job.resume.fileName} (v${job.resume.versionNumber} - ${job.resume.versionLabel || 'Untitled'})`
          : 'None';
        return [
          job.company || '',
          job.position || '',
          job.status || '',
          job.jobType || '',
          job.location || '',
          job.salary || '',
          job.jobUrl || '',
          job.atsScore || 'N/A',
          job.appliedDate ? format(new Date(job.appliedDate), 'yyyy-MM-dd') : '',
          resumeLabel,
          job.notes ? job.notes.length : 0,
          job.priority || 'medium',
          format(new Date(job.createdAt), 'yyyy-MM-dd HH:mm:ss')
        ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `joblens_jobs_export_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Jobs exported to CSV successfully!');
    } catch (err) {
      toast.error('Failed to export jobs');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateBragSheet = () => {
    if (!jobs.length) {
      toast.error('No jobs to include in the brag sheet');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    const appliedJobs = jobs.filter(j => j.status !== 'saved');
    const interviewingJobs = jobs.filter(j => j.status === 'interview');
    const offerJobs = jobs.filter(j => j.status === 'offer');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Search Brag Sheet - ${user?.name || 'Candidate'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', Arial, sans-serif;
              color: #1e293b;
              line-height: 1.5;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              color: #0f172a;
              margin: 0;
            }
            .subtitle {
              font-size: 14px;
              color: #64748b;
              margin: 5px 0 0 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .stat-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              background: #f8fafc;
            }
            .stat-val {
              font-size: 24px;
              font-weight: 700;
              color: #6366f1;
            }
            .stat-lbl {
              font-size: 12px;
              color: #64748b;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 15px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #f1f5f9;
              font-weight: 600;
              color: #475569;
              padding: 10px 12px;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              text-transform: capitalize;
            }
            .status-applied { background: #dbeafe; color: #1e40af; }
            .status-screening { background: #fef3c7; color: #92400e; }
            .status-interview { background: #e0e7ff; color: #3730a3; }
            .status-offer { background: #d1fae5; color: #065f46; }
            .status-rejected { background: #fee2e2; color: #991b1b; }
            .status-withdrawn { background: #f1f5f9; color: #475569; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 class="title">Job Search Brag Sheet</h1>
                <p class="subtitle">Generated on \${format(new Date(), 'MMMM d, yyyy')}</p>
              </div>
              <button onclick="window.print()" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
                Print / Save PDF
              </button>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val">\${appliedJobs.length}</div>
              <div class="stat-lbl">Active Applications</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">\${interviewingJobs.length}</div>
              <div class="stat-lbl">Interviews Scheduled</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">\${offerJobs.length}</div>
              <div class="stat-lbl">Offers Received</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">\${stats?.responseRate || 0}%</div>
              <div class="stat-lbl">Interview Response Yield</div>
            </div>
          </div>

          \${interviewingJobs.length > 0 ? \`
          <div class="section">
            <h2 class="section-title">Upcoming Interview Pipeline</h2>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Job Type</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                \${interviewingJobs.map(job => \\\`
                  <tr>
                    <td><strong>\\\${job.company}</strong></td>
                    <td>\\\${job.position}</td>
                    <td>\\\${job.jobType || 'Full-time'}</td>
                    <td>\\\${job.location || 'Remote'}</td>
                  </tr>
                \\\`).join('')}
              </tbody>
            </table>
          </div>
          \` : ''}

          <div class="section">
            <h2 class="section-title">Job Application Log</h2>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Location</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                \${appliedJobs.map(job => \\\`
                  <tr>
                    <td><strong>\\\${job.company}</strong></td>
                    <td>\\\${job.position}</td>
                    <td>\\\${job.location || 'N/A'}</td>
                    <td>\\\${job.appliedDate ? format(new Date(job.appliedDate), 'yyyy-MM-dd') : 'N/A'}</td>
                    <td>
                      <span class="status-badge status-\\\${job.status}">
                        \\\${job.status}
                      </span>
                    </td>
                  </tr>
                \\\`).join('')}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 50px;">
            Generated via JobLens AI — Career Tracking & Prep Suite
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getFunnelData = () => {
    if (!jobs.length) return [];
    
    const appliedCount = jobs.filter(j => j.status !== 'saved').length;
    const screeningCount = jobs.filter(j => ['screening', 'interview', 'offer'].includes(j.status)).length;
    const interviewCount = jobs.filter(j => ['interview', 'offer'].includes(j.status)).length;
    const offerCount = jobs.filter(j => j.status === 'offer').length;

    return [
      { stage: 'Applications', count: appliedCount, rate: 100 },
      { stage: 'Screening', count: screeningCount, rate: appliedCount ? Math.round((screeningCount / appliedCount) * 100) : 0 },
      { stage: 'Interviews', count: interviewCount, rate: appliedCount ? Math.round((interviewCount / appliedCount) * 100) : 0 },
      { stage: 'Offers', count: offerCount, rate: appliedCount ? Math.round((offerCount / appliedCount) * 100) : 0 },
    ];
  };

  const getResumePerformance = () => {
    if (!jobs.length) return [];

    const statsMap = {};

    jobs.forEach((job) => {
      if (!job.resume) return;
      const { fileName, versionNumber, versionLabel } = job.resume;
      const key = `${fileName} (v${versionNumber})`;
      
      if (!statsMap[key]) {
        statsMap[key] = {
          name: fileName,
          version: `v${versionNumber} - ${versionLabel || 'Untitled'}`,
          total: 0,
          responses: 0,
          interviews: 0,
          offers: 0,
        };
      }

      statsMap[key].total += 1;
      if (['screening', 'interview', 'offer', 'rejected'].includes(job.status)) {
        statsMap[key].responses += 1;
      }
      if (['interview', 'offer'].includes(job.status)) {
        statsMap[key].interviews += 1;
      }
      if (job.status === 'offer') {
        statsMap[key].offers += 1;
      }
    });

    return Object.values(statsMap)
      .map(item => ({
        ...item,
        responseRate: item.total ? Math.round((item.responses / item.total) * 100) : 0,
        interviewRate: item.total ? Math.round((item.interviews / item.total) * 100) : 0,
        offerRate: item.total ? Math.round((item.offers / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const funnelData = getFunnelData();
  const resumePerformance = getResumePerformance();

  const statCards = stats
    ? [
        { label: 'Total Applications', value: stats.totalJobs, icon: HiOutlineBriefcase, gradient: 'from-primary-500 to-primary-700' },
        { label: 'Offers', value: stats.offers, icon: HiOutlineTrophy, gradient: 'from-success to-success' },
        { label: 'Interviews', value: stats.upcomingInterviews, icon: HiOutlineCalendar, gradient: 'from-accent-400 to-accent-600' },
        { label: 'Response Rate', value: `${stats.responseRate}%`, icon: HiOutlineClipboardDocumentCheck, gradient: 'from-warning to-warning' },
      ]
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="px-3 py-2 rounded-lg bg-surface-800 border border-white/10 text-xs shadow-xl">
          <p className="text-surface-200/60">{label}</p>
          <p className="font-medium text-surface-100">{payload[0].value} applications</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 skeleton" />
          <div className="h-72 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
              <HiOutlineChartBar className="text-primary-400" /> Analytics Dashboard
            </h1>
            <p className="text-sm text-surface-200/50 mt-0.5">Gain insights into your job search funnel and resume performance</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateBragSheet}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 border border-white/5 bg-surface-800 text-surface-100 hover:bg-surface-700"
            >
              <HiOutlineClipboardDocumentCheck className="text-lg text-primary-400" /> Shareable Brag Sheet
            </Button>
            <Button
              onClick={handleExportCSV}
              loading={exporting}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 border border-white/5 bg-surface-800 text-surface-100 hover:bg-surface-700"
            >
              <HiOutlineArrowDownTray className="text-lg text-success" /> Export Jobs to CSV
            </Button>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-surface-200/60">{card.label}</p>
                  <p className="text-3xl font-bold text-surface-100 mt-1">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                  <card.icon className="text-xl text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <Card>
          <h3 className="text-lg font-semibold text-surface-100 mb-4">Application Trends</h3>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-surface-200/40">
              Not enough data to show trends yet
            </div>
          )}
        </Card>

        {/* Status Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-surface-100 mb-4">Status Distribution</h3>
          {distribution.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {distribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="px-3 py-2 rounded-lg bg-surface-800 border border-white/10 text-xs shadow-xl">
                            <p className="font-medium text-surface-100 capitalize">{payload[0].name}</p>
                            <p className="text-surface-200/60">{payload[0].value} applications</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-surface-200/60 capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-surface-200/40">
              No data to display
            </div>
          )}
        </Card>
      </div>

      {/* Application Funnel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Application Funnel</h3>
            <p className="text-xs text-surface-200/50 mb-6">Visualizing conversion drop-off and offer yields</p>
            {funnelData.length > 0 && funnelData.some(f => f.count > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="stage" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="px-3 py-2 rounded-lg bg-surface-800 border border-white/10 text-xs shadow-xl">
                            <p className="font-semibold text-surface-100">{payload[0].payload.stage}</p>
                            <p className="text-surface-200/60 mt-0.5">{payload[0].value} applications</p>
                            <p className="text-primary-400 font-medium">{payload[0].payload.rate}% conversion rate</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                    {funnelData.map((entry, index) => {
                      const colors = ['#818cf8', '#60a5fa', '#34d399', '#10b981'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-surface-200/40">
                Not enough data to calculate conversion funnel yet
              </div>
            )}
          </Card>
        </div>

        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Funnel Conversions</h3>
            <p className="text-xs text-surface-200/50 mb-6">Stage-to-stage transition conversion rates</p>
          </div>
          <div className="space-y-4 my-auto">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-surface-200/60 font-medium">Application ➔ Screen</span>
              <span className="text-sm font-bold text-surface-100">
                {funnelData[0]?.count ? Math.round((funnelData[1]?.count / funnelData[0]?.count) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-surface-200/60 font-medium">Screen ➔ Interview</span>
              <span className="text-sm font-bold text-surface-100">
                {funnelData[1]?.count ? Math.round((funnelData[2]?.count / funnelData[1]?.count) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-surface-200/60 font-medium">Interview ➔ Offer</span>
              <span className="text-sm font-bold text-success">
                {funnelData[2]?.count ? Math.round((funnelData[3]?.count / funnelData[2]?.count) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-surface-200/60 font-medium">Overall Conversion Yield</span>
              <span className="text-sm font-bold text-primary-400">
                {funnelData[0]?.count ? Math.round((funnelData[3]?.count / funnelData[0]?.count) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Resume Performance Leaderboard */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-surface-100">Resume Performance Analytics</h3>
          <p className="text-xs text-surface-200/50 mt-0.5">Success rates and response yields per resume version</p>
        </div>

        {resumePerformance.length > 0 ? (
          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-800/50 text-surface-200/60 font-medium border-b border-white/5">
                  <th className="p-4">Resume Version</th>
                  <th className="p-4 text-center">Applications</th>
                  <th className="p-4 text-center">Responses</th>
                  <th className="p-4 text-center">Interviews</th>
                  <th className="p-4 text-center">Offers</th>
                  <th className="p-4 text-center">Response Rate</th>
                  <th className="p-4 text-center font-semibold text-primary-400">Interview Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-surface-200/80">
                {resumePerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-surface-100">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-[10px] text-surface-200/40 mt-0.5">{item.version}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold text-surface-100">{item.total}</td>
                    <td className="p-4 text-center">{item.responses}</td>
                    <td className="p-4 text-center">{item.interviews}</td>
                    <td className="p-4 text-center text-success font-semibold">{item.offers}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                        item.responseRate >= 50 ? 'bg-success/10 text-success' :
                        item.responseRate >= 25 ? 'bg-warning/10 text-warning' : 'bg-surface-800 text-surface-200/50'
                      }`}>
                        {item.responseRate}%
                      </span>
                    </td>
                    <td className="p-4 text-center font-semibold text-primary-400">
                      <span className="font-mono">{item.interviewRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-sm text-surface-200/40 border border-dashed border-white/5 rounded-xl">
            No resume usage data available yet. Link resume versions to your jobs to see performance metrics.
          </div>
        )}
      </Card>

      {/* Status Breakdown Bar Chart */}
      {stats?.statusCounts && Object.keys(stats.statusCounts).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-surface-100 mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(stats.statusCounts).map(([key, val]) => ({ status: key, count: val }))}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="px-3 py-2 rounded-lg bg-surface-800 border border-white/10 text-xs shadow-xl">
                        <p className="font-medium text-surface-100 capitalize">{payload[0].payload.status}</p>
                        <p className="text-surface-200/60">{payload[0].value} applications</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {Object.entries(stats.statusCounts).map(([key]) => (
                  <Cell key={key} fill={STATUS_COLORS[key] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Job Type Distribution */}
      {stats?.typeCounts && Object.keys(stats.typeCounts).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-surface-100 mb-4">Applications by Job Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.typeCounts).map(([type, count]) => (
              <div key={type} className="text-center p-4 rounded-xl bg-surface-800/30">
                <p className="text-2xl font-bold text-surface-100">{count}</p>
                <p className="text-xs text-surface-200/50 capitalize mt-1">{type}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
