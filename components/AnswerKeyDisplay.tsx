
import React from 'react';

interface AnswerKeyDisplayProps {
  answerKey: string[];
}

export const AnswerKeyDisplay: React.FC<AnswerKeyDisplayProps> = ({ answerKey }) => {
  return (
    <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg mb-6">
      <h3 className="text-md font-semibold text-sky-800">Doğrulanan Cevap Anahtarı</h3>
      <p className="text-xs text-sky-700 mb-3">Öğrenci kağıtları bu cevaplara göre notlandırılacaktır.</p>
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
