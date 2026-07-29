import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineDocumentText, 
  HiOutlineCodeBracket, 
  HiOutlineArrowDownTray, 
  HiOutlineArrowLeft, 
  HiOutlinePlay,
  HiOutlineCloudArrowUp,
  HiOutlineExclamationTriangle,
  HiOutlineDocumentDuplicate,
} from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { buildResumeLatex, compileLatexToPdf, uploadResume } from '../../services/api';

const ResumeBuilderPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Input, 2: LaTeX Editor, 3: Preview
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [latexCode, setLatexCode] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [compileError, setCompileError] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

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
    certifications: '',
    languages: '',
    projects: ''
  });

  const inputHandler = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  // Handle direct file upload from builder page
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('resume', file);
    data.append('label', file.name.split('.')[0] || 'Uploaded Resume');

    try {
      await uploadResume(data);
      toast.success(`"${file.name}" uploaded successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateLatex = async () => {
    if (!formData.fullName || !formData.email) {
      return toast.error('Full Name and Email are required.');
    }
    
    setLoading(true);
    setCompileError(null);
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
    setCompileError(null);
    try {
      const response = await compileLatexToPdf(latexCode);
      const blobUrl = URL.createObjectURL(response.data);
      setPdfUrl(blobUrl);
      setStep(3);
      toast.success('PDF compiled successfully!');
    } catch (error) {
      let errMsg = 'Failed to compile LaTeX.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          errMsg = json.message || errMsg;
        } catch (e) {
          errMsg = 'LaTeX compilation failed. Try Word (.doc) download below.';
        }
      } else {
        errMsg = error.response?.data?.message || errMsg;
      }
      setCompileError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fallback Download as Word (.doc)
  const downloadAsWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Resume - ${formData.fullName || 'User'}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; color: #111; padding: 20px; }
          h1 { font-size: 22pt; text-align: center; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; color: #000; }
          .contact { text-align: center; font-size: 10pt; color: #444; margin-bottom: 18px; }
          h2 { font-size: 12pt; border-bottom: 1.5pt solid #222; text-transform: uppercase; margin-top: 16px; margin-bottom: 6px; font-weight: bold; color: #111; }
          p, ul { margin: 4px 0; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>${formData.fullName || 'Resume'}</h1>
        <div class="contact">
          ${[formData.email, formData.phone, formData.linkedin, formData.github, formData.website].filter(Boolean).join(' | ')}
        </div>
        ${formData.summary ? `<h2>Summary</h2><p>${formData.summary}</p>` : ''}
        ${formData.experience ? `<h2>Experience</h2><p>${formData.experience.replace(/\n/g, '<br/>')}</p>` : ''}
        ${formData.education ? `<h2>Education</h2><p>${formData.education.replace(/\n/g, '<br/>')}</p>` : ''}
        ${formData.projects ? `<h2>Projects</h2><p>${formData.projects.replace(/\n/g, '<br/>')}</p>` : ''}
        ${formData.skills ? `<h2>Skills</h2><p>${formData.skills}</p>` : ''}
        ${formData.certifications ? `<h2>Certifications</h2><p>${formData.certifications}</p>` : ''}
        ${formData.languages ? `<h2>Languages</h2><p>${formData.languages}</p>` : ''}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.fullName ? formData.fullName.replace(/\s+/g, '_') : 'Resume'}.doc`;
    a.click();
    toast.success('Downloaded Word (.doc) resume!');
  };

  // Fallback Download as Text (.txt)
  const downloadAsText = () => {
    const textContent = `
${(formData.fullName || 'RESUME').toUpperCase()}
${[formData.email, formData.phone, formData.linkedin, formData.github, formData.website].filter(Boolean).join(' | ')}
${'='.repeat(60)}

SUMMARY
${formData.summary || 'N/A'}

EXPERIENCE
${formData.experience || 'N/A'}

EDUCATION
${formData.education || 'N/A'}

PROJECTS
${formData.projects || 'N/A'}

SKILLS
${formData.skills || 'N/A'}

CERTIFICATIONS
${formData.certifications || 'N/A'}

LANGUAGES
${formData.languages || 'N/A'}
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.fullName ? formData.fullName.replace(/\s+/g, '_') : 'Resume'}.txt`;
    a.click();
    toast.success('Downloaded Text (.txt) resume!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/ai')} className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-surface-200 hover:text-white transition-colors">
            <HiOutlineArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Resume Builder & Exporter</h1>
            <p className="text-surface-200/60 text-sm mt-0.5">Build, compile, or export your resume into PDF, Word (.doc), or Text format.</p>
          </div>
        </div>

        {/* Direct Upload Resume Button */}
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".pdf,.doc,.docx" 
            className="hidden" 
          />
          <Button 
            variant="secondary" 
            loading={uploading} 
            onClick={() => fileInputRef.current?.click()}
            className="border-white/10 text-sm"
          >
            <HiOutlineCloudArrowUp className="text-lg mr-2 text-primary-400" /> Upload Existing Resume
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-800/50 -z-10 -translate-y-1/2" />
        <div className="absolute top-1/2 left-0 h-0.5 bg-primary-500/50 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }} />
        
        {[
          { num: 1, label: 'Details', icon: HiOutlineDocumentText },
          { num: 2, label: 'LaTeX & Export', icon: HiOutlineCodeBracket },
          { num: 3, label: 'Preview PDF', icon: HiOutlinePlay }
        ].map((s, index) => (
          <motion.div 
            key={s.num} 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center gap-2 bg-surface-950 px-2 sm:px-4"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${step >= s.num ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'border-surface-700 bg-surface-800 text-surface-400'}`}>
              <s.icon className="text-lg" />
            </div>
            <span className={`text-xs font-medium hidden sm:block transition-colors duration-300 ${step >= s.num ? 'text-primary-400' : 'text-surface-400'}`}>{s.label}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <Card className="p-4 sm:p-6 lg:p-8 space-y-6">
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/5 pb-3">Personal Contact Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={itemVariants}><Input label="Full Name *" placeholder="John Doe" value={formData.fullName} onChange={inputHandler('fullName')} /></motion.div>
                    <motion.div variants={itemVariants}><Input label="Email *" placeholder="john@example.com" type="email" value={formData.email} onChange={inputHandler('email')} /></motion.div>
                    <motion.div variants={itemVariants}><Input label="Phone" placeholder="+1 234 567 8900" value={formData.phone} onChange={inputHandler('phone')} /></motion.div>
                    <motion.div variants={itemVariants}><Input label="LinkedIn URL" placeholder="linkedin.com/in/johndoe" value={formData.linkedin} onChange={inputHandler('linkedin')} /></motion.div>
                    <motion.div variants={itemVariants}><Input label="GitHub URL" placeholder="github.com/johndoe" value={formData.github} onChange={inputHandler('github')} /></motion.div>
                    <motion.div variants={itemVariants}><Input label="Portfolio / Website" placeholder="johndoe.com" value={formData.website} onChange={inputHandler('website')} /></motion.div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/5 pb-3">Professional Experience & Background</h2>
                  <div className="space-y-4">
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-sm font-medium text-surface-200/80">Professional Summary</label>
                      <textarea rows={3} value={formData.summary} onChange={inputHandler('summary')} placeholder="A brief summary of your professional background..."
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-sm font-medium text-surface-200/80">Work Experience (Roles, Companies, Dates, Bullet points)</label>
                      <textarea rows={5} value={formData.experience} onChange={inputHandler('experience')} placeholder="e.g. Software Engineer at Google (2020-2023)..."
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-sm font-medium text-surface-200/80">Education (Degrees, Universities, Dates)</label>
                      <textarea rows={3} value={formData.education} onChange={inputHandler('education')} placeholder="e.g. BS Computer Science, MIT (2016-2020)..."
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-sm font-medium text-surface-200/80">Projects</label>
                      <textarea rows={3} value={formData.projects} onChange={inputHandler('projects')} placeholder="e.g. E-commerce App: Built with React and Node.js..."
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-sm font-medium text-surface-200/80">Skills</label>
                      <textarea rows={2} value={formData.skills} onChange={inputHandler('skills')} placeholder="e.g. JavaScript, React, Node.js, Python..."
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-sm font-medium text-surface-200/80">Certifications</label>
                      <textarea rows={2} value={formData.certifications} onChange={inputHandler('certifications')} placeholder="e.g. AWS Certified Solutions Architect, Google Cloud Professional..."
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-sm font-medium text-surface-200/80">Languages</label>
                      <Input placeholder="e.g. English (Native), Spanish (Fluent), French (Basic)" value={formData.languages} onChange={inputHandler('languages')} />
                    </motion.div>
                  </div>
                </div>

                {/* Quick Export options directly on Step 1 */}
                <motion.div variants={itemVariants} className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={downloadAsWord}>
                      <HiOutlineDocumentDuplicate className="mr-1 text-primary-400" /> Export Word (.doc)
                    </Button>
                    <Button variant="secondary" size="sm" onClick={downloadAsText}>
                      <HiOutlineDocumentText className="mr-1 text-surface-200" /> Export Text (.txt)
                    </Button>
                  </div>

                  <Button variant="accent" onClick={handleGenerateLatex} loading={loading} className="px-6">
                    Generate LaTeX & PDF Code
                  </Button>
                </motion.div>
              </motion.div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <Card className="p-4 sm:p-6 lg:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Review & Edit LaTeX</h2>
                  <p className="text-xs text-surface-200/60 mt-0.5">
                    Make manual tweaks to the code or compile directly to PDF.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>Back</Button>
                  <Button variant="accent" onClick={handleCompilePdf} loading={loading}>
                    Compile to PDF
                  </Button>
                </div>
              </div>

              {/* Compilation Fallback Warning Box if PDF Compile Fails */}
              {compileError && (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <HiOutlineExclamationTriangle className="text-danger text-xl flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">LaTeX Compilation Notice</h4>
                      <p className="text-xs text-surface-200/80 mt-1">{compileError}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-danger/20">
                    <span className="text-xs text-surface-200/60 font-medium">Alternative Downloads:</span>
                    <Button variant="secondary" size="sm" onClick={downloadAsWord} className="bg-surface-800 border-white/10 text-xs">
                      📄 Download as Word (.doc)
                    </Button>
                    <Button variant="secondary" size="sm" onClick={downloadAsText} className="bg-surface-800 border-white/10 text-xs">
                      📝 Download as Text (.txt)
                    </Button>
                  </div>
                </div>
              )}

              {/* Direct Export bar above editor */}
              <div className="flex items-center justify-between bg-surface-850/80 p-3 rounded-xl border border-white/8 text-xs">
                <span className="text-surface-200/70 font-medium">Export alternatives without compiling PDF:</span>
                <div className="flex gap-2">
                  <button type="button" onClick={downloadAsWord} className="text-primary-400 hover:underline font-semibold">
                    Word (.doc)
                  </button>
                  <span className="text-surface-200/30">•</span>
                  <button type="button" onClick={downloadAsText} className="text-surface-200/80 hover:underline font-semibold">
                    Text (.txt)
                  </button>
                </div>
              </div>

              <textarea
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                className="w-full h-[480px] p-4 font-mono text-sm bg-[#12141f] text-[#e2e8f0] rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 resize-y"
                spellCheck={false}
              />
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <Card className="p-4 sm:p-6 lg:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                <h2 className="text-lg font-semibold text-white">Compiled PDF Resume</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button variant="secondary" onClick={() => setStep(2)}>Back to Editor</Button>
                  <Button variant="secondary" onClick={downloadAsWord}>Word (.doc)</Button>
                  <a href={pdfUrl} download="Resume.pdf">
                    <Button variant="accent">
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
