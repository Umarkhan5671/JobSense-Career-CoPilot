import React, { useState } from 'react';
import Hero from './components/Hero';
import UploadPanel from './components/UploadPanel';
import LoadingState from './components/LoadingState';
import ResultsDashboard from './components/ResultsDashboard';
import ErrorBanner from './components/ErrorBanner';
import { analyzeCV } from './lib/api';

export default function App() {
  const [view, setView] = useState('hero'); // 'hero' | 'upload' | 'loading' | 'results' | 'error'
  const [report, setReport] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStart = () => {
    setView('upload');
  };

  const handleAnalyze = async (cvFile, jdText) => {
    setView('loading');
    setCvFile(cvFile);
    try {
      const data = await analyzeCV(cvFile, jdText);
      setReport(data);
      setView('results');
    } catch (err) {
      console.error(err);
      let errMsg = 'The AI career analysis engine had an issue processing your request. Please verify that your PDF is text-readable, your job description is valid, and the GROQ_API_KEY environment variable is configured in the backend.';
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      setErrorMsg(errMsg);
      setView('error');
    }
  };

  const handleReset = () => {
    setReport(null);
    setErrorMsg('');
    setCvFile(null);
    setView('upload');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Premium Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md font-bold text-lg font-heading">
              JS
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-slate-800 tracking-tight">
                JobSense
              </span>
              <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded ml-2 uppercase">
                AI Coach
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute" />
              Engine Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col justify-center">
        {view === 'hero' && <Hero onStartClick={handleStart} />}
        
        {view === 'upload' && (
          <div className="py-8">
            <UploadPanel onAnalyze={handleAnalyze} />
          </div>
        )}
        
        {view === 'loading' && <LoadingState />}
        
        {view === 'results' && report && (
          <ResultsDashboard report={report} cvFile={cvFile} onReset={handleReset} />
        )}
        
        {view === 'error' && (
          <ErrorBanner message={errorMsg} onBack={handleReset} />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-slate-200/60 py-6 text-center text-xs text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} JobSense — AI Career Coach. Built with FastAPI & React.
      </footer>
    </div>
  );
}
