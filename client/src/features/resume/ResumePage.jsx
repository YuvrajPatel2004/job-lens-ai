import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import {
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineMagnifyingGlassCircle,
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineLightBulb,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { getResumes, uploadResume, deleteResume, analyzeResume, downloadResume as downloadResumeApi } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { format } from 'date-fns';

const ResumePage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [analysisModal, setAnalysisModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzeId, setAnalyzeId] = useState(null);

  const fetchResumes = useCallback(async () => {
    try {
      const { data } = await getResumes();
      setResumes(data);
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      await uploadResume(formData);
      toast.success('Resume uploaded!');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [fetchResumes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await deleteResume(id);
      toast.success('Resume deleted');
      fetchResumes();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openAnalysis = (id) => {
    setAnalyzeId(id);
    setJobDescription('');
    setAnalysisModal(true);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await analyzeResume(analyzeId, jobDescription);
      setSelectedResume(data);
      setAnalysisModal(false);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const { data } = await downloadResumeApi(id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const ScoreGauge = ({ score, label, size = 'lg' }) => {
    const radius = size === 'lg' ? 54 : 36;
    const stroke = size === 'lg' ? 8 : 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const svgSize = (radius + stroke) * 2;

    const color = score >= 75 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';

    return (
      <div className="flex flex-col items-center">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
            stroke={color} strokeWidth={stroke} strokeDasharray={circumference}
            strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center" style={{ width: svgSize, height: svgSize }}>
          <span className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-xl'}`} style={{ color }}>{score}</span>
          {label && <span className="text-xs text-surface-200/50">{label}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Resume Manager</h1>
        <p className="text-sm text-surface-200/50 mt-0.5">Upload, analyze, and optimize your resumes</p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive ? 'border-primary-500 bg-primary-500/5' : 'border-white/10 hover:border-primary-500/30 hover:bg-white/2'
        }`}
      >
        <input {...getInputProps()} />
        <HiOutlineCloudArrowUp className={`text-5xl mx-auto mb-4 ${isDragActive ? 'text-primary-400' : 'text-surface-200/30'}`} />
        {uploading ? (
          <p className="text-primary-400">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-primary-400">Drop your resume here</p>
        ) : (
          <>
            <p className="text-surface-200/70 font-medium">
              Drag & drop your resume or <span className="text-primary-400">browse</span>
            </p>
            <p className="text-xs text-surface-200/40 mt-2">PDF files only, max 5MB</p>
          </>
        )}
      </div>

      {/* Resumes List */}
      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 skeleton" />)}</div>
      ) : resumes.length === 0 ? (
        <Card className="text-center py-12">
          <HiOutlineDocumentText className="text-5xl text-surface-200/20 mx-auto mb-3" />
          <p className="text-surface-200/50">No resumes uploaded yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((resume, i) => (
            <motion.div key={resume._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hover onClick={() => setSelectedResume(resume)} className="cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <HiOutlineDocumentText className="text-xl text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate">{resume.fileName}</p>
                      <p className="text-xs text-surface-200/40 mt-0.5">
                        {(resume.fileSize / 1024).toFixed(0)} KB • {format(new Date(resume.createdAt), 'MMM d, yyyy')}
                      </p>
                      {resume.atsScore != null && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-1.5 flex-1 max-w-24 bg-surface-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${resume.atsScore}%`,
                                background: resume.atsScore >= 75 ? 'var(--color-success)' : resume.atsScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium" style={{
                            color: resume.atsScore >= 75 ? 'var(--color-success)' : resume.atsScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
                          }}>
                            {resume.atsScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openAnalysis(resume._id)}
                      className="p-2 rounded-lg hover:bg-primary-500/10 text-surface-200/40 hover:text-primary-400 transition-colors"
                      title="Analyze">
                      <HiOutlineMagnifyingGlassCircle className="text-lg" />
                    </button>
                    <button onClick={() => handleDownload(resume._id, resume.fileName)}
                      className="p-2 rounded-lg hover:bg-white/5 text-surface-200/40 hover:text-surface-100 transition-colors"
                      title="Download">
                      <HiOutlineArrowDownTray className="text-lg" />
                    </button>
                    <button onClick={() => handleDelete(resume._id)}
                      className="p-2 rounded-lg hover:bg-danger/10 text-surface-200/40 hover:text-danger transition-colors"
                      title="Delete">
                      <HiOutlineTrash className="text-lg" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analysis Results */}
      {selectedResume?.analysisResults && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="space-y-6">
            <div className="flex items-center gap-3">
              <HiOutlineSparkles className="text-2xl text-primary-400" />
              <div>
                <h2 className="text-lg font-semibold text-surface-100">ATS Analysis Results</h2>
                <p className="text-sm text-surface-200/50">{selectedResume.fileName}</p>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <ScoreGauge score={selectedResume.atsScore || 0} label="ATS Score" />
                </div>
              </div>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <ScoreGauge score={selectedResume.analysisResults.matchScore || 0} label="Match" />
                </div>
              </div>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <ScoreGauge score={selectedResume.analysisResults.formatting?.score || 0} label="Format" />
                </div>
              </div>
            </div>

            {/* Section Analysis */}
            {selectedResume.analysisResults.sectionAnalysis && (
              <div>
                <h3 className="text-sm font-medium text-surface-200/60 uppercase tracking-wide mb-3">Resume Sections</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(selectedResume.analysisResults.sectionAnalysis).map(([key, val]) => (
                    <div key={key} className={`flex items-center gap-2 p-2.5 rounded-xl text-sm ${val ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {val ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
                      <span className="capitalize">{key.replace('has', '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {selectedResume.analysisResults.presentKeywords?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                    <HiOutlineCheckCircle /> Matching Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.analysisResults.presentKeywords.map((kw) => (
                      <span key={kw} className="px-2.5 py-1 rounded-full text-xs bg-success/10 text-success">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedResume.analysisResults.missingKeywords?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-danger mb-3 flex items-center gap-2">
                    <HiOutlineExclamationTriangle /> Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.analysisResults.missingKeywords.map((kw) => (
                      <span key={kw} className="px-2.5 py-1 rounded-full text-xs bg-danger/10 text-danger">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {selectedResume.analysisResults.strengths?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-success mb-3">Strengths</h3>
                  <ul className="space-y-2">
                    {selectedResume.analysisResults.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-surface-200/70">
                        <HiOutlineCheckCircle className="text-success mt-0.5 flex-shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedResume.analysisResults.weaknesses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-warning mb-3">Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {selectedResume.analysisResults.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-surface-200/70">
                        <HiOutlineExclamationTriangle className="text-warning mt-0.5 flex-shrink-0" /> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {selectedResume.analysisResults.suggestions?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-primary-400 mb-3 flex items-center gap-2">
                  <HiOutlineLightBulb /> Improvement Suggestions
                </h3>
                <ul className="space-y-2">
                  {selectedResume.analysisResults.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 p-3 rounded-xl bg-primary-500/5 text-sm text-surface-200/80">
                      <HiOutlineLightBulb className="text-primary-400 mt-0.5 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Analyze Modal */}
      <Modal isOpen={analysisModal} onClose={() => setAnalysisModal(false)} title="Analyze Resume">
        <div className="space-y-4">
          <p className="text-sm text-surface-200/60">
            Paste a job description to get a targeted analysis, or leave blank for a general ATS review.
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            placeholder="Paste job description here (optional)..."
            className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-white/8 text-surface-100 placeholder-surface-200/30 text-sm focus:outline-none focus:border-primary-500/50 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAnalysisModal(false)}>Cancel</Button>
            <Button variant="accent" loading={analyzing} onClick={handleAnalyze}>
              <HiOutlineSparkles /> Analyze
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResumePage;
