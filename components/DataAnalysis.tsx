
import React, { useState, useRef } from 'react';
import { Upload, FileText, BarChart2, Zap, Table, Code, Loader2, ArrowRight } from 'lucide-react';
import { performDataAnalysis } from '../services/geminiService';
import { Language, DataAnalysisResult } from '../types';
import { TRANSLATIONS } from '../translations';
import * as XLSX from 'xlsx';

interface DataAnalysisProps {
  language: Language;
}

// Helper: Calculate Basic Stats locally to save Tokens/Time
const calculateLocalStats = (data: any[]) => {
  if (!data || data.length === 0) return { rowCount: 0, columns: [], correlations: [] };

  const columns = Object.keys(data[0]);
  const columnStats: any[] = [];
  const numericData: Record<string, number[]> = {};

  columns.forEach(col => {
    const rawValues = data.map(row => row[col]);
    const validValues = rawValues.filter(v => v !== null && v !== undefined && v !== '');
    
    // Type detection: If >80% are numbers, treat as numeric
    const numValues = validValues.map(v => Number(v)).filter(v => !isNaN(v));
    const isNumeric = validValues.length > 0 && numValues.length / validValues.length > 0.8;

    if (isNumeric) {
        const sorted = numValues.sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / sorted.length;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const median = sorted[Math.floor(sorted.length / 2)];
        
        columnStats.push({
            name: col,
            type: 'Numeric',
            min, 
            max, 
            mean: mean.toFixed(2), 
            median,
            missing: rawValues.length - validValues.length
        });
        
        // Store for correlation (fill missing with mean for simple correlation calc)
        numericData[col] = rawValues.map(v => {
            const n = Number(v);
            return isNaN(n) ? mean : n;
        });
    } else {
        // Categorical Stats
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
            name: col,
            type: 'Categorical',
            distinct,
            topValues: top3,
            missing: rawValues.length - validValues.length
        });
    }
  });

  // Calculate Correlations (Pearson) for numeric columns
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
              // Re-calc means for the filled arrays
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
              
              // Only keep significant correlations
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
  
  // Return summary object
  return {
      rowCount: data.length,
      columns: columnStats,
      correlations: correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10)
  };
};

const DataAnalysis: React.FC<DataAnalysisProps> = ({ language }) => {
  const t = TRANSLATIONS[language].data;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataAnalysisResult | null>(null);
  
  // Streaming States
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [streamingSummary, setStreamingSummary] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setLoading(true);
      setResult(null);
      setLoadingStatus("Parsing file...");
      setStreamingSummary('');
      
      try {
        // 1. Parse File to JSON
        const jsonData = await parseFile(selectedFile);
        
        // 2. Slice Data (Limit to 50 rows as per requirements)
        const SAMPLE_SIZE = 50;
        const sampleData = jsonData.slice(0, SAMPLE_SIZE);
        const fullCount = jsonData.length;
        
        setLoadingStatus(language === 'ZH' ? '正在提取前50行样本及结构...' : 'Extracting first 50 rows sample & structure...');
        
        // 3. Calculate Stats Locally on SAMPLE
        const statsSummary = calculateLocalStats(sampleData);
        
        // 4. Inject Metadata & Raw Sample into Stats Payload
        (statsSummary as any).meta = {
            totalRows: fullCount,
            sampleSize: sampleData.length,
            note: "Analysis based on top 50 rows sample."
        };
        (statsSummary as any).rawSample = sampleData; // Attach sample rows
        
        setLoadingStatus("Connecting to AI Analyst...");
        
        // 5. Send Payload to AI
        const analysis = await performDataAnalysis(statsSummary, language, (status, partialText) => {
            setLoadingStatus(status);
            const summaryMatch = partialText.match(/"summary":\s*"(.*?)(?:"|$)/s);
            if (summaryMatch && summaryMatch[1]) {
                let rawSum = summaryMatch[1];
                if (rawSum.endsWith('\\')) rawSum = rawSum.slice(0, -1);
                setStreamingSummary(rawSum);
            }
        });
        
        setResult(analysis);
      } catch (err) {
        console.error("Analysis Failed", err);
        alert("Failed to parse or analyze file.");
      }
      setLoading(false);
    }
  };

  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook;
          
          if (file.name.endsWith('.csv')) {
             // Read CSV as string
             workbook = XLSX.read(data, { type: 'string' });
          } else {
             // Read Excel as ArrayBuffer
             workbook = XLSX.read(data, { type: 'array' });
          }
          
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };

      if (file.name.endsWith('.csv')) {
         reader.readAsText(file);
      } else {
         reader.readAsArrayBuffer(file);
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

       {loading && !result && (
          <div className="flex-grow flex flex-col items-center justify-center">
             <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
             <p className="text-lg font-bold text-slate-800">{t.analyzing}</p>
             <p className="text-blue-600 font-medium mt-2">{loadingStatus}</p>
             
             {/* Limit Notice */}
             <p className="text-xs text-slate-400 mt-2 max-w-md text-center bg-slate-50 p-2 rounded border border-slate-100">
                {t.limitNotice}
             </p>
             
             {/* Streaming Preview of Summary */}
             {streamingSummary && (
                 <div className="mt-8 max-w-2xl w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm opacity-80">
                     <h3 className="font-bold text-slate-800 mb-2 text-sm flex items-center gap-2">
                         <FileText size={14} className="text-emerald-500" /> Previewing Insights...
                     </h3>
                     <p className="text-sm text-slate-600 leading-relaxed font-mono">
                         {streamingSummary}<span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                     </p>
                 </div>
             )}
          </div>
       )}

       {result && (
          <div className="flex-grow overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 animate-fadeIn">
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
                       {result.columns?.map((col, i) => (
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
                       {result.correlations?.map((corr, i) => (
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
                    {result.recommendedModels?.map((model, i) => (
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
                        onClick={() => { setFile(null); setResult(null); setStreamingSummary(''); }}
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