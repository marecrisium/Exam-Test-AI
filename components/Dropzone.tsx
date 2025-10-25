
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
      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors duration-300 ${
        isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-100 hover:border-sky-400 hover:bg-sky-50'
      }`}
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
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
        <UploadIcon className="w-8 h-8 mb-3 text-slate-500" />
        <p className="mb-2 text-sm font-semibold text-slate-700">
            Dosyaları sürükleyip bırakın veya seçmek için tıklayın
        </p>
        <p className="text-sm text-slate-500">PNG veya JPEG (En fazla 20 adet)</p>
      </div>
      {error && <p className="absolute bottom-4 text-sm text-red-500">{error}</p>}
    </div>
  );
};
