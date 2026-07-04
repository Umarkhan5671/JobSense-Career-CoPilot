import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Cpu, Target, Award, AlertCircle, UploadCloud } from 'lucide-react';

export default function Hero({ onStartClick, hasDefaultResume, onUploadMasterClick }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-play loop for the 3D flip card (flips every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } }
  };

  return (
    <div className="relative overflow-hidden py-16 sm:py-20 bg-dark-base border-b border-dark-border">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand-600/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-amber-700/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading, description, CTA */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7 text-left space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-600/10 border border-brand-600/20 text-brand-gold text-xs font-semibold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
              AI RAG Career Intelligence
            </div>

            {/* Heading */}
            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none">
              Land Your Dream Role with <span className="bg-gradient-to-r from-brand-gold via-brand-bronze to-amber-500 bg-clip-text text-transparent animate-pulse font-extrabold">JobSense</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-405 leading-relaxed text-slate-350 max-w-2xl">
              Upload your CV and paste any job description. JobSense uses two independent local 
              vector stores to cross-reference your skills and experiences, providing a detailed 
              gap analysis, interview talking points, and tailored CV bullet rewrites in seconds.
            </p>

            {!hasDefaultResume && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 max-w-2xl"
              >
                <div className="flex items-center gap-3 text-brand-gold">
                  <AlertCircle size={18} className="shrink-0 animate-pulse" />
                  <span className="font-heading font-bold text-sm">No Master Resume Uploaded</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You haven't uploaded a default master resume to your profile yet. Upload a master resume now to enable instant one-click tailoring and profile-based RAG analysis.
                </p>
                <button
                  onClick={onUploadMasterClick}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-600/20 hover:bg-brand-600/35 border border-brand-600/30 text-brand-gold text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  <UploadCloud size={14} />
                  Upload Master Resume
                </button>
              </motion.div>
            )}

            {/* Call-to-action */}
            <div className="pt-2 flex flex-col sm:flex-row items-start gap-4">
              <motion.button
                whileHover={{ scale: 1.03, y: -1, boxShadow: "0 10px 25px -5px rgba(197, 168, 128, 0.25)" }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartClick}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base font-extrabold shadow-lg transition-all group cursor-pointer border border-amber-450/20"
              >
                Analyze Your CV Now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </div>
          </motion.div>

          {/* Right Column: Looping 3D Document Flip Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-[300px] aspect-[1/1.4] perspective-1000">
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

        {/* Tech/Process Stack details */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 pt-12 border-t border-dark-border/40"
        >
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.02, borderColor: 'rgba(197, 168, 128, 0.4)', boxShadow: '0 12px 30px -10px rgba(197, 168, 128, 0.15)' }}
            className="flex flex-col items-center bg-dark-panel/40 border border-dark-border p-6 rounded-2xl transition-all duration-350"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-600/10 border border-brand-600/20 text-brand-bronze flex items-center justify-center mb-3.5 shadow-md shadow-brand-600/5">
              <Cpu className="w-5 h-5 text-brand-gold" />
            </div>
            <span className="text-sm font-bold text-slate-200 font-heading">Dual-Store RAG</span>
            <span className="text-xs text-slate-500 mt-1.5 text-center">Independent FAISS vector stores</span>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.02, borderColor: 'rgba(197, 168, 128, 0.4)', boxShadow: '0 12px 30px -10px rgba(197, 168, 128, 0.15)' }}
            className="flex flex-col items-center bg-dark-panel/40 border border-dark-border p-6 rounded-2xl transition-all duration-350"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-600/10 border border-brand-600/20 text-brand-bronze flex items-center justify-center mb-3.5 shadow-md shadow-brand-600/5">
              <Target className="w-5 h-5 text-brand-gold" />
            </div>
            <span className="text-sm font-bold text-slate-200 font-heading">Precision Gaps</span>
            <span className="text-xs text-slate-500 mt-1.5 text-center">Identify exact missing keywords</span>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.02, borderColor: 'rgba(197, 168, 128, 0.4)', boxShadow: '0 12px 30px -10px rgba(197, 168, 128, 0.15)' }}
            className="flex flex-col items-center bg-dark-panel/40 border border-dark-border p-6 rounded-2xl transition-all duration-350"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-600/10 border border-brand-600/20 text-brand-bronze flex items-center justify-center mb-3.5 shadow-md shadow-brand-600/5">
              <Award className="w-5 h-5 text-brand-gold" />
            </div>
            <span className="text-sm font-bold text-slate-200 font-heading">Llama 3.3 70B</span>
            <span className="text-xs text-slate-500 mt-1.5 text-center">AI powered bullet point tailoring</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
