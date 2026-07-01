import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ErrorBanner({ message, onBack }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl shadow-sm space-y-5">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 font-heading">
            Analysis Failed
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {message || "We encountered an issue communicating with the AI career engine. Please check that your Groq API key is correct and your internet connection is active."}
          </p>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-700 font-medium text-sm transition-all duration-150 transform active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
