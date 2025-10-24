
import React, { useState, useCallback, useEffect } from 'react';
import { analyzeAnswerKey, analyzeStudentPaper, extractStudentData } from './services/geminiService';
import type { ExamData } from './types';
import { Dropzone } from './components/Dropzone';
import { ImagePreview } from './components/ImagePreview';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Header } from './components/Header';
import { AnalyzeButton } from './components/AnalyzeButton';
import { AnswerKeyDropzone } from './components/AnswerKeyDropzone';
import { AnswerKeyDisplay } from './components/AnswerKeyDisplay';

interface UploadedFile {
  id: string;
  file: File;
  url: string;
}

export type AnalyzedResult = ExamData & { id: string; fileId: string };

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [answerKeyFile, setAnswerKeyFile] = useState<UploadedFile | null>(null);
  const [isAnswerKeyAnalysis, setIsAnswerKeyAnalysis] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalyzedResult[]>([]);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [consensusKey, setConsensusKey] = useState<string[] | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  useEffect(() => {
    if (!isAnswerKeyAnalysis) {
      setConsensusKey(null);
      setAnswerKeyFile(null);
    }
  }, [isAnswerKeyAnalysis]);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    const newFiles = selectedFiles.map(file => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      file,
      url: URL.createObjectURL(file),
    }));
    
    setFiles(prevFiles => {
      const existingIds = new Set(prevFiles.map(f => f.id));
      const trulyNewFiles = newFiles.filter(nf => !existingIds.has(nf.id));
      return [...prevFiles, ...trulyNewFiles];
    });

    setError(null);
  }, []);
  
  const handleAnswerKeySelect = useCallback((selectedFile: File) => {
    if (answerKeyFile) {
        URL.revokeObjectURL(answerKeyFile.url);
    }
    setAnswerKeyFile({
      id: `${selectedFile.name}-${selectedFile.lastModified}-${selectedFile.size}`,
      file: selectedFile,
      url: URL.createObjectURL(selectedFile),
    });
    setError(null);
  }, [answerKeyFile]);

  const handleFileClear = useCallback((fileIdToRemove: string) => {
    setFiles(prevFiles => {
      const fileToRemove = prevFiles.find(f => f.id === fileIdToRemove);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prevFiles.filter(f => f.id !== fileIdToRemove);
    });
    setAnalysisResults(prevResults => prevResults.filter(r => r.fileId !== fileIdToRemove));
  }, []);

  const handleAnswerKeyClear = useCallback(() => {
    if (answerKeyFile) {
      URL.revokeObjectURL(answerKeyFile.url);
    }
    setAnswerKeyFile(null);
    setConsensusKey(null);
  }, [answerKeyFile]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            resolve(base64data);
        };
        reader.onerror = () => {
            reject(new Error(`'${file.name}' dosyası okunamadı.`));
        };
        reader.readAsDataURL(file);
    });
  };

  const handleAnalyzeClick = async () => {
    if (files.length === 0 || (isAnswerKeyAnalysis && !answerKeyFile)) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResults([]);
    setSelectedResultIds(new Set());
    setConsensusKey(null);
    setProgress({ current: 0, total: files.length, message: '' });

    try {
      if (isAnswerKeyAnalysis && answerKeyFile) {
        // --- Answer Key Analysis Mode ---
        setProgress(prev => ({ ...prev, message: 'Cevap anahtarı analiz ediliyor...' }));
        const answerKeyBase64 = await fileToBase64(answerKeyFile.file);
        const key = await analyzeAnswerKey(answerKeyBase64, questionCount);
        setConsensusKey(key);

        const results: AnalyzedResult[] = [];
        for (const [index, file] of files.entries()) {
          setProgress(prev => ({ ...prev, current: index + 1, message: `Öğrenci kağıdı ${index + 1} işleniyor...`}));
          const studentPaperBase64 = await fileToBase64(file.file);
          const resultData = await analyzeStudentPaper(studentPaperBase64, file.file.type, questionCount, key);
          const resultsWithIds = {
            ...resultData,
            id: crypto.randomUUID(),
            fileId: file.id,
          };
          results.push(resultsWithIds);
          setAnalysisResults([...results]);
        }
      } else {
        // --- Standard Analysis Mode ---
        const results: AnalyzedResult[] = [];
        for (const [index, file] of files.entries()) {
          setProgress(prev => ({ ...prev, current: index + 1, message: `Dosya ${index + 1} işleniyor...`}));
          const studentPaperBase64 = await fileToBase64(file.file);
          const resultData = await extractStudentData(studentPaperBase64, file.file.type, questionCount);
          const resultsWithIds = resultData.map(data => ({
              ...data,
              id: crypto.randomUUID(),
              fileId: file.id,
          }));
          results.push(...resultsWithIds);
          setAnalysisResults([...results]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Analiz sırasında bilinmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleSelectionChange = useCallback((resultId: string) => {
    setSelectedResultIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(resultId)) {
            newSet.delete(resultId);
        } else {
            newSet.add(resultId);
        }
        return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((select: boolean) => {
    if (select) {
        const allIds = new Set(analysisResults.map(r => r.id));
        setSelectedResultIds(allIds);
    } else {
        setSelectedResultIds(new Set());
    }
  }, [analysisResults]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <Header />
        <main className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-4 lg:col-span-1">
              <Dropzone onFileSelect={handleFileSelect} />
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-sm font-semibold text-slate-600">Yüklenen Öğrenci Kağıtları</h3>
                    <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">{files.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {files.map(file => (
                          <ImagePreview key={file.id} imageUrl={file.url} fileName={file.file.name} onClear={() => handleFileClear(file.id)} />
                      ))}
                  </div>
                </div>
              )}
               <div className="space-y-4">
                 <div className="space-y-2">
                    <label htmlFor="question-count" className="block text-sm font-medium text-slate-700">
                    Soru Sayısı
                    </label>
                    <select
                    id="question-count"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    disabled={isLoading}
                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-50"
                    >
                    {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                    </select>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="answer-key-analysis"
                            checked={isAnswerKeyAnalysis}
                            onChange={(e) => setIsAnswerKeyAnalysis(e.target.checked)}
                            disabled={isLoading}
                            className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                        />
                        <label htmlFor="answer-key-analysis" className="text-sm font-medium text-slate-700">
                            Cevap Anahtarı Analizi
                        </label>
                    </div>
                    {isAnswerKeyAnalysis && (
                        answerKeyFile ? (
                           <ImagePreview imageUrl={answerKeyFile.url} fileName={answerKeyFile.file.name} onClear={handleAnswerKeyClear} />
                        ) : (
                           <AnswerKeyDropzone onFileSelect={handleAnswerKeySelect} disabled={!isAnswerKeyAnalysis || isLoading}/>
                        )
                    )}
                </div>
                 <AnalyzeButton 
                    onClick={handleAnalyzeClick} 
                    disabled={files.length === 0 || isLoading || (isAnswerKeyAnalysis && !answerKeyFile)} 
                    isLoading={isLoading} 
                />
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 min-h-[500px] flex flex-col lg:col-span-2">
              <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-3">Analiz Sonuçları</h2>
              {consensusKey && <AnswerKeyDisplay answerKey={consensusKey} />}
              <ResultsDisplay
                results={analysisResults}
                isLoading={isLoading}
                error={error}
                selectedIds={selectedResultIds}
                onSelectionChange={handleSelectionChange}
                onSelectAll={handleSelectAll}
                progress={progress}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
