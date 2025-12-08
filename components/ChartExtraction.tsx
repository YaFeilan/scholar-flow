
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Table, BarChart2, Loader2, Download, MessageSquare, Send, Image as ImageIcon, X, Crop, Check } from 'lucide-react';
import { extractChartData, generateChartTrendAnalysis } from '../services/geminiService';
import { Language, ChartExtractionResult } from '../types';
import { TRANSLATIONS } from '../translations';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';

interface ChartExtractionProps {
  language: Language;
  onSendDataToAnalysis?: (data: any[][]) => void;
}

interface ChartFile {
    id: string;
    file: File;
    previewUrl: string;
    metadata?: any;
}

const ChartExtraction: React.FC<ChartExtractionProps> = ({ language, onSendDataToAnalysis }) => {
  const t = TRANSLATIONS[language].chart;
  
  const [chartFiles, setChartFiles] = useState<ChartFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChartExtractionResult | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste handling
  useEffect(() => {
    const handlePaste = (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      if (clipboardEvent.clipboardData && clipboardEvent.clipboardData.items) {
        const items = clipboardEvent.clipboardData.items;
        const newFiles: ChartFile[] = [];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
                // Ensure correct File type casting
                const file = blob as File;
                newFiles.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file: file,
                    previewUrl: URL.createObjectURL(file),
                    metadata: { addedDate: new Date().toISOString().split('T')[0] }
                });
            }
          }
        }

        if (newFiles.length > 0) {
            setChartFiles(prev => [...prev, ...newFiles]);
            if (!activeId && newFiles[0]) setActiveId(newFiles[0].id);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles: ChartFile[] = Array.from(e.target.files).map((file: File) => ({
              id: Math.random().toString(36).substring(2, 9),
              file,
              previewUrl: URL.createObjectURL(file)
          }));
          setChartFiles(prev => [...prev, ...newFiles]);
          if (!activeId && newFiles[0]) setActiveId(newFiles[0].id);
      }
  };

  const handleExtract = async () => {
      const activeFile = chartFiles.find(f => f.id === activeId);
      if (!activeFile) return;

      setLoading(true);
      setResult(null);
      setTrendAnalysis('');

      try {
          const data = await extractChartData(activeFile.file, language);
          setResult(data);
          
          if (data.data && data.data.length > 0) {
              const trends = await generateChartTrendAnalysis(data.data, language);
              setTrendAnalysis(trends);
          }
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };

  const handleExportCSV = () => {
      if (!result || !result.data) return;
      const ws = XLSX.utils.json_to_sheet(result.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chart Data");
      XLSX.writeFile(wb, "chart_data.csv");
  };

  const handleSendToAnalysis = () => {
      if (!result || !result.data || !onSendDataToAnalysis) return;
      // Convert array of objects to array of arrays (first row headers)
      if (result.data.length > 0) {
          const headers = Object.keys(result.data[0]);
          const rows = result.data.map(row => headers.map(h => row[h]));
          onSendDataToAnalysis([headers, ...rows]);
      }
  };

  const activeFile = chartFiles.find(f => f.id === activeId);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart2 className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
           {/* Left Panel: Upload & Preview */}
           <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
                   <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                       <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Source Image</h3>
                       <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                           <Upload size={12} /> {t.upload}
                       </button>
                       <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
                   </div>
                   
                   <div className="flex-grow bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
                       {activeFile ? (
                           <img src={activeFile.previewUrl} alt="Chart" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                       ) : (
                           <div className="text-center text-slate-400">
                               <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                               <p>Upload or Paste Chart Image</p>
                           </div>
                       )}
                   </div>

                   {/* Thumbnails */}
                   {chartFiles.length > 0 && (
                       <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2 overflow-x-auto custom-scrollbar">
                           {chartFiles.map(f => (
                               <div 
                                 key={f.id} 
                                 onClick={() => { setActiveId(f.id); setResult(null); }}
                                 className={`w-16 h-16 flex-shrink-0 rounded-lg border-2 cursor-pointer overflow-hidden relative ${activeId === f.id ? 'border-blue-500' : 'border-transparent'}`}
                               >
                                   <img src={f.previewUrl} className="w-full h-full object-cover" />
                               </div>
                           ))}
                       </div>
                   )}

                   <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                       <button 
                          onClick={handleExtract}
                          disabled={!activeFile || loading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                           {loading ? <Loader2 className="animate-spin" /> : <Table size={18} />}
                           {loading ? t.extracting : 'Extract Data'}
                       </button>
                   </div>
               </div>
           </div>

           {/* Right Panel: Results */}
           <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
               {result ? (
                   <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden animate-fadeIn">
                       <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                               <FileText className="text-green-500" size={18} />
                               <h3 className="font-bold text-slate-800 dark:text-slate-200">{result.title || "Extracted Data"}</h3>
                               <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{result.type}</span>
                           </div>
                           <div className="flex gap-2">
                               <button onClick={handleExportCSV} className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-1 transition-colors">
                                   <Download size={14} /> CSV
                               </button>
                               {onSendDataToAnalysis && (
                                   <button onClick={handleSendToAnalysis} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 flex items-center gap-1 transition-colors">
                                       <Send size={14} /> Analysis
                                   </button>
                               )}
                           </div>
                       </div>

                       <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                           <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Summary</h4>
                               <ReactMarkdown>{result.summary}</ReactMarkdown>
                           </div>

                           {/* Data Table Preview */}
                           {result.data && result.data.length > 0 && (
                               <div>
                                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Table size={14}/> Raw Data Preview</h4>
                                   <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                                       <table className="w-full text-sm text-left">
                                           <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase font-bold text-slate-600 dark:text-slate-400">
                                               <tr>
                                                   {Object.keys(result.data[0]).map((key, i) => (
                                                       <th key={i} className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">{key}</th>
                                                   ))}
                                               </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                               {result.data.slice(0, 10).map((row, i) => (
                                                   <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                       {Object.values(row).map((val: any, j) => (
                                                           <td key={j} className="px-4 py-2 text-slate-600 dark:text-slate-300">{val}</td>
                                                       ))}
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                       {result.data.length > 10 && (
                                           <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900">
                                               ...and {result.data.length - 10} more rows
                                           </div>
                                       )}
                                   </div>
                               </div>
                           )}

                           {trendAnalysis && (
                               <div>
                                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><MessageSquare size={14}/> Trend Analysis</h4>
                                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                       <ReactMarkdown>{trendAnalysis}</ReactMarkdown>
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
               ) : (
                   <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full items-center justify-center text-slate-400">
                       <Table size={48} className="mb-4 opacity-50" />
                       <p>Extraction results will appear here.</p>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default ChartExtraction;
