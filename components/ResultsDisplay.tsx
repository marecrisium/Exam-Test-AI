import React, { useState, useMemo } from 'react';
import { utils, writeFile } from 'xlsx';
import type { AnalyzedResult } from '../App';
import { DownloadIcon, CheckIcon, LoadingSpinnerIcon, PencilIcon } from './icons';

interface ResultsDisplayProps {
  results: AnalyzedResult[];
  isLoading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  onSelectionChange: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onEdit: (id: string) => void;
  progress: { current: number; total: number; message: string };
}

type StaticColumnConfig = {
    [key: string]: {
        label: string;
        selected: boolean;
    };
};

type ScoresColumnConfig = {
    label: string;
    selected: boolean;
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error, selectedIds, onSelectionChange, onSelectAll, onEdit, progress }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const [staticColumns, setStaticColumns] = useState<StaticColumnConfig>({
      studentName: { label: 'Öğrenci Adı', selected: true },
      studentNumber: { label: 'Öğrenci Numarası', selected: true },
      subject: { label: 'Ders', selected: true },
      totalScore: { label: 'Toplam Puan', selected: true },
  });

  const [scoresColumn, setScoresColumn] = useState<ScoresColumnConfig>({
      label: 'Cevap',
      selected: true,
  });

  const maxScores = useMemo(() => {
    if (!results || results.length === 0) return 0;
    return Math.max(0, ...results.map(r => r.scores.length));
  }, [results]);

  const stats = useMemo(() => {
    if (!results || results.length === 0) return { mean: 0, max: 0, min: 0 };
    const scores = results.map(r => Number(Math.max(0, r.scores.reduce((sum, s) => sum + s, 0)).toFixed(2)));
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const mean = Number((sum / scores.length).toFixed(2));
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    return { mean, max, min };
  }, [results]);

  const { absoluteMax, absoluteMin, hasMultipleDistinct } = useMemo(() => {
    if (!results || results.length === 0) return { absoluteMax: 0, absoluteMin: 0, hasMultipleDistinct: false };
    const scores = results.map(r => Number(Math.max(0, r.scores.reduce((sum, s) => sum + s, 0)).toFixed(2)));
    const maxVal = Math.max(...scores);
    const minVal = Math.min(...scores);
    return {
      absoluteMax: maxVal,
      absoluteMin: minVal,
      hasMultipleDistinct: results.length > 1 && maxVal !== minVal
    };
  }, [results]);

  // FIX: Use a type-safe update for static columns to prevent type errors.
  const handleStaticColumnChange = (key: string, field: 'label' | 'selected', value: string | boolean) => {
    setStaticColumns(prev => {
        const newConfig = { ...prev[key] };
        if (field === 'label' && typeof value === 'string') {
            newConfig.label = value;
        } else if (field === 'selected' && typeof value === 'boolean') {
            newConfig.selected = value;
        }
        return {
            ...prev,
            [key]: newConfig,
        };
    });
  };
  
  // FIX: Use a type-safe update for scores column to prevent type errors.
  const handleScoresColumnChange = (field: 'label' | 'selected', value: string | boolean) => {
      setScoresColumn(prev => {
          const newConfig = { ...prev };
          if (field === 'label' && typeof value === 'string') {
            newConfig.label = value;
          } else if (field === 'selected' && typeof value === 'boolean') {
            newConfig.selected = value;
          }
          return newConfig;
      });
  };
  
  const handleExport = () => {
    if (!results || selectedIds.size === 0) return;

    const selectedResults = results.filter(r => selectedIds.has(r.id));
    
    // FIX: Replaced Object.entries with Object.keys to ensure proper type inference for config properties.
    const activeStaticColumnKeys = Object.keys(staticColumns).filter((key) => staticColumns[key].selected);
    
    let headers = activeStaticColumnKeys.map((key) => staticColumns[key].label);
    if (scoresColumn.selected) {
        for (let i = 0; i < maxScores; i++) {
            headers.push(`${scoresColumn.label} ${i + 1}`);
        }
    }
    
    const data = selectedResults.map(item => {
        // FIX: Use activeStaticColumnKeys from above.
        const row: (string | number)[] = activeStaticColumnKeys.map((key) => {
            switch (key) {
                case 'studentName': return item.studentName;
                case 'studentNumber': return item.studentNumber;
                case 'subject': return item.subject;
                case 'totalScore': return Number(Math.max(0, item.scores.reduce((sum, score) => sum + score, 0)).toFixed(2));
                default: return '';
            }
        });
        if (scoresColumn.selected) {
            for (let i = 0; i < maxScores; i++) {
                const score = item.scores[i];
                if (score !== undefined) {
                    row.push(Number(score.toFixed(2)));
                } else {
                    row.push(0);
                }
            }
        }
        return row;
    });

    // Calculate stats for exported students
    const exportedScores = selectedResults.map(r => Number(Math.max(0, r.scores.reduce((sum, s) => sum + s, 0)).toFixed(2)));
    const exportedSum = exportedScores.reduce((acc, curr) => acc + curr, 0);
    const exportedMean = exportedScores.length > 0 ? Number((exportedSum / exportedScores.length).toFixed(2)) : 0;
    const exportedMax = exportedScores.length > 0 ? Math.max(...exportedScores) : 0;
    const exportedMin = exportedScores.length > 0 ? Math.min(...exportedScores) : 0;

    const totalScoreIndex = activeStaticColumnKeys.indexOf('totalScore');

    const emptyRow: string[] = [];
    
    const statsRowMean = Array(headers.length).fill('');
    statsRowMean[0] = 'Ortalama Puan';
    if (totalScoreIndex !== -1) {
        statsRowMean[totalScoreIndex] = exportedMean;
    } else {
        statsRowMean[1] = exportedMean;
    }

    const statsRowMax = Array(headers.length).fill('');
    statsRowMax[0] = 'En Yüksek Puan';
    if (totalScoreIndex !== -1) {
        statsRowMax[totalScoreIndex] = exportedMax;
    } else {
        statsRowMax[1] = exportedMax;
    }

    const statsRowMin = Array(headers.length).fill('');
    statsRowMin[0] = 'En Düşük Puan';
    if (totalScoreIndex !== -1) {
        statsRowMin[totalScoreIndex] = exportedMin;
    } else {
        statsRowMin[1] = exportedMin;
    }
      
    const worksheetData = [
        headers, 
        ...data, 
        emptyRow, 
        statsRowMean, 
        statsRowMax, 
        statsRowMin
    ];
    const worksheet = utils.aoa_to_sheet(worksheetData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sınav Sonuçları');
    
    writeFile(workbook, 'sinav_analizi.xlsx');
    
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    return (
      <div className="flex flex-col items-center justify-center flex-grow text-center py-12">
        <LoadingSpinnerIcon className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="mt-4 text-slate-200 font-medium">{progress.message || 'Görüntüler analiz ediliyor...'}</p>
        {progress.total > 1 && (
            <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 mt-4 border border-slate-700/50 overflow-hidden">
                <div className="bg-accent h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        )}
        <p className="text-xs font-mono text-slate-400 mt-3">
            {progress.total > 1 ? `${progress.current} / ${progress.total} DOSYA TAMAMLANDI` : 'BU İŞLEM BİRAZ ZAMAN ALABİLİR.'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-grow text-center py-12">
        <div className="bg-rose-950/20 border border-rose-500/30 text-rose-200 p-6 rounded-xl max-w-md">
          <p className="font-syne font-extrabold uppercase text-sm tracking-wider text-rose-400 mb-2">[ SİSTEM HATASI ]</p>
          <p className="text-sm font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow text-center py-12 px-6">
        <p className="font-mono text-xs text-accent opacity-50 uppercase tracking-widest mb-3">[ BEKLEME MODU ]</p>
        <p className="text-sm text-slate-300 max-w-sm">İşlemi başlatmak için sol panelden sınav kağıtlarını yükleyip analizi tetikleyin.</p>
      </div>
    );
  }
  
  // FIX: Use Object.keys to avoid issues with Object.entries typing.
  const staticColumnKeys = Object.keys(staticColumns);

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex-grow overflow-auto">
        <div className="bg-[#1E293B] border border-slate-700/50 p-5 rounded-xl space-y-4 mb-6">
            <h3 className="text-xs font-syne font-extrabold uppercase tracking-widest text-[#F8FAFC]">[ Excel Sütun Başlıkları ]</h3>
            <p className="text-xs text-slate-300">Dışa aktarılacak Excel dosyasındaki sütunları seçip başlıklarını düzenleyebilirsiniz.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 text-sm">
                {/* FIX: Use Object.keys to avoid issues with Object.entries typing. */}
                {staticColumnKeys.map((key) => {
                     const config = staticColumns[key];
                     return (
                     <div key={key}>
                        <div className="flex items-center mb-1.5 space-x-2">
                           <input
                                type="checkbox"
                                id={`${key}-checkbox`}
                                checked={config.selected}
                                onChange={(e) => handleStaticColumnChange(key, 'selected', e.target.checked)}
                                className="w-4 h-4 text-accent bg-[#0F172A] border-slate-700 rounded focus:ring-accent focus:ring-offset-[#1E293B] shrink-0"
                            />
                            <label htmlFor={`${key}-input`} className="block text-xs font-mono font-bold text-accent/80 uppercase truncate">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                        </div>
                        <input
                            type="text"
                            id={`${key}-input`}
                            value={config.label}
                            onChange={(e) => handleStaticColumnChange(key, 'label', e.target.value)}
                            className="block w-full px-3 py-1.5 border border-slate-700 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-xs bg-[#0F172A] text-slate-100 font-medium"
                        />
                    </div>
                );
                })}
                {maxScores > 0 && (
                     <div>
                        <div className="flex items-center mb-1.5 space-x-2">
                           <input
                                type="checkbox"
                                id="scores-checkbox"
                                checked={scoresColumn.selected}
                                onChange={(e) => handleScoresColumnChange('selected', e.target.checked)}
                                className="w-4 h-4 text-accent bg-[#0F172A] border-slate-700 rounded focus:ring-accent focus:ring-offset-[#1E293B] shrink-0"
                            />
                            <label htmlFor="scores-input" className="block text-xs font-mono font-bold text-accent/80 uppercase truncate">
                                Cevaplar
                            </label>
                        </div>
                        <input
                            type="text"
                            id="scores-input"
                            value={scoresColumn.label}
                            onChange={(e) => handleScoresColumnChange('label', e.target.value)}
                            className="block w-full px-3 py-1.5 border border-slate-700 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-xs bg-[#0F172A] text-slate-100 font-medium"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Sınav İstatistikleri */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700/50 shadow-xs flex flex-col justify-center">
                <span className="text-[10px] font-mono font-bold text-accent/80 uppercase tracking-widest">Ortalama Puan</span>
                <span className="text-2xl font-syne font-extrabold text-[#F8FAFC] mt-1">{stats.mean}</span>
            </div>
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 shadow-xs flex flex-col justify-center">
                <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">En Yüksek Puan</span>
                </div>
                <span className="text-2xl font-syne font-extrabold text-emerald-400 mt-1">{stats.max}</span>
            </div>
            <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-500/20 shadow-xs flex flex-col justify-center">
                <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">En Düşük Puan</span>
                </div>
                <span className="text-2xl font-syne font-extrabold text-rose-400 mt-1">{stats.min}</span>
            </div>
        </div>

        <div className="relative overflow-x-auto border border-slate-700/50 rounded-xl">
            <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-200 uppercase bg-[#1E293B] border-b border-slate-700/50 font-mono">
                    <tr>
                        <th scope="col" className="p-4 w-4">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 text-accent bg-[#0F172A] border-slate-700 rounded focus:ring-accent focus:ring-offset-[#1E293B]"
                                checked={results.length > 0 && selectedIds.size === results.length}
                                onChange={(e) => onSelectAll(e.target.checked)}
                            />
                        </th>
                        {/* FIX: Use Object.keys to avoid issues with Object.entries typing. */}
                        {staticColumnKeys.map((key) => {
                           const config = staticColumns[key];
                           return config.selected && <th key={key} scope="col" className="px-4 py-3 font-semibold">{config.label}</th>;
                        })}
                        {scoresColumn.selected && Array.from({ length: maxScores }).map((_, i) => (
                            <th key={`score-header-${i}`} scope="col" className="px-4 py-3 text-center font-semibold">{`${scoresColumn.label} ${i + 1}`}</th>
                        ))}
                        <th scope="col" className="px-4 py-3 text-center font-semibold">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((item) => {
                        const itemScore = Number(Math.max(0, item.scores.reduce((sum, s) => sum + s, 0)).toFixed(2));
                        const isMax = hasMultipleDistinct && itemScore === absoluteMax;
                        const isMin = hasMultipleDistinct && itemScore === absoluteMin;
                        
                        let rowClass = "bg-[#0F172A] border-b border-slate-800 hover:bg-slate-800/40 text-slate-100 transition-colors";
                        if (isMax) {
                            rowClass = "bg-emerald-950/25 hover:bg-emerald-950/35 border-b border-emerald-900/40 text-emerald-200 transition-colors";
                        } else if (isMin) {
                            rowClass = "bg-rose-950/25 hover:bg-rose-950/35 border-b border-rose-900/40 text-rose-200 transition-colors";
                        }
                        
                        return (
                            <tr key={item.id} className={rowClass}>
                                <td className="p-4 w-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-accent bg-[#0F172A] border-slate-700 rounded focus:ring-accent focus:ring-offset-[#1E293B]"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => onSelectionChange(item.id)}
                                    />
                                </td>
                                {/* FIX: Use Object.keys to avoid issues with Object.entries typing. */}
                                {staticColumnKeys.map((key) => {
                                    const config = staticColumns[key];
                                    if (!config.selected) return null;
                                    let content: string | number = '';
                                    switch (key) {
                                      case 'studentName': content = item.studentName; break;
                                      case 'studentNumber': content = item.studentNumber; break;
                                      case 'subject': content = item.subject; break;
                                      case 'totalScore': content = Number(Math.max(0, item.scores.reduce((sum, score) => sum + score, 0)).toFixed(2)); break;
                                    }
                                    return <td key={key} className="px-4 py-3 font-medium">{content}</td>;
                                })}
                                {scoresColumn.selected && Array.from({ length: maxScores }).map((_, i) => {
                                    const score = item.scores[i];
                                    const hasScore = score !== undefined;
                                    const studentAns = item.answers?.[i]?.trim() || '';
                                    
                                    if (!hasScore) {
                                        return (
                                            <td key={`score-cell-${i}`} className="px-4 py-3 font-mono text-center select-none text-xs text-slate-600">
                                                -
                                            </td>
                                        );
                                    }
                                    
                                    if (score > 0) {
                                        return (
                                            <td key={`score-cell-${i}`} className="px-4 py-3 font-mono text-center select-none text-sm text-emerald-400 font-extrabold" title={`Doğru (${score} Puan)`}>
                                                +{Number(score.toFixed(2))}
                                            </td>
                                        );
                                    } else if (score < 0) {
                                        return (
                                            <td key={`score-cell-${i}`} className="px-4 py-3 font-mono text-center select-none text-sm text-rose-400 font-bold" title={`Yanlış Ceza (${score} Puan)`}>
                                                {Number(score.toFixed(2))}
                                            </td>
                                        );
                                    } else {
                                        const isBlank = studentAns === '';
                                        return (
                                            <td key={`score-cell-${i}`} className={`px-4 py-3 font-mono text-center select-none text-sm ${isBlank ? 'text-slate-500 font-normal' : 'text-rose-400/70 font-semibold'}`} title={isBlank ? 'Boş (0 Puan)' : 'Yanlış (0 Puan)'}>
                                                {isBlank ? 'Boş' : '0'}
                                            </td>
                                        );
                                    }
                                })}
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onEdit(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-accent hover:bg-slate-800 rounded-lg transition-colors"
                                        aria-label="Sonucu Düzenle"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
       <div className="mt-5 pt-4 border-t border-slate-800">
         <button 
           onClick={handleExport}
           disabled={selectedIds.size === 0}
           className="w-full flex items-center justify-center gap-2 px-6 py-3.5 font-syne font-extrabold text-slate-900 bg-accent hover:bg-[#0ea5e9] disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200 uppercase rounded-lg tracking-wider"
         >
           {isCopied ? <CheckIcon className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5" />}
           {isCopied ? 'XLSX İndirildi!' : `Seçili (${selectedIds.size}) Sonucu İndir`}
         </button>
       </div>
    </div>
  );
};