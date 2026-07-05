import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './context/authContext';
import LandingPage from './components/LandingPage';
import ResumeSetup from './components/ResumeSetup';
import Hero from './components/Hero';
import UploadPanel from './components/UploadPanel';
import LoadingState from './components/LoadingState';
import ResultsDashboard from './components/ResultsDashboard';
import ErrorBanner from './components/ErrorBanner';
import ComparePanel from './components/ComparePanel';
import { analyzeCV, uploadAvatar, uploadDefaultResume } from './lib/api';
import { User, LogOut, Camera, Loader2, ChevronLeft, ChevronRight, LayoutDashboard, Sparkles, FileSpreadsheet, FileText, UploadCloud, CheckCircle2, AlertCircle, X, Calendar, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HamburgerIcon = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 flex flex-col justify-center items-center gap-1.5 focus:outline-none hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
      aria-label="Toggle Menu"
    >
      <motion.span
        animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-5 h-0.5 bg-brand-bronze rounded-full"
      />
      <motion.span
        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-5 h-0.5 bg-brand-bronze rounded-full"
      />
      <motion.span
        animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-5 h-0.5 bg-brand-bronze rounded-full"
      />
    </button>
  );
};

export default function App() {
  const { user, loading, profile, avatarUrl, refreshProfile, signOut } = useAuth();
  
  // Navigation State: 'hero' | 'analyze' | 'compare'
  const [activeNav, setActiveNav] = useState('hero');
  // Secondary views within 'analyze': 'form' | 'loading' | 'results' | 'error'
  const [analyzeView, setAnalyzeView] = useState('form'); 
  
  const [report, setReport] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  // Swap resume inside profile modal states
  const [swapFile, setSwapFile] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState('');
  
  const avatarInputRef = useRef(null);
  const swapResumeInputRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showFullSidebar = !isMobile ? !isSidebarCollapsed : true;

  const handleStart = () => {
    setActiveNav('analyze');
    setAnalyzeView('form');
  };

  const handleAnalyze = async (uploadedFile, jdText) => {
    setAnalyzeView('loading');
    setCvFile(uploadedFile);
    setJobDescription(jdText);
    try {
      const data = await analyzeCV(uploadedFile, jdText);
      setReport(data);
      setAnalyzeView('results');
    } catch (err) {
      console.error(err);
      let errMsg;
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        errMsg = 'The analysis timed out on the frontend, but the AI engine may still be running. Please wait 30 seconds and try again — the backend handles 5 tailoring passes which can take 2–4 minutes.';
      } else if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      } else if (err.code === 'ERR_NETWORK' || err.message?.toLowerCase().includes('network')) {
        errMsg = 'Network error — cannot reach the backend. Make sure the backend server is running on port 8000.';
      } else {
        errMsg = 'The AI career analysis engine had an issue processing your request. Please verify that your PDF is text-readable, your job description is valid, and the GROQ_API_KEY environment variable is configured in the backend.';
      }
      setErrorMsg(errMsg);
      setAnalyzeView('error');
    }
  };


  const handleReset = () => {
    setReport(null);
    setErrorMsg('');
    setCvFile(null);
    setAnalyzeView('form');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSwapResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSwapError('');
    setSwapLoading(true);
    try {
      await uploadDefaultResume(file);
      await refreshProfile();
      setSwapFile(file);
      alert('Default resume successfully updated!');
    } catch (err) {
      console.error(err);
      setSwapError(err.response?.data?.detail || 'Failed to update resume. Please verify file and try again.');
    } finally {
      setSwapLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // 1. Loading state
  if (loading) {
    return <LoadingState message="Connecting to JobSense session..." />;
  }

  // 2. Auth protection - Show marketing landing page if logged out
  if (!user) {
    return <LandingPage onLoginSuccess={refreshProfile} />;
  }

  const defaultResumeFilename = profile?.default_resume_url ? profile.default_resume_url.split('/').pop() : 'Default Resume.pdf';

  return (
    <div className="min-h-screen bg-dark-base text-slate-100 flex font-sans overflow-hidden">
      {/* Sidebar Backdrop Overlay on mobile */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside
        className={`bg-dark-panel border-r border-dark-border text-slate-300 transition-all duration-300 flex flex-col shrink-0 z-40 
          /* Mobile layout */
          fixed top-0 bottom-0 left-0 w-64
          ${isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          
          /* Desktop layout */
          md:relative md:translate-x-0 md:flex
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Brand Header / Animated Hamburger wrapper */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-dark-border overflow-hidden shrink-0">
          {showFullSidebar ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-amber-500 rounded-xl flex items-center justify-center text-dark-base shadow font-bold text-lg shrink-0">
                  JS
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-base text-white leading-tight">
                    JobSense
                  </span>
                  <span className="text-[9px] text-brand-bronze font-semibold tracking-wider uppercase">
                    Career Co-Pilot
                  </span>
                </div>
              </div>
              {/* Hamburger on desktop, Close (X) on mobile */}
              <div className="hidden md:block">
                <HamburgerIcon
                  isOpen={true}
                  onClick={() => setIsSidebarCollapsed(true)}
                />
              </div>
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close Drawer"
                >
                  <X size={20} className="text-brand-bronze" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <HamburgerIcon
                isOpen={false}
                onClick={() => setIsSidebarCollapsed(false)}
              />
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-8 space-y-4 px-4">
          <div className="relative group">
            <button
              onClick={() => { setActiveNav('hero'); setAnalyzeView('form'); setIsMobileDrawerOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-xl text-sm font-semibold transition-all ${
                activeNav === 'hero'
                  ? 'bg-brand-600/15 text-brand-bronze border border-brand-600/20'
                  : 'hover:bg-slate-800/50 hover:text-white border border-transparent'
              }`}
            >
              <LayoutDashboard size={18} />
              {showFullSidebar && <span>Dashboard</span>}
            </button>
            {!showFullSidebar && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 text-xs bg-slate-850 border border-dark-border text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-40">
                Dashboard
              </span>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={() => { setActiveNav('analyze'); setAnalyzeView('form'); setIsMobileDrawerOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-xl text-sm font-semibold transition-all ${
                activeNav === 'analyze'
                  ? 'bg-brand-600/15 text-brand-bronze border border-brand-600/20'
                  : 'hover:bg-slate-800/50 hover:text-white border border-transparent'
              }`}
            >
              <Sparkles size={18} />
              {showFullSidebar && <span>Analyze CV vs JD</span>}
            </button>
            {!showFullSidebar && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 text-xs bg-slate-850 border border-dark-border text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-40">
                Analyze CV vs JD
              </span>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={() => { setActiveNav('compare'); setIsMobileDrawerOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-xl text-sm font-semibold transition-all ${
                activeNav === 'compare'
                  ? 'bg-brand-600/15 text-brand-bronze border border-brand-600/20'
                  : 'hover:bg-slate-800/50 hover:text-white border border-transparent'
              }`}
            >
              <FileSpreadsheet size={18} />
              {showFullSidebar && <span>Compare Resumes</span>}
            </button>
            {!showFullSidebar && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 text-xs bg-slate-850 border border-dark-border text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-40">
                Compare Resumes
              </span>
            )}
          </div>
        </nav>

        {/* Pinned Profile Avatar block at the bottom */}
        <div className="p-4.5 border-t border-dark-border shrink-0">
          <div className="flex items-center justify-between gap-3 overflow-hidden">
            <button
              onClick={() => { setIsProfileModalOpen(true); setIsMobileDrawerOpen(false); }}
              className="flex items-center gap-3 text-left overflow-hidden group focus:outline-none flex-1"
              title="Open profile details"
            >
                <div className="w-11 h-11 rounded-full bg-slate-800 border border-dark-border flex items-center justify-center overflow-hidden hover:opacity-85 transition-opacity">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-brand-bronze">
                      {getInitials(profile?.full_name)}
                    </span>
                  )}
                </div>

              {showFullSidebar && (
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate group-hover:text-brand-bronze transition-colors">
                    {profile?.full_name || 'JobSense User'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </button>

            {showFullSidebar && (
              <button
                onClick={signOut}
                className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 h-20 border-b border-dark-border/40 bg-dark-panel/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 shadow-lg shadow-brand-600/5">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button on mobile/tablet */}
            <div className="md:hidden">
              <HamburgerIcon
                isOpen={isMobileDrawerOpen}
                onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Workspace /</span>
              <span className="text-xs font-bold bg-gradient-to-r from-brand-gold via-brand-bronze to-amber-500 bg-clip-text text-transparent capitalize tracking-wider">
                {activeNav === 'hero' ? 'Dashboard' : activeNav}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider shadow-lg shadow-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Engine Online
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-grow overflow-y-auto">
          {activeNav === 'hero' && (
            <Hero
              onStartClick={handleStart}
              hasDefaultResume={!!profile?.default_resume_url}
              onUploadMasterClick={() => setIsProfileModalOpen(true)}
            />
          )}
          
          {activeNav === 'analyze' && (
            <>
              {analyzeView === 'form' && (
                <div className="py-4">
                  <UploadPanel
                    onAnalyze={handleAnalyze}
                    hasDefaultResume={!!profile?.default_resume_url}
                  />
                </div>
              )}
              {analyzeView === 'loading' && <LoadingState />}
              {analyzeView === 'results' && report && (
                <ResultsDashboard report={report} cvFile={cvFile} onReset={handleReset} jobDescription={jobDescription} />
              )}
              {analyzeView === 'error' && (
                <ErrorBanner message={errorMsg} onBack={handleReset} />
              )}
            </>
          )}

          {activeNav === 'compare' && <ComparePanel />}
        </main>

      </div>

      {/* Profile Modal Overlay */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-dark-panel border border-dark-border rounded-2xl shadow-2xl p-6 text-slate-100"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setSwapFile(null);
                  setSwapError('');
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold text-white mb-6 border-b border-dark-border pb-3">
                Your Profile Details
              </h3>

              {/* Profile Details Container */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Photo container with camera overlay */}
                  <div className="relative group shrink-0">
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-brand-bronze flex items-center justify-center overflow-hidden hover:opacity-90"
                      title="Update avatar"
                      disabled={avatarLoading}
                    >
                      {avatarLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-brand-bronze" />
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-brand-bronze">
                          {getInitials(profile?.full_name)}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </button>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h4 className="text-lg font-bold text-white truncate">
                      {profile?.full_name}
                    </h4>
                    <p className="text-sm text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                      <Mail size={14} className="text-brand-bronze" />
                      <span>{user.email}</span>
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/20 border border-emerald-900/35 text-[10px] font-bold text-emerald-400 mt-3">
                      Verified Member
                    </span>
                  </div>
                </div>

                {/* Default Resume section */}
                <div className="bg-dark-base/50 border border-dark-border rounded-xl p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-600/10 text-brand-bronze rounded-lg">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-white">Default Master Resume</h5>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                          {defaultResumeFilename}
                        </p>
                      </div>
                    </div>
                    {profile?.resume_updated_at && (
                      <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                        Uploaded: {new Date(profile.resume_updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Swap master resume upload zones */}
                  <div className="border border-dashed border-dark-border hover:border-brand-bronze/50 rounded-xl p-3 bg-dark-panel flex items-center justify-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      ref={swapResumeInputRef}
                      onChange={handleSwapResume}
                      accept="application/pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={swapLoading}
                    />
                    {swapLoading ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-brand-bronze py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing and embedding new resume...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 py-2">
                        <UploadCloud size={16} className="text-brand-bronze" />
                        <span>Click to swap master resume (PDF)</span>
                      </div>
                    )}
                  </div>
                  {swapError && (
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{swapError}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-dark-border">
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setSwapFile(null);
                      setSwapError('');
                    }}
                    className="px-4 py-2 border border-dark-border hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-300 text-xs font-semibold rounded-lg transition-all"
                  >
                    Logout Account
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
