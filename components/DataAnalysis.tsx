
// ... imports ...
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, FileText, BarChart2, Zap, Table, Code, Loader2, ArrowRight, PieChart, Activity, LayoutGrid, Download, Eye, CheckCircle, RefreshCcw, Target, Filter, Settings, Type, ListFilter, MessageCircle, Send, Check, X, AlertTriangle, Info } from 'lucide-react';
import { performDataAnalysis, chatWithDataAnalysis } from '../services/geminiService';
import { Language, DataAnalysisResult, CleaningStrategy } from '../types';
import { TRANSLATIONS } from '../translations';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';

interface DataAnalysisProps {
  language: Language;
  initialData?: any[][] | null;
}

type ColumnType = 'Numeric' | 'Categorical' | 'Date' | 'Text';

interface ColumnConfig {
  index: number;
  name: string;
  included: boolean;
  type: ColumnType;
}

// ... (cleanData and calculateLocalStats helper functions remain the same) ...
const cleanData = (data: any[], configs: ColumnConfig[], strategy: CleaningStrategy) => {
    if (strategy === 'auto') return data; // Default pass-through, simplistic for auto
    
    let cleaned = [...data];

    // Filter Logic
    if (strategy === 'drop') {
        cleaned = cleaned.filter(row => {
            return configs.every(col => {
                if (!col.included) return true;
                const val = row[col.name];
                return val !== undefined && val !== null && val !== '';
            });
        });
    } else if (strategy === 'mean' || strategy === 'zero') {
        // Calculate means/modes first if needed
        const replacements: Record<string, any> = {};
        if (strategy === 'mean') {
             configs.forEach(col => {
                 if (col.included) {
                     const vals = cleaned.map(r => r[col.name]).filter(v => v !== undefined && v !== null && v !== '');
                     if (col.type === 'Numeric') {
                         const sum = vals.reduce((a, b) => a + Number(b), 0);
                         replacements[col.name] = vals.length ? (sum / vals.length) : 0;
                     } else {
                         // Mode for categorical
                         const counts: Record<string, number> = {};
                         vals.forEach(v => counts[String(v)] = (counts[String(v)] || 0) + 1);
                         const mode = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0];
                         replacements[col.name] = mode || 'Unknown';
                     }
                 }
             });
        }

        cleaned = cleaned.map(row => {
            const newRow = { ...row };
            configs.forEach(col => {
                if (col.included) {
                    const val = newRow[col.name];
                    if (val === undefined || val === null || val === '') {
                        if (strategy === 'zero') {
                            newRow[col.name] = col.type === 'Numeric' ? 0 : 'Unknown';
                        } else {
                            newRow[col.name] = replacements[col.name];
                        }
                    }
                }
            });
            return newRow;
        });
    }

    return cleaned;
};

