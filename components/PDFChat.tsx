
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Send, Loader2, X, MessageSquare, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Sun, Moon, Eye, GripVertical, Minus, Maximize2, Sparkles, Languages, BookOpen, Image as ImageIcon, Link as LinkIcon, Quote, LayoutList, Crop, MousePointer2, ChevronDown, ChevronRight as ChevronRightIcon, List, Lightbulb, Rocket, Search } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { performPDFChat, explainVisualContent } from '../services/geminiService';
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

  // Interaction State
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
  const [referencePopup, setReferencePopup] = useState<{x: number, y: number, id: string, type: 'ref' | 'fig', content?: string, loading?: boolean} | null>(null);
  
  // Box Selection State
  const [toolMode, setToolMode] = useState<'text' | 'box'>('text');
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [boxSelection, setBoxSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [boxStart, setBoxStart] = useState<{x: number, y: number} | null>(null);
  const [showBoxMenu, setShowBoxMenu] = useState(false);

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

              // Generate Mock Insights for UI Demo
              setTimeout(() => {
                  setInsightCards([
                      {
                          type: 'conclusion',
                          title: language === 'ZH' ? '核心结论卡片' : 'Core Conclusion Card',
                          icon: <Rocket size={14} />,
                          content: language === 'ZH' 
                              ? '确认存在倒U型曲线关系，并深入探讨了环境经济学基于程中，在环境经济的导向曲线关系。' 
                              : 'Confirmed an inverted U-shaped relationship, exploring the directional curve relationship in environmental economics.',
                          tags: ['#EnvironmentalEcon', '#SpatialEconometrics']
                      },
                      {
                          type: 'reviewer',
                          title: language === 'ZH' ? '审稿人视角卡片' : 'Reviewer Perspective Card',
                          icon: <Lightbulb size={14} />,
                          content: language === 'ZH' 
                              ? '内生性处理建议：建议增加工具变量(IV)，内生性处理将变量审稿构建设拒稿，建议应生性出现变量的建议，并近可调预波向完全均用的问题。' 
                              : 'Endogeneity suggestion: Add Instrumental Variables (IV). Current handling might face rejection risks. Suggest addressing variable emergence.',
                          tags: []
                      }
                  ]);
              }, 1500);

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
    if (!file) return;
    setHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    
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

  const MarkdownComponents = {
      a: ({ node, href, children, ...props }: any) => {
          if (href?.startsWith('source:')) {
              const snippet = href.replace('source:', '');
              return (
                  <button 
                    onClick={() => highlightSource(snippet)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors mx-1 align-middle"
                  >
                      <Quote size={10} /> {children}
                  </button>
              );
          }
          return <a href={href} {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{children}</a>;
      }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-900 relative text-slate-800 dark:text-slate-100" onClick={() => { setSelectionMenu(null); setReferencePopup(null); }}>
      
      {!file && (
         <div className="flex-grow flex flex-col items-center justify-center p-8 text-center animate-fadeIn w-full">
            <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-full max-w-xl p-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:bg-white dark:hover:bg-slate-800/50 cursor-pointer flex flex-col items-center group transition-colors"
            >
               <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
               <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={40} />
               </div>
               <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">{t.upload}</h3>
               <p className="text-slate-500 dark:text-slate-400">{t.dragDrop}</p>
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
                        {/* Insight Cards Area */}
                        {insightCards.map((card, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn">
                                <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <span className={card.type === 'conclusion' ? 'text-green-500' : 'text-amber-500'}>{card.title}</span>
                                    {card.type === 'conclusion' && <span className="bg-green-100 text-green-700 p-0.5 rounded-full"><Check size={8} /></span>}
                                </div>
                                <div className="flex gap-3">
                                    <div className={`mt-1 p-2 rounded-lg h-fit flex-shrink-0 ${card.type === 'conclusion' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {card.icon}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                        {card.content}
                                    </p>
                                </div>
                                {card.tags && card.tags.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {card.tags.map((tag: string, tIdx: number) => (
                                            <span key={tIdx} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded-full font-bold">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Chat History */}
                        {history.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'}`}>
                                    <ReactMarkdown className="prose prose-sm max-w-none">{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-sm text-slate-500">
                                    <Loader2 size={16} className="animate-spin" /> Thinking...
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

// Helper components for icons used in cards
const Check = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export default PDFChat;
