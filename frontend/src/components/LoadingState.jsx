import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, RefreshCw, FileSearch, Sparkles, Target, BarChart3, Zap, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    icon: FileSearch,
    title: 'Reading your CV',
    desc: 'Extracting skills, projects, and education using PyMuPDF...',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    icon: Cpu,
    title: 'Building RAG vector store',
    desc: 'Embedding your resume into FAISS for semantic search...',
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    icon: Target,
    title: 'Analysing job alignment',
    desc: 'Querying dual vector stores to find your best-fit sections...',
    color: 'text-brand-600 bg-brand-50 border-brand-100',
  },
  {
    icon: Sparkles,
    title: 'Writing your career report',
    desc: 'Synthesising strengths, gaps, and talking points via Llama 3.3...',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    icon: Zap,
    title: 'Tailoring your resume (pass 1–3)',
    desc: 'Rewriting bullet points and skills to match the JD requirements...',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    icon: BarChart3,
    title: 'Tailoring your resume (pass 4–5)',
    desc: 'Fine-tuning phrasing and verifying match score improvements...',
    color: 'text-orange-600 bg-orange-50 border-orange-100',
  },
  {
    icon: CheckCircle,
    title: 'Finalising results',
    desc: 'Quality-checking the optimised resume and preparing your dashboard...',
    color: 'text-teal-600 bg-teal-50 border-teal-100',
  },
];

function useElapsed() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return elapsed;
}

export default function LoadingState({ message }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const elapsed = useElapsed();

  useEffect(() => {
    // Advance step every ~18 seconds — covers the full multi-pass pipeline (~2 min)
    // But never go past last step — stay on "Finalising results" once we reach it
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 18000);
    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = STEPS[currentStepIndex].icon;

  const formatElapsed = (s) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[400px]">
      {/* Animated icon circle */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-4 rounded-full border border-dashed border-brand-200"
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-md relative z-10 ${STEPS[currentStepIndex].color}`}
          >
            <ActiveIcon className="w-10 h-10" />
          </motion.div>
        </AnimatePresence>
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

      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {STEPS.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              width: index === currentStepIndex ? 20 : 8,
              opacity: index <= currentStepIndex ? 1 : 0.25,
            }}
            transition={{ duration: 0.3 }}
            className={`h-2 rounded-full ${
              index < currentStepIndex
                ? 'bg-emerald-500'
                : index === currentStepIndex
                ? 'bg-brand-500'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Step counter + elapsed timer */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Step {currentStepIndex + 1} of {STEPS.length} — AI analysis in progress
        </div>
        <div className="text-xs text-slate-400">
          ⏱ Elapsed: <span className="font-semibold text-slate-500">{formatElapsed(elapsed)}</span>
          {elapsed > 30 && (
            <span className="ml-2 text-amber-500 font-medium">
              (Groq multi-pass tailoring can take 2–3 min — please wait)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
