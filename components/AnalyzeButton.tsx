
import React from 'react';
import { SparklesIcon, LoadingSpinnerIcon } from './icons';

interface AnalyzeButtonProps {
    onClick: () => void;
    disabled: boolean;
    isLoading: boolean;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({ onClick, disabled, isLoading }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white bg-sky-600 rounded-full shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
            {isLoading ? (
                <>
                    <LoadingSpinnerIcon className="w-5 h-5"/>
                    <span>Analiz Ediliyor...</span>
                </>
            ) : (
                <>
                    <SparklesIcon className="w-5 h-5" />
                    <span>Analizi Başlat</span>
                </>
            )}
        </button>
    );
};