
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, FileText, BarChart2, Table, MessageSquare, Loader2, Send, Download, Settings, RefreshCw, PieChart, TrendingUp, AlertCircle, X, Check, Calculator, Bot, Sparkles } from 'lucide-react';
import { performDataAnalysis, chatWithDataAnalysis } from '../services/geminiService';
import { Language, DataAnalysisResult } from '../types';
import { TRANSLATIONS } from '../translations';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';

interface DataAnalysisProps {
  language: Language;
  initialData?: any[][] | null;
}

type TabView = 'overview' | 'stats' | 'ai' | 'chat';

const DataAnalysis: React.FC<DataAnalysisProps> = ({ language, initialData }) => {
  const t = TRANSLATIONS[language].data;
  
  // Data State
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Analysis State
  const [columnStats, setColumnStats] = useState<any[]>([]);
  const [aiResult, setAiResult] = useState<DataAnalysisResult | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with passed data if available
  useEffect(() => {
    if (initialData && initialData.length > 0) {
        const [headerRow, ...dataRows] = initialData;
        setHeaders(headerRow);
        const processedRows = dataRows.map(r => {
            const obj: any = {};
            headerRow.forEach((h: string, i: number) => {
                obj[h] = r[i];
            });
            return obj;
        });
        setRows(processedRows);
        setFileName("Imported Data");
        calculateStats(headerRow, processedRows);
    }
  }, [initialData]);

  // Scroll chat
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setFileName(file.name);
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          if (data.length > 0) {
              const [headerRow, ...dataRows] = data;
              // Clean headers
              const cleanHeaders = headerRow.map(h => String(h || 'Untitled'));
              setHeaders(cleanHeaders);
              
              const processedRows = dataRows.map(r => {
                  const obj: any = {};
                  cleanHeaders.forEach((h, i) => {
                      obj[h] = r[i];
                  });
                  return obj;
              });
              setRows(processedRows);
              calculateStats(cleanHeaders, processedRows);
          }
          setLoading(false);
      };
      reader.readAsBinaryString(file);
  };

  const calculateStats = (cols: string[], data: any[]) => {
      const stats = cols.map(col => {
          const values = data.map(r => r[col]).filter(v => v !== undefined && v !== null && v !== '');
          const isNumeric = values.every(v => !isNaN(Number(v)));
          
          if (isNumeric && values.length > 0) {
              const nums = values.map(v => Number(v)).sort((a, b) => a - b);
              const sum = nums.reduce((a, b) => a + b, 0);
              const mean = sum / nums.length;
              const min = nums[0];
              const max = nums[nums.length - 1];
              const median = nums[Math.floor(nums.length / 2)];
              
              // Create bins for histogram
              const range = max - min || 1;
              const binSize = range / 5;
              const bins = Array.from({length: 5}, (_, i) => ({
                  range: `${(min + i*binSize).toFixed(1)}-${(min + (i+1)*binSize).toFixed(1)}`,
                  count: nums.filter(n => n >= min + i*binSize && n < min + (i+1)*binSize).length
              }));
              // Fix last bin inclusion
              bins[4].count += nums.filter(n => n === max).length;

              return { name: col, type: 'Numeric', mean: mean.toFixed(2), min, max, median, missing: data.length - values.length, chartData: bins };
          } else {
              // Categorical
              const counts: Record<string, number> = {};
              values.forEach(v => counts[String(v)] = (counts[String(v)] || 0) + 1);
              const unique = Object.keys(counts).length;
              const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ name: k, value: v }));
              
              return { name: col, type: 'Categorical', unique, missing: data.length - values.length, chartData: top };
          }
      });
      setColumnStats(stats);
  };

  const handleAIAnalysis = async () => {
      if (rows.length === 0) return;
      setAnalyzing(true);
      
      // Prepare a sample of data + stats for the AI
      const sampleRows = rows.slice(0, 20); // First 20 rows
      const statsContext = {
          rowCount: rows.length,
          columns: columnStats.map(c => ({ name: c.name, type: c.type, mean: c.mean, unique: c.unique, missing: c.missing }))
      };
      
      const payload = {
          stats: statsContext,
          sample: sampleRows
      };

      try {
          const result = await performDataAnalysis(payload, language);
          setAiResult(result);
      } catch (e) {
          console.error(e);
      }
      setAnalyzing(false);
  };

  const handleChat = async () => {
      if (!chatInput.trim() || rows.length === 0) return;
      const msg = chatInput;
      setChatInput('');
      setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
      setChatLoading(true);

      const statsContext = {
          rowCount: rows.length,
          columns: columnStats.map(c => ({ name: c.name, type: c.type, mean: c.mean, unique: c.unique }))
      };

      try {
          const result = await chatWithDataAnalysis(msg, statsContext, language);
          setChatHistory(prev => [...prev, { role: 'ai', text: result }]);
      } catch (e) {
          setChatHistory(prev => [...prev, { role: 'ai', text: "Error processing request." }]);
      }
      setChatLoading(false);
  };

  const renderContent = () => {
      if (loading) {
          return (
              <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                  <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                  <p>Processing Data...</p>
              </div>
          );
      }

      if (rows.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center h-96 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-4">
                      <Upload size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">{t.upload}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">CSV, Excel (XLSX)</p>
                  <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md"
                  >
                      Browse Files
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.xlsx,.xls" />
              </div>
          );
      }

      switch (activeTab) {
          case 'overview':
              return (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                          <h3 className="font-bold text-slate-700 dark:text-slate-200">{fileName} ({rows.length} rows)</h3>
                          <span className="text-xs text-slate-500">{headers.length} Columns</span>
                      </div>
                      <div className="flex-grow overflow-auto">
                          <table className="w-full text-sm text-left border-collapse">
                              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase sticky top-0 z-10">
                                  <tr>
                                      {headers.map((h, i) => (
                                          <th key={i} className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700 last:border-r-0 whitespace-nowrap">
                                              {h}
                                          </th>
                                      ))}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                  {rows.slice(0, 100).map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                          {headers.map((h, j) => (
                                              <td key={j} className="px-4 py-2 border-r border-slate-100 dark:border-slate-700 last:border-r-0 truncate max-w-[200px] text-slate-600 dark:text-slate-400">
                                                  {row[h]}
                                              </td>
                                          ))}
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          {rows.length > 100 && (
                              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                                  Showing first 100 rows of {rows.length}
                              </div>
                          )}
                      </div>
                  </div>
              );

          case 'stats':
              return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-4">
                      {columnStats.map((col, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-72">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate w-40" title={col.name}>{col.name}</h4>
                                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${col.type === 'Numeric' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                          {col.type}
                                      </span>
                                  </div>
                                  <div className="text-right text-xs text-slate-500">
                                      {col.missing > 0 && <span className="text-red-500 block">{col.missing} missing</span>}
                                      {col.type === 'Numeric' && <span className="block">Mean: {col.mean}</span>}
                                      {col.type === 'Categorical' && <span className="block">{col.unique} unique</span>}
                                  </div>
                              </div>
                              <div className="flex-grow min-h-0">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={col.chartData}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                          <XAxis dataKey={col.type === 'Numeric' ? 'range' : 'name'} tick={{fontSize: 9}} interval={0} angle={-30} textAnchor="end" height={40} />
                                          <YAxis tick={{fontSize: 10}} width={30} />
                                          <Tooltip 
                                              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                              cursor={{fill: 'transparent'}}
                                          />
                                          <Bar dataKey={col.type === 'Numeric' ? 'count' : 'value'} fill={col.type === 'Numeric' ? '#3b82f6' : '#8b5cf6'} radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      ))}
                  </div>
              );

          case 'ai':
              return (
                  <div className="h-full flex flex-col">
                      {!aiResult ? (
                          <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                              <Bot size={64} className="text-emerald-500 mb-6" />
                              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">AI Data Scientist</h3>
                              <p className="text-slate-500 max-w-md mb-8">
                                  Generate automated insights, find correlations, and get modeling recommendations based on your dataset structure.
                              </p>
                              <button 
                                  onClick={handleAIAnalysis}
                                  disabled={analyzing}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-3 disabled:opacity-70"
                              >
                                  {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                  {analyzing ? 'Analyzing Data...' : 'Generate Insights Report'}
                              </button>
                          </div>
                      ) : (
                          <div className="flex-grow overflow-y-auto pr-2 space-y-6 animate-fadeIn">
                              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                  <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
                                      <FileText size={24} />
                                      <h3 className="text-xl font-bold">Executive Summary</h3>
                                  </div>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                                      <ReactMarkdown>{aiResult.summary}</ReactMarkdown>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                          <TrendingUp className="text-blue-500" /> Key Correlations
                                      </h4>
                                      <div className="space-y-3">
                                          {aiResult.correlations.map((corr, i) => (
                                              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{corr.pair}</span>
                                                  <div className="flex items-center gap-3">
                                                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                          <div className={`h-full ${corr.value > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${Math.abs(corr.value) * 100}%`}}></div>
                                                      </div>
                                                      <span className="text-xs font-mono font-bold w-8 text-right">{corr.value.toFixed(2)}</span>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                          <Settings className="text-purple-500" /> Recommended Models
                                      </h4>
                                      <div className="space-y-4">
                                          {aiResult.recommendedModels.map((model, i) => (
                                              <div key={i} className="group border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-purple-300 transition-colors">
                                                  <div className="flex justify-between items-start mb-2">
                                                      <span className="font-bold text-sm text-purple-700 dark:text-purple-400">{model.name}</span>
                                                  </div>
                                                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{model.reason}</p>
                                                  <div className="bg-slate-900 text-slate-300 p-2 rounded text-[10px] font-mono overflow-x-auto">
                                                      {model.codeSnippet}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                              <div className="flex justify-center pt-4">
                                  <button onClick={() => setAiResult(null)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-2">
                                      <RefreshCw size={14} /> Regenerate Analysis
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              );

          case 'chat':
              return (
                  <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                          {chatHistory.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                  <MessageSquare size={48} className="mb-4 opacity-50" />
                                  <p>Ask questions about your data.</p>
                                  <p className="text-xs mt-2">"What is the average of column X?" "Show trends for Y."</p>
                              </div>
                          )}
                          {chatHistory.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}>
                                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                                  </div>
                              </div>
                          ))}
                          {chatLoading && (
                              <div className="flex justify-start">
                                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
                                      <Loader2 size={16} className="animate-spin text-slate-400" />
                                  </div>
                              </div>
                          )}
                          <div ref={messagesEndRef} />
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                          <div className="relative">
                              <input 
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                                  placeholder="Ask a data question..."
                                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <button 
                                  onClick={handleChat}
                                  disabled={!chatInput.trim() || chatLoading}
                                  className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                  <Send size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              );
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6 flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BarChart2 className="text-blue-600" /> {t.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
          </div>
          {rows.length > 0 && (
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}><Table size={14} /> Data</button>
                  <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'stats' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}><BarChart2 size={14} /> Stats</button>
                  <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'ai' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-500'}`}><Sparkles size={14} /> AI Insights</button>
                  <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}><MessageSquare size={14} /> Chat</button>
              </div>
          )}
       </div>

       <div className="flex-grow overflow-hidden">
           {renderContent()}
       </div>
    </div>
  );
};

export default DataAnalysis;
