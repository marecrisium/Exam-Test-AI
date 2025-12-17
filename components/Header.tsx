import React from 'react';
import { SparklesIcon, CheckIcon } from './icons';

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
        <SparklesIcon className="w-8 h-8 text-sky-500" />
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Sınav Analizi</h1>
      </div>
      <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
        Bir sınav kağıdı veya belge fotoğrafı yükleyin. Gemini, içeriği analiz edip verileri sizin için yapılandırsın.
      </p>
    </header>
  );
};
