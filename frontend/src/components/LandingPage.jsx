import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, CheckCircle, ArrowRight, X, Shield, Zap, Award, Mail } from 'lucide-react';
import AuthView from './AuthView';

export default function LandingPage({ onLoginSuccess }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-play loop for the 3D flip card (flips every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-dark-base text-slate-100 font-sans relative overflow-x-hidden selection:bg-brand-600/30 selection:text-brand-200">
      {/* Background glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-700/10 blur-[150px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-dark-base/70 border-b border-dark-border/40 shadow-lg shadow-brand-600/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-amber-500 rounded-xl flex items-center justify-center text-dark-base shadow-lg shadow-brand-600/20 font-bold text-lg border border-white/10">
              JS
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-base bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent leading-tight tracking-wide">
                JobSense
              </span>
              <span className="text-[9px] text-brand-gold font-bold tracking-widest uppercase">
                Career Platform
              </span>
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="relative hover:text-brand-gold transition-colors duration-300 py-1 group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#pricing" className="relative hover:text-brand-gold transition-colors duration-300 py-1 group">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all duration-300 group-hover:w-full" />
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openAuth('login')}
              className="text-sm font-bold text-slate-300 hover:text-brand-gold transition-colors duration-300 cursor-pointer px-3 py-1.5"
            >
              Sign In
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.03, y: -1, boxShadow: "0 10px 25px -5px rgba(197, 168, 128, 0.25)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAuth('signup')}
              className="text-sm font-extrabold bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-600/10 cursor-pointer border border-amber-450/20"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </header>

      {/* Hero Section - Matches the 2-Column Layout */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Headline, subtext, and CTAs */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7 text-left space-y-6"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-600/10 border border-brand-600/20 text-xs font-semibold text-brand-bronze">
              <Sparkles size={12} className="text-brand-gold animate-pulse" />
              AI-Powered Career Co-Pilot
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Land more interviews with JobSense's <span className="bg-gradient-to-r from-brand-gold via-brand-bronze to-amber-400 bg-clip-text text-transparent">Resume Builder</span>
            </h1>
            
            <p className="text-slate-405 text-base md:text-lg leading-relaxed text-slate-350 max-w-2xl">
              ATS Check, AI Writer, and One-Click Job Tailoring make your resume stand out to recruiters. Identify gaps instantly and optimize your resume and cover letter in seconds.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => openAuth('signup')}
                className="w-full sm:w-auto text-base font-semibold bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base px-8 py-4 rounded-xl transition-all shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Build Your Resume</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => openAuth('login')}
                className="w-full sm:w-auto text-base font-semibold bg-dark-panel hover:bg-slate-800 text-slate-300 px-8 py-4 rounded-xl border border-dark-border transition-all flex items-center justify-center cursor-pointer"
              >
                Get Your Resume Score
              </button>
            </div>
          </motion.div>

          {/* Right Column: Looping 3D Document Flip Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-[360px] aspect-[1/1.4] perspective-1000">
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
                className="w-full h-full transform-style-preserve-3d relative cursor-pointer shadow-2xl rounded-2xl"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front Side: Real Resume Image */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-dark-panel rounded-2xl border border-dark-border overflow-hidden shadow-2xl flex flex-col justify-between">
                  <img
                    src="/resume_sample.png"
                    alt="Sample Tailored Resume"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark-base/80 backdrop-blur border border-dark-border rounded-full px-4 py-1.5 text-[10px] font-bold text-brand-bronze uppercase tracking-widest text-center shadow-lg">
                    Real-time Tailoring
                  </div>
                </div>

                {/* Back Side: Real Cover Letter Image */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-dark-panel rounded-2xl border border-dark-border overflow-hidden shadow-2xl flex flex-col justify-between">
                  <img
                    src="/cover_letter_sample.png"
                    alt="Sample Tailored Cover Letter"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark-base/80 backdrop-blur border border-dark-border rounded-full px-4 py-1.5 text-[10px] font-bold text-brand-gold uppercase tracking-widest text-center shadow-lg">
                    ATS Cover Letter
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Features Grid Section - Scroll triggered */}
      <motion.section 
        id="features" 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-dark-border/40 bg-dark-panel/20"
      >
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Tailored Specifically for SaaS and Tech Job Hunts
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything you need to compete effectively in competitive recruitment environments.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-8 rounded-2xl bg-dark-panel/40 border border-dark-border hover:border-brand-bronze/50 transition-all group shadow-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-600/10 text-brand-bronze flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Fit Analysis</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Direct comparison of job requirements against your experiences. Returns score, missing skills, strengths, and interview talking points.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-2xl bg-dark-panel/40 border border-dark-border hover:border-brand-bronze/50 transition-all group shadow-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-600/10 text-brand-bronze flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cover Letter Generator</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No templates, no generic fluff. JobSense designs a fully tailored matching cover letter based on the specific JD that fits on a single page.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-2xl bg-dark-panel/40 border border-dark-border hover:border-brand-bronze/50 transition-all group shadow-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-600/10 text-brand-bronze flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Comparative Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload a competitor resume to identify relative gaps, design differences, formatting quality, and writing copy improvements.
            </p>
          </motion.div>

        </div>
      </motion.section>

      {/* Pricing Section - Scroll triggered */}
      <motion.section 
        id="pricing" 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-dark-border/40"
      >
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Transparent, Simple Pricing
          </h2>
          <p className="text-slate-400">
            Start tailoring today, no credit card required.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md mx-auto rounded-2xl bg-dark-panel border border-brand-bronze/45 p-8 text-center relative shadow-2xl"
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-dark-base text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
          <h3 className="text-2xl font-bold text-white">Premium Tier</h3>
          <p className="text-slate-455 mt-2 text-sm text-slate-400">Full access to resume and cover letter tailoring engine</p>
          
          <div className="my-8">
            <span className="text-5xl font-extrabold text-white">$0</span>
            <span className="text-slate-400 text-sm ml-1">/ lifetime free</span>
          </div>

          <ul className="space-y-4 text-left text-sm text-slate-300 mb-8">
            <li className="flex items-center gap-3">
              <CheckCircle size={16} className="text-brand-bronze" />
              <span>Unlimited resume analysis</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={16} className="text-brand-bronze" />
              <span>Tailored resume PDF downloads</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={16} className="text-brand-bronze" />
              <span>Tailored Cover Letter PDFs</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={16} className="text-brand-bronze" />
              <span>Competitor resume comparison</span>
            </li>
          </ul>

          <button 
            onClick={() => openAuth('signup')}
            className="w-full bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Create Your Account Now
          </button>
        </motion.div>
      </motion.section>


      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
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
              className="relative w-full max-w-md bg-dark-panel border border-dark-border rounded-2xl overflow-hidden shadow-2xl p-1"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors z-20 cursor-pointer"
              >
                <X size={18} />
              </button>

              <AuthView 
                initialIsLogin={authMode === 'login'} 
                onSuccess={() => {
                  setShowAuthModal(false);
                  if (onLoginSuccess) onLoginSuccess();
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
