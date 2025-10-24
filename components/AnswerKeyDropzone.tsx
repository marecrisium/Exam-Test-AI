
import React, { useState, useCallback, useRef } from 'react';
import { KeyIcon } from './icons';

interface AnswerKeyDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

export const AnswerKeyDropzone: React.FC<AnswerKeyDropzoneProps> = ({ onFileSelect, disabled }) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    
    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        setError('Lütfen sadece PNG veya JPEG formatında bir dosya seçin.');
        return;
    }
    
    setError(null);
    onFileSelect(file);
  }, [onFileSelect]);


  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]){
        handleFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if(disabled) return;
    if(e.dataTransfer.files && e.dataTransfer.files[0]){
        handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-2xl transition-colors duration-300 ${
        disabled 
        ? 'border-slate-200 bg-slate-100 cursor-not-allowed' 
        : 'border-slate-300 bg-slate-100 cursor-pointer hover:border-sky-400 hover:bg-sky-50'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center text-center">
        <KeyIcon className={`w-7 h-7 mb-2 ${disabled ? 'text-slate-400' : 'text-slate-500'}`} />
        <p className={`text-sm font-semibold ${disabled ? 'text-slate-500' : 'text-slate-700'}`}>
            Cevap Anahtarını Yükle
        </p>
      </div>
       {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};
