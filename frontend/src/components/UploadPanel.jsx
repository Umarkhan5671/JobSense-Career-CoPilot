import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPanel({ onAnalyze, hasDefaultResume }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const MIN_JD_LENGTH = 100;

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

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleJdChange = (e) => {
    setJobDescription(e.target.value);
  };

  const jdLength = jobDescription.trim().length;
  const isJdValid = jdLength >= MIN_JD_LENGTH;
  const isFormValid = (file || hasDefaultResume) && isJdValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      onAnalyze(file, jobDescription);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: CV Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-200 font-heading">
              {hasDefaultResume ? '1. Upload an Override CV (Optional)' : '1. Upload Your CV (PDF)'}
            </label>
            
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-dark-panel flex flex-col items-center justify-center min-h-[250px] ${
                  isDragActive
                    ? 'border-brand-bronze bg-brand-600/10 scale-[1.01]'
                    : 'border-dark-border hover:border-brand-bronze/50 hover:bg-slate-800/20'
                }`}
              >
                <input {...getInputProps()} />
                <div className="p-4 rounded-full bg-dark-base text-slate-400 mb-4 border border-dark-border">
                  <UploadCloud className="w-8 h-8 text-brand-bronze" />
                </div>
                <h3 className="text-sm font-medium text-slate-200">
                  {hasDefaultResume
                    ? 'Drag & drop a new PDF to override'
                    : 'Drag & drop your PDF CV here'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  {hasDefaultResume
                    ? 'Using your master resume by default'
                    : 'Only PDF files are supported (max 10MB)'}
                </p>
              </div>
            ) : (
              <div className="border border-dark-border rounded-2xl p-6 bg-dark-panel shadow-2xl flex flex-col justify-between min-h-[250px]">
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
                      Override CV active
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-950/30 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove override (use default)
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Job Description */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="jd-textarea" className="block text-sm font-bold text-slate-200 font-heading">
                2. Paste Job Description
              </label>
              <span className={`text-xs font-semibold ${isJdValid ? 'text-slate-500' : 'text-amber-500'}`}>
                {jdLength} characters {jdLength < MIN_JD_LENGTH && `(min ${MIN_JD_LENGTH})`}
              </span>
            </div>
            
            <div className="relative">
              <textarea
                id="jd-textarea"
                value={jobDescription}
                onChange={handleJdChange}
                placeholder="Paste the target job description or requirements here..."
                className={`w-full min-h-[250px] p-4 bg-dark-panel border rounded-2xl shadow-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bronze/20 focus:border-brand-bronze transition-all resize-none placeholder:text-slate-600 ${
                  isJdValid
                    ? 'border-dark-border'
                    : jdLength > 0
                    ? 'border-amber-500/50'
                    : 'border-dark-border'
                }`}
              />

              {jdLength > 0 && !isJdValid && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-950/35 border border-amber-900/30 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please add at least {MIN_JD_LENGTH - jdLength} more characters.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-bold rounded-xl shadow-lg transition-all transform active:scale-95 ${
              isFormValid
                ? 'bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base cursor-pointer'
                : 'bg-dark-panel border border-dark-border text-slate-600 cursor-not-allowed'
            }`}
          >
            Start Career Fit Analysis
          </button>
        </div>
      </form>
    </div>
  );
}
