import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, HelpCircle, Check, Copy, RefreshCw, Star, MessageSquare, Clipboard, Download, Loader2, AlertCircle } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import SkillChips from './SkillChips';
import { exportReport } from '../lib/api';

export default function ResultsDashboard({ report, cvFile, onReset }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
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
      
      // Trigger a browser download of the blob
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
      setExportError("Failed to export and download your career report. Please verify the backend is running and try again.");
    } finally {
      setIsExporting(false);
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto px-4 py-8 space-y-8"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">
            AI Career Coach Report
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time semantic comparison between your CV and the job description.
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all duration-150 transform active:scale-95 bg-white shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Analyze Another
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Match Score Gauge */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <ScoreGauge score={report.match_score} />
        </motion.div>

        {/* Right Column: Strengths */}
        <motion.div variants={itemVariants} className="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 font-heading flex items-center gap-2">
              <Star className="w-5 h-5 text-brand-500 fill-brand-100" />
              Top Strengths to Leverage
            </h3>
            <p className="text-xs text-slate-400">
              Highlight these key accomplishments and experiences in your application and introductory calls.
            </p>
            <ul className="space-y-3.5 mt-2">
              {report.strengths && report.strengths.slice(0, 3).map((strength, index) => (
                <li key={index} className="flex gap-3 text-sm text-slate-700 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0">
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
        <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 font-heading flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-4.5 h-4.5" />
            </div>
            Matched Skills
          </h3>
          <p className="text-xs text-slate-400">
            Skills and technologies found in both your CV and the job description.
          </p>
          <div className="pt-2">
            <SkillChips skills={report.matched_skills} type="matched" />
          </div>
        </motion.div>

        {/* Missing Skills */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 font-heading flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            Skill Gaps
          </h3>
          <p className="text-xs text-slate-400">
            Important requirements from the JD that were not found or emphasized in your CV.
          </p>
          <div className="pt-2">
            <SkillChips skills={report.missing_skills} type="missing" />
          </div>
        </motion.div>
      </div>

      {/* Bullet point rewrites & Download Report Panel */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 font-heading flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-brand-500" />
              Rewritten CV Bullet Points
            </h3>
            <p className="text-xs text-slate-400">
              Tailored accomplishments starting with strong action verbs. Use these directly in your CV to target this role.
            </p>
          </div>
          
          <button
            onClick={handleDownloadReport}
            disabled={isExporting}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 transform active:scale-95 ${
              isExporting
                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-md hover:shadow-brand-100 cursor-pointer'
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
        </div>

        {exportError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            {exportError}
          </div>
        )}

        <div className="space-y-4 pt-2">
          {report.rewritten_bullets && report.rewritten_bullets.slice(0, 3).map((bullet, index) => (
            <div
              key={index}
              className="group relative flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-200 transition-colors"
            >
              <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-sm text-slate-700 leading-relaxed pr-10 flex-1">
                {bullet}
              </p>
              <button
                onClick={() => handleCopy(bullet, index)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                title="Copy to clipboard"
              >
                {copiedIndex === index ? (
                  <Check className="w-4.5 h-4.5 text-emerald-600" />
                ) : (
                  <Copy className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Interview Talking Points */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800 font-heading flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Interview Talking Points
        </h3>
        <p className="text-xs text-slate-400">
          Concrete anecdotes and explanations to bridge the gap and highlight your match during interviews.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {report.interview_talking_points && report.interview_talking_points.slice(0, 5).map((point, index) => (
            <div key={index} className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-indigo-100/50 border border-indigo-200/50 text-indigo-700 flex items-center justify-center text-xs font-bold mb-3 shrink-0">
                {index + 1}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {point}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
