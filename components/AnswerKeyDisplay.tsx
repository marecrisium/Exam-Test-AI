import React from 'react';
import { PencilIcon } from './icons';

interface AnswerKeyDisplayProps {
  answerKey: string[];
  onEdit: () => void;
}

export const AnswerKeyDisplay: React.FC<AnswerKeyDisplayProps> = ({ answerKey, onEdit }) => {
  return (
    <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
            <h3 className="text-md font-semibold text-sky-800">Doğrulanan Cevap Anahtarı</h3>
            <p className="text-xs text-sky-700">Öğrenci kağıtları bu cevaplara göre notlandırılacaktır.</p>
        </div>
        <button 
            onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-md transition-colors"
            aria-label="Cevap anahtarını düzenle"
        >
            <PencilIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 text-center">
        {answerKey.map((answer, index) => (
          <div key={index} className="bg-white rounded p-1.5 shadow-sm">
            <div className="text-xs font-bold text-slate-500">{index + 1}</div>
            <div className="text-sm font-mono font-semibold text-slate-800">{answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
};