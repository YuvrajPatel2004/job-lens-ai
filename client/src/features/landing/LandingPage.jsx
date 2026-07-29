import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineRocketLaunch,
  HiOutlineLightBulb,
  HiOutlineCpuChip,
  HiOutlineStar,
  HiOutlineArrowTrendingUp,
  HiOutlineUserGroup,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'AI Tools', href: '#ai-tools' },
  { label: 'Testimonials', href: '#testimonials' },
];

const features = [
  {
    icon: HiOutlineBriefcase,
    title: 'Smart Job Tracking',
    description: 'Track every application with status management, notes, tags, and priority levels. Never lose track of where you applied.',
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/20',
  },
  {
    icon: HiOutlineDocumentText,
    title: 'ATS Resume Scanner',
    description: 'Upload your resume and get an instant ATS compatibility score. Identify missing keywords and formatting issues.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: HiOutlineSparkles,
    title: 'AI Cover Letters',
    description: 'Generate tailored cover letters in seconds using Gemini AI. Matched perfectly to each job description.',
    color: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/20',
  },
  {
    icon: HiOutlineCalendar,
    title: 'Interview Scheduler',
    description: 'Schedule interviews, set reminders, track meeting links, and log feedback — all in one place.',
    color: 'from-orange-500 to-amber-600',
    glow: 'shadow-orange-500/20',
  },
  {
    icon: HiOutlineChartBar,
    title: 'Analytics Dashboard',
    description: 'Visualize your job search with charts and insights. Track trends, response rates, and application velocity.',
    color: 'from-pink-500 to-rose-600',
    glow: 'shadow-pink-500/20',
  },
  {
    icon: HiOutlineChatBubbleBottomCenterText,
    title: 'Interview Prep AI',
    description: 'Get AI-generated practice questions with suggested answers tailored to your resume and the job.',
    color: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/20',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description: 'Sign up in seconds and set up your job search profile.',
    icon: HiOutlineShieldCheck,
  },
  {
    number: '02',
    title: 'Upload Your Resume',
    description: 'Get an instant ATS score and AI-powered improvement suggestions.',
    icon: HiOutlineDocumentText,
  },
  {
    number: '03',
    title: 'Track Applications',
    description: 'Add jobs, manage statuses, and keep notes organized.',
    icon: HiOutlineBriefcase,
  },
  {
    number: '04',
    title: 'Land Your Dream Job',
    description: 'Use AI insights to optimize every step of your search.',
    icon: HiOutlineRocketLaunch,
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer at Google',
    text: 'JobLens AI helped me track 50+ applications effortlessly. The ATS scanner caught keywords I was missing, and I landed interviews at 3 FAANG companies!',
    rating: 5,
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Product Manager at Stripe',
    text: 'The AI cover letter generator saved me hours every week. Each letter was perfectly tailored and I got callbacks from nearly every application.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Data Scientist at Netflix',
    text: 'The interview prep feature is a game changer. It generated questions specific to my background and the role. I felt confident walking into every interview.',
    rating: 5,
  },
];

const stats = [
  { value: '50K+', label: 'Jobs Tracked', icon: HiOutlineBriefcase },
  { value: '12K+', label: 'Users', icon: HiOutlineUserGroup },
  { value: '89%', label: 'Interview Rate', icon: HiOutlineArrowTrendingUp },
  { value: '4.9', label: 'User Rating', icon: HiOutlineStar },
];

