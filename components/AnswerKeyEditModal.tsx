
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';

interface AnswerKeyEditModalProps {
    answerKey: string[];
    imageUrl: string;
    onClose: () => void;
    onSave: (updatedKey: string[]) => void;
}

export const AnswerKeyEditModal: React.FC<AnswerKeyEditModalProps> = ({ answerKey, imageUrl, onClose, onSave }) => {
    const [editedKey, setEditedKey] = useState<string[]>(answerKey);

    useEffect(() => {
        setEditedKey(answerKey);
    }, [answerKey]);
    
    const handleAnswerChange = (index: number, value: string) => {
        const newKey = [...editedKey];
        newKey[index] = value.toUpperCase();
        setEditedKey(newKey);
    };

    const handleSave = () => {
        onSave(editedKey);
    };
    
    const answerChunks: string[][] = [];
    for (let i = 0; i < editedKey.length; i += 10) {
        answerChunks.push(editedKey.slice(i, i + 10));
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
            aria-labelledby="edit-ak-modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white rounded-t-2xl sticky top-0">
                    <h2 id="edit-ak-modal-title" className="text-lg font-semibold text-slate-800">Cevap Anahtarını Düzenle</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        aria-label="Düzenleme panelini kapat"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image Column */}
                    <div className="flex flex-col space-y-2">
                         <h3 className="text-md font-semibold text-slate-600">Analiz Edilen Görüntü</h3>
                         <p className="text-xs text-slate-500 mb-2">Görüntünün analiz için kullanılan orijinal halidir.</p>
                        <div className="bg-slate-200 rounded-lg p-2 border border-slate-300 overflow-hidden">
                            <img 
                                src={imageUrl} 
                                alt="İşlenmiş cevap anahtarı" 
                                className="w-full h-auto object-contain rounded-md"
                            />
                        </div>
                    </div>
                    {/* Form Column */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-md font-semibold text-slate-600">Çıkarılan Cevaplar</h3>
                        <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-2 max-h-[50vh] lg:max-h-none">
                            {answerChunks.map((chunk, chunkIndex) => (
                                <div key={chunkIndex} className="flex flex-col space-y-3 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                                    {chunk.map((answer, answerIndex) => {
                                        const originalIndex = chunkIndex * 10 + answerIndex;
                                        const currentAnswer = (answer || '').trim().toUpperCase();
                                        return (
                                            <div key={originalIndex} className="flex items-center space-x-3 h-8">
                                                <span className="w-6 text-right text-xs font-bold text-slate-400">
                                                    {originalIndex + 1}.
                                                </span>
                                                <div className="flex items-center space-x-1.5">
                                                    {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                                                        const isSelected = currentAnswer === opt;
                                                        return (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => handleAnswerChange(originalIndex, isSelected ? '' : opt)}
                                                                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm scale-110'
                                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-400'
                                                                }`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAnswerChange(originalIndex, '')}
                                                        title="Temizle"
                                                        className={`w-7 h-7 text-xs font-medium flex items-center justify-center transition-colors rounded-lg border ${
                                                            currentAnswer === ''
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                                                        }`}
                                                    >
                                                        Boş
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-100 rounded-b-2xl sticky bottom-0">
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        >
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};