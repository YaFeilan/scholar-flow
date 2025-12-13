
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Send, Loader2, X, MessageSquare, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Sparkles, Image as ImageIcon, Link as LinkIcon, Quote, MousePointer2, ChevronDown, Bot, Mic, Gamepad2, GraduationCap, Settings2, Play, SkipForward, List, Clock, CheckCircle, Bookmark, Highlighter, Trophy, Award, Target, Book, LayoutList, StickyNote, BookOpen } from 'lucide-react';
import { Language, ModelProvider, Note, Bookmark as BookmarkType, Quiz, GameState, GuidedStep, ReadingMode } from '../types';
import { TRANSLATIONS } from '../translations';
import { performPDFChat, explainPaperInPlainLanguage, generateReadingQuiz } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';

// Robust PDF.js Initialization
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;
if (pdfjs && typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PDFChatProps {
  language: Language;
  initialFile?: File | null;
}

const PDFChat: React.FC<PDFChatProps> = ({ language, initialFile }) => {
  const t = TRANSLATIONS[language].pdfChat;
  
  // Settings State
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('Gemini');
  const [chatMode, setChatMode] = useState<ReadingMode>('standard');

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

  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'outline' | 'notes' | 'bookmarks'>('outline');

  // Data State
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [highlights, setHighlights] = useState<Note[]>([]); // Storing highlights as simplified notes

  // Guided Mode State
  const [guidedSteps, setGuidedSteps] = useState<GuidedStep[]>([
      { id: 'intro', title: 'Introduction & Motivation', description: 'Understand why this research matters.', status: 'active' },
      { id: 'method', title: 'Methodology', description: 'How did they do it?', status: 'locked' },
      { id: 'results', title: 'Key Results', description: 'What did they find?', status: 'locked' },
      { id: 'conclusion', title: 'Conclusion & Impact', description: 'What does it mean for the field?', status: 'locked' }
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Game Mode State
  const [gameState, setGameState] = useState<GameState>({
      points: 0,
      level: 1,
      badges: [],
      streak: 0,
      completedQuizzes: []
  });
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Chat State
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
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

  useEffect(() => {
      if (initialFile) {
          processFile(initialFile);
      }
  }, [initialFile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText]);

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

              // Auto-trigger logic
              if (history.length === 0) {
                  if (chatMode === 'guided') {
                      executeChat(language === 'ZH' ? "开始导读" : "Start Guided Reading", true);
                  } else {
                      setChatLoading(true);
                      setTimeout(async () => {
                          try {
                              const explanation = await explainPaperInPlainLanguage(file, language);
                              setHistory([{ role: 'model', text: explanation }]);
                          } catch (e) { console.error(e); }
                          setChatLoading(false);
                      }, 1000);
                  }
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
  }, [fileUrl, chatMode]);

  // Render Page & Highlights
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
            
            if (pdfjs.renderTextLayer) {
                await pdfjs.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                }).promise;

                // Apply Highlights after rendering
                const pageHighlights = highlights.filter(h => h.page === pageNum);
                const spans = Array.from(textLayerDiv.querySelectorAll('span')) as HTMLSpanElement[];
                
                pageHighlights.forEach(h => {
                    // Simple text matching
                    spans.forEach(span => {
                        if (span.textContent && span.textContent.includes(h.quote)) {
                            span.style.backgroundColor = h.color || 'yellow';
                            span.style.opacity = '0.4';
                        }
                    });
                });
            }
        }
      } catch (error: any) {
          if (error.name !== 'RenderingCancelledException') console.error('Render error:', error);
      }
    };

    renderPage();
  }, [pdfDoc, pageNum, scale, isImage, highlights]);

  const processFile = (selectedFile: File) => {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setHistory([]); 
      setStreamingText('');
      setPdfDoc(null);
      setNotes([]);
      setBookmarks([]);
      setHighlights([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault(); setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const changePage = (delta: number) => {
      const newPage = pageNum + delta;
      if (newPage >= 1 && newPage <= numPages) setPageNum(newPage);
  };

  const handleTextSelection = (e: React.MouseEvent) => {
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
          }
      } else {
          setSelectionMenu(null);
      }
  };

  const addHighlight = (color: string) => {
      if (!selectionMenu) return;
      const newHighlight: Note = {
          id: Date.now().toString(),
          page: pageNum,
          quote: selectionMenu.text,
          content: '',
          color: color,
          timestamp: Date.now()
      };
      setHighlights(prev => [...prev, newHighlight]);
      setSelectionMenu(null);
  };

  const addNote = () => {
      if (!selectionMenu) return;
      const newNote: Note = {
          id: Date.now().toString(),
          page: pageNum,
          quote: selectionMenu.text,
          content: '',
          timestamp: Date.now()
      };
      setNotes(prev => [...prev, newNote]);
      setSelectionMenu(null);
      setActiveSidebarTab('notes');
      setSidebarOpen(true);
  };

  const addBookmark = () => {
      const newBookmark: BookmarkType = {
          id: Date.now().toString(),
          page: pageNum,
          label: `Page ${pageNum}`,
          timestamp: Date.now()
      };
      setBookmarks(prev => [...prev, newBookmark]);
      setActiveSidebarTab('bookmarks');
      setSidebarOpen(true);
  };

  const handleQuizChallenge = async () => {
      if (!file) return;
      setQuizLoading(true);
      setShowQuizModal(true);
      const quiz = await generateReadingQuiz(file, language);
      setCurrentQuiz(quiz);
      setQuizLoading(false);
  };

  const handleQuizAnswer = (index: number) => {
      if (!currentQuiz) return;
      if (index === currentQuiz.correctIndex) {
          setGameState(prev => ({
              ...prev,
              points: prev.points + currentQuiz.points,
              streak: prev.streak + 1,
              completedQuizzes: [...prev.completedQuizzes, currentQuiz.id]
          }));
          alert(language === 'ZH' ? '回答正确！积分 +10' : 'Correct! +10 Points');
      } else {
          setGameState(prev => ({ ...prev, streak: 0 }));
          alert(language === 'ZH' ? '回答错误。' : 'Incorrect.');
      }
      setShowQuizModal(false);
      setCurrentQuiz(null);
  };

  const executeChat = async (msg: string, isHiddenUserMessage: boolean = false) => {
    if (!file) { alert("Please upload a file first."); return; }
    
    if (!isHiddenUserMessage) {
        setHistory(prev => [...prev, { role: 'user', text: msg }]);
    }
    setChatLoading(true);
    setInput('');
    
    const ac = new AbortController();
    setAbortController(ac);

    let systemInstruction = "";
    if (chatMode === 'guided') {
        const currentStep = guidedSteps[currentStepIndex];
        systemInstruction = language === 'ZH' 
            ? `你是一个科研导师，正在进行交互式导读。当前步骤：${currentStep.title}。请专注于解释这部分内容。`
            : `You are a research tutor in Guided Mode. Current Step: ${currentStep.title}. Focus on explaining this part.`;
    } else if (chatMode === 'game') {
        systemInstruction = language === 'ZH' 
            ? "你是一个叫'Lumina'的二次元科研助手，性格活泼可爱。请用轻松有趣的方式解读论文。"
            : "You are 'Lumina', a cute anime research assistant. Explain the paper in a fun and engaging way.";
    } else {
        systemInstruction = `Model: ${selectedModel}. ` + (language === 'ZH' ? "请专业地解读这篇文献。" : "Please interpret this paper professionally.");
    }

    try {
        const fullPrompt = `${systemInstruction}\n\nUser Query: ${msg}`;
        const fullResponse = await performPDFChat(
            fullPrompt,
            language,
            file,
            history.map(h => ({ role: h.role === 'model' ? 'model' : 'user', text: h.text })),
            (partial) => setStreamingText(partial),
            ac.signal
        );
        setHistory(prev => [...prev, { role: 'model', text: fullResponse }]);
        
        // Guided Mode Logic
        if (chatMode === 'guided' && currentStepIndex < guidedSteps.length - 1) {
             const nextIndex = currentStepIndex + 1;
             setGuidedSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, status: 'completed' } : i === nextIndex ? { ...s, status: 'active' } : s));
             setCurrentStepIndex(nextIndex);
        }

    } catch (e) { console.error(e); }
    
    setStreamingText('');
    setChatLoading(false);
    setAbortController(null);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-900 relative text-slate-800 dark:text-slate-100" onClick={() => setSelectionMenu(null)}>
      
      {!file && (
         <div 
            className={`flex-grow flex flex-col items-center justify-center p-8 text-center animate-fadeIn w-full bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 relative overflow-hidden transition-colors ${isDragOver ? 'bg-blue-100/50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
         >
            {/* ... (Keep existing upload UI) ... */}
            <div className="z-10 max-w-2xl w-full flex flex-col items-center gap-8">
                <div className="relative">
                     <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full shadow-lg flex items-center justify-center mb-6 mx-auto relative z-10">
                         <Bot size={48} className="text-white" />
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-indigo-50 dark:border-slate-700 relative text-left">
                         <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-medium">
                             {language === 'ZH' ? "你好！我是你的智能阅读助手。选择一种模式开始精读吧！" : "Hello! I'm your intelligent reading assistant. Choose a mode to start intensive reading!"}
                         </p>
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    <button onClick={() => { setChatMode('standard'); fileInputRef.current?.click(); }} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all group text-left">
                        <BookOpen className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.modes.standard}</h3>
                        <p className="text-xs text-slate-500">Traditional tools.</p>
                    </button>
                    <button onClick={() => { setChatMode('guided'); fileInputRef.current?.click(); }} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all group text-left">
                        <GraduationCap className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.modes.guided}</h3>
                        <p className="text-xs text-slate-500">Step-by-step learning.</p>
                    </button>
                    <button onClick={() => { setChatMode('game'); fileInputRef.current?.click(); }} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all group text-left">
                        <Gamepad2 className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.modes.game}</h3>
                        <p className="text-xs text-slate-500">Quizzes & Points.</p>
                    </button>
                </div>

                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
            </div>
         </div>
      )}

      {file && fileUrl && (
         <div className="flex w-full h-full relative overflow-hidden">
            
            {/* 1. Left Sidebar (Outline, Notes, Bookmarks) */}
            <div className={`flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setActiveSidebarTab('outline')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeSidebarTab === 'outline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>{t.tools.outline}</button>
                    <button onClick={() => setActiveSidebarTab('notes')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeSidebarTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>{t.tools.notes}</button>
                    <button onClick={() => setActiveSidebarTab('bookmarks')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeSidebarTab === 'bookmarks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>{t.tools.bookmarks}</button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-2">
                    {activeSidebarTab === 'outline' && (
                        mockOutline.map((item, idx) => (
                            <div key={idx} className="mb-1">
                                <div onClick={() => setPageNum(item.page)} className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                                    <FileText size={14} className="text-slate-400" /> <span>{item.title}</span>
                                </div>
                                {item.children && (
                                    <div className="ml-4 border-l border-slate-200 dark:border-slate-700 pl-2">
                                        {item.children.map((child, cIdx) => (
                                            <div key={cIdx} onClick={() => setPageNum(child.page)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-600 dark:text-slate-400">
                                                {child.title}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {activeSidebarTab === 'notes' && (
                        notes.length > 0 ? notes.map(note => (
                            <div key={note.id} className="p-3 mb-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer" onClick={() => setPageNum(note.page)}>
                                <div className="text-[10px] font-bold text-slate-400 mb-1">Page {note.page}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">"{note.quote.substring(0, 50)}..."</div>
                                <textarea 
                                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 focus:ring-1 focus:ring-yellow-500 outline-none"
                                    placeholder="Add note..."
                                    value={note.content}
                                    onChange={(e) => setNotes(prev => prev.map(n => n.id === note.id ? {...n, content: e.target.value} : n))}
                                />
                            </div>
                        )) : <div className="text-center text-slate-400 text-xs py-4">No notes yet. Select text to add.</div>
                    )}
                    {activeSidebarTab === 'bookmarks' && (
                        bookmarks.length > 0 ? bookmarks.map(bm => (
                            <div key={bm.id} onClick={() => setPageNum(bm.page)} className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer group">
                                <div className="flex items-center gap-2">
                                    <Bookmark size={14} className="text-blue-500" />
                                    <span className="text-sm font-medium">{bm.label}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setBookmarks(prev => prev.filter(b => b.id !== bm.id)); }} className="opacity-0 group-hover:opacity-100 text-red-400"><X size={12} /></button>
                            </div>
                        )) : <div className="text-center text-slate-400 text-xs py-4">No bookmarks.</div>
                    )}
                </div>
            </div>

            {/* 2. Center PDF Viewer */}
            <div className="flex-grow flex flex-col relative min-w-0 bg-slate-100 dark:bg-slate-900/50">
                <div className="h-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-10 shadow-sm">
                   <div className="flex items-center gap-2">
                      {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"><PanelLeftOpen size={18} /></button>}
                      <span className="font-bold text-sm truncate max-w-[200px]">{file.name}</span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                       <button onClick={() => changePage(-1)} disabled={pageNum <= 1} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronLeft size={16} /></button>
                       <span className="text-xs font-mono font-bold">{pageNum} / {numPages}</span>
                       <button onClick={() => changePage(1)} disabled={pageNum >= numPages} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ChevronRight size={16} /></button>
                       <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                       <button onClick={addBookmark} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-blue-600" title={t.tools.addBookmark}><Bookmark size={16} /></button>
                       <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomOut size={16} /></button>
                       <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomIn size={16} /></button>
                   </div>
                </div>

                <div 
                  ref={containerRef}
                  className="flex-grow overflow-auto relative flex items-start justify-center p-8 transition-colors duration-300 bg-slate-100 dark:bg-slate-900"
                  onMouseUp={handleTextSelection}
                >
                   {pdfLoading && <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/80"><Loader2 size={32} className="animate-spin text-blue-600" /></div>}
                   <div className="relative shadow-2xl transition-all duration-300 group">
                      <canvas ref={canvasRef} className="block" />
                      <div ref={textLayerRef} className="textLayer" />
                   </div>

                   {selectionMenu && (
                       <div className="fixed z-50 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-1 animate-fadeIn transform -translate-x-1/2" style={{ left: selectionMenu.x, top: selectionMenu.y }}>
                           <button onClick={() => executeChat(`Explain: ${selectionMenu.text}`, true)} className="p-2 hover:bg-slate-100 rounded-full" title="Explain"><MessageSquare size={14} className="text-blue-500" /></button>
                           <button onClick={addNote} className="p-2 hover:bg-slate-100 rounded-full" title={t.tools.addNote}><StickyNote size={14} className="text-amber-500" /></button>
                           <div className="flex gap-1 border-l border-slate-200 pl-1">
                               <button onClick={() => addHighlight('yellow')} className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-110 transition-transform"></button>
                               <button onClick={() => addHighlight('green')} className="w-4 h-4 rounded-full bg-green-300 hover:scale-110 transition-transform"></button>
                               <button onClick={() => addHighlight('red')} className="w-4 h-4 rounded-full bg-red-300 hover:scale-110 transition-transform"></button>
                           </div>
                       </div>
                   )}
                </div>
            </div>

            {/* 3. Right AI Assistant Panel */}
            <div className="w-[400px] flex-shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-20 relative">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setChatMode('standard')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${chatMode === 'standard' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t.modes.standard}</button>
                        <button onClick={() => setChatMode('guided')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${chatMode === 'guided' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>{t.modes.guided}</button>
                        <button onClick={() => setChatMode('game')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${chatMode === 'game' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}>{t.modes.game}</button>
                    </div>
                </div>

                {chatMode === 'guided' && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1"><LayoutList size={12}/> {t.guided.path}</h4>
                        <div className="space-y-2">
                            {guidedSteps.map((step, i) => (
                                <div key={step.id} className={`flex items-center gap-2 p-2 rounded border ${i === currentStepIndex ? 'bg-white border-emerald-500 shadow-sm' : step.status === 'completed' ? 'bg-emerald-100/50 border-transparent opacity-60' : 'bg-slate-50 border-transparent opacity-40'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === currentStepIndex ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-800">{step.title}</div>
                                        {i === currentStepIndex && <div className="text-[10px] text-slate-500">{step.description}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {chatMode === 'game' && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg"><Trophy size={20} /></div>
                                <div>
                                    <div className="text-xs font-bold text-purple-800 uppercase">{t.game.points}</div>
                                    <div className="text-xl font-black text-purple-900">{gameState.points}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-purple-800 uppercase">{t.game.level}</div>
                                <div className="text-lg font-bold text-purple-700">{gameState.level}</div>
                            </div>
                        </div>
                        <button onClick={handleQuizChallenge} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-bold text-xs shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            <Target size={14} /> {t.game.challengeBtn}
                        </button>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                    {history.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                            <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                                <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {chatLoading && <div className="flex justify-start"><Loader2 className="animate-spin text-slate-400" /></div>}
                    {streamingText && <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm"><ReactMarkdown>{streamingText}</ReactMarkdown></div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeChat(input)}
                            placeholder={chatMode === 'game' ? (language === 'ZH' ? "回答问题..." : "Answer quiz...") : (language === 'ZH' ? "输入问题..." : "Ask a question...")}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                        />
                        <button onClick={() => executeChat(input)} disabled={!input.trim()} className="absolute right-2 top-2 p-1.5 bg-white dark:bg-slate-700 rounded-lg text-blue-600 shadow-sm hover:scale-105 transition-transform"><Send size={16} /></button>
                    </div>
                </div>

                {/* Quiz Modal Overlay */}
                {showQuizModal && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-50 flex flex-col p-6 animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2"><Award size={24} /> {t.game.quizTitle}</h3>
                            <button onClick={() => setShowQuizModal(false)}><X size={24} className="text-slate-400" /></button>
                        </div>
                        {quizLoading ? (
                            <div className="flex-grow flex items-center justify-center"><Loader2 className="w-12 h-12 text-purple-600 animate-spin" /></div>
                        ) : currentQuiz ? (
                            <div className="space-y-6">
                                <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{currentQuiz.question}</p>
                                <div className="space-y-3">
                                    {currentQuiz.options.map((opt, idx) => (
                                        <button 
                                           key={idx} 
                                           onClick={() => handleQuizAnswer(idx)}
                                           className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-all font-medium"
                                        >
                                            {String.fromCharCode(65 + idx)}. {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-red-500">Failed to load quiz.</div>
                        )}
                    </div>
                )}
            </div>
         </div>
      )}
    </div>
  );
};

export default PDFChat;
