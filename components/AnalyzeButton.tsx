
import React from 'react';
import { SparklesIcon, LoadingSpinnerIcon } from './icons';

interface AnalyzeButtonProps {
    onClick: () => void;
    disabled: boolean;
    isLoading: boolean;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({ onClick, disabled, isLoading }) => {
    return (
        <div className="flex justify-center w-full pt-2">
            <button
                onClick={onClick}
                disabled={disabled}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 font-syne font-extrabold text-slate-900 bg-accent hover:bg-[#0ea5e9] disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200 uppercase rounded-lg tracking-wider"
            >
                {isLoading ? (
                    <>
                        <LoadingSpinnerIcon className="w-5 h-5 animate-spin"/>
                        <span>Analiz Ediliyor...</span>
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        <span>Analizi Başlat</span>
                    </>
                )}
            </button>
        </div>
    );
};