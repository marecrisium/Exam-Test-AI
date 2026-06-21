import React from 'react';
import { SparklesIcon, CheckIcon } from './icons';

const ExamPapersStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="sheetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="sheetGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="sheetGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Backmost sheet, slightly rotated / offset */}
      <rect 
        x="7" 
        y="2" 
        width="11" 
        height="15" 
        rx="1.5" 
        fill="url(#sheetGrad3)" 
        stroke="#cbd5e1" 
        strokeWidth="1"
        transform="rotate(6 12 9)"
      />

      {/* Middle sheet */}
      <rect 
        x="5" 
        y="3" 
        width="11" 
        height="15" 
        rx="1.5" 
        fill="url(#sheetGrad2)" 
        stroke="#94a3b8" 
        strokeWidth="1"
        transform="rotate(-4 10 11)"
      />

      {/* Frontmost sheet (Main Exam) */}
      <rect 
        x="3" 
        y="4" 
        width="12" 
        height="16" 
        rx="1.5" 
        fill="#ffffff" 
        stroke="#0284c7" 
        strokeWidth="1.5"
      />

      {/* Title */}
      <line x1="5.5" y1="7" x2="10" y2="7" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Question lines */}
      <line x1="5.5" y1="10" x2="12" y2="10" stroke="#64748b" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="5.5" cy="12.5" r="0.75" fill="#22c55e" />
      <line x1="7.5" y1="12.5" x2="11" y2="12.5" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />

      <line x1="5.5" y1="15" x2="12" y2="15" stroke="#64748b" strokeWidth="0.8" strokeLinecap="round" />

      {/* Big green check/A+ mark badge */}
      <g transform="translate(10.5, 12)">
        <circle cx="4" cy="4" r="3.5" fill="#f0fdf4" stroke="#22c55e" strokeWidth="0.8" />
        <path d="M2.5 4l1 1 2-2" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
};

interface HeaderProps {
    onRunTest?: () => void;
    isTesting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRunTest, isTesting }) => {
  return (
    <header className="relative text-center">
      <div className="absolute top-0 right-0 hidden md:block">
        {onRunTest && (
            <button 
                onClick={onRunTest}
                disabled={isTesting}
                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-sky-600 transition-colors bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200"
            >
                {isTesting ? <span className="animate-pulse">Test Çalışıyor...</span> : 'Sistem Testi Başlat'}
            </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <ExamPapersStackIcon className="w-10 h-10 text-sky-500" />
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Sınav Analizi</h1>
      </div>
      <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
        Bir sınav kağıdı veya belge fotoğrafı yükleyin. Gemini, içeriği analiz edip verileri sizin için yapılandırsın.
      </p>
    </header>
  );
};
