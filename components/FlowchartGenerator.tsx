
import React, { useState, useRef, useEffect } from 'react';
import { Network, Upload, Send, Loader2, Copy, Download, Image as ImageIcon, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Language, FlowchartResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateFlowchartData } from '../services/geminiService';

interface FlowchartGeneratorProps {
  language: Language;
}

const FlowchartGenerator: React.FC<FlowchartGeneratorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].flowchart;
  
  // State
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [chartType, setChartType] = useState('flowchart');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlowchartResult | null>(null);
  const [zoom, setZoom] = useState(100);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim() && !imageFile) return;
    setLoading(true);
    setResult(null);
    setZoom(100);
    
    try {
        const data = await generateFlowchartData(inputText, chartType, language, imageFile || undefined);
        setResult(data);
    } catch (e) {
        console.error(e);
    }
    setLoading(false);
  };

  const copyCode = () => {
      if (result?.mermaidCode) {
          navigator.clipboard.writeText(result.mermaidCode);
          alert('Mermaid Code Copied!');
      }
  };

  const downloadSVG = () => {
      // Basic implementation for Mermaid Ink download
      if (result?.mermaidCode) {
          const url = `https://mermaid.ink/svg/${btoa(result.mermaidCode)}`;
          const a = document.createElement('a');
          a.href = url;
          a.download = 'flowchart.svg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Network className="text-emerald-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
           
           {/* Left: Input */}
           <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                   
                   <div>
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">{t.chartType}</label>
                       <select 
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value)}
                          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 dark:text-slate-200"
                       >
                           {Object.entries(t.types).map(([k, v]) => (
                               <option key={k} value={k}>{v}</option>
                           ))}
                       </select>
                   </div>

                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                   >
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                       {imageFile ? (
                           <div className="flex flex-col items-center gap-2">
                               <ImageIcon size={24} className="text-emerald-500" />
                               <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{imageFile.name}</span>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); setImageFile(null); }}
                                  className="text-xs text-red-500 hover:underline"
                               >
                                  Remove
                               </button>
                           </div>
                       ) : (
                           <div className="flex flex-col items-center gap-2 text-slate-400">
                               <Upload size={24} />
                               <span className="text-sm font-bold">{t.uploadImage}</span>
                           </div>
                       )}
                   </div>

                   <div>
                       <textarea 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={t.inputPlaceholder}
                          className="w-full h-40 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-transparent dark:text-slate-200"
                       />
                   </div>

                   <button 
                      onClick={handleGenerate}
                      disabled={loading || (!inputText && !imageFile)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                   >
                      {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                      {t.btn}
                   </button>
               </div>
           </div>

           {/* Right: Result */}
           <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col relative">
               {result ? (
                   <>
                       <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                           <h3 className="font-bold text-slate-700 dark:text-slate-200">{t.resultTitle}</h3>
                           <div className="flex items-center gap-2">
                               <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomOut size={16}/></button>
                               <span className="text-xs font-mono">{zoom}%</span>
                               <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomIn size={16}/></button>
                               <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                               <button onClick={copyCode} className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1"><Copy size={14} /> {t.copyCode}</button>
                               <button onClick={downloadSVG} className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 flex items-center gap-1"><Download size={14} /> {t.download}</button>
                           </div>
                       </div>
                       
                       <div className="flex-grow overflow-auto p-8 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]">
                           <div style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.2s' }}>
                               <img 
                                  src={`https://mermaid.ink/img/${btoa(result.mermaidCode)}`} 
                                  alt="Flowchart" 
                                  className="max-w-none shadow-lg rounded bg-white p-4"
                                  onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      alert("Failed to render diagram. Please verify the code.");
                                  }}
                               />
                           </div>
                       </div>

                       <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                           <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                               <strong>Explanation: </strong>{result.explanation}
                           </div>
                           <details className="text-xs">
                               <summary className="cursor-pointer font-bold text-slate-500 hover:text-emerald-600 mb-2">Show Mermaid Code</summary>
                               <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto font-mono text-slate-700 dark:text-slate-300">
                                   {result.mermaidCode}
                               </pre>
                           </details>
                       </div>
                   </>
               ) : (
                   <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                       <Network size={64} className="mb-4 opacity-50" />
                       <p>Generate a diagram to see it here.</p>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default FlowchartGenerator;
