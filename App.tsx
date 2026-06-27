
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import imageCompression from 'browser-image-compression';
import { analyzeAnswerKey, analyzeStudentPaper, extractStudentData } from './services/geminiService';
import type { ExamData } from './types';
import { Dropzone } from './components/Dropzone';
import { ImagePreview } from './components/ImagePreview';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Header } from './components/Header';
import { AnalyzeButton } from './components/AnalyzeButton';
import { AnswerKeyDropzone } from './components/AnswerKeyDropzone';
import { AnswerKeyDisplay } from './components/AnswerKeyDisplay';
import { HelpPanel } from './components/HelpPanel';
import { QuestionMarkCircleIcon } from './components/icons';
import { EditModal } from './components/EditModal';
import { AnswerKeyEditModal } from './components/AnswerKeyEditModal';
import { generateTestImage } from './utils/testGenerator';

interface UploadedFile {
  id: string;
  file: File;
  url: string;
}

export type AnalyzedResult = ExamData & { id: string; fileId: string; processedImageUrl: string; };

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [answerKeyFile, setAnswerKeyFile] = useState<UploadedFile | null>(null);
  const [isAnswerKeyAnalysis, setIsAnswerKeyAnalysis] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalyzedResult[]>([]);
  const [isPenaltyEnabled, setIsPenaltyEnabled] = useState<boolean>(false);
  const [penaltyRatio, setPenaltyRatio] = useState<number>(4);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [pointsPerQuestion, setPointsPerQuestion] = useState<string>("4");
  const [consensusKey, setConsensusKey] = useState<string[] | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<AnalyzedResult | null>(null);
  const [isAnswerKeyEditing, setIsAnswerKeyEditing] = useState<boolean>(false);
  const [processedAnswerKeyUrl, setProcessedAnswerKeyUrl] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const processedResults = useMemo(() => {
    const pts = parseFloat(pointsPerQuestion) || Number((100 / questionCount).toFixed(2));
    return analysisResults.map(result => {
      if (isAnswerKeyAnalysis && consensusKey && result.answers) {
        const computedScores = result.answers.map((studentAnswer, i) => {
          const correctAnswer = consensusKey[i] ? String(consensusKey[i]).trim().toUpperCase() : '';
          const trimmedStudentAnswer = studentAnswer ? String(studentAnswer).trim().toUpperCase() : '';
          
          if (!correctAnswer) return 0;
          
          if (trimmedStudentAnswer === correctAnswer) {
            return pts;
          } else if (trimmedStudentAnswer === '') {
            return 0;
          } else {
            if (isPenaltyEnabled && penaltyRatio > 0) {
              return -(pts / penaltyRatio);
            }
            return 0;
          }
        });
        return {
          ...result,
          scores: computedScores
        };
      }
      return result;
    });
  }, [analysisResults, isAnswerKeyAnalysis, consensusKey, pointsPerQuestion, isPenaltyEnabled, penaltyRatio, questionCount]);

  useEffect(() => {
    const defaultPoints = (100 / questionCount).toFixed(2).replace(/\.00$/, "");
    setPointsPerQuestion(defaultPoints);
  }, [questionCount]);

  useEffect(() => {
    if (!isAnswerKeyAnalysis) {
      setConsensusKey(null);
      setAnswerKeyFile(null);
      setProcessedAnswerKeyUrl(null);
    }
  }, [isAnswerKeyAnalysis]);

  useEffect(() => {
    const reAnalyzeAnswerKey = async () => {
        // Only re-analyze if we are in the correct mode, have a file, and a key already exists.
        // Also skip if we are in testing mode to avoid double triggering
        if (isAnswerKeyAnalysis && answerKeyFile && consensusKey && !isTesting) {
            // Check if the existing key's length matches the new question count. If not, re-run.
            if (consensusKey.length !== questionCount) {
                console.log(`Soru sayısı değişti. Cevap anahtarı ${questionCount} soru için yeniden analiz ediliyor...`);
                setIsLoading(true);
                setProgress(prev => ({ ...prev, message: 'Soru sayısı değişti, cevap anahtarı yeniden analiz ediliyor...' }));
                try {
                    const { base64, dataUrl } = await fileToBase64(answerKeyFile.file);
                    const newKey = await analyzeAnswerKey(base64, answerKeyFile.file.type, questionCount);
                    setConsensusKey(newKey);
                    setProcessedAnswerKeyUrl(dataUrl);
                } catch (err) {
                     setError(err instanceof Error ? err.message : 'Cevap anahtarı yeniden analiz edilirken bir hata oluştu.');
                     setConsensusKey(null); // Clear the old key on error
                } finally {
                    setIsLoading(false);
                    setProgress({ current: 0, total: 0, message: '' });
                }
            }
        }
    };
    
    reAnalyzeAnswerKey();
  }, [questionCount, isAnswerKeyAnalysis, answerKeyFile, consensusKey, isTesting]);


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
    setConsensusKey(null);
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
    setProcessedAnswerKeyUrl(null);
  }, [answerKeyFile]);

   const fileToBase64 = async (file: File): Promise<{ base64: string; dataUrl: string; }> => {
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      try {
        console.log(`Görsel sıkıştırılıyor: ${file.name}, orijinal boyut: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.85
        };
        processedFile = await imageCompression(file, options);
        console.log(`Sıkıştırma tamamlandı: ${processedFile.name}, yeni boyut: ${(processedFile.size / 1024 / 1024).toFixed(2)} MB`);
      } catch (err) {
        console.error("Görsel sıkıştırma hatası:", err);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (!dataUrl) {
            return reject(new Error(`'${file.name}' dosyasından veri URL'si alınamadı.`));
        }
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, dataUrl });
      };
      reader.onerror = (error) => {
        console.error("FileReader hatası:", error);
        reject(new Error(`'${file.name}' dosyası okunamadı.`));
      };
      reader.readAsDataURL(processedFile);
    });
  };

  const handleAnalyzeClick = async () => {
    if (files.length === 0 || (isAnswerKeyAnalysis && !answerKeyFile)) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResults([]);
    setSelectedResultIds(new Set());
    setProgress({ current: 0, total: files.length, message: '' });

    try {
      if (isAnswerKeyAnalysis && answerKeyFile) {
        // --- Answer Key Analysis Mode with Caching ---
        let keyToUse: string[];

        if (consensusKey && consensusKey.length === questionCount) {
            setProgress(prev => ({ ...prev, message: 'Mevcut cevap anahtarı kullanılıyor...' }));
            keyToUse = consensusKey;
        } else {
            setProgress(prev => ({ ...prev, message: 'Cevap anahtarı analiz ediliyor...' }));
            const { base64: answerKeyBase64, dataUrl } = await fileToBase64(answerKeyFile.file);
            const newKey = await analyzeAnswerKey(answerKeyBase64, answerKeyFile.file.type, questionCount);
            setConsensusKey(newKey);
            setProcessedAnswerKeyUrl(dataUrl);
            keyToUse = newKey;
        }

        const results: AnalyzedResult[] = [];
        const pts = parseFloat(pointsPerQuestion) || Number((100 / questionCount).toFixed(2));
        for (const [index, file] of files.entries()) {
          setProgress(prev => ({ ...prev, current: index + 1, message: `Öğrenci kağıdı ${index + 1} işleniyor...`}));
          const { base64: studentPaperBase64, dataUrl: processedImageUrl } = await fileToBase64(file.file);
          const resultData = await analyzeStudentPaper(studentPaperBase64, file.file.type, questionCount, keyToUse, pts);
          const resultsWithIds = {
            ...resultData,
            id: crypto.randomUUID(),
            fileId: file.id,
            processedImageUrl: processedImageUrl
          };
          results.push(resultsWithIds);
          setAnalysisResults([...results]);
        }
      } else {
        // --- Standard Analysis Mode ---
        const results: AnalyzedResult[] = [];
        for (const [index, file] of files.entries()) {
          setProgress(prev => ({ ...prev, current: index + 1, message: `Dosya ${index + 1} işleniyor...`}));
          const { base64: studentPaperBase64, dataUrl: processedImageUrl } = await fileToBase64(file.file);
          const resultData = await extractStudentData(studentPaperBase64, file.file.type, questionCount);
          const resultsWithIds = {
              ...resultData,
              id: crypto.randomUUID(),
              fileId: file.id,
              processedImageUrl: processedImageUrl
          };
          results.push(resultsWithIds);
          setAnalysisResults([...results]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Analiz sırasında bilinmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0, message: '' });
      setIsTesting(false);
    }
  };

  const handleSystemTest = async () => {
      if (isLoading) return;
      setIsTesting(true);
      setIsLoading(true);
      setError(null);
      setAnalysisResults([]);
      setFiles([]);
      setAnswerKeyFile(null);
      setConsensusKey(null);
      setIsAnswerKeyAnalysis(true);
      
      const TEST_QUESTION_COUNT = 30; // 30 questions
      setQuestionCount(TEST_QUESTION_COUNT);
      setProgress({ current: 0, total: 0, message: 'Test verileri oluşturuluyor...' });

      try {
          // 1. Generate Fake Answer Key
          const fakeAnswerKey = await generateTestImage('answerKey', TEST_QUESTION_COUNT);
          
          // 2. Generate 10 Fake Students with different names
          const mockStudents = [
              { name: "Ahmet Yılmaz", no: "101" },
              { name: "Ayşe Demir", no: "102" },
              { name: "Mehmet Öz", no: "103" },
              { name: "Fatma Kaya", no: "104" },
              { name: "Ali Can", no: "105" },
              { name: "Zeynep Şahin", no: "106" },
              { name: "Mustafa Çelik", no: "107" },
              { name: "Elif Yıldız", no: "108" },
              { name: "Burak Arslan", no: "109" },
              { name: "Selin Aydın", no: "110" }
          ];

          const studentFilesPromises = mockStudents.map(async (student, i) => {
              const file = await generateTestImage('student', TEST_QUESTION_COUNT, student.name, student.no);
              return {
                  id: `test-student-${i}`,
                  file: file,
                  url: URL.createObjectURL(file)
              };
          });

          const generatedStudentFiles = await Promise.all(studentFilesPromises);


          // 3. Set UI State (Visual Feedback)
          const akObj = {
              id: 'test-ak',
              file: fakeAnswerKey,
              url: URL.createObjectURL(fakeAnswerKey)
          };
          setAnswerKeyFile(akObj);
          setFiles(generatedStudentFiles);

          // 4. Trigger Logic Programmatically 
          
          // Step 4a: Analyze Answer Key
          setProgress({ current: 0, total: generatedStudentFiles.length + 1, message: 'Test: Cevap anahtarı analiz ediliyor...' });
          const { base64: akBase64, dataUrl: akDataUrl } = await fileToBase64(fakeAnswerKey);
          const newKey = await analyzeAnswerKey(akBase64, fakeAnswerKey.type, TEST_QUESTION_COUNT);
          setConsensusKey(newKey);
          setProcessedAnswerKeyUrl(akDataUrl);

          // Step 4b: Analyze Students
          const results: AnalyzedResult[] = [];
          for (const [index, file] of generatedStudentFiles.entries()) {
              setProgress(prev => ({ 
                  ...prev, 
                  current: index + 1, 
                  total: generatedStudentFiles.length,
                  message: `Test: Öğrenci kağıdı ${index + 1}/${generatedStudentFiles.length} analiz ediliyor...`
              }));
              
              const { base64: spBase64, dataUrl: spDataUrl } = await fileToBase64(file.file);
              const pts = parseFloat(pointsPerQuestion) || Number((100 / TEST_QUESTION_COUNT).toFixed(2));
              const resultData = await analyzeStudentPaper(spBase64, file.file.type, TEST_QUESTION_COUNT, newKey, pts);
              
              results.push({
                  ...resultData,
                  id: crypto.randomUUID(),
                  fileId: file.id,
                  processedImageUrl: spDataUrl
              });
              setAnalysisResults([...results]);
          }

      } catch (err) {
          setError(`Test Başarısız: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
      } finally {
          setIsLoading(false);
          setIsTesting(false);
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
        const allIds = new Set(processedResults.map(r => r.id));
        setSelectedResultIds(allIds);
    } else {
        setSelectedResultIds(new Set());
    }
  }, [processedResults]);

  const handleEditResult = (resultId: string) => {
    const resultToEdit = processedResults.find(r => r.id === resultId);
    if (resultToEdit) {
      setEditingResult(resultToEdit);
    }
  };
  
  const handleSaveChanges = (updatedResult: AnalyzedResult) => {
    let resultToSave = updatedResult;

    if (isAnswerKeyAnalysis && consensusKey && resultToSave.answers) {
        const pts = parseFloat(pointsPerQuestion) || Number((100 / consensusKey.length).toFixed(2));
        const newScores = resultToSave.answers.map((studentAnswer, i) => {
            const correctAnswer = consensusKey[i] ? String(consensusKey[i]).trim().toUpperCase() : '';
            const trimmedStudentAnswer = studentAnswer ? String(studentAnswer).trim().toUpperCase() : '';
            if (trimmedStudentAnswer && correctAnswer && trimmedStudentAnswer === correctAnswer) {
                return pts;
            }
            return 0;
        });
        resultToSave = { ...resultToSave, scores: newScores };
    }

    setAnalysisResults(prevResults => 
      prevResults.map(r => (r.id === resultToSave.id ? resultToSave : r))
    );
    setEditingResult(null);
  };

  const handleAnswerKeySave = (updatedKey: string[]) => {
    setConsensusKey(updatedKey);
    setIsAnswerKeyEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col">
        <Header onRunTest={handleSystemTest} isTesting={isTesting} />
        <main className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="flex flex-col space-y-5 lg:col-span-1">
              <Dropzone onFileSelect={handleFileSelect} />
              
              {files.length > 0 && (
                <div className="bg-[#1E293B] border border-slate-700/30 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider">Yüklenen Öğrenci Kağıtları</h3>
                    <span className="text-xs font-mono font-bold bg-[#0F172A] text-accent px-2.5 py-0.5 rounded-md border border-slate-700">{files.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {files.map(file => (
                          <ImagePreview key={file.id} imageUrl={file.url} fileName={file.file.name} onClear={() => handleFileClear(file.id)} />
                      ))}
                  </div>
                </div>
              )}

              <div className="bg-[#1E293B] border border-slate-700/30 p-5 rounded-xl space-y-4">
                <div className="font-mono text-accent text-xs mb-2 border-l-2 border-accent pl-2 uppercase tracking-widest font-bold">Parametreler</div>
                <div className="space-y-1.5">
                    <label htmlFor="question-count" className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                      Soru Sayısı
                    </label>
                    <select
                      id="question-count"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      disabled={isLoading}
                      className="block w-full px-3 py-2 bg-[#0F172A] border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm text-[#F8FAFC] disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="points-per-question" className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                      Doğru Cevap Puanı
                    </label>
                    <input
                      type="text"
                      id="points-per-question"
                      value={pointsPerQuestion}
                      onChange={(e) => setPointsPerQuestion(e.target.value)}
                      disabled={isLoading}
                      placeholder="Örn: 4"
                      className="block w-full px-3 py-2 bg-[#0F172A] border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm text-[#F8FAFC] disabled:bg-slate-800 disabled:text-slate-500"
                    />
                </div>
                <div className="space-y-3 pt-1">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="answer-key-analysis"
                            checked={isAnswerKeyAnalysis}
                            onChange={(e) => setIsAnswerKeyAnalysis(e.target.checked)}
                            disabled={isLoading}
                            className="w-4 h-4 text-accent bg-[#0F172A] border-slate-700 rounded focus:ring-accent"
                        />
                        <label htmlFor="answer-key-analysis" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide select-none cursor-pointer">
                            Cevap Anahtarı Analizi
                        </label>
                    </div>
                    {isAnswerKeyAnalysis && (
                        answerKeyFile ? (
                           <div className="mt-2">
                             <ImagePreview imageUrl={answerKeyFile.url} fileName={answerKeyFile.file.name} onClear={handleAnswerKeyClear} />
                           </div>
                        ) : (
                           <AnswerKeyDropzone onFileSelect={handleAnswerKeySelect} disabled={!isAnswerKeyAnalysis || isLoading}/>
                        )
                    )}
                </div>

                {isAnswerKeyAnalysis && (
                    <div className="space-y-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="penalty-enabled"
                                checked={isPenaltyEnabled}
                                onChange={(e) => setIsPenaltyEnabled(e.target.checked)}
                                disabled={isLoading}
                                className="w-4 h-4 text-accent bg-[#0F172A] border-slate-700 rounded focus:ring-accent"
                            />
                            <label htmlFor="penalty-enabled" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide select-none cursor-pointer">
                                Yanlışlar Doğruları Götürsün
                            </label>
                        </div>
                        {isPenaltyEnabled && (
                            <div className="space-y-1.5 pl-6">
                                <label htmlFor="penalty-ratio" className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                                    Net Hesabı Oranı
                                </label>
                                <select
                                    id="penalty-ratio"
                                    value={penaltyRatio}
                                    onChange={(e) => setPenaltyRatio(Number(e.target.value))}
                                    disabled={isLoading}
                                    className="block w-full px-2 py-1.5 bg-[#0F172A] border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-xs text-[#F8FAFC] disabled:bg-slate-800 disabled:text-slate-500"
                                >
                                    <option value={3}>3 Yanlış 1 Doğruyu Götürür</option>
                                    <option value={4}>4 Yanlış 1 Doğruyu Götürür</option>
                                    <option value={5}>5 Yanlış 1 Doğruyu Götürür</option>
                                    <option value={2}>2 Yanlış 1 Doğruyu Götürür</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}
                <div className="pt-2">
                  <AnalyzeButton 
                    onClick={handleAnalyzeClick} 
                    disabled={files.length === 0 || isLoading || (isAnswerKeyAnalysis && !answerKeyFile)} 
                    isLoading={isLoading} 
                  />
                </div>
              </div>

              <div className="bg-[#1E293B] border border-slate-700/30 p-5 rounded-xl text-xs leading-relaxed flex-grow-0">
                <div className="font-mono text-accent text-[11px] mb-3 uppercase tracking-widest font-bold">[ HIZLI İPUÇLARI ]</div>
                <ul className="space-y-2 text-slate-300 font-medium">
                  <li>• Fotoğrafları tam tepeden çekin.</li>
                  <li>• İyi ışık analizi hızlandırır.</li>
                  <li>• Her karede bir öğrenci olsun.</li>
                </ul>
              </div>
            </aside>

            <main className="bg-[#1E293B] p-6 rounded-xl border border-slate-700/30 min-h-[calc(100vh-220px)] flex flex-col lg:col-span-3 overflow-auto relative">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #F8FAFC 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              <h2 className="text-xs font-syne font-extrabold uppercase tracking-widest text-[#F8FAFC] mb-4 border-b border-slate-700/40 pb-3 z-10">[ Analiz Sonuçları ]</h2>
              <div className="z-10 flex flex-col flex-grow">
                {consensusKey && <AnswerKeyDisplay answerKey={consensusKey} onEdit={() => setIsAnswerKeyEditing(true)} />}
                <ResultsDisplay
                  results={processedResults}
                  isLoading={isLoading}
                  error={error}
                  selectedIds={selectedResultIds}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  onEdit={handleEditResult}
                  progress={progress}
                />
              </div>
            </main>
          </div>
        </main>
      </div>
      <button
        onClick={() => setIsHelpPanelOpen(true)}
        className="fixed bottom-6 right-6 bg-sky-600 text-white p-3 rounded-full shadow-lg hover:bg-sky-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        aria-label="Yardımı aç"
      >
        <QuestionMarkCircleIcon className="w-8 h-8" />
      </button>
      <HelpPanel isOpen={isHelpPanelOpen} onClose={() => setIsHelpPanelOpen(false)} />
      {editingResult && (
        <EditModal 
            result={editingResult}
            onClose={() => setEditingResult(null)}
            onSave={handleSaveChanges}
            isAnswerKeyMode={isAnswerKeyAnalysis}
        />
      )}
      {isAnswerKeyEditing && consensusKey && processedAnswerKeyUrl && (
        <AnswerKeyEditModal
            answerKey={consensusKey}
            imageUrl={processedAnswerKeyUrl}
            onClose={() => setIsAnswerKeyEditing(false)}
            onSave={handleAnswerKeySave}
        />
      )}
    </div>
  );
};

export default App;
