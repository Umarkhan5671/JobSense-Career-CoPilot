import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/authContext';
import { uploadDefaultResume } from '../lib/api';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ResumeSetup = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshProfile, signOut } = useAuth();

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

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      await uploadDefaultResume(file);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload and parse resume. Please check Groq API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-base relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-700/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg p-8 rounded-2xl backdrop-blur-md bg-dark-panel border border-dark-border shadow-2xl relative z-10 mx-4"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Complete Your Profile
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            Upload your master resume (PDF). We will parse it and embed it into your secure profile to tailor future applications instantly.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-2 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-dark-base/40 min-h-[220px] flex flex-col items-center justify-center ${
                isDragActive
                  ? 'border-brand-bronze bg-brand-600/10 scale-[1.01]'
                  : 'border-dark-border hover:border-slate-700'
              }`}
            >
              <input {...getInputProps()} />
              <div className="p-4 rounded-full bg-dark-base border border-dark-border text-slate-400 mb-4">
                <UploadCloud className="w-8 h-8 text-brand-bronze" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                Drag & drop your PDF resume here
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Only PDF files are supported (max 10MB)
              </p>
            </div>
          ) : (
            <div className="border border-dark-border rounded-2xl p-6 bg-dark-base/40 flex flex-col justify-between min-h-[220px]">
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
                    Ready for parsing
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dark-border hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4 text-dark-base" />
                  ) : (
                    'Parse & Save Resume'
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={signOut}
              className="text-slate-500 hover:text-slate-400 text-xs font-semibold focus:outline-none"
            >
              Sign out and return
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeSetup;
