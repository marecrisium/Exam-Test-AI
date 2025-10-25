import React from 'react';
import { SparklesIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="relative text-center">
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