import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export default function SkillChips({ skills, type }) {
  const isMatched = type === 'matched';
  
  if (!skills || skills.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        No {type} skills identified.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <div
          key={index}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors duration-150 ${
            isMatched
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/50'
              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/50'
          }`}
        >
          {isMatched ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
          {skill}
        </div>
      ))}
    </div>
  );
}
