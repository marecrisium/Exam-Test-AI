
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface DropzoneProps {
  onFileSelect: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    let fileArray = Array.from(files);
    let mainError: string | null = null;

    // Check for file count limit
    if (fileArray.length > 20) {
        mainError = "Tek seferde en fazla 20 dosya seçebilirsiniz.";
        fileArray = fileArray.slice(0, 20);
    }

    const acceptedFiles = fileArray.filter(
        file => file.type === 'image/png' || file.type === 'image/jpeg'
    );

    // Check for file type errors, only if a count error isn't already set
    if (acceptedFiles.length !== fileArray.length && !mainError) {
        mainError = 'Lütfen sadece PNG veya JPEG formatında dosyalar seçin.';
    }

    setError(mainError);

    if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles);
    }
  }, [onFileSelect]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  };


  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 p-6 ${
        isDragging ? 'border-accent bg-accent/20' : 'border-accent/30 bg-gradient-to-b from-accent/5 to-transparent hover:border-accent hover:bg-accent/10'
      } bg-[#1E293B]`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg"
        className="hidden"
        onChange={handleChange}
        multiple
      />
      <div className="flex flex-col items-center justify-center text-center">
        <UploadIcon className="w-8 h-8 mb-3 text-accent" />
        <div className="font-mono text-accent text-xs mb-2 uppercase tracking-widest">[ ÖĞRENCİ KAĞIDI YÜKLEME ]</div>
        <p className="text-sm font-semibold text-slate-100">
            Sürükleyip bırakın veya seçmek için tıklayın
        </p>
        <p className="text-xs text-slate-400 mt-1">PNG veya JPEG (En fazla 20 adet)</p>
      </div>
      {error && <p className="absolute bottom-4 text-xs font-mono text-rose-400">{error}</p>}
    </div>
  );
};