// Interactive 3D Tilt Card Helper Component
const Tilt3DCard = ({ children, className = '', depth = 15 }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({ x: -y / depth, y: x / depth });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const LandingPage = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileMenu(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 border-b border-white/6'
            : 'py-5'
        }`}
        style={{
          background: scrolled ? 'rgba(8, 10, 22, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              <HiOutlineSparkles className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold">
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">JobLens</span>
              <span className="text-surface-200/80 ml-1">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="px-4 py-2 text-sm font-medium text-surface-200/60 hover:text-surface-100 transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-surface-200/70 hover:text-surface-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.97]"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-surface-200/60 hover:text-surface-100 transition-colors"
          >
            {mobileMenu ? <HiOutlineXMark className="text-2xl" /> : <HiOutlineBars3 className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 mx-4 p-4 rounded-2xl border border-white/6"
            style={{ background: 'rgba(15, 18, 30, 0.98)', backdropFilter: 'blur(20px)' }}
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-surface-200/60 hover:text-surface-100 hover:bg-white/5 rounded-xl transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-white/5 mt-2 pt-3 space-y-2">
              <Link to="/login" className="block w-full text-center px-4 py-2.5 text-sm font-medium text-surface-200/70 hover:text-surface-100 rounded-xl hover:bg-white/5 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500">
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 overflow-hidden"
      >
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/8 rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
              <HiOutlineCpuChip className="text-sm" />
              Powered by Google Gemini AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            <span className="text-surface-100">Your AI-Powered</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Career Command Center
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-surface-200/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Track applications, scan resumes for ATS compatibility, generate cover letters,
            and prepare for interviews — all powered by AI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.97]"
            >
              Start Free — No Card Required
              <HiOutlineArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => scrollTo('#features')}
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-surface-200/70 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/15 hover:text-surface-100 transition-all"
            >
              See How It Works
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-surface-200/30"
          >
            {['Free Forever Plan', 'No Credit Card', 'ATS-Optimized', 'Gemini AI Powered'].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <HiOutlineCheckCircle className="text-emerald-500/60 text-sm" />
                {badge}
              </span>
            ))}
          </motion.div>

          {/* ─── 3D INTERACTIVE HERO SHOWCASE CARD ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-4xl mx-auto text-left relative"
          >
            <Tilt3DCard depth={12} className="relative rounded-3xl border border-white/10 bg-surface-900/80 backdrop-blur-2xl p-4 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] group overflow-hidden cursor-grab active:cursor-grabbing">
              {/* Animating gradient highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-cyan-500/5 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Header Bar */}
              <div style={{ transform: 'translateZ(20px)' }} className="flex items-center justify-between border-b border-white/8 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-surface-200/40 font-mono ml-2">JobLens AI • Command Center</span>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Live Preview
                </span>
              </div>

              {/* Data Grid Mockup */}
              <div style={{ transform: 'translateZ(30px)' }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface-850/90 border border-white/6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Senior Software Engineer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Interview</span>
                  </div>
                  <p className="text-xs text-surface-200/50">Google • Mountain View, CA</p>
                  <div className="w-full bg-surface-800 rounded-full h-1.5 mt-3">
                    <div className="bg-emerald-400 h-1.5 rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-850/90 border border-white/6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Product Designer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">Applied</span>
                  </div>
                  <p className="text-xs text-surface-200/50">Stripe • Remote</p>
                  <div className="w-full bg-surface-800 rounded-full h-1.5 mt-3">
                    <div className="bg-indigo-400 h-1.5 rounded-full w-[60%]" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-850/90 border border-white/6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">AI Research Lead</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">Offer</span>
                  </div>
                  <p className="text-xs text-surface-200/50">OpenAI • San Francisco, CA</p>
                  <div className="w-full bg-surface-800 rounded-full h-1.5 mt-3">
                    <div className="bg-cyan-400 h-1.5 rounded-full w-[95%]" />
                  </div>
                </div>
              </div>

              {/* Floating Parallax 3D Pop-out Badges */}
              <div 
                style={{ transform: 'translateZ(65px)' }}
                className="hidden sm:flex absolute -top-4 -right-4 bg-surface-900/95 border border-indigo-500/40 px-4 py-2.5 rounded-2xl shadow-2xl items-center gap-3 backdrop-blur-xl pointer-events-none"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
                  <HiOutlineSparkles className="animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">ATS Match Score</p>
                  <p className="text-xs text-indigo-400 font-semibold">94% Highly Compatible</p>
                </div>
              </div>

              <div 
                style={{ transform: 'translateZ(55px)' }}
                className="hidden sm:flex absolute -bottom-4 -left-4 bg-surface-900/95 border border-cyan-500/40 px-4 py-2.5 rounded-2xl shadow-2xl items-center gap-3 backdrop-blur-xl pointer-events-none"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">
                  <HiOutlineRocketLaunch />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Auto-Join Armed</p>
                  <p className="text-xs text-cyan-400 font-semibold">Starting in 5 mins</p>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── STATS BAR ─── */}
      <section className="relative py-12 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="text-2xl text-indigo-400/60 mx-auto mb-2" />
                <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-surface-100 to-surface-200/60 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-surface-200/40 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Land Your Dream Job
              </span>
            </h2>
            <p className="text-surface-200/50 max-w-2xl mx-auto text-lg">
              From tracking applications to acing interviews — JobLens AI has every tool you need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Tilt3DCard depth={18} className="group relative rounded-2xl p-6 border border-white/6 hover:border-white/12 transition-all duration-300 cursor-default flex flex-col h-full bg-surface-900/40 backdrop-blur-xl">
                  {/* Hover glow */}
                  <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 blur-xl`} />
                  <div style={{ transform: 'translateZ(20px)' }} className="relative flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="text-2xl text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-surface-100 mb-2 group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-surface-200/50 leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                  </div>
                </Tilt3DCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
              Get Started in{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                4 Simple Steps
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-800 to-surface-900 border border-white/8 mb-4 mx-auto relative z-10">
                  <step.icon className="text-2xl text-indigo-400" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold text-white flex items-center justify-center shadow-lg">
                    {step.number.replace('0', '')}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-surface-100 mb-2">{step.title}</h3>
                <p className="text-sm text-surface-200/40 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI TOOLS SHOWCASE ─── */}
      <section id="ai-tools" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
              <HiOutlineCpuChip /> AI-Powered
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
              Supercharge Your Search with{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Gemini AI
              </span>
            </h2>
            <p className="text-surface-200/50 max-w-2xl mx-auto text-lg">
              Harness the power of Google&apos;s Gemini to analyze, generate, and optimize every aspect of your job applications.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'ATS Resume Scanner',
                description: 'Get a detailed breakdown of your resume\'s ATS compatibility. See which keywords you\'re missing and how to fix formatting issues.',
                items: ['ATS Compatibility Score', 'Keyword Gap Analysis', 'Section Detection', 'Formatting Audit'],
                gradient: 'from-indigo-500/10 to-purple-500/10',
                iconColor: 'text-indigo-400',
                borderColor: 'border-indigo-500/15',
              },
              {
                title: 'AI Cover Letter Writer',
                description: 'Generate professional, tailored cover letters that match the job description and highlight your most relevant experience.',
                items: ['Job-Specific Tailoring', 'Professional Tone', 'Key Highlights', 'One-Click Copy'],
                gradient: 'from-purple-500/10 to-pink-500/10',
                iconColor: 'text-purple-400',
                borderColor: 'border-purple-500/15',
              },
              {
                title: 'Interview Prep Coach',
                description: 'Practice with AI-generated questions customized to your resume and the specific role you\'re applying for.',
                items: ['Behavioral Questions', 'Technical Questions', 'Suggested Answers', 'Preparation Tips'],
                gradient: 'from-pink-500/10 to-rose-500/10',
                iconColor: 'text-pink-400',
                borderColor: 'border-pink-500/15',
              },
            ].map((tool, i) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Tilt3DCard depth={15} className={`rounded-2xl p-6 border ${tool.borderColor} bg-gradient-to-br ${tool.gradient} flex flex-col h-full backdrop-blur-xl`}>
                  <div style={{ transform: 'translateZ(25px)' }} className="flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-surface-100 mb-2">{tool.title}</h3>
                    <p className="text-sm text-surface-200/50 mb-5 leading-relaxed flex-grow">{tool.description}</p>
                    <ul className="space-y-2.5 mt-auto">
                      {tool.items.map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-surface-200/70">
                          <HiOutlineCheckCircle className={`text-base flex-shrink-0 ${tool.iconColor}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Tilt3DCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-24 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
              <HiOutlineStar /> Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
              Loved by{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Job Seekers
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Tilt3DCard depth={20} className="rounded-2xl p-6 border border-white/6 hover:border-white/10 transition-all flex flex-col h-full bg-surface-900/40 backdrop-blur-xl">
                  <div style={{ transform: 'translateZ(20px)' }} className="flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <HiOutlineStar key={s} className="text-amber-400 text-sm" style={{ fill: 'currentColor' }} />
                      ))}
                    </div>
                    <p className="text-sm text-surface-200/70 leading-relaxed mb-5 italic flex-grow">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {t.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-100 truncate">{t.name}</p>
                        <p className="text-xs text-surface-200/40 truncate">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Tilt3DCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl" />
          <Tilt3DCard depth={10} className="relative rounded-3xl p-12 sm:p-16 border border-white/8 bg-surface-900/60 backdrop-blur-2xl">
            <div style={{ transform: 'translateZ(30px)' }}>
              <HiOutlineRocketLaunch className="text-4xl text-indigo-400 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
                Ready to Supercharge Your Job Search?
              </h2>
              <p className="text-surface-200/50 text-lg max-w-xl mx-auto mb-8">
                Join thousands of job seekers using AI to land their dream roles faster.
              </p>
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-10 py-4 text-base font-semibold text-white rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.97]"
              >
                Get Started Free
                <HiOutlineArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-xs text-surface-200/30 mt-4">No credit card required • Free forever plan</p>
            </div>
          </Tilt3DCard>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <HiOutlineSparkles className="text-white text-sm" />
            </div>
            <span className="font-bold">
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">JobLens</span>
              <span className="text-surface-200/60 ml-1">AI</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-surface-200/40">
            {navLinks.map((link) => (
              <button key={link.label} onClick={() => scrollTo(link.href)} className="hover:text-surface-200/70 transition-colors">
                {link.label}
              </button>
            ))}
            <Link to="/login" className="hover:text-surface-200/70 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-surface-200/70 transition-colors">Get Started</Link>
          </div>

          <p className="text-xs text-surface-200/25">
            © {new Date().getFullYear()} JobLens AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
