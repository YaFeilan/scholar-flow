
import React, { useState, useRef } from 'react';
import { Upload, FileText, BarChart2, Zap, Table, Code, Loader2, ArrowRight } from 'lucide-react';
import { performDataAnalysis } from '../services/geminiService';
import { Language, DataAnalysisResult } from '../types';
import { TRANSLATIONS } from '../translations';
import * as XLSX from 'xlsx';

interface DataAnalysisProps {
  language: Language;
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ language }) => {
  const t = TRANSLATIONS[language].data;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setLoading(true);
      
      try {
        const data = await parseFile(selectedFile);
        const analysis = await performDataAnalysis(data, language);
        setResult(analysis);
      } catch (err) {
        console.error("Analysis Failed", err);
        alert("Failed to parse or analyze file.");
      }
      setLoading(false);
    }
  };

  const parseFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          // Convert to CSV string to send to Gemini
          const csv = XLSX.utils.sheet_to_csv(sheet);
          resolve(csv);
        } catch (error) {
          reject(error);
        }
      };

      if (file.name.endsWith('.csv')) {
         reader.readAsText(file);
      } else {
         reader.readAsBinaryString(file);
      }
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm">{t.subtitle}</p>
       </div>

       {/* Upload Area (Collapsed if result exists) */}
       {!result && !loading && (
          <div className="flex-grow flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
             onClick={() => fileInputRef.current?.click()}
          >
             <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Upload size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-700">{t.upload}</h3>
             <p className="text-slate-400">Supported: CSV, Excel (.xlsx)</p>
          </div>
       )}

       {loading && (
          <div className="flex-grow flex flex-col items-center justify-center">
             <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
             <p className="text-lg font-bold text-slate-800">{t.analyzing}</p>
             <p className="text-slate-500">Generating statistical insights...</p>
          </div>
       )}

       {result && (
          <div className="flex-grow overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
             {/* Left Panel: Stats & Correlations */}
             <div className="lg:col-span-4 space-y-6">
                 {/* Summary Card */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <FileText size={18} className="text-emerald-500" /> {t.summary}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
                 </div>

                 {/* Columns / Variables */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <Table size={18} className="text-blue-500" /> {t.columns}
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                       {result.columns.map((col, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                             <div>
                                <span className="font-bold text-xs text-slate-700 block">{col.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase">{col.type}</span>
                             </div>
                             <span className="text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{col.stats}</span>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Correlations */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <Zap size={18} className="text-amber-500" /> {t.correlations}
                    </h3>
                    <div className="space-y-3">
                       {result.correlations.map((corr, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100">
                             <div className="flex justify-between mb-1">
                                <span className="font-bold text-xs text-slate-700">{corr.pair}</span>
                                <span className={`text-xs font-bold px-1.5 rounded ${Math.abs(corr.value) > 0.7 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                   r = {corr.value}
                                </span>
                             </div>
                             <p className="text-xs text-slate-500">{corr.insight}</p>
                          </div>
                       ))}
                    </div>
                 </div>
             </div>

             {/* Right Panel: Models & Code */}
             <div className="lg:col-span-8 space-y-6">
                 <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                    <Code className="text-purple-500" /> {t.models}
                 </h3>
                 
                 <div className="space-y-6">
                    {result.recommendedModels.map((model, i) => (
                       <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                             <h4 className="font-bold text-slate-800">{model.name}</h4>
                             <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">Recommended</span>
                          </div>
                          <div className="p-6">
                             <p className="text-sm text-slate-600 mb-4">{model.reason}</p>
                             
                             <div className="bg-slate-900 rounded-lg p-4 relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                      onClick={() => navigator.clipboard.writeText(model.codeSnippet)}
                                      className="text-xs text-slate-400 hover:text-white bg-white/10 px-2 py-1 rounded"
                                   >
                                      Copy Code
                                   </button>
                                </div>
                                <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                                   <code>{model.codeSnippet}</code>
                                </pre>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 <div className="flex justify-end">
                     <button 
                        onClick={() => { setFile(null); setResult(null); }}
                        className="text-slate-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1"
                     >
                        Analyze Another Dataset <ArrowRight size={14} />
                     </button>
                 </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default DataAnalysis;