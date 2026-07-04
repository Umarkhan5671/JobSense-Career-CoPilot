import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, HelpCircle, Check, Copy, RefreshCw, Star, MessageSquare, Clipboard, Download, Loader2, AlertCircle, FileText } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import SkillChips from './SkillChips';
import ResumeEditor from './ResumeEditor';
import { exportReport, generateCoverLetter } from '../lib/api';
import { useAuth } from '../context/authContext';

export default function ResultsDashboard({ report, cvFile, onReset, jobDescription }) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'resume'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCL, setIsExportingCL] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleDownloadReport = async () => {
    if (!report) return;
    setIsExporting(true);
    setExportError(null);

    try {
      const pdfBlob = await exportReport(report);
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jobsense_career_report.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      let errMsg = "Failed to export and download your career report. Please verify the backend is running and try again.";
      if (err.response && err.response.data) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const parsed = JSON.parse(text);
            if (parsed.detail) errMsg = parsed.detail;
          } catch (_) {}
        } else if (err.response.data.detail) {
          errMsg = err.response.data.detail;
        }
      }
      setExportError(errMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    if (!jobDescription) return;
    setExportError(null);

    if (!profile?.default_resume_url) {
      setExportError("You haven't uploaded a default master resume yet. Please upload one under your profile details (bottom-left avatar) to enable instant cover letter generation.");
      return;
    }

    setIsExportingCL(true);
    try {
      const pdfBlob = await generateCoverLetter(jobDescription);
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jobsense_cover_letter.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      let errMsg = "Failed to generate and download cover letter. Please verify the backend and try again.";
      if (err.response && err.response.data) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const parsed = JSON.parse(text);
            if (parsed.detail) errMsg = parsed.detail;
          } catch (_) {}
        } else if (err.response.data.detail) {
          errMsg = err.response.data.detail;
        }
      }
      setExportError(errMsg);
    } finally {
      setIsExportingCL(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-slate-100 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-dark-border">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            AI Career Coach Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time semantic comparison and tailored matching of your profile.
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dark-border hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-all transform active:scale-95 bg-dark-panel shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Analyze Another
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-dark-border">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === 'report'
              ? 'border-brand-bronze text-brand-bronze'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Analysis Report
        </button>
        {report.tailored_resume && (
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-6 py-3 border-b-2 text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'resume'
                ? 'border-brand-bronze text-brand-bronze'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Tailored Resume
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'report' ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Match Score Gauge */}
            <motion.div variants={itemVariants} className="md:col-span-1">
              <ScoreGauge score={report.match_score} />
            </motion.div>

            {/* Right Column: Strengths */}
            <motion.div variants={itemVariants} className="md:col-span-2 bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <Star className="w-5 h-5 text-brand-gold fill-brand-600/20" />
                  Top Strengths to Leverage
                </h3>
                <p className="text-xs text-slate-500">
                  Highlight these key accomplishments and experiences in your application and introductory calls.
                </p>
                <ul className="space-y-3.5 mt-2">
                  {report.strengths && report.strengths.slice(0, 3).map((strength, index) => (
                    <li key={index} className="flex gap-3 text-sm text-slate-200 bg-dark-base/40 border border-dark-border rounded-xl p-3">
                      <span className="w-6 h-6 rounded-lg bg-brand-600/10 border border-brand-600/20 text-brand-bronze flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Skills Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Matched Skills */}
            <motion.div variants={itemVariants} className="bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-4.5 h-4.5" />
                </div>
                Matched Skills
              </h3>
              <p className="text-xs text-slate-500">
                Skills and technologies found in both your CV and the job description.
              </p>
              <div className="pt-2">
                <SkillChips skills={report.matched_skills} type="matched" />
              </div>
            </motion.div>

            {/* Missing Skills */}
            <motion.div variants={itemVariants} className="bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-950/20 text-amber-400 flex items-center justify-center">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                Skill Gaps
              </h3>
              <p className="text-xs text-slate-500">
                Important requirements from the JD that were not found or emphasized in your CV.
              </p>
              <div className="pt-2">
                <SkillChips skills={report.missing_skills} type="missing" />
              </div>
            </motion.div>
          </div>

          {/* Bullet point rewrites & Download Report Panel */}
          <motion.div variants={itemVariants} className="bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-dark-border">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-brand-bronze" />
                  Rewritten CV Bullet Points
                </h3>
                <p className="text-xs text-slate-500">
                  Tailored accomplishments starting with strong action verbs. Use these directly in your CV to target this role.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadReport}
                  disabled={isExporting}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 transform active:scale-95 ${
                    isExporting
                      ? 'bg-slate-800 border border-dark-border text-slate-500 cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-700 text-dark-base hover:shadow-md hover:shadow-brand-600/10 cursor-pointer'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Generating Report PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4.5 h-4.5" />
                      Download Career Report (PDF)
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCoverLetter}
                  disabled={isExportingCL}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 transform active:scale-95 ${
                    isExportingCL
                      ? 'bg-slate-800 border border-dark-border text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-md hover:shadow-amber-600/10 cursor-pointer'
                  }`}
                >
                  {isExportingCL ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Generating Cover Letter...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4.5 h-4.5" />
                      Generate Cover Letter (PDF)
                    </>
                  )}
                </button>
              </div>
            </div>

            {exportError && (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/30 text-rose-300 text-sm flex items-center gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                {exportError}
              </div>
            )}

            <div className="space-y-4 pt-2">
              {report.rewritten_bullets && report.rewritten_bullets.slice(0, 3).map((bullet, index) => (
                <div
                  key={index}
                  className="group relative flex items-start gap-4 p-4 rounded-2xl bg-dark-base/40 border border-dark-border hover:border-brand-bronze/30 transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-brand-600/10 border border-brand-600/20 text-brand-bronze flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed pr-10 flex-1">
                    {bullet}
                  </p>
                  <button
                    onClick={() => handleCopy(bullet, index)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg border border-dark-border bg-dark-panel text-slate-400 hover:text-slate-255 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4.5 h-4.5 text-emerald-450" />
                    ) : (
                      <Copy className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interview Talking Points */}
          <motion.div variants={itemVariants} className="bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-bronze" />
              Interview Talking Points
            </h3>
            <p className="text-xs text-slate-500">
              Concrete anecdotes and explanations to bridge the gap and highlight your match during interviews.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
              {report.interview_talking_points && report.interview_talking_points.slice(0, 5).map((point, index) => (
                <div key={index} className="flex flex-col p-4 bg-dark-base/40 border border-dark-border rounded-2xl shadow-md hover:shadow-xl hover:border-brand-bronze/25 transition-all">
                  <span className="w-8 h-8 rounded-full bg-brand-600/10 border border-brand-600/20 text-brand-bronze flex items-center justify-center text-xs font-bold mb-3 shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <ResumeEditor initialResume={report.tailored_resume} report={report} />
      )}
    </div>
  );
}
