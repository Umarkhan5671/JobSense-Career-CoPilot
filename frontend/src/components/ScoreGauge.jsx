import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ScoreGauge({ score }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(score, 10) || 0;
    if (end === 0) return;
    
    const duration = 1.2; // seconds
    const incrementTime = Math.abs(Math.floor(duration * 1000 / end));
    
    const timer = setInterval(() => {
      start += 1;
      setDisplayScore(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [score]);

  // Color mapping based on score
  let strokeColor = 'stroke-rose-500';
  let bgColor = 'bg-rose-50';
  let textColor = 'text-rose-700';
  let ringBgColor = 'stroke-rose-100';
  let ratingText = 'Needs Work';

  if (score >= 75) {
    strokeColor = 'stroke-emerald-500';
    bgColor = 'bg-emerald-50';
    textColor = 'text-emerald-700';
    ringBgColor = 'stroke-emerald-100';
    ratingText = 'Strong Match';
  } else if (score >= 50) {
    strokeColor = 'stroke-amber-500';
    bgColor = 'bg-amber-50';
    textColor = 'text-amber-700';
    ringBgColor = 'stroke-amber-100';
    ratingText = 'Good Fit';
  }

  // Circle parameters for SVG
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* SVG gauge */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            className={`${ringBgColor} transition-colors duration-300`}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score circle */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            className={`${strokeColor} transition-colors duration-300`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute text-center">
          <span className="font-heading font-bold text-4xl text-slate-800">
            {displayScore}%
          </span>
          <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Match Score
          </span>
        </div>
      </div>

      {/* Dynamic Rating Badge */}
      <div className={`mt-4 px-3.5 py-1 rounded-full text-xs font-semibold border ${textColor} ${bgColor} border-current`}>
        {ratingText}
      </div>
    </div>
  );
}
