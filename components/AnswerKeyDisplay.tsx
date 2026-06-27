import React from 'react';
import { PencilIcon } from './icons';

interface AnswerKeyDisplayProps {
  answerKey: string[];
  onEdit: () => void;
}

export const AnswerKeyDisplay: React.FC<AnswerKeyDisplayProps> = ({ answerKey, onEdit }) => {
  return (
    <div className="bg-[#1E293B] border border-accent/20 p-5 rounded-xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
            <h3 className="text-sm font-syne font-extrabold uppercase tracking-wider text-[#F8FAFC]">Doğrulanan Cevap Anahtarı</h3>
            <p className="text-xs text-slate-300 mt-1">Öğrenci kağıtları bu cevaplara göre notlandırılacaktır.</p>
        </div>
        <button 
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-accent hover:bg-slate-800 rounded-lg transition-all"
            aria-label="Cevap anahtarını düzenle"
        >
            <PencilIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 text-center">
        {answerKey.map((answer, index) => (
          <div key={index} className="bg-[#0F172A] border border-slate-700/50 rounded-lg p-2">
            <div className="text-[10px] font-mono font-bold text-accent/70">{index + 1}</div>
            <div className="text-sm font-mono font-bold text-[#F8FAFC] mt-0.5">{answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
};