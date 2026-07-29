import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlineCodeBracket, HiOutlineArrowDownTray, HiOutlineArrowLeft, HiOutlinePlay } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { buildResumeLatex, compileLatexToPdf } from '../../services/api';

const ResumeBuilderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Input, 2: LaTeX Editor, 3: Preview
  const [loading, setLoading] = useState(false);
  const [latexCode, setLatexCode] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    website: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: ''
  });

  const inputHandler = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleGenerateLatex = async () => {
    if (!formData.fullName || !formData.email) {
      return toast.error('Full Name and Email are required.');
    }
    
    setLoading(true);
    try {
      const { data } = await buildResumeLatex(formData);
      setLatexCode(data.latex);
      setStep(2);
      toast.success('LaTeX code generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate LaTeX');
    } finally {
      setLoading(false);
    }
  };

  const handleCompilePdf = async () => {
    if (!latexCode.trim()) return toast.error('LaTeX code cannot be empty.');
    
    setLoading(true);
    try {
      const response = await compileLatexToPdf(latexCode);
      // The response is a blob because of our api.js configuration
      const blobUrl = URL.createObjectURL(response.data);
      setPdfUrl(blobUrl);
      setStep(3);
      toast.success('PDF compiled successfully!');
    } catch (error) {
      toast.error('Failed to compile LaTeX. There might be syntax errors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/ai')} className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-surface-200 hover:text-white transition-colors">
          <HiOutlineArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Resume Builder</h1>
          <p className="text-surface-200 mt-1">Generate a professional ATS-friendly LaTeX resume instantly.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-800/50 -z-10 -translate-y-1/2" />
        <div className="absolute top-1/2 left-0 h-0.5 bg-primary-500/50 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }} />
        
        {[
          { num: 1, label: 'Details', icon: HiOutlineDocumentText },
          { num: 2, label: 'LaTeX Code', icon: HiOutlineCodeBracket },
          { num: 3, label: 'Preview PDF', icon: HiOutlinePlay }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-surface-900 px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s.num ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-surface-700 bg-surface-800 text-surface-400'}`}>
              <s.icon className="text-lg" />
            </div>
            <span className={`text-xs font-medium ${step >= s.num ? 'text-primary-400' : 'text-surface-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/5 pb-4">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name *" placeholder="John Doe" value={formData.fullName} onChange={inputHandler('fullName')} />
                <Input label="Email *" placeholder="john@example.com" type="email" value={formData.email} onChange={inputHandler('email')} />
                <Input label="Phone" placeholder="+1 234 567 8900" value={formData.phone} onChange={inputHandler('phone')} />
                <Input label="LinkedIn URL" placeholder="linkedin.com/in/johndoe" value={formData.linkedin} onChange={inputHandler('linkedin')} />
                <Input label="GitHub URL" placeholder="github.com/johndoe" value={formData.github} onChange={inputHandler('github')} />
                <Input label="Portfolio / Website" placeholder="johndoe.com" value={formData.website} onChange={inputHandler('website')} />
              </div>

              <h2 className="text-lg font-semibold text-white mt-8 mb-4 border-b border-white/5 pb-4">Professional Information</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-200/80">Professional Summary</label>
                  <textarea rows={3} value={formData.summary} onChange={inputHandler('summary')} placeholder="A brief summary of your professional background..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-200/80">Work Experience (Roles, Companies, Dates, Bullet points)</label>
                  <textarea rows={5} value={formData.experience} onChange={inputHandler('experience')} placeholder="e.g. Software Engineer at Google (2020-2023)..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-200/80">Education (Degrees, Universities, Dates)</label>
                  <textarea rows={3} value={formData.education} onChange={inputHandler('education')} placeholder="e.g. BS Computer Science, MIT (2016-2020)..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-200/80">Projects</label>
                  <textarea rows={3} value={formData.projects} onChange={inputHandler('projects')} placeholder="e.g. E-commerce App: Built with React and Node.js..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-200/80">Skills</label>
                  <textarea rows={2} value={formData.skills} onChange={inputHandler('skills')} placeholder="e.g. JavaScript, React, Node.js, Python..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none" />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button variant="accent" onClick={handleGenerateLatex} loading={loading}>
                  Generate LaTeX Code
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <h2 className="text-lg font-semibold text-white">Review & Edit LaTeX</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>Back</Button>
                  <Button variant="accent" onClick={handleCompilePdf} loading={loading}>
                    Compile to PDF
                  </Button>
                </div>
              </div>
              <p className="text-sm text-surface-200/60 mb-4">
                Make any manual adjustments to the generated LaTeX code below before compiling.
              </p>
              <textarea
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                className="w-full h-[500px] p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 resize-y"
                spellCheck={false}
              />
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <h2 className="text-lg font-semibold text-white">Compiled PDF</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(2)}>Back to Editor</Button>
                  <a href={pdfUrl} download="Resume.pdf">
                    <Button variant="primary">
                      <HiOutlineArrowDownTray className="text-lg mr-1" /> Download PDF
                    </Button>
                  </a>
                </div>
              </div>
              
              <div className="w-full h-[800px] rounded-xl overflow-hidden border border-white/10 bg-surface-800">
                {pdfUrl ? (
                  <iframe src={pdfUrl} className="w-full h-full" title="Resume PDF Preview" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-surface-400">
                    PDF Preview Not Available
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeBuilderPage;
