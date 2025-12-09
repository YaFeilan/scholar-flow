
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Send, Loader2, X, MessageSquare, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Sun, Moon, Eye, GripVertical, Minus, Maximize2, Sparkles, Languages, BookOpen, Image as ImageIcon, Link as LinkIcon, Quote, LayoutList, Crop, MousePointer2, ChevronDown, ChevronRight as ChevronRightIcon, List, Lightbulb, Rocket, Search, Bot, Mic } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { performPDFChat, explainVisualContent, explainPaperInPlainLanguage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import * as pdfjsLib from 'pdfjs-dist';

// Robust PDF.js Initialization
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;
if (pdfjs && typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PDFChatProps {
  language: Language;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  initialFile?: File | null;
}

type ReadingTheme = 'light' | 'dark' | 'sepia';

const PDFChat: React.FC<PDFChatProps> = ({ language, sidebarCollapsed, setSidebarCollapsed, initialFile }) => {
  const t = TRANSLATIONS[language].pdfChat;
  
  // File State
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Viewer State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2); 
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout & Theme State
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light');

  // Chat State
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mentor Loading State
  const [loadingMessage, setLoadingMessage] = useState('');

  // Interaction State
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
  const [referencePopup, setReferencePopup] = useState<{x: number, y: number, id: string, type: 'ref' | 'fig', content?: string, loading?: boolean} | null>(null);
  
  // Box Selection State
  const [toolMode, setToolMode] = useState<'text' | 'box'>('text');
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [boxSelection, setBoxSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [boxStart, setBoxStart] = useState<{x: number, y: number} | null>(null);
  const [showBoxMenu, setShowBoxMenu] = useState(false);
  
  // Drag & Drop State
  const [isDragOver, setIsDragOver] = useState(false);

  // Mock Outline Data
  const mockOutline = [
      { title: '1. Introduction', page: 1 },
      { title: '2. Model', page: 2, children: [
          { title: '2.1 SDM', page: 3 },
          { title: '2.2 Data', page: 4 }
      ]},
      { title: '3. Result', page: 5 },
      { title: '4. Discussion', page: 7 },
      { title: '5. Conclusion', page: 8 }
  ];

  // Insight Cards Data
  const [insightCards, setInsightCards] = useState<any[]>([]);

  // Mentor Loading Messages
  const mentorMessages = language === 'ZH' ? [
      "导师正在查阅专业字典...",
      "导师正在给通讯作者发邮件确认细节...",
      "导师正在分析实验方法论...",
      "导师正在回顾相关引用文献...",
      "导师正在整理逻辑框架...",
      "导师正在喝口咖啡提神..."
  ] : [
      "Mentor is consulting the dictionary...",
      "Mentor is emailing the corresponding author...",
      "Mentor is analyzing the methodology...",
      "Mentor is reviewing citations...",
      "Mentor is organizing the logic framework...",
      "Mentor is grabbing a coffee..."
  ];

  // Loading Message Cycle Effect
  useEffect(() => {
      let interval: any;
      if (chatLoading) {
          let index = 0;
          setLoadingMessage(mentorMessages[0]);
          interval = setInterval(() => {
              index = (index + 1) % mentorMessages.length;
              setLoadingMessage(mentorMessages[index]);
          }, 2500); // Change message every 2.5s
      }
      return () => clearInterval(interval);
  }, [chatLoading, language]);

  // Effect to load initial file
  useEffect(() => {
      if (initialFile) {
          processFile(initialFile);
      }
  }, [initialFile]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText, insightCards]);

  // Load PDF Document or Image
  useEffect(() => {
    if (fileUrl && file) {
      if (file.type === 'application/pdf') {
          setIsImage(false);
          const loadPdf = async () => {
            try {
              setPdfLoading(true);
              setLoadProgress(10);
              
              if (!pdfjs) throw new Error("PDF.js library not loaded");

              const loadingTask = pdfjs.getDocument(fileUrl);
              loadingTask.onProgress = (progress: any) => {
                 if (progress.total > 0) {
                     const percent = (progress.loaded / progress.total) * 100;
                     setLoadProgress(Math.min(90, percent));
                 }
              };

              const pdf = await loadingTask.promise;
              setPdfDoc(pdf);
              setNumPages(pdf.numPages);
              setPageNum(1);
              setLoadProgress(100);
              setPdfLoading(false);

              // Auto-trigger simple explanation on load if history is empty
              if (history.length === 0) {
                  setChatLoading(true);
                  // Simulate initial analysis
                  setTimeout(async () => {
                      try {
                          const explanation = await explainPaperInPlainLanguage(file, language);
                          setHistory([{ role: 'model', text: explanation }]);
                      } catch (e) {
                          console.error(e);
                      }
                      setChatLoading(false);
                  }, 1000);
              }

            } catch (error) {
              console.error("Error loading PDF:", error);
              setPdfLoading(false);
              setLoadProgress(0);
            }
          };
          loadPdf();
      } else if (file.type.startsWith('image/')) {
          setIsImage(true);
      }
    }
  }, [fileUrl]); 

  // Render Page (Canvas + TextLayer) - ONLY FOR PDF
  useEffect(() => {
    if (isImage) return;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

      if (renderTaskRef.current) {
         try { await renderTaskRef.current.cancel(); } catch (e) {}
      }

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const textLayerDiv = textLayerRef.current;

        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;
        textLayerDiv.style.setProperty('--scale-factor', `${scale}`);

        if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;
            await renderTask.promise;

            const textContent = await page.getTextContent();
            
            // Check if renderTextLayer exists (it might be in pdfjsLib depending on build)
            if (pdfjs.renderTextLayer) {
                pdfjs.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
            }
            
            setTimeout(() => {
                const spans = textLayerDiv.querySelectorAll('span');
                spans.forEach((span) => {
                    const text = span.textContent || '';
                    if (/^\[\d+\]$/.test(text.trim()) || /^(Fig\.?|Figure|Table)\s?\d+/.test(text.trim())) {
                        span.classList.add('clickable-ref');
                        span.onclick = (e) => handleRefClick(e, text.trim());
                    }
                });
            }, 100);
        }
      } catch (error: any) {
          if (error.name !== 'RenderingCancelledException') console.error('Render error:', error);
      }
    };

    renderPage();
  }, [pdfDoc, pageNum, scale, isImage]);

  const processFile = (selectedFile: File) => {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setHistory([]); 
      setInsightCards([]);
      setStreamingText('');
      setPdfDoc(null);
      setSidebarCollapsed(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processFile(e.dataTransfer.files[0]);
      }
  };

  const changePage = (delta: number) => {
      const newPage = pageNum + delta;
      if (newPage >= 1 && newPage <= numPages) setPageNum(newPage);
  };

  // --- Interaction Handlers ---

  const handleTextSelection = (e: React.MouseEvent) => {
      if (toolMode === 'box') return; 
      if (isImage) return; 
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 2) {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          
          if (rect) {
              setSelectionMenu({
                  x: rect.left + (rect.width / 2),
                  y: rect.top - 10,
                  text: text
              });
              setReferencePopup(null);
          }
      } else {
          setSelectionMenu(null);
      }
  };

  const handleMenuAction = async (action: 'explain' | 'note') => {
      if (!selectionMenu) return;
      const text = selectionMenu.text;
      setSelectionMenu(null);

      let prompt = '';
      if (action === 'explain') {
          prompt = `Explain this text: "${text}"`;
          await executeChat(prompt);
      } else {
          // Note action: Just add to chat for now or local notes
          const noteMsg = `Added note for: "${text.substring(0, 20)}..."`;
          setHistory(prev => [...prev, { role: 'model', text: `📝 **Note Saved:** ${text}` }]);
      }
  };

  const handleRefClick = async (e: MouseEvent, text: string) => {
      if (toolMode === 'box') return;
      e.stopPropagation(); 
      
      const isCitation = /^\[\d+\]$/.test(text);
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      
      setReferencePopup({
          x: rect.left + (rect.width/2),
          y: rect.bottom + 10,
          id: text,
          type: isCitation ? 'ref' : 'fig',
          loading: true
      });

      if (isCitation) {
          const prompt = `Locate reference ${text} and summarize it.`;
          const ac = new AbortController();
          await performPDFChat(prompt, language, file!, [], () => {}, ac.signal).then((res) => {
              setReferencePopup(prev => prev ? {...prev, loading: false, content: res} : null);
          });
      }
  };

  const executeChat = async (msg: string) => {
    // If no file is loaded, we can't really chat with PDF, but maybe chat generally?
    // For now, require file for PDF chat context or just echo.
    if (!file) {
        alert("Please upload a file first.");
        return;
    }
    
    setHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    setInput('');
    
    const ac = new AbortController();
    setAbortController(ac);

    try {
        const fullResponse = await performPDFChat(
            msg,
            language,
            file,
            history.map(h => ({ role: h.role === 'model' ? 'model' : 'user', text: h.text })),
            (partial) => setStreamingText(partial),
            ac.signal
        );
        setHistory(prev => [...prev, { role: 'model', text: fullResponse }]);
    } catch (e) { console.error(e); }
    
    setStreamingText('');
    setChatLoading(false);
    setAbortController(null);
  };

  const highlightSource = (snippet: string) => {
      if (!textLayerRef.current) return;
      
      const existing = Array.from(textLayerRef.current.querySelectorAll('.ai-highlight')) as HTMLElement[];
      existing.forEach(el => el.classList.remove('ai-highlight'));

      const spans = Array.from(textLayerRef.current.querySelectorAll('span')) as HTMLSpanElement[];
      for (const span of spans) {
          if (span.textContent && span.textContent.includes(snippet.trim())) {
              span.classList.add('ai-highlight');
              span.scrollIntoView({ behavior: 'smooth', block: 'center' });
              break; 
          }
      }
  };

  // --- Box Selection Logic --- (Simplified for brevity, similar to previous)
  const getRelativeCoords = (e: React.MouseEvent) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
          x: e.clientX - rect.left + containerRef.current.scrollLeft,
          y: e.clientY - rect.top + containerRef.current.scrollTop
      };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (toolMode !== 'box') return;
      e.preventDefault();
      const coords = getRelativeCoords(e);
      setBoxStart(coords);
      setBoxSelection({ x: coords.x, y: coords.y, w: 0, h: 0 });
      setIsSelectingBox(true);
      setShowBoxMenu(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isSelectingBox || !boxStart) return;
      e.preventDefault();
      const coords = getRelativeCoords(e);
      const width = Math.abs(coords.x - boxStart.x);
      const height = Math.abs(coords.y - boxStart.y);
      const x = Math.min(coords.x, boxStart.x);
      const y = Math.min(coords.y, boxStart.y);
      setBoxSelection({ x, y, w: width, h: height });
  };

  const handleMouseUp = () => {
      if (isSelectingBox && boxSelection && boxSelection.w > 10 && boxSelection.h > 10) {
          setShowBoxMenu(true);
      } else {
          setBoxSelection(null); 
      }
      setIsSelectingBox(false);
      setBoxStart(null);
  };

  const getContainerStyle = () => {
      switch (readingTheme) {
          case 'dark': return 'bg-slate-900';
          case 'sepia': return 'bg-[#f4ecd8]';
          default: return 'bg-slate-100';
      }
  };
  
  const getCanvasStyle = () => {
      switch (readingTheme) {
          case 'dark': return 'filter invert-[0.9] hue-rotate-180 contrast-[0.8]';
          case 'sepia': return 'filter sepia-[0.25] contrast-[0.95]';
          default: return '';
      }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-900 relative text-slate-800 dark:text-slate-100" onClick={() => { setSelectionMenu(null); setReferencePopup(null); }}>
      
      {!file && (
         <div 
            className={`flex-grow flex flex-col items-center justify-center p-8 text-center animate-fadeIn w-full bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 relative overflow-hidden transition-colors ${isDragOver ? 'bg-blue-100/50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
         >
            {/* Decorative Background Circles */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="z-10 max-w-2xl w-full flex flex-col items-center gap-8">
                {/* Robot & Message Bubble */}
                <div className="relative">
                     <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full shadow-lg flex items-center justify-center mb-6 mx-auto relative z-10">
                         <Bot size={48} className="text-white" />
                     </div>
                     
                     {/* Bubble */}
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-indigo-50 dark:border-slate-700 relative text-left">
                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-800 border-t border-l border-indigo-50 dark:border-slate-700 transform rotate-45"></div>
                         <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-medium">
                             {language === 'ZH' 
                                ? "同学你好，我是你的科研导师 AI。今天想研究什么？把文献交给我，我用大白话讲给你听，复杂的术语统统‘翻译’成人话！" 
                                : "Hello! I'm your Research Mentor AI. What are we exploring today? Hand me a paper, and I'll explain it in plain English—translating all that complex jargon into something human!"}
                         </p>
                     </div>
                </div>

                {/* Action Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Mic size={20} />
                    {language === 'ZH' ? '一键通俗语音解读' : 'Plain Language Explain'}
                </button>

                {/* Spacer */}
                <div className="h-4"></div>

                {/* Bottom Input Bar (Floating) */}
                <div className="w-full bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 transform transition-all hover:scale-[1.01]">
                     <div 
                        className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                     >
                         <Upload className="text-white" size={24} />
                     </div>
                     <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                     <input 
                        className="flex-grow bg-transparent border-none outline-none text-lg px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                        placeholder={language === 'ZH' ? "与导师对话或拖入 PDF..." : "Chat with mentor or drag PDF..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && input.trim()) {
                                // Since no file, we can't do RAG, but maybe basic chat? 
                                // For now, trigger file upload if they try to chat without file
                                if (!file) fileInputRef.current?.click();
                            }
                        }}
                     />
                     <button className="p-3 text-slate-400 hover:text-blue-600 transition-colors">
                         <Send size={24} />
                     </button>
                </div>
            </div>
         </div>
      )}

      {file && fileUrl && (
         <div className="flex w-full h-full relative overflow-hidden">
            
            {/* 1. Left Outline Panel */}
            <div className={`flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col ${outlineOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>{language === 'ZH' ? '大纲结构' : 'Outline'}</span>
                    <button onClick={() => setOutlineOpen(false)}><PanelLeftClose size={16} /></button>
                </div>
                <div className="flex-grow overflow-y-auto p-2">
                    {mockOutline.map((item, idx) => (
                        <div key={idx} className="mb-1">
                            <div className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                                {item.children ? <ChevronDown size={14} /> : <FileText size={14} className="text-slate-400" />}
                                <span>{item.title}</span>
                            </div>
                            {item.children && (
                                <div className="ml-4 border-l border-slate-200 dark:border-slate-700 pl-2">
                                    {item.children.map((child, cIdx) => (
                                        <div key={cIdx} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                            <FileText size={12} className="text-slate-300" /> {child.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Center PDF Viewer */}
            <div className="flex-grow flex flex-col relative min-w-0 bg-slate-100 dark:bg-slate-900/50">
                {/* PDF Toolbar */}
                <div className="h-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-10 shadow-sm">
                   <div className="flex items-center gap-2">
                      {!outlineOpen && (
                          <button onClick={() => setOutlineOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500">
                             <PanelLeftOpen size={18} />
                          </button>
                      )}
                      {!sidebarCollapsed && (
                          <button onClick={() => setSidebarCollapsed(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500">
                             <PanelLeftClose size={18} />
                          </button>
                      )}
                      <span className="font-bold text-sm truncate max-w-[200px]">{file.name}</span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                       <button onClick={() => changePage(-1)} disabled={pageNum <= 1} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronLeft size={16} /></button>
                       <span className="text-xs font-mono font-bold">{pageNum} / {numPages}</span>
                       <button onClick={() => changePage(1)} disabled={pageNum >= numPages} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronRight size={16} /></button>
                       <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                       <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomOut size={16} /></button>
                       <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomIn size={16} /></button>
                   </div>
                </div>

                {/* Canvas */}
                <div 
                  ref={containerRef}
                  className={`flex-grow overflow-auto relative flex items-start justify-center p-8 transition-colors duration-300 ${getContainerStyle()} ${toolMode === 'box' ? 'cursor-crosshair' : ''}`}
                  onMouseUp={(e) => { toolMode === 'text' ? handleTextSelection(e) : handleMouseUp() }}
                  onMouseDown={(e) => { toolMode === 'box' && handleMouseDown(e) }}
                  onMouseMove={(e) => { toolMode === 'box' && handleMouseMove(e) }}
                >
                   {pdfLoading && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-sm bg-white/80">
                           <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                           <span className="text-sm font-bold text-slate-500">Loading PDF...</span>
                       </div>
                   )}
                   
                   <div className="relative shadow-2xl transition-all duration-300 group">
                      <canvas ref={canvasRef} className={`block ${getCanvasStyle()}`} />
                      <div ref={textLayerRef} className={`textLayer ${toolMode === 'box' ? 'pointer-events-none' : ''}`} />
                   </div>

                   {/* Selection Menu (Minimal Pill) */}
                   {selectionMenu && toolMode === 'text' && (
                       <div 
                         className="fixed z-50 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-1 animate-fadeIn transform -translate-x-1/2"
                         style={{ left: selectionMenu.x, top: selectionMenu.y }}
                         onMouseDown={e => e.stopPropagation()}
                       >
                           <button onClick={() => handleMenuAction('explain')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-xs font-bold transition-colors">
                               <Search size={12} className="text-blue-500" /> {language === 'ZH' ? '解释' : 'Explain'}
                           </button>
                           <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                           <button onClick={() => handleMenuAction('note')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-xs font-bold transition-colors">
                               <Quote size={12} className="text-amber-500" /> {language === 'ZH' ? '笔记' : 'Note'}
                           </button>
                       </div>
                   )}
                </div>
            </div>

            {/* 3. Right AI Assistant Panel */}
            <div className="w-[380px] flex-shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-20">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-500" />
                    {language === 'ZH' ? 'AI 助手面板' : 'AI Assistant'}
                </div>

                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="space-y-4">
                        {/* Chat History */}
                        {history.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'}`}>
                                    <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-3 text-sm text-slate-500 animate-fadeIn">
                                    <Loader2 size={16} className="animate-spin text-blue-600" /> 
                                    <span className="font-medium animate-pulse">{loadingMessage || 'Thinking...'}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeChat(input)}
                            placeholder={language === 'ZH' ? "问问关于模型的问题..." : "Ask about the model..."}
                            disabled={chatLoading}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all shadow-inner"
                        />
                        <button 
                           onClick={() => executeChat(input)}
                           disabled={!input.trim()}
                           className="absolute right-2 top-2 p-1.5 bg-white dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default PDFChat;