const calculateLocalStats = (data: any[], configs: ColumnConfig[]) => {
  if (!data || data.length === 0) return { rowCount: 0, columns: [], correlations: [], visualData: {} };

  const columnStats: any[] = [];
  const numericData: Record<string, number[]> = {};
  const visualData: Record<string, any[]> = {}; // Store data for charts

  configs.filter(c => c.included).forEach(colConfig => {
    const rawValues = data.map(row => row[colConfig.name]);
    const validValues = rawValues.filter(v => v !== null && v !== undefined && v !== '');
    
    if (colConfig.type === 'Numeric') {
        const numValues = validValues.map(v => Number(v)).filter(v => !isNaN(v));
        
        if (numValues.length > 0) {
            const sorted = numValues.sort((a, b) => a - b);
            const sum = sorted.reduce((a, b) => a + b, 0);
            const mean = sum / sorted.length;
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const median = sorted[Math.floor(sorted.length / 2)];
            
            columnStats.push({
                name: colConfig.name,
                type: 'Numeric',
                min, 
                max, 
                mean: mean.toFixed(2), 
                median,
                missing: rawValues.length - validValues.length
            });
            
            numericData[colConfig.name] = rawValues.map(v => {
                const n = Number(v);
                return isNaN(n) ? mean : n;
            });

            // Histogram Data
            const binCount = 10;
            const range = max - min;
            const binSize = range / binCount || 1;
            const bins = Array.from({length: binCount}, (_, i) => ({
                name: (min + i * binSize).toFixed(1),
                min: min + i * binSize,
                max: min + (i + 1) * binSize,
                count: 0
            }));
            
            numValues.forEach(v => {
                const binIndex = Math.min(Math.floor((v - min) / binSize), binCount - 1);
                if (bins[binIndex]) bins[binIndex].count++;
            });
            visualData[colConfig.name] = bins.map(b => ({ name: b.name, value: b.count }));
        }
    } else {
        const counts: Record<string, number> = {};
        validValues.forEach(v => {
            const s = String(v);
            counts[s] = (counts[s] || 0) + 1;
        });
        const distinct = Object.keys(counts).length;
        const top3 = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k, v]) => `${k}(${v})`)
            .join(', ');
            
        columnStats.push({
            name: colConfig.name,
            type: colConfig.type,
            distinct,
            topValues: top3,
            missing: rawValues.length - validValues.length
        });

        if (colConfig.type === 'Categorical') {
            visualData[colConfig.name] = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([k, v]) => ({ name: k.substring(0, 15), value: v }));
        }
    }
  });

  const correlations: any[] = [];
  const numCols = Object.keys(numericData);
  
  if (numCols.length > 1) {
      for (let i = 0; i < numCols.length; i++) {
          for (let j = i + 1; j < numCols.length; j++) {
              const colA = numCols[i];
              const colB = numCols[j];
              const arrA = numericData[colA];
              const arrB = numericData[colB];
              
              const n = arrA.length;
              const meanA = arrA.reduce((a, b) => a + b, 0) / n;
              const meanB = arrB.reduce((a, b) => a + b, 0) / n;
              
              let num = 0, denA = 0, denB = 0;
              for (let k = 0; k < n; k++) {
                  const da = arrA[k] - meanA;
                  const db = arrB[k] - meanB;
                  num += da * db;
                  denA += da * da;
                  denB += db * db;
              }
              
              const r = (denA > 0 && denB > 0) ? num / Math.sqrt(denA * denB) : 0;
              
              if (Math.abs(r) > 0.3) { 
                  correlations.push({
                      pair: `${colA} vs ${colB}`,
                      value: r.toFixed(2),
                      strength: Math.abs(r) > 0.7 ? 'Strong' : 'Moderate'
                  });
              }
          }
      }
  }
  
  return {
      rowCount: data.length,
      columns: columnStats,
      correlations: correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10),
      visualData,
      rawSample: data
  };
};

