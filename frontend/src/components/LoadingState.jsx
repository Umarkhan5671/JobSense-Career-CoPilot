import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, RefreshCw, FileSearch, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: FileSearch,
    title: 'Reading your CV',
    desc: 'Extracting skills, projects, and education chunks...',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    icon: Cpu,
    title: 'Cross-referencing the role',
    desc: 'Querying dual FAISS vector stores to find semantic alignments...',
    color: 'text-brand-600 bg-brand-50 border-brand-100',
  },
  {
    icon: Sparkles,
    title: 'Writing your report',
    desc: 'Synthesizing strengths, talking points, and bullet rewrites via Llama 3.3...',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  }
];

export default function LoadingState() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Cycle through steps roughly every 3 seconds
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = STEPS[currentStepIndex].icon;

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[400px]">
      {/* Animated icon circle */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-4 rounded-full border border-dashed border-brand-200"
        />
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-md relative z-10 transition-all duration-300 ${STEPS[currentStepIndex].color}`}>
          <ActiveIcon className="w-10 h-10 animate-pulse" />
        </div>
      </div>

      {/* Text Stepper with Fades */}
      <div className="h-28 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <h2 className="text-xl font-bold text-slate-800 font-heading">
              {STEPS[currentStepIndex].title}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {STEPS[currentStepIndex].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress indicators */}
      <div className="flex items-center justify-center gap-2.5 mt-4 w-full max-w-xs">
        {STEPS.map((_, index) => (
          <div
            key={index}
            className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden"
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ 
                width: index < currentStepIndex ? '100%' : index === currentStepIndex ? '100%' : '0%' 
              }}
              transition={{ duration: index === currentStepIndex ? 2.8 : 0.2, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-500"
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 font-medium">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        RAG matching runs in real-time (usually under 10s)
      </div>
    </div>
  );
}
