import React from 'react';
import { ArrowRight, Sparkles, Cpu, Target, Award } from 'lucide-react';

export default function Hero({ onStartClick }) {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24 bg-white border-b border-slate-100">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
            AI RAG Career Intelligence
          </div>

          {/* Heading */}
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-none mb-6">
            Land Your Dream Role with <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">JobSense</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload your CV and paste any job description. JobSense uses two independent local 
            vector stores to cross-reference your skills and experiences, providing a detailed 
            gap analysis, interview talking points, and tailored CV bullet rewrites in seconds.
          </p>

          {/* Call-to-action */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onStartClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl hover:shadow-brand-100 transition-all duration-200 group transform active:scale-95"
            >
              Analyze Your CV Now
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Tech/Process Stack details */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-16 pt-12 border-t border-slate-100">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Dual-Store RAG</span>
              <span className="text-xs text-slate-400 mt-0.5">Independent FAISS cross-querying</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Precision Gaps</span>
              <span className="text-xs text-slate-400 mt-0.5">Find exact missing technologies</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Llama 3.3 70B</span>
              <span className="text-xs text-slate-400 mt-0.5">AI powered bullet rewrites</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
