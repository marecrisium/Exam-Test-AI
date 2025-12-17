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
                case 'totalScore': return Number(item.scores.reduce((sum, score) => sum + score, 0).toFixed(2));
                default: return '';
            }
        });
        if (scoresColumn.selected) {
            for (let i = 0; i < maxScores; i++) {
                row.push(item.scores[i] ?? '');
            }
        }
        return row;
    });
      
    const worksheetData = [headers, ...data];
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
      <div className="flex flex-col items-center justify-center flex-grow text-center">
        <LoadingSpinnerIcon className="w-12 h-12 text-sky-500" />
        <p className="mt-4 text-slate-600">{progress.message || 'Görüntüler analiz ediliyor...'}</p>
        {progress.total > 1 && (
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5 mt-4">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        )}
        <p className="text-sm text-slate-500 mt-2">
            {progress.total > 1 ? `${progress.current} / ${progress.total} dosya tamamlandı` : 'Bu işlem biraz zaman alabilir.'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-grow text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Bir Hata Oluştu</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center flex-grow text-center">
        <p className="text-slate-500">Sonuçları görmek için bir veya daha fazla resim yükleyin ve analizi başlatın.</p>
      </div>
    );
  }
  
  // FIX: Use Object.keys to avoid issues with Object.entries typing.
  const staticColumnKeys = Object.keys(staticColumns);

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex-grow overflow-auto">
        <div className="bg-slate-100 p-4 rounded-lg space-y-4 mb-6">
            <h3 className="text-md font-semibold text-slate-600">Excel Sütun Başlıkları</h3>
            <p className="text-xs text-slate-500">Dışa aktarılacak Excel dosyasındaki sütunları seçip başlıklarını düzenleyebilirsiniz.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 text-sm">
                {/* FIX: Use Object.keys to avoid issues with Object.entries typing. */}
                {staticColumnKeys.map((key) => {
                     const config = staticColumns[key];
                     return (
                     <div key={key}>
                        <div className="flex items-center mb-1 space-x-2">
                           <input
                                type="checkbox"
                                id={`${key}-checkbox`}
                                checked={config.selected}
                                onChange={(e) => handleStaticColumnChange(key, 'selected', e.target.checked)}
                                className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 shrink-0"
                            />
                            <label htmlFor={`${key}-input`} className="block text-xs font-medium text-slate-500 capitalize truncate">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                        </div>
                        <input
                            type="text"
                            id={`${key}-input`}
                            value={config.label}
                            onChange={(e) => handleStaticColumnChange(key, 'label', e.target.value)}
                            className="block w-full px-2 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white"
                        />
                    </div>
                );
                })}
                {maxScores > 0 && (
                     <div>
                        <div className="flex items-center mb-1 space-x-2">
                           <input
                                type="checkbox"
                                id="scores-checkbox"
                                checked={scoresColumn.selected}
                                onChange={(e) => handleScoresColumnChange('selected', e.target.checked)}
                                className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 shrink-0"
                            />
                            <label htmlFor="scores-input" className="block text-xs font-medium text-slate-500 capitalize truncate">
                                Cevaplar
                            </label>
                        </div>
                        <input
                            type="text"
                            id="scores-input"
                            value={scoresColumn.label}
                            onChange={(e) => handleScoresColumnChange('label', e.target.value)}
                            className="block w-full px-2 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white"
                        />
                    </div>
                )}
            </div>
        </div>
        <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 rounded-t-lg">
                    <tr>
                        <th scope="col" className="p-4">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                                checked={results.length > 0 && selectedIds.size === results.length}
                                onChange={(e) => onSelectAll(e.target.checked)}
                            />
                        </th>
                        {/* FIX: Use Object.keys to avoid issues with Object.entries typing. */}
                        {staticColumnKeys.map((key) => {
                           const config = staticColumns[key];
                           return config.selected && <th key={key} scope="col" className="px-4 py-3">{config.label}</th>;
                        })}
                        {scoresColumn.selected && Array.from({ length: maxScores }).map((_, i) => (
                            <th key={`score-header-${i}`} scope="col" className="px-4 py-3 text-center">{`${scoresColumn.label} ${i + 1}`}</th>
                        ))}
                        <th scope="col" className="px-4 py-3 text-center">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((item) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="w-4 p-4">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
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
                                  case 'totalScore': content = Number(item.scores.reduce((sum, score) => sum + score, 0).toFixed(2)); break;
                                }
                                return <td key={key} className="px-4 py-3 font-medium">{content}</td>;
                            })}
                            {scoresColumn.selected && Array.from({ length: maxScores }).map((_, i) => (
                                <td key={`score-cell-${i}`} className="px-4 py-3 font-mono text-center">{item.scores[i] ?? ''}</td>
                            ))}
                            <td className="px-4 py-3 text-center">
                                <button
                                    onClick={() => onEdit(item.id)}
                                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-md transition-colors"
                                    aria-label="Sonucu Düzenle"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
       <div className="mt-4 pt-4 border-t border-slate-200">
         <button 
           onClick={handleExport}
           disabled={selectedIds.size === 0}
           className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
         >
           {isCopied ? <CheckIcon className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5" />}
           {isCopied ? 'XLSX İndirildi!' : `Seçili (${selectedIds.size}) Sonucu İndir`}
         </button>
       </div>
    </div>
  );
};