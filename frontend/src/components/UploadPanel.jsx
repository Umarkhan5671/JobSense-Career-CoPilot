import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPanel({ onAnalyze }) {
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
  const isFormValid = file && isJdValid;

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
            <label className="block text-sm font-semibold text-slate-800 font-heading">
              1. Upload Your CV (PDF)
            </label>
            
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-white flex flex-col items-center justify-center min-h-[250px] ${
                  isDragActive
                    ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                    : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="p-4 rounded-full bg-slate-50 text-slate-500 mb-4 border border-slate-100 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                  <UploadCloud className="w-8 h-8 text-brand-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-700">
                  Drag & drop your PDF CV here
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">
                  Only PDF files are supported (max 10MB)
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between min-h-[250px]">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-50 border border-brand-100 text-brand-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="inline-flex items-center gap-1.5 mt-3 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready to analyze
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition-colors duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove and replace PDF
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Job Description */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="jd-textarea" className="block text-sm font-semibold text-slate-800 font-heading">
                2. Paste Job Description
              </label>
              <span className={`text-xs font-medium ${isJdValid ? 'text-slate-400' : 'text-amber-600'}`}>
                {jdLength} characters {jdLength < MIN_JD_LENGTH && `(min ${MIN_JD_LENGTH})`}
              </span>
            </div>
            
            <div className="relative">
              <textarea
                id="jd-textarea"
                value={jobDescription}
                onChange={handleJdChange}
                placeholder="Paste the target job description or requirements here..."
                className={`w-full min-h-[250px] p-4 bg-white border rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                  isJdValid
                    ? 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                    : jdLength > 0
                    ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-400'
                    : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
              />

              {jdLength > 0 && !isJdValid && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-xl animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please add at least {MIN_JD_LENGTH - jdLength} more characters for context.
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
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 ${
              isFormValid
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white cursor-pointer hover:shadow-xl hover:shadow-brand-100'
                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Analyze Career Fit
          </button>
        </div>
      </form>
    </div>
  );
}
