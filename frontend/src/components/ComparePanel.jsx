import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { compareResumes, exportComparison } from '../lib/api';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, Loader2, Download, Award, ShieldAlert, FileType, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ComparePanel() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleCompare = async () => {
    if (!file) return;
    setError('');
    setLoading(true);
    setReport(null);

    try {
      const data = await compareResumes(file);
      setReport(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate comparison. Ensure you have uploaded a master resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const pdfBlob = await exportComparison(report);
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resume_comparison_report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download comparison report.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-slate-100 font-sans">
        <Loader2 className="w-10 h-10 text-brand-bronze animate-spin mb-4" />
        <p className="text-slate-200 font-semibold text-sm">Deeply analyzing and comparing resumes...</p>
        <p className="text-slate-500 text-xs mt-1">This might take up to 30 seconds to query Groq model.</p>
      </div>
    );
  }

  if (report) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans text-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-dark-border">
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">
              Resume Comparison Dashboard
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Your master resume vs the peer benchmark.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setReport(null)}
              className="px-5 py-2.5 rounded-xl border border-dark-border hover:bg-slate-800 text-slate-300 font-semibold text-sm bg-dark-panel"
            >
              Compare Another
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-dark-base font-bold text-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-dark-base" /> : <Download className="w-4 h-4" />}
              Download Comparison (PDF)
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-dark-panel text-slate-100 rounded-2xl p-6 shadow-2xl border border-dark-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-bronze mb-2">Executive Summary</h3>
          <p className="text-sm text-slate-350 leading-relaxed">{report.summary}</p>
        </div>

        {/* Visual Chart-based Comparison */}
        <div className="bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-2xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-bronze">Visual Axis Comparison</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 py-4">
            <svg width="460" height="200" viewBox="0 0 460 200" className="w-full max-w-[460px] bg-dark-base/40 rounded-xl p-4 border border-dark-border">
              {/* Guidelines */}
              <line x1="55" y1="20" x2="55" y2="160" stroke="#1f2937" strokeWidth="1.5"/>
              <line x1="55" y1="160" x2="430" y2="160" stroke="#1f2937" strokeWidth="1.5"/>
              
              {/* Gridlines */}
              <line x1="55" y1="90" x2="430" y2="90" stroke="#1f2937" strokeDasharray="4"/>
              <line x1="55" y1="20" x2="430" y2="20" stroke="#1f2937" strokeDasharray="4"/>
              
              {/* Y Axis Labels */}
              <text x="45" y="163" className="text-[10px] fill-slate-500 font-medium" textAnchor="end">0%</text>
              <text x="45" y="93" className="text-[10px] fill-slate-500 font-medium" textAnchor="end">50%</text>
              <text x="45" y="23" className="text-[10px] fill-slate-500 font-medium" textAnchor="end">100%</text>
              
              {/* Category 1: Skills */}
              <rect x="75" y={160 - ((report.user_skills_rating || 75) * 1.4)} width="18" height={(report.user_skills_rating || 75) * 1.4} fill="#c5a880" rx="2" className="transition-all duration-500" />
              <rect x="96" y={160 - ((report.other_skills_rating || 65) * 1.4)} width="18" height={(report.other_skills_rating || 65) * 1.4} fill="#4b5563" rx="2" className="transition-all duration-500" />
              <text x="94" y="176" className="text-[10px] font-semibold fill-slate-300" textAnchor="middle">Skills</text>

              {/* Category 2: Experience */}
              <rect x="145" y={160 - ((report.user_experience_rating || 80) * 1.4)} width="18" height={(report.user_experience_rating || 80) * 1.4} fill="#c5a880" rx="2" className="transition-all duration-500" />
              <rect x="166" y={160 - ((report.other_experience_rating || 70) * 1.4)} width="18" height={(report.other_experience_rating || 70) * 1.4} fill="#4b5563" rx="2" className="transition-all duration-500" />
              <text x="164" y="176" className="text-[10px] font-semibold fill-slate-300" textAnchor="middle">Experience</text>

              {/* Category 3: Format */}
              <rect x="215" y={160 - ((report.user_formatting_rating || 85) * 1.4)} width="18" height={(report.user_formatting_rating || 85) * 1.4} fill="#c5a880" rx="2" className="transition-all duration-500" />
              <rect x="236" y={160 - ((report.other_formatting_rating || 75) * 1.4)} width="18" height={(report.other_formatting_rating || 75) * 1.4} fill="#4b5563" rx="2" className="transition-all duration-500" />
              <text x="234" y="176" className="text-[10px] font-semibold fill-slate-300" textAnchor="middle">Format</text>

              {/* Category 4: Grammar */}
              <rect x="285" y={160 - ((report.user_grammar_rating || 90) * 1.4)} width="18" height={(report.user_grammar_rating || 90) * 1.4} fill="#c5a880" rx="2" className="transition-all duration-500" />
              <rect x="306" y={160 - ((report.other_grammar_rating || 80) * 1.4)} width="18" height={(report.other_grammar_rating || 80) * 1.4} fill="#4b5563" rx="2" className="transition-all duration-500" />
              <text x="304" y="176" className="text-[10px] font-semibold fill-slate-300" textAnchor="middle">Grammar</text>

              {/* Category 5: Overall */}
              <rect x="355" y={160 - ((report.user_overall_rating || 80) * 1.4)} width="18" height={(report.user_overall_rating || 80) * 1.4} fill="#c5a880" rx="2" className="transition-all duration-500" />
              <rect x="376" y={160 - ((report.other_overall_rating || 72) * 1.4)} width="18" height={(report.other_overall_rating || 72) * 1.4} fill="#4b5563" rx="2" className="transition-all duration-500" />
              <text x="374" y="176" className="text-[10px] font-semibold fill-slate-300" textAnchor="middle">Overall</text>
            </svg>
            
            <div className="flex flex-row md:flex-col gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-brand-bronze rounded"></div>
                <span className="font-semibold text-slate-200">Your Resume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#4b5563] rounded"></div>
                <span className="font-semibold text-slate-400">Peer Resume</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Advantages and Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-emerald-450 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Your Relative Advantages
            </h3>
            <ul className="space-y-3">
              {report.user_advantages.map((adv, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm text-emerald-350">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-450 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Identified Gaps
            </h3>
            <ul className="space-y-3">
              {report.user_gaps.map((gap, idx) => (
                <li key={idx} className="flex gap-2.5 text-sm text-amber-350">
                  <span className="text-amber-500 font-bold">!</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-dark-panel border border-dark-border rounded-2xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileType className="w-5 h-5 text-brand-bronze" />
              Formatting & Layout Comparison
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">{report.formatting_comparison}</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-350 mb-1">
                  <span>Your Resume Structure</span>
                  <span>{report.user_formatting_rating}%</span>
                </div>
                <div className="w-full h-2 bg-dark-base rounded-full overflow-hidden border border-dark-border">
                  <div className="h-full bg-brand-600" style={{ width: `${report.user_formatting_rating}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-350 mb-1">
                  <span>Peer Resume Structure</span>
                  <span>{report.other_formatting_rating}%</span>
                </div>
                <div className="w-full h-2 bg-dark-base rounded-full overflow-hidden border border-dark-border">
                  <div className="h-full bg-slate-600" style={{ width: `${report.other_formatting_rating}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-panel border border-dark-border rounded-2xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-brand-bronze" />
              Grammar & Quality Comparison
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">{report.grammar_quality_comparison}</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-350 mb-1">
                  <span>Your Writing Quality</span>
                  <span>{report.user_grammar_rating}%</span>
                </div>
                <div className="w-full h-2 bg-dark-base rounded-full overflow-hidden border border-dark-border">
                  <div className="h-full bg-brand-600" style={{ width: `${report.user_grammar_rating}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-350 mb-1">
                  <span>Peer Writing Quality</span>
                  <span>{report.other_grammar_rating}%</span>
                </div>
                <div className="w-full h-2 bg-dark-base rounded-full overflow-hidden border border-dark-border">
                  <div className="h-full bg-slate-600" style={{ width: `${report.other_grammar_rating}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-slate-100 font-sans">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-white font-heading">
          Compare Master Resume vs Peer
        </h2>
        <p className="text-sm text-slate-400">
          Upload a peer or competitor's resume to perform a side-by-side RAG analysis of strengths, gaps, formatting, and grammar.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-450 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-dark-panel border border-dark-border rounded-2xl p-6 shadow-2xl space-y-6">
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-dark-base/40 min-h-[200px] flex flex-col items-center justify-center ${
              isDragActive ? 'border-brand-bronze bg-brand-600/10 scale-[1.01]' : 'border-dark-border hover:border-brand-bronze/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="p-4 rounded-full bg-dark-base border border-dark-border text-slate-400 mb-4 shadow-md">
              <UploadCloud className="w-8 h-8 text-brand-bronze" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              Drag & drop peer resume here
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Only PDF format is supported (max 10MB)
            </p>
          </div>
        ) : (
          <div className="border border-dark-border rounded-2xl p-6 bg-dark-base/40 flex flex-col justify-between min-h-[200px]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-600/10 border border-brand-600/20 text-brand-bronze rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="inline-flex items-center gap-1.5 mt-3 text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1 rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to compare
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setFile(null)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dark-border hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
              <button
                type="button"
                onClick={handleCompare}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Compare Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
