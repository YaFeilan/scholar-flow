
import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, FileText, Upload, RefreshCw, AlertTriangle, CheckCircle, Copy, MoveRight, Loader2, X, Trash2, History, Clock, FileType, Link as LinkIcon, Settings, Search, BarChart } from 'lucide-react';
import { Language, AIDetectionResult, AIHumanizeResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { detectAIContent, humanizeText } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AIDetectorProps {
  language: Language;
}

interface DetectionHistoryItem {
  id: string;
  excerpt: string;
  score: number;
  timestamp: number;
  result: AIDetectionResult;
}

const AIDetector: React.FC<AIDetectorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].aiDetector;
  
  // Input State
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Configuration State
  const [sensitivity, setSensitivity] = useState<'Standard' | 'Strict'>('Standard');
  const [domain, setDomain] = useState<'Academic' | 'Media' | 'General'>('Academic');

  // Process State
  const [detecting, setDetecting] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null);
  
  const [humanizing, setHumanizing] = useState(false);
  const [humanizeResult, setHumanizeResult] = useState<AIHumanizeResult | null>(null);
  
  const [history, setHistory] = useState<DetectionHistoryItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Rotating Placeholder State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholders = language === 'ZH' 
    ? ["在此粘贴文本 (最少100字)...", "支持论文、公文、博客文章检测...", "快速识别 AI 生成痕迹..."]
    : ["Paste text here (min 100 words)...", "Supports papers, essays, and blogs...", "Detect AI patterns instantly..."];

  const progressSteps = language === 'ZH'
    ? ["正在分析句法结构...", "正在检测困惑度 (Perplexity)...", "正在比对 AI 数据库...", "生成最终报告..."]
    : ["Analyzing syntax structure...", "Checking text perplexity...", "Comparing with AI models...", "Finalizing report..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [language]);

  // Progress Timer
  useEffect(() => {
      let step = 0;
      let interval: any;
      if (detecting) {
          setProgressMessage(progressSteps[0]);
          interval = setInterval(() => {
              step = (step + 1) % progressSteps.length;
              setProgressMessage(progressSteps[step]);
          }, 1500); // Change message every 1.5s
      }
      return () => clearInterval(interval);
  }, [detecting, language]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
      setFile(selectedFile);
      setText(''); // Clear text input if file is selected
      setActiveTab('file');
      
      // If it's a text file, read it for preview
      if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) setText(ev.target.result as string);
          };
          reader.readAsText(selectedFile);
      } else {
          setText(`[File Selected: ${selectedFile.name}]`);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFile(e.dataTransfer.files[0]);
      }
  };

  const handleCheck = async () => {
      const content = activeTab === 'file' ? file : (activeTab === 'url' ? `Check URL Content: ${url}` : text);
      if (!content && !text && !url) return;

      setDetecting(true);
      setDetectionResult(null);
      setHumanizeResult(null); // Reset previous humanization
      
      // Append config to prompt context implicitly
      const contextPrefix = `[Config: Sensitivity=${sensitivity}, Domain=${domain}] `;
      const finalInput = typeof content === 'string' ? contextPrefix + content : content;

      const result = await detectAIContent(finalInput, language);
      
      if (result) {
          setDetectionResult(result);
          // Add to history
          const newItem: DetectionHistoryItem = {
              id: Date.now().toString(),
              excerpt: activeTab === 'file' && file ? file.name : (activeTab === 'url' ? url : text.substring(0, 60) + '...'),
              score: result.score,
              timestamp: Date.now(),
              result: result
          };
          setHistory(prev => [newItem, ...prev]);
      }
      setDetecting(false);
  };

  const loadHistoryItem = (item: DetectionHistoryItem) => {
      setDetectionResult(item.result);
      setHumanizeResult(null);
      // Restore input logic simplified
      if (item.excerpt.startsWith('http')) {
          setActiveTab('url');
          setUrl(item.excerpt);
      } else if (item.excerpt.includes('.')) { // Rough check for filename
           // Can't restore File object easily, just switch tab
           setActiveTab('file');
      } else {
           setActiveTab('text');
           setText(item.excerpt); // Only partial text restoration in this demo structure
      }
  };

  const handleHumanize = async () => {
      setHumanizing(true);
      const inputContent = activeTab === 'file' && file ? "Please process the uploaded file content." : (activeTab === 'url' ? `Content from ${url}` : text);
      const result = await humanizeText(inputContent, language);
      setHumanizeResult(result);
      setHumanizing(false);
  };

  const handleClearInput = () => {
      setText('');
      setUrl('');
      setFile(null);
      setDetectionResult(null);
      setHumanizeResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyInput = () => {
      if (text) navigator.clipboard.writeText(text);
  };

  const getScoreColor = (score: number) => {
      if (score < 30) return 'text-green-600';
      if (score < 70) return 'text-amber-500';
      return 'text-red-600';
  };

  const highlightText = (fullText: string, highlights: {text: string, score: number}[]) => {
      if (!fullText) return null;
      // Simple highlighting logic
      let parts: {text: string, highlight?: boolean, score?: number}[] = [{text: fullText}];
      
      highlights.forEach(h => {
          const newParts: typeof parts = [];
          parts.forEach(p => {
              if (p.highlight) {
                  newParts.push(p);
              } else {
                  const split = p.text.split(h.text);
                  split.forEach((s, i) => {
                      if (s) newParts.push({text: s});
                      if (i < split.length - 1) newParts.push({text: h.text, highlight: true, score: h.score});
                  });
              }
          });
          parts = newParts;
      });

      return (
          <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-700 dark:text-slate-300">
              {parts.map((p, i) => (
                  <span key={i} className={p.highlight ? (p.score && p.score > 80 ? 'bg-red-200 dark:bg-red-900/50' : 'bg-yellow-200 dark:bg-yellow-900/50') + ' rounded px-0.5' : ''}>
                      {p.text}
                  </span>
              ))}
          </div>
      );
  };

  // Stats calculation
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        <div className="flex-shrink-0 mb-6">
            <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="text-red-600" /> {t.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
        </div>

        <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
            {/* Left Panel: Input & Config */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <div 
                    className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border flex flex-col flex-grow overflow-hidden relative group transition-all duration-300
                        ${isDragOver ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900 scale-[1.02]' : 'border-slate-200 dark:border-slate-700'}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragOver && (
                        <div className="absolute inset-0 bg-blue-50/90 dark:bg-slate-800/90 z-20 flex flex-col items-center justify-center pointer-events-none">
                            <Upload size={48} className="text-blue-500 mb-2 animate-bounce" />
                            <h3 className="text-xl font-bold text-blue-600">Drop File Here</h3>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <button 
                           onClick={() => setActiveTab('text')}
                           className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'text' ? 'bg-white dark:bg-slate-800 text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           <FileText size={14} /> Text
                        </button>
                        <button 
                           onClick={() => setActiveTab('file')}
                           className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'file' ? 'bg-white dark:bg-slate-800 text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           <Upload size={14} /> File
                        </button>
                        <button 
                           onClick={() => setActiveTab('url')}
                           className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'url' ? 'bg-white dark:bg-slate-800 text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           <LinkIcon size={14} /> URL
                        </button>
                    </div>
                    
                    <div className="relative flex-grow flex flex-col bg-white dark:bg-slate-800">
                        {activeTab === 'text' && (
                            <>
                                <textarea 
                                   value={text}
                                   onChange={(e) => setText(e.target.value)}
                                   placeholder={placeholders[placeholderIndex]}
                                   className="flex-grow p-4 pb-8 resize-none outline-none text-sm text-slate-700 dark:text-slate-200 bg-transparent transition-all"
                                />
                                {/* Counts */}
                                <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono pointer-events-none bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded">
                                    {wordCount} words | {charCount} chars
                                </div>
                            </>
                        )}

                        {activeTab === 'file' && (
                            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                <input 
                                   type="file" 
                                   ref={fileInputRef} 
                                   className="hidden" 
                                   accept=".pdf,.docx,.doc,.txt" 
                                   onChange={handleFileChange} 
                                />
                                {file ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <FileText size={32} className="text-blue-500 mx-auto mb-2" />
                                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-3 text-xs text-red-500 hover:underline">Remove</button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={32} className="text-slate-300 mb-2" />
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Click to Upload</p>
                                        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT</p>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'url' && (
                            <div className="flex-grow p-6 flex flex-col justify-center">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2">Article Link</label>
                                <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900">
                                    <LinkIcon size={16} className="text-slate-400" />
                                    <input 
                                       value={url}
                                       onChange={(e) => setUrl(e.target.value)}
                                       placeholder="https://example.com/article..."
                                       className="flex-grow bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Paste a public URL. AI will analyze the main content.</p>
                            </div>
                        )}
                        
                        {/* Quick Actions (Top Right) */}
                        {(text || file || url) && (
                            <div className="absolute top-2 right-2 flex gap-1 bg-white/80 dark:bg-slate-800/80 p-1 rounded-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700 z-10">
                                <button 
                                    onClick={handleClearInput}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 rounded transition-colors"
                                    title="Clear"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Configuration Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Mode</label>
                                <select 
                                   value={sensitivity}
                                   onChange={(e) => setSensitivity(e.target.value as any)}
                                   className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Strict">Strict (High Sensitivity)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Domain</label>
                                <select 
                                   value={domain}
                                   onChange={(e) => setDomain(e.target.value as any)}
                                   className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                                >
                                    <option value="Academic">Academic / Paper</option>
                                    <option value="Media">News / Media</option>
                                    <option value="General">General / Blog</option>
                                </select>
                            </div>
                        </div>

                        <button 
                           onClick={handleCheck}
                           disabled={detecting || (!text && !file && !url)}
                           className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {detecting ? <Loader2 className="animate-spin" size={16} /> : <ShieldAlert size={16} />}
                            {detecting ? progressMessage : t.checkBtn}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Results & History */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                
                {!detectionResult ? (
                    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <BarChart size={18} /> {language === 'ZH' ? '检测预览' : 'Result Preview'}
                        </div>
                        
                        {/* Empty State / Preview Visual */}
                        <div className="flex-grow flex items-center justify-center p-10 bg-slate-50 dark:bg-slate-900/50">
                            <div className="w-full max-w-md opacity-60 pointer-events-none select-none transform scale-95">
                                {/* Visual Mock of a Report */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center text-red-500 font-bold text-xl">85%</div>
                                        <div className="space-y-2 flex-grow">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                        <div className="h-3 bg-red-100 dark:bg-red-900/30 rounded w-full border-l-4 border-red-500"></div>
                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                                        <div className="h-3 bg-yellow-100 dark:bg-yellow-900/30 rounded w-full border-l-4 border-yellow-500"></div>
                                        <div className="h-3 bg-red-100 dark:bg-red-900/30 rounded w-4/5 border-l-4 border-red-500"></div>
                                    </div>
                                </div>
                                <p className="text-center text-slate-400 mt-4 text-sm font-medium">
                                    {language === 'ZH' ? 'AI生成内容将被标记为红色，疑似内容为黄色' : 'AI content highlighted in red, suspicious in yellow'}
                                </p>
                            </div>
                        </div>

                        {/* Recent History Mini-List at Bottom */}
                        {history.length > 0 && (
                            <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Recent Scans</div>
                                <div className="max-h-40 overflow-y-auto">
                                    {history.map((item) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => loadHistoryItem(item)}
                                            className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.score > 50 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{item.score}% AI</span>
                                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{item.excerpt}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <button 
                                onClick={() => setDetectionResult(null)}
                                className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <History size={14} /> Back to History
                            </button>
                        </div>

                        {/* Detection Score Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-fadeIn flex-shrink-0">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Gauge */}
                                <div className="relative w-40 h-40 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                                        <circle 
                                            cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" 
                                            strokeDasharray={440} 
                                            strokeDashoffset={440 - (440 * detectionResult.score) / 100}
                                            className={`${detectionResult.score < 50 ? 'text-green-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-bold ${getScoreColor(detectionResult.score)}`}>{detectionResult.score}%</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">AI Score</span>
                                    </div>
                                </div>

                                {/* Analysis Text */}
                                <div className="flex-grow space-y-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2 flex items-center gap-2">
                                            <AlertTriangle size={20} className={getScoreColor(detectionResult.score)} />
                                            Analysis Report
                                        </h3>
                                        <div className="flex gap-2 mb-3">
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 font-bold">{sensitivity} Mode</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 font-bold">{domain} Domain</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                            {detectionResult.analysis}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                        onClick={handleHumanize}
                                        disabled={humanizing}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-100 dark:shadow-none transition-all disabled:opacity-50"
                                        >
                                            {humanizing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                            {t.humanizeBtn}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Highlights & Humanize Diff */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 min-h-0 flex-grow">
                            {/* Original / Highlights */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden h-[500px]">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20 flex justify-between items-center">
                                    <h4 className="font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
                                        <AlertTriangle size={16} /> {t.highlights}
                                    </h4>
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400">{detectionResult.score}% AI</span>
                                </div>
                                <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                                    {activeTab === 'file' && file ? (
                                        <div className="text-center text-slate-400 mt-10">
                                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Visual highlights available for text input only.</p>
                                            <p className="text-xs mt-2">Check the report for file analysis details.</p>
                                        </div>
                                    ) : (
                                        highlightText(activeTab === 'url' ? "Content fetched from URL..." : text, detectionResult.highlightedSentences)
                                    )}
                                </div>
                            </div>

                            {/* Humanized Result */}
                            {humanizeResult && (
                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden h-[500px] animate-slideInRight">
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/20 flex justify-between items-center">
                                        <h4 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                                            <CheckCircle size={16} /> {t.humanized}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 line-through">{humanizeResult.originalScore}%</span>
                                            <MoveRight size={12} className="text-slate-400" />
                                            <span className="text-xs font-bold text-green-600">{humanizeResult.newScore}% AI</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow p-6 overflow-y-auto custom-scrollbar prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{humanizeResult.text}</ReactMarkdown>
                                    </div>
                                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                        <div className="text-xs text-slate-500 italic max-w-[70%] truncate">
                                            {humanizeResult.changesSummary}
                                        </div>
                                        <button 
                                        onClick={() => navigator.clipboard.writeText(humanizeResult.text)}
                                        className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-xs font-bold"
                                        >
                                            <Copy size={14} /> {t.copy}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default AIDetector;
