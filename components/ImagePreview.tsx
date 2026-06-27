
import React from 'react';
import { XCircleIcon } from './icons';

interface ImagePreviewProps {
  imageUrl: string;
  fileName: string;
  onClear: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, fileName, onClear }) => {
  return (
    <div className="relative w-full group flex items-center p-2 bg-[#0F172A] border border-slate-700/50 rounded-lg gap-2">
      <img
        src={imageUrl}
        alt="Yüklenen önizleme"
        className="object-cover w-10 h-10 rounded bg-[#1E293B]"
      />
      <p className="text-xs text-slate-200 font-medium truncate flex-1" title={fileName}>
        {fileName}
      </p>
      <button
        onClick={onClear}
        className="bg-[#1E293B] rounded-lg p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all duration-200 focus:outline-none"
        aria-label="Resmi kaldır"
      >
        <XCircleIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
