
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
      className={`relative flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-2xl transition-all duration-300 ${
        disabled 
        ? 'border-slate-700 bg-slate-800/40 opacity-50 cursor-not-allowed' 
        : 'border-accent/30 bg-gradient-to-b from-accent/5 to-transparent hover:border-accent hover:bg-accent/10 cursor-pointer'
      } bg-[#1E293B]`}
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
        <KeyIcon className={`w-7 h-7 mb-2 ${disabled ? 'text-slate-600' : 'text-accent'}`} />
        <div className={`font-mono text-xs uppercase tracking-widest ${disabled ? 'text-slate-500' : 'text-accent'}`}>
          [ CEVAP ANAHTARI SEÇİN ]
        </div>
        <p className={`text-xs mt-1 ${disabled ? 'text-slate-500' : 'text-slate-300'}`}>
          PNG veya JPEG dosyası yükleyin
        </p>
      </div>
       {error && <p className="mt-2 text-xs font-mono text-rose-400">{error}</p>}
    </div>
  );
};
