import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineClipboardDocument,
  HiOutlineLightBulb,
  HiOutlineArrowPath,
  HiOutlineChatBubbleBottomCenterText,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { getResumes, generateCoverLetter, getImproveSuggestions, getInterviewPrep } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const AIToolsPage = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [activeTab, setActiveTab] = useState('cover-letter');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getResumes();
        setResumes(data);
        if (data.length > 0) setSelectedResumeId(data[0]._id);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  const tabs = [
    { id: 'cover-letter', label: 'Cover Letter', icon: HiOutlineDocumentText, description: 'Generate a tailored cover letter' },
    { id: 'improve', label: 'Resume Tips', icon: HiOutlineLightBulb, description: 'Get improvement suggestions' },
    { id: 'interview-prep', label: 'Interview Prep', icon: HiOutlineChatBubbleBottomCenterText, description: 'Practice questions & answers' },
    { id: 'resume-builder', label: 'Resume Builder', icon: HiOutlineClipboardDocument, description: 'Generate LaTeX Resume', navigateTo: '/ai/resume-builder' },
  ];

  const handleGenerate = async () => {
    if (!selectedResumeId) return toast.error('Select a resume first');
    if (!jobDescription && activeTab !== 'improve') return toast.error('Provide a job description');
    setLoading(true);
    setResult(null);
    try {
      let data;
      if (activeTab === 'cover-letter') {
        const res = await generateCoverLetter({ resumeId: selectedResumeId, jobDescription, companyName });
        data = res.data;
      } else if (activeTab === 'improve') {
        const res = await getImproveSuggestions({ resumeId: selectedResumeId, jobDescription });
        data = res.data;
      } else {
        const res = await getInterviewPrep({ resumeId: selectedResumeId, jobDescription, companyName });
        data = res.data;
      }
      setResult(data);
      toast.success('Generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
          <HiOutlineSparkles className="text-primary-400" /> AI Tools
        </h1>
        <p className="text-sm text-surface-200/50 mt-0.5">Powered by Gemini AI</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { 
              if (tab.navigateTo) {
                navigate(tab.navigateTo);
              } else {
                setActiveTab(tab.id); setResult(null); 
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'bg-surface-800/40 text-surface-200/60 hover:bg-surface-800/60 border border-transparent'
            }`}
          >
            <tab.icon className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1 space-y-5">
          <h3 className="font-semibold text-surface-100">
            {tabs.find((t) => t.id === activeTab)?.description}
          </h3>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200/80">Select Resume</label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="">Choose a resume...</option>
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>{r.fileName}</option>
              ))}
            </select>
          </div>

          {activeTab !== 'improve' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-200/80">Company Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200/80">
              Job Description {activeTab === 'improve' ? '(optional)' : '*'}
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste the job description..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          <Button variant="accent" size="lg" className="w-full" loading={loading} onClick={handleGenerate}>
            <HiOutlineSparkles /> Generate
          </Button>
        </Card>

        {/* Result Panel */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                <span className="text-sm text-surface-200/60">AI is generating...</span>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 skeleton" style={{ width: `${90 - i * 10}%` }} />)}
              </div>
            </Card>
          ) : result ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Cover Letter Result */}
              {activeTab === 'cover-letter' && result.coverLetter && (
                <Card className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-100">Generated Cover Letter</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.coverLetter)}>
                        <HiOutlineClipboardDocument /> Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleGenerate}>
                        <HiOutlineArrowPath /> Regenerate
                      </Button>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-surface-800/40 text-sm text-surface-200/80 leading-relaxed whitespace-pre-wrap">
                    {result.coverLetter}
                  </div>
                  {result.highlights?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-surface-200/60 mb-2">Key Highlights</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.highlights.map((h, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-primary-500/10 text-primary-400">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Improvement Suggestions */}
              {activeTab === 'improve' && result.suggestions && (
                <Card className="space-y-4">
                  <h3 className="font-semibold text-surface-100">Improvement Suggestions</h3>
                  <div className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-xl border ${
                          s.priority === 'high' ? 'border-danger/20 bg-danger/5' :
                          s.priority === 'medium' ? 'border-warning/20 bg-warning/5' :
                          'border-success/20 bg-success/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                s.priority === 'high' ? 'bg-danger/15 text-danger' :
                                s.priority === 'medium' ? 'bg-warning/15 text-warning' :
                                'bg-success/15 text-success'
                              }`}>
                                {s.priority}
                              </span>
                              <span className="text-xs text-surface-200/40">{s.category}</span>
                            </div>
                            <p className="text-sm text-surface-100">{s.suggestion}</p>
                            {s.example && (
                              <p className="text-xs text-surface-200/50 mt-2 italic">
                                Example: &quot;{s.example}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Interview Prep */}
              {activeTab === 'interview-prep' && result.questions && (
                <Card className="space-y-4">
                  <h3 className="font-semibold text-surface-100">Interview Questions & Answers</h3>
                  <div className="space-y-4">
                    {result.questions.map((q, i) => (
                      <motion.details
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group rounded-xl border border-white/6 overflow-hidden"
                      >
                        <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors">
                          <span className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-surface-100 flex-1">{q.question}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-200/60">{q.type}</span>
                        </summary>
                        <div className="px-4 pb-4 space-y-3">
                          <div className="p-3 rounded-lg bg-primary-500/5 text-sm text-surface-200/80">
                            <p className="font-medium text-primary-400 text-xs mb-1">Suggested Answer:</p>
                            {q.suggestedAnswer}
                          </div>
                          {q.tips && (
                            <div className="flex items-start gap-2 text-xs text-surface-200/50">
                              <HiOutlineLightBulb className="text-warning flex-shrink-0 mt-0.5" />
                              <span>{q.tips}</span>
                            </div>
                          )}
                        </div>
                      </motion.details>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          ) : (
            <AICoreVisualizer />
          )}
        </div>
      </div>
    </div>
  );
};

const AICoreVisualizer = () => {
  const [rotate, setRotate] = useState({ x: 10, y: -15 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({ x: -y / 6, y: x / 6 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 10, y: -15 });
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[450px] rounded-3xl bg-surface-900/40 border border-white/8 flex flex-col items-center justify-center overflow-hidden shadow-2xl transition-all duration-300 hover:border-primary-500/20 group"
      style={{ perspective: '1200px' }}
    >
      {/* Animating mesh gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 via-accent-500/5 to-transparent animate-gradient-slow opacity-75" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary-600/15 transition-all duration-500" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-600/15 transition-all duration-500" />

      {/* 3D Visualizer Node */}
      <motion.div 
        className="relative w-36 h-36 select-none cursor-grab active:cursor-grabbing"
        animate={{ 
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Outer orbital rings */}
        <div className="absolute inset-[-40px] rounded-full border border-dashed border-primary-500/30 animate-spin pointer-events-none" style={{ animationDuration: '25s', transform: 'translateZ(0px)' }} />
        <div className="absolute inset-[-20px] rounded-full border border-dotted border-accent-500/40 animate-spin pointer-events-none" style={{ animationDuration: '15s', animationDirection: 'reverse', transform: 'translateZ(10px)' }} />

        {/* 3D Glass Prism/Cube */}
        {/* Front face */}
        <div className="absolute inset-0 rounded-2xl border border-primary-400/40 bg-gradient-to-br from-primary-500/20 to-primary-500/5 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.2)]" style={{ transform: 'translateZ(65px)' }}>
          <HiOutlineSparkles className="text-3xl text-primary-400 animate-pulse" />
        </div>
        {/* Back face */}
        <div className="absolute inset-0 rounded-2xl border border-accent-400/30 bg-gradient-to-br from-accent-500/10 to-transparent backdrop-blur-md" style={{ transform: 'translateZ(-65px) rotateY(180deg)' }} />
        {/* Left face */}
        <div className="absolute inset-0 rounded-2xl border border-primary-500/20 bg-surface-900/80 backdrop-blur-md" style={{ transform: 'translateX(-65px) rotateY(-90deg)' }} />
        {/* Right face */}
        <div className="absolute inset-0 rounded-2xl border border-accent-500/20 bg-surface-900/80 backdrop-blur-md" style={{ transform: 'translateX(65px) rotateY(90deg)' }} />
        {/* Top face */}
        <div className="absolute inset-0 rounded-2xl border border-primary-400/30 bg-gradient-to-b from-primary-500/15 to-transparent backdrop-blur-md" style={{ transform: 'translateY(-65px) rotateX(90deg)' }} />
        {/* Bottom face */}
        <div className="absolute inset-0 rounded-2xl border border-accent-400/30 bg-gradient-to-t from-accent-500/15 to-transparent backdrop-blur-md" style={{ transform: 'translateY(65px) rotateX(-90deg)' }} />
      </motion.div>

      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-2.5 h-2.5 rounded-full bg-primary-400/40 animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-2 h-2 rounded-full bg-accent-400/40 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />

      <div className="mt-12 text-center px-6 z-10 select-none pointer-events-none">
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          Interactive AI Core
        </h3>
        <p className="text-sm text-surface-200/50 mt-2 max-w-sm mx-auto">
          Hover your mouse or click and drag over the widget to rotate the 3D projection model in real-time.
        </p>
      </div>
    </div>
  );
};

export default AIToolsPage;
