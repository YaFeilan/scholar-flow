
import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Download, Table2, Image as ImageIcon, X, Copy, CheckCircle } from 'lucide-react';
import { Language, ChartExtractionResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { extractChartData } from '../services/geminiService';

interface ChartExtractionProps {
  language: Language;
}

const ChartExtraction: React.FC<ChartExtractionProps> = ({ language }) => {
  const t = TRANSLATIONS[language].chart;
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ChartExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    const data = await extractChartData(file, language);
    setResult(data);
    setLoading(false);
  };

  const handleDownloadCSV = () => {
    if (!result || !result.data || result.data.length === 0) return;
    
    const headers = Object.keys(result.data[0]);
    const csvRows = [headers.join(',')];
    
    result.data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        return `"${val !== undefined && val !== null ? val : ''}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${result.title || 'extracted_data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyTableToClipboard = () => {
      if (!result || !result.data || result.data.length === 0) return;
      
      const headers = Object.keys(result.data[0]);
      let text = headers.join('\t') + '\n';
      
      result.data.forEach(row => {
          text += headers.map(h => row[h]).join('\t') + '\n';
      });
      
      navigator.clipboard.writeText(text);
      alert(language === 'ZH' ? '表格已复制到剪贴板' : 'Table copied to clipboard');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Table2 className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow flex flex-col md:flex-row gap-8 overflow-hidden">
           {/* Left Panel: Upload & Image Preview */}
           <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mb-6"
               >
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                   {file ? (
                       <div className="relative group">
                           <img src={URL.createObjectURL(file)} alt="Chart" className="max-h-64 mx-auto rounded shadow-md object-contain" />
                           <div className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">{file.name}</div>
                           <button 
                              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                           >
                              <X size={14} />
                           </button>
                       </div>
                   ) : (
                       <div className="flex flex-col items-center text-slate-400">
                           <ImageIcon size={48} className="mb-4" />
                           <p className="font-medium text-slate-600 dark:text-slate-300">{t.upload}</p>
                           <p className="text-xs mt-2">Supports JPG, PNG, WEBP</p>
                       </div>
                   )}
               </div>

               <button 
                  onClick={handleExtract}
                  disabled={!file || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {loading ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                  {loading ? t.extracting : t.extractBtn}
               </button>
           </div>

           {/* Right Panel: Result Table */}
           <div className="w-full md:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               {result ? (
                   <div className="flex flex-col h-full">
                       <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                           <div>
                               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{result.title || t.resultTitle}</h3>
                               <p className="text-xs text-slate-500">{t.chartType}: {result.type}</p>
                           </div>
                           <div className="flex gap-2">
                               <button onClick={copyTableToClipboard} className="text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2">
                                   <Copy size={14} /> {t.copyTable}
                               </button>
                               <button onClick={handleDownloadCSV} className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                                   <Download size={14} /> {t.downloadCsv}
                               </button>
                           </div>
                       </div>
                       
                       <div className="flex-grow overflow-auto custom-scrollbar p-0">
                           {result.data && result.data.length > 0 ? (
                               <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                   <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 sticky top-0 shadow-sm">
                                       <tr>
                                           {Object.keys(result.data[0]).map((header, i) => (
                                               <th key={i} className="px-6 py-3 border-b border-slate-200 dark:border-slate-600 font-bold whitespace-nowrap">
                                                   {header}
                                               </th>
                                           ))}
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {result.data.map((row, i) => (
                                           <tr key={i} className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                               {Object.values(row).map((val: any, j) => (
                                                   <td key={j} className="px-6 py-4">
                                                       <input 
                                                          className="bg-transparent border-none w-full outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                                          defaultValue={val} 
                                                       />
                                                   </td>
                                               ))}
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           ) : (
                               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                   <p>No tabular data found.</p>
                               </div>
                           )}
                       </div>
                       
                       <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500">
                           <span className="font-bold">Summary:</span> {result.summary}
                       </div>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                       <Table2 size={64} className="mb-4" />
                       <p className="text-lg font-bold">No Data Extracted Yet</p>
                       <p className="text-sm">Upload an image and click extract to see results.</p>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default ChartExtraction;