const DataAnalysis: React.FC<DataAnalysisProps> = ({ language, initialData }) => {
  const t = TRANSLATIONS[language].data;
  
  // State for Flow Control
  const [step, setStep] = useState<'upload' | 'preview' | 'analyzing' | 'result'>('upload');
  
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DataAnalysisResult | null>(null);
  
  // Preview & Config States
  const [rawFileContent, setRawFileContent] = useState<any[][]>([]);
  const [useFirstRowAsHeader, setUseFirstRowAsHeader] = useState(true);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
  const [targetVariable, setTargetVariable] = useState<string>('');
  const [cleaningStrategy, setCleaningStrategy] = useState<CleaningStrategy>('auto');
  
  // Local Stats & Visuals
  const [localStats, setLocalStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'data'>('overview');
  
  // Progress & Chat
  const [loadingStep, setLoadingStep] = useState<number>(0); // 0..3
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (handleDownloadTemplate, parseFileRaw, detectColumnTypes, useEffects, handleFileChange, handleConfirmAnalysis, resetUpload, toggleColumnInclude, updateColumnType remain the same) ...
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Group,Score_Pre,Score_Post,Gender,Age\n"
        + "1,Control,75,78,M,24\n"
        + "2,Treatment,72,85,F,28\n"
        + "3,Control,80,81,F,30\n"
        + "4,Treatment,68,88,M,22\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseFileRaw = (file: File): Promise<any[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook;
          if (file.name.endsWith('.csv')) {
             workbook = XLSX.read(data, { type: 'string' });
          } else {
             workbook = XLSX.read(data, { type: 'array' });
          }
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          resolve(json as any[][]);
        } catch (error) {
          reject(error);
        }
      };
      if (file.name.endsWith('.csv')) reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    });
  };

  const detectColumnTypes = (data: any[][], hasHeader: boolean) => {
      if (!data || data.length === 0) return [];
      const startRow = hasHeader ? 1 : 0;
      const sampleRows = data.slice(startRow, Math.min(startRow + 20, data.length));
      const headers = hasHeader ? (data[0] as string[]) : data[0].map((_, i) => `Column ${i + 1}`);
      
      return headers.map((header, index) => {
          let numericCount = 0;
          let validCount = 0;
          sampleRows.forEach(row => {
              const val = row[index];
              if (val !== undefined && val !== null && val !== '') {
                  validCount++;
                  if (!isNaN(Number(val))) numericCount++;
              }
          });
          let type: ColumnType = 'Categorical';
          if (validCount > 0 && (numericCount / validCount) > 0.8) {
              type = 'Numeric';
          }
          return { index, name: header || `Col_${index}`, included: true, type };
      });
  };

  useEffect(() => {
      if (initialData && initialData.length > 0) {
          setRawFileContent(initialData);
          setUseFirstRowAsHeader(true);
          setColumnConfigs(detectColumnTypes(initialData, true));
          setStep('preview');
          setFile({ name: 'Imported Data from Chart', type: 'text/csv' } as File);
          setResult(null);
          setLocalStats(null);
      }
  }, [initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setLocalStats(null);
      setTargetVariable('');
      setCleaningStrategy('auto');
      
      try {
        const rawData = await parseFileRaw(selectedFile);
        if (rawData && rawData.length > 0) {
            setRawFileContent(rawData);
            setColumnConfigs(detectColumnTypes(rawData, true));
            setStep('preview');
        } else {
            alert("File appears to be empty.");
        }
      } catch (err) {
        console.error("Parse Error", err);
        alert("Failed to parse file.");
      }
    }
  };

  useEffect(() => {
      if (step === 'preview' && rawFileContent.length > 0) {
          setColumnConfigs(detectColumnTypes(rawFileContent, useFirstRowAsHeader));
      }
  }, [useFirstRowAsHeader, rawFileContent]);

  const handleConfirmAnalysis = async () => {
      if (!rawFileContent || rawFileContent.length === 0) return;
      
      setStep('analyzing');
      setLoadingStep(0); 
      setActiveTab('overview');

      setTimeout(async () => {
          setLoadingStep(1); 

          const startRow = useFirstRowAsHeader ? 1 : 0;
          const processedData = rawFileContent.slice(startRow).map(row => {
              const obj: any = {};
              columnConfigs.forEach(col => {
                  if (col.included) obj[col.name] = row[col.index];
              });
              return obj;
          });

          const SAMPLE_SIZE = 50;
          const sampleData = processedData.slice(0, SAMPLE_SIZE);
          const fullCount = processedData.length;

          await new Promise(r => setTimeout(r, 800));
          const cleanedSample = cleanData(sampleData, columnConfigs, cleaningStrategy);
          setLoadingStep(2); 

          await new Promise(r => setTimeout(r, 800));
          const statsSummary = calculateLocalStats(cleanedSample, columnConfigs);
          setLocalStats(statsSummary);
          
          (statsSummary as any).meta = {
              totalRows: fullCount,
              sampleSize: cleanedSample.length,
              targetVariable: targetVariable || 'None (Unsupervised)',
              cleaningStrategy
          };
          
          setLoadingStep(3); 
          
          try {
            const analysis = await performDataAnalysis(statsSummary, language, targetVariable);
            setResult(analysis);
            setStep('result');
          } catch (error) {
              console.error("AI Analysis Failed", error);
              setStep('upload');
              alert("AI Analysis Failed. Please try again.");
          }
      }, 800);
  };

  const resetUpload = () => {
      setFile(null);
      setResult(null);
      setRawFileContent([]);
      setLocalStats(null);
      setStep('upload');
      setChatHistory([]);
  };

  const toggleColumnInclude = (index: number) => {
      setColumnConfigs(prev => prev.map((c, i) => i === index ? { ...c, included: !c.included } : c));
  };

  const updateColumnType = (index: number, newType: ColumnType) => {
      setColumnConfigs(prev => prev.map((c, i) => i === index ? { ...c, type: newType } : c));
  };

  const handleChat = async () => {
      if (!chatInput.trim() || !localStats) return;
      const q = chatInput;
      setChatInput('');
      setChatHistory(prev => [...prev, {role: 'user', text: q}]);
      setChatLoading(true);
      const answer = await chatWithDataAnalysis(q, localStats, language);
      setChatHistory(prev => [...prev, {role: 'ai', text: answer}]);
      setChatLoading(false);
  };

  const handleExportReport = () => {
      if (!result) return;
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;
      const width = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text("Data Analysis Report", margin, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 10;
      
      doc.setFontSize(14);
      doc.text("Executive Summary", margin, y);
      y += 6;
      doc.setFontSize(10);
      const sumLines = doc.splitTextToSize(result.summary, width - 2*margin);
      doc.text(sumLines, margin, y);
      y += sumLines.length * 5 + 10;

      if (result.featureImportance) {
          doc.setFontSize(14);
          doc.text("Key Drivers (Feature Importance)", margin, y);
          y += 6;
          doc.setFontSize(10);
          result.featureImportance.forEach(f => {
              doc.text(`- ${f.feature}: ${(f.importance * 100).toFixed(1)}% (${f.reason})`, margin, y);
              y += 6;
          });
          y += 5;
      }

      doc.setFontSize(14);
      doc.text("Recommended Models", margin, y);
      y += 6;
      doc.setFontSize(10);
      result.recommendedModels.forEach(m => {
          doc.text(`- ${m.name}: ${m.reason}`, margin, y);
          y += 6;
      });

      doc.save('Data_Analysis_Report.pdf');
  };

  const ProgressStep = ({ num, label, active, completed }: {num: number, label: string, active: boolean, completed: boolean}) => (
      <div className={`flex flex-col items-center gap-2 w-32 transition-all duration-500 ${active ? 'opacity-100 scale-110' : completed ? 'opacity-50' : 'opacity-30'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 
             ${completed ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-blue-600 border-blue-600 text-white animate-pulse' : 'bg-slate-100 border-slate-300 text-slate-400'}
          `}>
              {completed ? <CheckCircle size={20} /> : active ? <Loader2 size={20} className="animate-spin" /> : num}
          </div>
          <span className={`text-xs font-bold text-center ${active ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
      </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       {/* ... (Previous code for Header, Upload, Config) ... */}
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm">{t.subtitle}</p>
       </div>

       {step === 'upload' && (
          <div className="flex-grow flex flex-col items-center justify-center">
              <div 
                 className="w-full max-w-2xl p-12 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center group mb-6"
                 onClick={() => fileInputRef.current?.click()}
              >
                 <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                 <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-700">{t.upload}</h3>
                 <p className="text-slate-400">Supported: CSV, Excel (.xlsx)</p>
              </div>
              
              <button onClick={handleDownloadTemplate} className="text-slate-500 hover:text-blue-600 flex items-center gap-2 text-sm font-bold bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                 <Download size={16} /> {t.downloadTemplate}
              </button>
          </div>
       )}
       
       {step === 'preview' && (
           <div className="flex-grow flex flex-col overflow-hidden max-w-6xl mx-auto w-full animate-fadeIn">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Settings className="text-blue-500" size={20} />
                            <h3 className="font-bold text-slate-800">{t.setupTitle}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600 select-none">
                                <input type="checkbox" checked={useFirstRowAsHeader} onChange={(e) => setUseFirstRowAsHeader(e.target.checked)} className="w-4 h-4 rounded" />
                                {t.useHeader}
                            </label>
                            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">{file?.name}</span>
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                        <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
                             <div className="p-4 border-b border-slate-200 bg-white space-y-4">
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Target size={14} /> {t.targetVar}
                                    </label>
                                    <select value={targetVariable} onChange={(e) => setTargetVariable(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">{t.noTarget}</option>
                                        {columnConfigs.filter(c => c.included).map((col, i) => <option key={i} value={col.name}>{col.name}</option>)}
                                    </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                         <Filter size={14} /> {t.cleaning}
                                     </label>
                                     <select value={cleaningStrategy} onChange={(e) => setCleaningStrategy(e.target.value as CleaningStrategy)} className="w-full border border-slate-300 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                         {Object.entries(t.cleaningStrategies).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                     </select>
                                 </div>
                             </div>
                             
                             <div className="p-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-500 px-4">
                                 <span>{t.colName}</span>
                                 <span>{t.colType}</span>
                             </div>

                             <div className="flex-grow overflow-y-auto p-2 space-y-1">
                                 {columnConfigs.map((col, idx) => (
                                     <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${col.included ? 'bg-white border-slate-200' : 'bg-slate-100 border-transparent opacity-60'}`}>
                                         <input type="checkbox" checked={col.included} onChange={() => toggleColumnInclude(idx)} className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer" />
                                         <div className="flex-grow truncate text-sm font-bold text-slate-700" title={col.name}>{col.name}</div>
                                         <select value={col.type} onChange={(e) => updateColumnType(idx, e.target.value as ColumnType)} disabled={!col.included} className="text-xs border border-slate-200 rounded py-1 px-1 bg-slate-50 text-slate-600 w-24">
                                             <option value="Numeric">Numeric</option>
                                             <option value="Categorical">Category</option>
                                             <option value="Date">Date</option>
                                             <option value="Text">Text</option>
                                         </select>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        <div className="w-full md:w-2/3 flex flex-col bg-white overflow-hidden">
                             <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 flex justify-between">
                                 <span className="flex items-center gap-1"><ListFilter size={14} /> Raw Data Preview</span>
                                 <span>First 20 rows</span>
                             </div>
                             <div className="flex-grow overflow-auto custom-scrollbar">
                                <table className="w-full text-sm text-left text-slate-600">
                                    <thead className="text-xs uppercase bg-white border-b border-slate-200 text-slate-700 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            {columnConfigs.map((col, idx) => (
                                                <th key={idx} className={`px-4 py-3 whitespace-nowrap border-r border-slate-100 last:border-0 ${!col.included && 'opacity-30 bg-slate-50'}`}>
                                                    <div className="flex flex-col">
                                                        <span>{col.name}</span>
                                                        <span className="text-[9px] text-slate-400 font-normal">{col.type}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rawFileContent.slice(useFirstRowAsHeader ? 1 : 0, 21).map((row, rIdx) => (
                                            <tr key={rIdx} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                                {row.map((cell: any, cIdx: number) => {
                                                    const config = columnConfigs[cIdx];
                                                    return (
                                                        <td key={cIdx} className={`px-4 py-2 whitespace-nowrap truncate max-w-[150px] border-r border-slate-50 last:border-0 ${config && !config.included && 'opacity-30 bg-slate-50'}`}>
                                                            {cell !== undefined && cell !== null ? String(cell) : ''}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">{t.limitBanner}</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={resetUpload} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm">{t.reupload}</button>
                            <button onClick={handleConfirmAnalysis} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2">
                                <Zap size={18} /> {t.quickAnalysisBtn}
                            </button>
                        </div>
                    </div>
                </div>
           </div>
       )}

       {step === 'analyzing' && (
          <div className="flex-grow flex flex-col items-center justify-center animate-fadeIn gap-8">
             <div className="flex gap-4">
                 <ProgressStep num={1} label={t.progress.loading} active={loadingStep === 0} completed={loadingStep > 0} />
                 <div className="w-10 h-0.5 bg-slate-200 mt-5"></div>
                 <ProgressStep num={2} label={t.progress.cleaning} active={loadingStep === 1} completed={loadingStep > 1} />
                 <div className="w-10 h-0.5 bg-slate-200 mt-5"></div>
                 <ProgressStep num={3} label={t.progress.stats} active={loadingStep === 2} completed={loadingStep > 2} />
                 <div className="w-10 h-0.5 bg-slate-200 mt-5"></div>
                 <ProgressStep num={4} label={t.progress.ai} active={loadingStep === 3} completed={loadingStep > 3} />
             </div>
             <p className="text-xs text-slate-400 max-w-md text-center bg-slate-50 p-3 rounded border border-slate-100">{t.limitNotice}</p>
          </div>
       )}

       {step === 'result' && result && (
          <div className="flex-grow flex flex-col overflow-hidden animate-fadeIn relative">
             <div className="flex gap-4 mb-4 border-b border-slate-200 pb-1 justify-between items-center">
                 <div className="flex gap-4">
                     <button onClick={() => setActiveTab('overview')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        <LayoutGrid size={16} /> Overview
                     </button>
                     <button onClick={() => setActiveTab('charts')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'charts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        <PieChart size={16} /> Visualizations
                     </button>
                     <button onClick={() => setActiveTab('data')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        <Table size={16} /> Data Preview
                     </button>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={handleExportReport} className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded flex items-center gap-1 mb-2">
                        <Download size={14} /> {t.exportReport}
                     </button>
                     <button onClick={() => setChatOpen(!chatOpen)} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded flex items-center gap-1 mb-2">
                        <MessageCircle size={14} /> {t.chatData}
                     </button>
                 </div>
             </div>

             <div className="flex-grow overflow-y-auto custom-scrollbar pb-20">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-12">
                             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-800">
                                <Info size={16} />
                                {t.resultDisclaimer}
                             </div>
                        </div>
                        {/* Stats & Feature Importance */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText size={18} className="text-emerald-500" /> {t.summary}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
                            </div>

                            {/* Feature Importance Chart */}
                            {result.featureImportance && result.featureImportance.length > 0 && (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Target size={18} className="text-purple-500" /> {t.featureImportance}</h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={result.featureImportance} margin={{left: 20}}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="feature" type="category" width={80} tick={{fontSize: 10}} />
                                                <Tooltip />
                                                <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        {result.featureImportance.slice(0, 3).map((f, i) => (
                                            <p key={i} className="text-xs text-slate-500"><strong>{f.feature}:</strong> {f.reason}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> {t.correlations}</h3>
                                <div className="space-y-3">
                                {result.correlations?.map((corr, i) => (
                                    <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-xs text-slate-700">{corr.pair}</div>
                                            <p className="text-xs text-slate-500">{corr.insight}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-1.5 rounded ${Math.abs(corr.value) > 0.7 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>r = {corr.value}</span>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Models & Code */}
                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Code className="text-purple-500" /> {t.models}</h3>
                            <div className="space-y-4">
                                {result.recommendedModels?.map((model, i) => (
                                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                        <h4 className="font-bold text-sm text-slate-800">{model.name}</h4>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-slate-600 mb-3">{model.reason}</p>
                                        <div className="bg-slate-900 rounded p-3 relative group">
                                            <button onClick={() => navigator.clipboard.writeText(model.codeSnippet)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] text-white bg-white/20 px-1 rounded">Copy</button>
                                            <pre className="text-[10px] text-green-400 font-mono overflow-x-auto"><code>{model.codeSnippet}</code></pre>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'charts' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {localStats?.columns.map((col: any) => {
                            const data = localStats.visualData[col.name];
                            if (!data || data.length === 0) return null;
                            return (
                                <div key={col.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-slate-800 mb-4 text-sm">{col.name} ({col.type})</h4>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" /></BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'data' && (
                     <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden pb-20">
                        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600"><thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200"><tr>{columnConfigs.filter(c => c.included).map((col: any) => <th key={col.name} className="px-6 py-3 font-bold whitespace-nowrap">{col.name}</th>)}</tr></thead><tbody>{localStats?.rawSample.map((row: any, i: number) => <tr key={i} className="bg-white border-b border-slate-100 hover:bg-slate-50">{columnConfigs.filter(c => c.included).map((col: any) => <td key={col.name} className="px-6 py-3 truncate max-w-xs">{row[col.name] !== undefined ? String(row[col.name]) : '-'}</td>)}</tr>)}</tbody></table></div>
                    </div>
                )}
             </div>

             {/* Chat Interface */}
             {chatOpen && (
                 <div className="absolute right-6 bottom-6 w-80 bg-white border border-slate-200 shadow-2xl rounded-xl flex flex-col h-96 z-50 animate-slideInRight">
                     <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-emerald-50 rounded-t-xl">
                         <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-2"><MessageCircle size={14} /> Chat with Data</h4>
                         <button onClick={() => setChatOpen(false)}><X size={16} className="text-slate-400 hover:text-slate-600" /></button>
                     </div>
                     <div className="flex-grow overflow-y-auto p-3 space-y-3 bg-slate-50">
                         {chatHistory.map((msg, i) => (
                             <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white self-end ml-4' : 'bg-white border border-slate-200 text-slate-700 mr-4'}`}>{msg.text}</div>
                         ))}
                         {chatLoading && <Loader2 className="animate-spin text-slate-400 w-4 h-4" />}
                     </div>
                     <div className="p-2 border-t border-slate-100 flex gap-2">
                         <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} className="flex-grow text-xs border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Ask a question..." />
                         <button onClick={handleChat} disabled={chatLoading} className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700"><Send size={14} /></button>
                     </div>
                 </div>
             )}
          </div>
       )}
    </div>
  );
};

export default DataAnalysis;
