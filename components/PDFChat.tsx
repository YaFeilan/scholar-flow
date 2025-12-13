
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Send, Loader2, X, MessageSquare, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Sparkles, Image as ImageIcon, Link as LinkIcon, Quote, MousePointer2, ChevronDown, Bot, Mic, Gamepad2, GraduationCap, Settings2, Play, SkipForward, List } from 'lucide-react';
import { Language, ModelProvider } from '../types';
import { TRANSLATIONS } from '../translations';
import { performPDFChat, explainPaperInPlainLanguage } from '../services/geminiService';
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

type ChatMode = 'standard' | 'guided' | 'game';
type GameEmotion = 'normal' | 'happy' | 'thinking' | 'surprised' | 'explain';

const PDFChat: React.FC<PDFChatProps> = ({ language, initialFile }) => {
  const t = TRANSLATIONS[language].pdfChat;
  
  // Settings State
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('Gemini');
  const [chatMode, setChatMode] = useState<ChatMode>('standard');

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
  const [outlineOpen, setOutlineOpen] = useState(true);

  // Chat State
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Game Mode State
  const [gameEmotion, setGameEmotion] = useState<GameEmotion>('normal');
  const [showGameLog, setShowGameLog] = useState(false);

  // Mentor Loading State
  const [loadingMessage, setLoadingMessage] = useState('');

  // Interaction State
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
  const [toolMode, setToolMode] = useState<'text' | 'box'>('text');
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
          }, 2500); 
      }
      return () => clearInterval(interval);
  }, [chatLoading, language]);

  useEffect(() => {
      if (initialFile) {
          processFile(initialFile);
      }
  }, [initialFile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText, showGameLog]);

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

  // Render Page
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
                pdfjs.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
            }
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
      setStreamingText('');
      setPdfDoc(null);
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
          setHistory(prev => [...prev, { role: 'model', text: `📝 **Note Saved:** ${text}` }]);
      }
  };

  const executeChat = async (msg: string) => {
    if (!file) {
        alert("Please upload a file first.");
        return;
    }
    
    setHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    setInput('');
    setGameEmotion('thinking');
    
    const ac = new AbortController();
    setAbortController(ac);

    let systemInstruction = "";
    if (chatMode === 'guided') {
        systemInstruction = language === 'ZH' 
            ? "你是一位严谨的科研导师。请采用'边解读边提问'的导读模式。在解释完一个概念或段落后，必须提出一个相关的检查问题，确认用户是否理解。如果用户回答正确，给予肯定并进行下一部分解读；如果回答错误或模糊，请重新通俗地解释，直到用户理解。不要一次性输出太多内容，保持交互性。"
            : "You are a strict research tutor using a 'Guided Reading' mode. After explaining a concept or section, you MUST ask a specific checking question to verify the user's understanding. Only proceed if they answer correctly. If they are wrong, re-explain simply. Keep it interactive.";
    } else if (chatMode === 'game') {
        systemInstruction = language === 'ZH' 
            ? "你是一位名叫'Lumina'的二次元美少女科研助手。外貌特征：紫色双丸子头，紫色古风服饰，手持月亮道具。性格活泼、可爱，喜欢使用颜文字和表情符号(◕‿◕✿)。请用Galgame/视觉小说的对话风格来解读这篇论文。将复杂的学术概念比喻成生活中的例子。保持语气轻松有趣，偶尔卖萌。当前情绪：开心。"
            : "You are 'Lumina', a cute anime girl research assistant with purple double-bun hair and purple outfit holding a crescent moon. You are energetic and love using kaomoji (◕‿◕✿). Explain this paper in the style of a Visual Novel/Galgame dialogue. Use metaphors. Be fun and cute. Current mood: Happy.";
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
        setGameEmotion(chatMode === 'game' ? 'happy' : 'normal');
    } catch (e) { console.error(e); setGameEmotion('surprised'); }
    
    setStreamingText('');
    setChatLoading(false);
    setAbortController(null);
  };

  // Anime Character Component - Custom Purple Theme Lumina
  const AnimeCharacter = ({ emotion }: { emotion: GameEmotion }) => (
      <svg viewBox="0 0 200 250" className="w-full h-full drop-shadow-2xl filter contrast-110">
          <defs>
              <linearGradient id="hairPurple" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7C3AED"/>
                  <stop offset="100%" stopColor="#A78BFA"/>
              </linearGradient>
              <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF0E5"/>
                  <stop offset="100%" stopColor="#FFE0D0"/>
              </linearGradient>
          </defs>
          
          {/* Hair Back */}
          <path d="M40,80 Q20,150 30,200 L170,200 Q180,150 160,80" fill="url(#hairPurple)" />
          
          {/* Buns */}
          <circle cx="35" cy="50" r="25" fill="url(#hairPurple)" />
          <circle cx="165" cy="50" r="25" fill="url(#hairPurple)" />
          
          {/* Hair Sticks */}
          <line x1="15" y1="65" x2="55" y2="35" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <circle cx="15" cy="65" r="4" fill="#FDE047" />
          <line x1="185" y1="65" x2="145" y2="35" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <circle cx="185" cy="65" r="4" fill="#FDE047" />

          {/* Body (Purple Outfit) */}
          <path d="M70,160 Q60,250 40,250 L160,250 Q140,250 130,160" fill="#8B5CF6" />
          <path d="M70,160 L130,160 L130,190 L70,190 Z" fill="#6D28D9" /> 
          
          {/* Collar/Details */}
          <path d="M90,160 L100,175 L110,160" fill="#E9D5FF" />
          
          {/* Face */}
          <path d="M60,90 Q60,40 100,40 Q140,40 140,90 Q140,150 100,170 Q60,150 60,90" fill="url(#skin)" />
          
          {/* Bangs */}
          <path d="M60,90 Q70,60 100,60 Q130,60 140,90 L140,70 Q120,50 100,50 Q80,50 60,70 Z" fill="url(#hairPurple)" />

          {/* Eyes (Purple/Dark) */}
          <g transform="translate(0, 5)">
               {emotion === 'happy' ? (
                    <>
                      <path d="M75,100 Q85,90 95,100" fill="none" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" />
                      <path d="M105,100 Q115,90 125,100" fill="none" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" />
                    </>
                ) : emotion === 'thinking' ? (
                    <>
                      <circle cx="85" cy="100" r="5" fill="#4C1D95" />
                      <line x1="105" y1="100" x2="125" y2="100" stroke="#4C1D95" strokeWidth="3" />
                    </>
                ) : (
                    <>
                      <circle cx="85" cy="100" r="7" fill="#4C1D95" /><circle cx="83" cy="97" r="2.5" fill="#FFF" />
                      <circle cx="115" cy="100" r="7" fill="#4C1D95" /><circle cx="113" cy="97" r="2.5" fill="#FFF" />
                    </>
                )}
          </g>

          {/* Blush */}
          <ellipse cx="70" cy="115" rx="6" ry="3" fill="#F472B6" opacity="0.4" />
          <ellipse cx="130" cy="115" rx="6" ry="3" fill="#F472B6" opacity="0.4" />

          {/* Mouth */}
          <path d="M92,125 Q100,130 108,125" fill="none" stroke="#BE185D" strokeWidth="2" strokeLinecap="round" />

          {/* Hands holding Moon */}
          <circle cx="80" cy="190" r="10" fill="url(#skin)" />
          <circle cx="120" cy="190" r="10" fill="url(#skin)" />
          
          {/* Crescent Moon Prop */}
          <path d="M85,175 Q100,215 115,175 Q105,205 95,175" fill="#60A5FA" stroke="#2563EB" strokeWidth="2" /> 
      </svg>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-900 relative text-slate-800 dark:text-slate-100" onClick={() => setSelectionMenu(null)}>
      
      {!file && (
         <div 
            className={`flex-grow flex flex-col items-center justify-center p-8 text-center animate-fadeIn w-full bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 relative overflow-hidden transition-colors ${isDragOver ? 'bg-blue-100/50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
         >
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="z-10 max-w-2xl w-full flex flex-col items-center gap-8">
                <div className="relative">
                     <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full shadow-lg flex items-center justify-center mb-6 mx-auto relative z-10">
                         <Bot size={48} className="text-white" />
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-indigo-50 dark:border-slate-700 relative text-left">
                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-800 border-t border-l border-indigo-50 dark:border-slate-700 transform rotate-45"></div>
                         <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-medium">
                             {language === 'ZH' 
                                ? "同学你好，我是你的科研导师 AI。今天想研究什么？把文献交给我，我用大白话讲给你听，复杂的术语统统‘翻译’成人话！" 
                                : "Hello! I'm your Research Mentor AI. Hand me a paper, and I'll explain it in plain English!"}
                         </p>
                     </div>
                </div>

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Mic size={20} />
                    {language === 'ZH' ? '一键通俗语音解读' : 'Plain Language Explain'}
                </button>

                <div className="h-4"></div>

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
                        placeholder={language === 'ZH' ? "拖入 PDF..." : "Drag PDF here..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={true}
                     />
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
                <div className="h-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-10 shadow-sm">
                   <div className="flex items-center gap-2">
                      {!outlineOpen && (
                          <button onClick={() => setOutlineOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500">
                             <PanelLeftOpen size={18} />
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

                <div 
                  ref={containerRef}
                  className={`flex-grow overflow-auto relative flex items-start justify-center p-8 transition-colors duration-300 bg-slate-100 dark:bg-slate-900 ${toolMode === 'box' ? 'cursor-crosshair' : ''}`}
                  onMouseUp={(e) => { toolMode === 'text' ? handleTextSelection(e) : null }}
                >
                   {pdfLoading && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-sm bg-white/80">
                           <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                           <span className="text-sm font-bold text-slate-500">Loading PDF...</span>
                       </div>
                   )}
                   
                   <div className="relative shadow-2xl transition-all duration-300 group">
                      <canvas ref={canvasRef} className="block" />
                      <div ref={textLayerRef} className={`textLayer ${toolMode === 'box' ? 'pointer-events-none' : ''}`} />
                   </div>

                   {selectionMenu && (
                       <div 
                         className="fixed z-50 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-1 animate-fadeIn transform -translate-x-1/2"
                         style={{ left: selectionMenu.x, top: selectionMenu.y }}
                         onMouseDown={e => e.stopPropagation()}
                       >
                           <button onClick={() => handleMenuAction('explain')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-xs font-bold transition-colors">
                               <MessageSquare size={12} className="text-blue-500" /> Explain
                           </button>
                           <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                           <button onClick={() => handleMenuAction('note')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-xs font-bold transition-colors">
                               <Quote size={12} className="text-amber-500" /> Note
                           </button>
                       </div>
                   )}
                </div>
            </div>

            {/* 3. Right AI Assistant Panel */}
            <div className="w-[420px] flex-shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-20 relative">
                
                {/* Advanced Mode Toggle Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                            <Settings2 size={16} />
                            {language === 'ZH' ? '模式设置' : 'Mode Settings'}
                        </div>
                        <select 
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as ModelProvider)}
                            className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                        >
                            <option value="Gemini">Gemini</option>
                            <option value="DeepSeek">DeepSeek</option>
                            <option value="ChatGPT">ChatGPT</option>
                            <option value="Doubao">Doubao</option>
                        </select>
                    </div>
                    <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setChatMode('standard')} 
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${chatMode === 'standard' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
                        >
                            <MessageSquare size={12} /> {language === 'ZH' ? '标准' : 'Standard'}
                        </button>
                        <button 
                            onClick={() => setChatMode('guided')} 
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${chatMode === 'guided' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-500'}`}
                        >
                            <GraduationCap size={12} /> {language === 'ZH' ? '导读' : 'Guided'}
                        </button>
                        <button 
                            onClick={() => setChatMode('game')} 
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${chatMode === 'game' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                        >
                            <Gamepad2 size={12} /> {language === 'ZH' ? '游戏' : 'Game'}
                        </button>
                    </div>
                </div>

                {chatMode === 'game' ? (
                    // GAME MODE INTERFACE
                    <div className="flex-grow flex flex-col bg-gradient-to-b from-purple-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl"></div>
                        
                        {/* Character Display */}
                        <div className="flex-grow flex items-end justify-center pb-32 relative z-10">
                            <div className="w-64 h-80 transition-transform hover:scale-105 duration-500">
                                <AnimeCharacter emotion={gameEmotion} />
                            </div>
                        </div>

                        {/* Dialogue Box Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                            <div className="bg-white/95 dark:bg-slate-900/95 border-2 border-purple-200 dark:border-purple-900 rounded-xl shadow-2xl p-4 min-h-[160px] flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded uppercase">Lumina</span>
                                    <button onClick={() => setShowGameLog(!showGameLog)} className="text-[10px] text-slate-400 hover:text-purple-600 flex items-center gap-1">
                                        <List size={10} /> Log
                                    </button>
                                </div>
                                <div className="flex-grow text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed overflow-y-auto max-h-[100px] custom-scrollbar">
                                    {showGameLog ? (
                                        <div className="space-y-3">
                                            {history.map((msg, i) => (
                                                <div key={i} className={`text-xs ${msg.role === 'user' ? 'text-slate-500' : 'text-purple-700 dark:text-purple-300'}`}>
                                                    <span className="font-bold">{msg.role === 'user' ? 'You' : 'Lumina'}:</span> {msg.text}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        streamingText || (history.length > 0 ? history[history.length - 1].text : (language === 'ZH' ? "嗨！准备好今天的学术冒险了吗？(◕‿◕✿)" : "Hii! Ready to learn something amazing today? (◕‿◕✿)"))
                                    )}
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && executeChat(input)}
                                        placeholder={language === 'ZH' ? "回复 Lumina..." : "Reply to Lumina..."}
                                        className="flex-grow bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <button onClick={() => executeChat(input)} disabled={chatLoading} className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700">
                                        {chatLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // STANDARD / GUIDED MODE
                    <>
                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                            {chatMode === 'guided' && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg mb-4 text-xs text-emerald-800 dark:text-emerald-200">
                                    <strong className="block mb-1 flex items-center gap-1"><GraduationCap size={12}/> {language === 'ZH' ? '导读模式已激活' : 'Guided Mode Active'}</strong>
                                    {language === 'ZH' ? '我会确保你理解每个部分后再继续。请回答我的检查问题！' : 'I will ensure you understand each part before moving on. Please answer my checking questions!'}
                                </div>
                            )}
                            <div className="space-y-4">
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
                                {streamingText && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm text-sm text-slate-800 dark:text-slate-200">
                                            <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">{streamingText}</ReactMarkdown>
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
                                    placeholder={chatMode === 'guided' ? (language === 'ZH' ? "回答问题或寻求帮助..." : "Answer the question or ask for help...") : (language === 'ZH' ? "询问论文内容..." : "Ask about the paper...")}
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
                    </>
                )}
            </div>
         </div>
      )}
    </div>
  );
};

export default PDFChat;
