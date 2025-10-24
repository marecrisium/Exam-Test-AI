
import React from 'react';
import { XCircleIcon } from './icons';

interface ImagePreviewProps {
  imageUrl: string;
  fileName: string;
  onClear: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, fileName, onClear }) => {
  return (
    <div className="relative w-full group flex items-center p-1.5 bg-slate-100 border border-slate-200 rounded-lg gap-2">
      <img
        src={imageUrl}
        alt="Yüklenen önizleme"
        className="object-cover w-12 h-12 rounded-md bg-slate-200"
      />
      <p className="text-sm text-slate-700 font-medium truncate flex-1" title={fileName}>
        {fileName}
      </p>
      <button
        onClick={onClear}
        className="bg-white rounded-full p-1 text-slate-500 hover:text-red-500 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        aria-label="Resmi kaldır"
      >
        <XCircleIcon className="w-6 h-6" />
      </button>
    </div>
  );
};
