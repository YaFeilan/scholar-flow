
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Send, Loader2, X, MessageSquare, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Sun, Moon, Eye, GripVertical, Minus, Maximize2, Sparkles, Languages, BookOpen, Image as ImageIcon, Link as LinkIcon, Quote, LayoutList } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { performPDFChat } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for PDF.js import (handle default export if present)
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Configure PDF.js worker
// Use CDNJS which is reliable for worker scripts
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PDFChatProps {
  language: Language;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

type ReadingTheme = 'light' | 'dark' | 'sepia';

const PDFChat: React.FC<PDFChatProps> = ({ language, sidebarCollapsed, setSidebarCollapsed }) => {
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
  const [scale, setScale] = useState(1.2); // Default slightly larger for readability
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Layout & Theme State
  const [chatWidth, setChatWidth] = useState(400); 
  const [isResizing, setIsResizing] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light');

  // Chat State
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Interaction State (New)
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
  const [referencePopup, setReferencePopup] = useState<{x: number, y: number, id: string, type: 'ref' | 'fig', content?: string, loading?: boolean} | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText]);

  // Handle Resize Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = document.body.clientWidth - e.clientX;
        const constrainedWidth = Math.max(300, Math.min(800, newWidth));
        setChatWidth(constrainedWidth);
      }
    };
    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);


  // Load PDF Document or Image
  useEffect(() => {
    if (fileUrl && file) {
      if (file.type === 'application/pdf') {
          setIsImage(false);
          const loadPdf = async () => {
            try {
              setPdfLoading(true);
              setLoadProgress(10);
              
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

              // Trigger Active Help (Auto Summary)
              executeChat(
                  language === 'ZH' 
                  ? "文档已加载。请生成一份结构化的导读表单，包含：核心贡献、创新点、方法论概要和主要实验结论。" 
                  : "Document loaded. Please generate a structured guide including: Core Contribution, Innovation, Methodology, and Experimental Conclusions."
              );

            } catch (error) {
              console.error("Error loading PDF:", error);
              setPdfLoading(false);
              setLoadProgress(0);
            }
          };
          loadPdf();
      } else if (file.type.startsWith('image/')) {
          setIsImage(true);
          // Auto-trigger analysis for image
          executeChat(
              language === 'ZH' 
              ? "这是一张论文截图或图片。请分析其内容，提取关键信息（如标题、图表含义、文本内容）。" 
              : "This is an image of a paper. Please analyze it and extract key information (title, chart meaning, text)."
          );
      }
    }
  }, [fileUrl]); 

  // Render Page (Canvas + TextLayer) - ONLY FOR PDF
  useEffect(() => {
    if (isImage) return;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

      // Cancel previous render
      if (renderTaskRef.current) {
         try { await renderTaskRef.current.cancel(); } catch (e) {}
      }

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const textLayerDiv = textLayerRef.current;

        // Reset Text Layer
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;
        // Pass style property to CSS class to align selection
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

            // Render Text Layer
            const textContent = await page.getTextContent();
            
            // Enhance text items for "Clickable" detection
            // We'll render them normally, but add event listeners to the spans
            pdfjs.renderTextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport: viewport,
                textDivs: []
            });
            
            // Post-process text layer for clickable references
            // Slight delay to ensure DOM is ready
            setTimeout(() => {
                const spans = textLayerDiv.querySelectorAll('span');
                spans.forEach((span) => {
                    const text = span.textContent || '';
                    // Regex for [1], [12], Figure 1, Table 2
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setHistory([]); 
      setStreamingText('');
      setPdfDoc(null);
      setSidebarCollapsed(true);
    }
  };

  const changePage = (delta: number) => {
      const newPage = pageNum + delta;
      if (newPage >= 1 && newPage <= numPages) setPageNum(newPage);
  };

  // --- Interaction Handlers ---

  const handleTextSelection = (e: React.MouseEvent) => {
      if (isImage) return; // No text selection on standard image tag easily
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 2) {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          
          if (rect) {
              // Calculate position relative to viewport, adjusted for container
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

  const handleMenuAction = async (action: 'explain' | 'translate' | 'summarize' | 'ask') => {
      if (!selectionMenu) return;
      const text = selectionMenu.text;
      setSelectionMenu(null);

      let prompt = '';
      switch(action) {
          case 'explain': prompt = `Explain this text/formula from the PDF in detail: "${text}"`; break;
          case 'translate': prompt = `Translate this text to ${language === 'ZH' ? 'Chinese' : 'English'}: "${text}"`; break;
          case 'summarize': prompt = `Summarize this section: "${text}"`; break;
          case 'ask': setInput(`"${text}" `); return; // Just paste to input
      }

      // Execute Chat
      await executeChat(prompt);
  };

  const handleRefClick = async (e: MouseEvent, text: string) => {
      e.stopPropagation(); // Prevent selection menu
      
      const isCitation = /^\[\d+\]$/.test(text);
      const isFigure = /^(Fig\.?|Figure|Table)/.test(text);
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      
      setReferencePopup({
          x: rect.left + (rect.width/2),
          y: rect.bottom + 10,
          id: text,
          type: isCitation ? 'ref' : 'fig',
          loading: true
      });

      // AI Lookup
      if (isCitation) {
          const prompt = `Locate the full bibliography reference for citation ${text} in this paper and provide a 2-sentence summary of that referenced work. Format: **Title**, Authors. Summary.`;
          await performPDFChat(prompt, language, file!, [], (partial) => {
              // Update popup content as it streams (simplified to just wait for result in this demo or implement streaming hook)
          }).then((res) => {
              setReferencePopup(prev => prev ? {...prev, loading: false, content: res} : null);
          });
      } else if (isFigure) {
          // Attempt to find the page with the figure caption
          // Since we can't easily parse content coordinates, we ask AI to find it or we simulate a jump
          // For this demo, we'll ask AI to describe it.
          const prompt = `Describe the content and key insight of ${text} from this paper.`;
          await performPDFChat(prompt, language, file!, [], (partial) => {}).then(res => {
               setReferencePopup(prev => prev ? {...prev, loading: false, content: res} : null);
          });
      }
  };

  const executeChat = async (msg: string) => {
    if (!file) return;
    setHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    setChatMinimized(false); // Open chat if closed
    
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

  const handleStop = () => {
      if (abortController) {
          abortController.abort();
          setAbortController(null);
          setChatLoading(false);
          if (streamingText) {
             setHistory(prev => [...prev, { role: 'model', text: streamingText }]);
             setStreamingText('');
          }
      }
  };

  // Highlighting Mechanism
  const highlightSource = (snippet: string) => {
      if (!textLayerRef.current) return;
      
      // Remove existing highlights
      const existing = textLayerRef.current.querySelectorAll('.ai-highlight');
      existing.forEach(el => el.classList.remove('ai-highlight'));

      // Naive search: Look for spans containing the first 5 words of snippet
      // This is a simplification. Robust search requires normalizing whitespace and searching across span boundaries.
      const searchTerms = snippet.substring(0, 30).split(' ').slice(0, 5).join(' '); // Search using first 5 words
      if (searchTerms.length < 5) return;

      const spans = textLayerRef.current.querySelectorAll('span');
      let found = false;
      spans.forEach((span) => {
          if (span.textContent && span.textContent.includes(searchTerms)) {
              span.classList.add('ai-highlight');
              span.scrollIntoView({ behavior: 'smooth', block: 'center' });
              found = true;
          }
      });

      if (!found) {
          // If not found in current page, we might need to search other pages.
          // For this MVP, we simply notify the user if not found on current page.
          // Ideally AI would return page number.
          console.log("Snippet not found on current page layer.");
      }
  };

  const getContainerStyle = () => {
      switch (readingTheme) {
          case 'dark': return 'bg-slate-900';
          case 'sepia': return 'bg-[#f4ecd8]';
          default: return 'bg-slate-200/50 dark:bg-slate-900/50';
      }
  };
  
  const getCanvasStyle = () => {
      switch (readingTheme) {
          case 'dark': return 'filter invert-[0.9] hue-rotate-180 contrast-[0.8]';
          case 'sepia': return 'filter sepia-[0.25] contrast-[0.95]';
          default: return '';
      }
  };

  // Custom Link Renderer for Markdown to handle citations
  const MarkdownComponents = {
      a: ({ node, href, children, ...props }: any) => {
          if (href?.startsWith('source:')) {
              const snippet = href.replace('source:', '');
              return (
                  <button 
                    onClick={() => highlightSource(snippet)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors mx-1 align-middle"
                    title="Click to locate in document"
                  >
                      <Quote size={10} /> {children}
                  </button>
              );
          }
          return <a href={href} {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{children}</a>;
      }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-slate-900 relative" onClick={() => { setSelectionMenu(null); setReferencePopup(null); }}>
      
      {!file && (
         <div className="flex-grow flex flex-col items-center justify-center p-8 text-center animate-fadeIn w-full">
            <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-full max-w-xl p-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex flex-col items-center group transition-colors"
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
            {/* Left Panel: PDF Viewer / Image Viewer */}
            <div className={`flex-1 h-full flex flex-col relative transition-colors duration-300 ${readingTheme === 'dark' ? 'border-r border-slate-700' : 'border-r border-slate-200'}`}>
                {/* Toolbar */}
                <div className={`h-14 flex items-center justify-between px-4 shadow-sm z-10 flex-shrink-0 transition-colors ${readingTheme === 'dark' ? 'bg-slate-900 border-b border-slate-700 text-slate-200' : readingTheme === 'sepia' ? 'bg-[#e8dec0] border-b border-[#d0c6a8] text-[#5b4636]' : 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700'}`}>
                   <div className="flex items-center gap-2 lg:gap-4">
                      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 rounded hover:bg-black/10 transition-colors">
                         {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                      </button>
                      <div className="flex items-center gap-2 truncate max-w-[150px]">
                         {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
                         <span className="font-bold text-sm truncate">{file.name}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1 p-1 rounded-lg border border-black/10 bg-white/50">
                           <button onClick={() => setReadingTheme('light')} className={`p-1.5 rounded ${readingTheme === 'light' ? 'bg-white shadow text-amber-500' : 'text-slate-400'}`}><Sun size={14} /></button>
                           <button onClick={() => setReadingTheme('sepia')} className={`p-1.5 rounded ${readingTheme === 'sepia' ? 'bg-[#f4ecd8] shadow text-[#8b5e3c]' : 'text-slate-400'}`}><Eye size={14} /></button>
                           <button onClick={() => setReadingTheme('dark')} className={`p-1.5 rounded ${readingTheme === 'dark' ? 'bg-slate-700 shadow text-blue-300' : 'text-slate-400'}`}><Moon size={14} /></button>
                       </div>
                       
                       {!isImage && (
                           <>
                               <div className="w-px h-4 bg-slate-300"></div>
                               <div className="flex items-center gap-1 rounded-lg p-1 border border-black/10 bg-white/50">
                                  <button onClick={() => changePage(-1)} disabled={pageNum <= 1} className="p-1.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronLeft size={16} /></button>
                                  <span className="text-xs font-mono font-bold w-16 text-center">{pageNum} / {numPages || '-'}</span>
                                  <button onClick={() => changePage(1)} disabled={pageNum >= numPages} className="p-1.5 hover:bg-black/10 rounded disabled:opacity-30"><ChevronRight size={16} /></button>
                                  <div className="w-px h-4 mx-1 bg-slate-300"></div>
                                  <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-black/10 rounded"><ZoomOut size={16} /></button>
                                  <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1.5 hover:bg-black/10 rounded"><ZoomIn size={16} /></button>
                               </div>
                           </>
                       )}
                   </div>
                </div>

                {/* Canvas Area */}
                <div 
                  className={`flex-grow overflow-auto relative flex items-start justify-center p-8 transition-colors duration-300 ${getContainerStyle()}`}
                  onMouseUp={handleTextSelection}
                >
                   {pdfLoading && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-sm bg-white/80">
                           <div className="w-64 space-y-3">
                               <div className="flex justify-between text-xs font-bold opacity-70"><span>Loading...</span><span>{Math.round(loadProgress)}%</span></div>
                               <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${loadProgress}%` }}></div></div>
                           </div>
                       </div>
                   )}
                   
                   {isImage ? (
                       <img src={fileUrl} alt="Paper" className="max-w-full shadow-lg rounded-lg object-contain" style={{ maxHeight: '90%' }} />
                   ) : (
                       <div className="relative shadow-2xl transition-all duration-300 group">
                          <canvas ref={canvasRef} className={`block ${getCanvasStyle()}`} />
                          {/* Text Layer Overlay */}
                          <div ref={textLayerRef} className="textLayer" />
                       </div>
                   )}

                   {/* Floating Action Menu (Only for PDF text selection) */}
                   {selectionMenu && !isImage && (
                       <div 
                         className="fixed z-50 bg-slate-900 text-white rounded-lg shadow-xl p-1 flex items-center gap-1 animate-fadeIn transform -translate-x-1/2"
                         style={{ left: selectionMenu.x, top: selectionMenu.y }}
                         onMouseDown={e => e.stopPropagation()} // Prevent deselection
                       >
                           <button onClick={() => handleMenuAction('explain')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/20 rounded text-xs font-bold transition-colors">
                               <Sparkles size={12} className="text-yellow-400" /> Explain
                           </button>
                           <div className="w-px h-3 bg-white/20"></div>
                           <button onClick={() => handleMenuAction('translate')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/20 rounded text-xs font-bold transition-colors">
                               <Languages size={12} /> Translate
                           </button>
                           <div className="w-px h-3 bg-white/20"></div>
                           <button onClick={() => handleMenuAction('summarize')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/20 rounded text-xs font-bold transition-colors">
                               <FileText size={12} /> Summary
                           </button>
                           <div className="w-px h-3 bg-white/20"></div>
                           <button onClick={() => handleMenuAction('ask')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/20 rounded text-xs font-bold transition-colors">
                               <MessageSquare size={12} /> Ask AI
                           </button>
                           <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                       </div>
                   )}

                   {/* Reference Popup */}
                   {referencePopup && (
                       <div 
                         className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 w-80 animate-fadeIn transform -translate-x-1/2"
                         style={{ left: referencePopup.x, top: referencePopup.y }}
                         onMouseDown={e => e.stopPropagation()}
                       >
                           <div className="flex items-start justify-between mb-2">
                               <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                                   {referencePopup.type === 'ref' ? <BookOpen size={12}/> : <ImageIcon size={12}/>}
                                   {referencePopup.type === 'ref' ? 'Citation Source' : 'Figure Insight'}
                               </span>
                               <button onClick={() => setReferencePopup(null)}><X size={14} className="text-slate-400 hover:text-slate-600"/></button>
                           </div>
                           <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                               {referencePopup.loading ? (
                                   <div className="flex items-center gap-2 text-slate-400 py-2">
                                       <Loader2 size={16} className="animate-spin" /> AI Analyzing Context...
                                   </div>
                               ) : (
                                   <ReactMarkdown>{referencePopup.content || 'No info found.'}</ReactMarkdown>
                               )}
                           </div>
                           {referencePopup.type === 'fig' && !referencePopup.loading && (
                               <button className="w-full mt-3 bg-slate-100 dark:bg-slate-700 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                   <LinkIcon size={12} /> Jump to Figure
                               </button>
                           )}
                       </div>
                   )}
                </div>
            </div>

            {/* Right Panel: Chat */}
            {!chatMinimized ? (
                <div 
                  className={`flex flex-col bg-white dark:bg-slate-900 h-full shadow-xl z-10 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 transition-all`}
                  style={{ width: chatWidth }}
                >
                    <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 flex-shrink-0 bg-white dark:bg-slate-900">
                         <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                             <MessageSquare size={16} className="text-blue-500" />
                             <span>AI Assistant</span>
                         </div>
                         <button onClick={() => setChatMinimized(true)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"><Minus size={16} /></button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                        {history.length === 0 && (
                            <div className="text-center py-20 opacity-60">
                                <MessageSquare size={40} className="mx-auto mb-4 text-blue-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{t.welcome}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Select text to ask questions, or click citations like [1] to see details.</p>
                            </div>
                        )}
                        {history.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'}`}>
                                    <ReactMarkdown 
                                        className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={MarkdownComponents}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[90%] rounded-2xl px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none text-sm text-slate-600 dark:text-slate-300">
                                    {streamingText ? (
                                        <ReactMarkdown 
                                            className="prose prose-sm dark:prose-invert"
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={MarkdownComponents}
                                        >
                                            {streamingText}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="flex items-center gap-2"><Loader2 size={16} className="animate-spin text-blue-600" /><span>Thinking...</span></div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && executeChat(input)}
                                placeholder={t.placeholder}
                                disabled={chatLoading}
                                className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {chatLoading ? (
                                <button onClick={handleStop} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><X size={20} /></button>
                            ) : (
                                <button onClick={() => executeChat(input)} disabled={!input.trim()} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"><Send size={20} /></button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <button onClick={() => setChatMinimized(false)} className="absolute right-4 bottom-4 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 z-50 animate-fadeIn"><MessageSquare size={24} /></button>
            )}
         </div>
      )}
    </div>
  );
};

export default PDFChat;
