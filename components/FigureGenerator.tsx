
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Wand2, Upload, Download, RefreshCw, PenTool, ImagePlus, Loader2, Sparkles, MessageCircle, Send, Type, MousePointer2, Eraser, CheckSquare, Layers, Brush, X, Layout, ChevronDown, ChevronUp, Palette, Printer, Ruler, Box, BarChart, Save, History, Clock } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateScientificFigure } from '../services/geminiService';

interface FigureGeneratorProps {
  language: Language;
}

interface Annotation {
  id: string;
  xPct: number; // 0-100 percentage of width
  yPct: number; // 0-100 percentage of height
  text: string;
}

const FigureGenerator: React.FC<FigureGeneratorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].figure;
  
  const [mode, setMode] = useState<'generate' | 'polish'>('generate');
  const [polishTask, setPolishTask] = useState<'general' | 'sketchTo3D' | 'chartBeautify'>('general');
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [style, setStyle] = useState('Nature');
  const [chartType, setChartType] = useState('Mechanism');
  const [colorPalette, setColorPalette] = useState('Default'); 
  const [backgroundOnly, setBackgroundOnly] = useState(false);
  
  // New Settings for DPI and Size
  const [dpi, setDpi] = useState<'300' | '600'>('300');
  const [colSize, setColSize] = useState<'single' | 'double'>('single');

  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  
  // Annotation State
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [tempAnnotation, setTempAnnotation] = useState<{x: number, y: number} | null>(null);
  const [tempText, setTempText] = useState('');
  
  // Masking / Local Edit State
  const [isMasking, setIsMasking] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [hasMask, setHasMask] = useState(false);

  // Template State
  const [showTemplate, setShowTemplate] = useState(false);
  const [templateData, setTemplateData] = useState({ subject: '', action: '', environment: '', perspective: '' });

  // Refine chat
  const [refineInput, setRefineInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Sync Canvas Size with Image
  useEffect(() => {
      if (isMasking && imageRef.current && canvasRef.current) {
          const img = imageRef.current;
          const canvas = canvasRef.current;
          // Match the displayed size exactly for correct coordinate mapping
          const resizeObserver = new ResizeObserver(() => {
              if (!img || !canvas) return;
              canvas.width = img.width; 
              canvas.height = img.height;
              canvas.style.width = `${img.width}px`;
              canvas.style.height = `${img.height}px`;
          });
          resizeObserver.observe(img);
          return () => resizeObserver.disconnect();
      }
  }, [isMasking, resultImage]);

  const startDrawing = (e: React.MouseEvent) => {
      if (!isMasking || !canvasRef.current) return;
      setIsDrawing(true);
      setHasMask(true);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
          const rect = canvasRef.current.getBoundingClientRect();
          ctx.beginPath();
          ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
          ctx.lineWidth = 20;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Visual feedback
      }
  };

  const draw = (e: React.MouseEvent) => {
      if (!isDrawing || !isMasking || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
          const rect = canvasRef.current.getBoundingClientRect();
          ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
          ctx.stroke();
      }
  };

  const stopDrawing = () => {
      setIsDrawing(false);
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.closePath();
      }
  };

  const clearMask = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setHasMask(false);
      }
  };

  const handleApplyTemplate = () => {
      const { subject, action, environment, perspective } = templateData;
      const parts = [subject, action, environment, perspective].filter(p => p && p.trim());
      
      if (parts.length === 0) return;

      const newPrompt = parts.join(language === 'ZH' ? '，' : ', ');
      setPrompt(newPrompt);
      setShowTemplate(false);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    if (mode === 'polish' && !imageFile) return;

    setLoading(true);
    setAnnotations([]); 
    setIsMasking(false);
    setHasMask(false);
    
    // Construct augmented prompt with chart type and color palette
    const typeLabel = t.chartTypes[chartType as keyof typeof t.chartTypes];
    const paletteLabel = t.colorPalettes[colorPalette as keyof typeof t.colorPalettes];
    const sizeLabel = t.input.sizes[colSize];
    
    // Append palette instruction only if not Default
    const paletteInstruction = colorPalette !== 'Default' ? ` Color Palette: ${paletteLabel}.` : '';
    const sizeInstruction = ` Target Layout: ${sizeLabel} width. Resolution: ${dpi} DPI.`;
    
    // Special Instructions based on Polish Task
    let specificInstruction = "";
    if (mode === 'polish') {
       if (polishTask === 'sketchTo3D') {
           specificInstruction = " Render this sketch as a high-quality 3D model. Use realistic lighting, ambient occlusion, and material textures (e.g. metallic, biological). View: Isometric or Perspective as drawn. Maintain structural integrity but add 3D depth.";
       } else if (polishTask === 'chartBeautify') {
           specificInstruction = " Redesign this chart for a top-tier scientific journal (Nature/Science style). IMPORTANT: Preserve the exact data trends and values. Improve typography, color harmony, and layout. Make it look like a vector graphic. Use a clean, professional aesthetic.";
       }
    }

    const augmentedPrompt = `Type: ${typeLabel}. Description: ${prompt}.${specificInstruction}${paletteInstruction}${sizeInstruction}`;

    // Determine API Image Size based on settings
    let imageSize: '1K' | '2K' | '4K' = '1K';
    
    if (colSize === 'double' && dpi === '600') {
        imageSize = '4K';
    } else if (colSize === 'double' || dpi === '600') {
        imageSize = '2K';
    } else {
        imageSize = '1K';
    }

    const result = await generateScientificFigure(augmentedPrompt, style, mode, imageFile || undefined, backgroundOnly, undefined, imageSize);
    if (result) {
        setResultImage(result);
        setHistory(prev => [result, ...prev]);
    }
    setLoading(false);
  };

  const handleRefine = async () => {
      if (!refineInput || !resultImage) return;
      setLoading(true);
      
      try {
          const res = await fetch(resultImage);
          const blob = await res.blob();
          const file = new File([blob], "refined_image.png", { type: "image/png" });
          
          let maskFile: File | undefined = undefined;

          // Process Mask if exists
          if (hasMask && canvasRef.current) {
              const maskBlob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/png'));
              if (maskBlob) maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
          }
          
          const newResult = await generateScientificFigure(refineInput, style, 'polish', file, backgroundOnly, maskFile);
          if (newResult) {
              setResultImage(newResult);
              setHistory(prev => [newResult, ...prev]);
              setRefineInput('');
              clearMask();
              setIsMasking(false);
          }
      } catch (e) {
          console.error("Refine Error", e);
      }
      setLoading(false);
  };

  const handleDownload = () => {
      if (resultImage) {
          const a = document.createElement('a');
          a.href = resultImage;
          a.download = `scientific_figure_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  const handleDownloadComposite = () => {
      if (!resultImage) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
              ctx.drawImage(img, 0, 0);
              const fontSize = Math.max(12, Math.round(canvas.width * 0.02));
              ctx.font = `bold ${fontSize}px Arial, sans-serif`;
              ctx.fillStyle = "black";
              ctx.textBaseline = "middle";
              ctx.textAlign = "left"; 
              
              annotations.forEach(ann => {
                  const x = (ann.xPct / 100) * canvas.width;
                  const y = (ann.yPct / 100) * canvas.height;
                  
                  const textMetrics = ctx.measureText(ann.text);
                  const bgPadding = fontSize * 0.4;
                  
                  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                  ctx.fillRect(x - bgPadding, y - fontSize/2 - bgPadding, textMetrics.width + bgPadding*2, fontSize + bgPadding*2);
                  
                  ctx.fillStyle = "black";
                  ctx.fillText(ann.text, x, y);
              });
              
              const dataUrl = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = dataUrl;
              a.download = `annotated_figure_${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
          }
      };
      img.src = resultImage;
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMasking) return; 
      if (!isAnnotating || !resultImage || tempAnnotation) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;
      
      setTempAnnotation({ x: xPct, y: yPct });
      setTempText('');
  };

  const confirmAnnotation = () => {
      if (tempAnnotation && tempText.trim()) {
          setAnnotations(prev => [...prev, {
              id: Date.now().toString(),
              xPct: tempAnnotation.x,
              yPct: tempAnnotation.y,
              text: tempText
          }]);
      }
      setTempAnnotation(null);
      setTempText('');
  };

  const removeAnnotation = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const restoreHistory = (url: string) => {
      setResultImage(url);
      setAnnotations([]);
      setIsMasking(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon className="text-purple-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
           
           {/* Left Panel: Controls */}
           <div className="lg:col-span-4 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                   
                   {/* Mode Toggle */}
                   <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex">
                       <button 
                          onClick={() => setMode('generate')}
                          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'generate' ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                       >
                           <Wand2 size={16} /> {t.mode.generate}
                       </button>
                       <button 
                          onClick={() => setMode('polish')}
                          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'polish' ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                       >
                           <PenTool size={16} /> {t.mode.polish}
                       </button>
                   </div>

                   {/* Polish Task Sub-menu */}
                   {mode === 'polish' && (
                       <div className="grid grid-cols-3 gap-2">
                           <button
                               onClick={() => setPolishTask('general')}
                               className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${polishTask === 'general' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                           >
                               <Brush size={16} className="mb-1" />
                               <span className="text-[10px] font-bold">{t.polishTasks.general}</span>
                           </button>
                           <button
                               onClick={() => setPolishTask('sketchTo3D')}
                               className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${polishTask === 'sketchTo3D' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                           >
                               <Box size={16} className="mb-1" />
                               <span className="text-[10px] font-bold">{t.polishTasks.sketchTo3D}</span>
                           </button>
                           <button
                               onClick={() => setPolishTask('chartBeautify')}
                               className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${polishTask === 'chartBeautify' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                           >
                               <BarChart size={16} className="mb-1" />
                               <span className="text-[10px] font-bold">{t.polishTasks.chartBeautify}</span>
                           </button>
                       </div>
                   )}

                   {/* Inputs */}
                   <div className="space-y-4">
                       <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                       >
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} />
                           {imageFile ? (
                               <div className="relative">
                                   <img src={URL.createObjectURL(imageFile)} alt="Upload" className="max-h-24 mx-auto rounded shadow-sm" />
                                   <div className="text-xs text-slate-500 mt-2 font-bold">{imageFile.name}</div>
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); setImageFile(null); }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                   >
                                      <X size={12} />
                                   </button>
                               </div>
                           ) : (
                               <div className="flex flex-col items-center text-slate-400 py-2">
                                   <Upload size={24} className="mb-2" />
                                   <span className="text-sm font-bold">
                                       {mode === 'generate' ? t.input.referenceLabel : t.input.sourceLabel}
                                   </span>
                                   {mode === 'generate' && <span className="text-[10px] text-slate-400 mt-1">{t.input.backgroundOnlyTip?.split('.')[0] || "Optional structure guide"}</span>}
                               </div>
                           )}
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.input.promptLabel}</label>
                           <textarea 
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder={
                                  polishTask === 'sketchTo3D' ? "E.g. Metallic surface, soft biological tissue, glossy finish..." :
                                  polishTask === 'chartBeautify' ? "E.g. Change bars to blue/green, use Times New Roman, make it cleaner..." :
                                  t.input.promptPlaceholder
                              }
                              className="w-full h-32 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-transparent text-slate-800 dark:text-slate-100"
                           />
                           
                           {/* Template Toggle - Hide for specialized tasks to avoid clutter */}
                           {polishTask === 'general' && (
                               <div className="mt-2">
                                   <button 
                                      onClick={() => setShowTemplate(!showTemplate)}
                                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                                   >
                                       <Layout size={14} /> 
                                       {t.template.title} 
                                       {showTemplate ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                   </button>
                                   
                                   {showTemplate && (
                                       <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 space-y-3 animate-fadeIn">
                                           <div className="grid grid-cols-2 gap-3">
                                               <div>
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t.template.subject}</label>
                                                   <input 
                                                      value={templateData.subject}
                                                      onChange={(e) => setTemplateData({...templateData, subject: e.target.value})}
                                                      placeholder={t.template.subjectPh}
                                                      className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-purple-500 outline-none"
                                                   />
                                               </div>
                                               <div>
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t.template.action}</label>
                                                   <input 
                                                      value={templateData.action}
                                                      onChange={(e) => setTemplateData({...templateData, action: e.target.value})}
                                                      placeholder={t.template.actionPh}
                                                      className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-purple-500 outline-none"
                                                   />
                                               </div>
                                               <div>
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t.template.environment}</label>
                                                   <input 
                                                      value={templateData.environment}
                                                      onChange={(e) => setTemplateData({...templateData, environment: e.target.value})}
                                                      placeholder={t.template.environmentPh}
                                                      className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-purple-500 outline-none"
                                                   />
                                               </div>
                                               <div>
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t.template.perspective}</label>
                                                   <input 
                                                      value={templateData.perspective}
                                                      onChange={(e) => setTemplateData({...templateData, perspective: e.target.value})}
                                                      placeholder={t.template.perspectivePh}
                                                      className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-purple-500 outline-none"
                                                   />
                                               </div>
                                           </div>
                                           <button 
                                              onClick={handleApplyTemplate}
                                              className="w-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold py-2 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                           >
                                               {t.template.apply}
                                           </button>
                                       </div>
                                   )}
                               </div>
                           )}
                       </div>

                       {/* Size and DPI */}
                       <div className="grid grid-cols-2 gap-3">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1">
                                   <Ruler size={12} /> {t.input.sizeLabel}
                               </label>
                               <select 
                                  value={colSize}
                                  onChange={(e) => setColSize(e.target.value as 'single' | 'double')}
                                  className="w-full p-2 rounded-lg text-xs font-bold border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                               >
                                   <option value="single">{t.input.sizes.single}</option>
                                   <option value="double">{t.input.sizes.double}</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1">
                                   <Printer size={12} /> {t.input.dpiLabel}
                               </label>
                               <select 
                                  value={dpi}
                                  onChange={(e) => setDpi(e.target.value as '300' | '600')}
                                  className="w-full p-2 rounded-lg text-xs font-bold border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                               >
                                   <option value="300">300 DPI (Web/Standard)</option>
                                   <option value="600">600 DPI (High-Res/Print)</option>
                               </select>
                           </div>
                       </div>

                       {/* Additional Options */}
                       <div className="flex items-center gap-2">
                           <input 
                              type="checkbox" 
                              id="bgOnly"
                              checked={backgroundOnly}
                              onChange={(e) => setBackgroundOnly(e.target.checked)}
                              className="rounded text-purple-600 focus:ring-purple-500"
                           />
                           <label htmlFor="bgOnly" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                               {t.input.backgroundOnly}
                           </label>
                       </div>
                       {backgroundOnly && <p className="text-[10px] text-slate-400">{t.input.backgroundOnlyTip}</p>}

                       {/* Generate Button */}
                       <button 
                          onClick={handleGenerate}
                          disabled={loading || !prompt || (mode === 'polish' && !imageFile)}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
                       >
                          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} className="fill-white" />}
                          {t.btn}
                       </button>
                   </div>
               </div>
           </div>

           {/* Right Panel: Result */}
           <div className="lg:col-span-8 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
               
               {/* Toolbar */}
               <div className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 z-10 flex-shrink-0">
                   <div className="flex items-center gap-4">
                       <span className="font-bold text-slate-700 dark:text-slate-200">{t.result}</span>
                       {resultImage && (
                           <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                               <button 
                                  onClick={() => { setIsAnnotating(!isAnnotating); setIsMasking(false); }}
                                  className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${isAnnotating ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'}`}
                               >
                                   <Type size={14} /> {t.tools.addLabel}
                               </button>
                               <button 
                                  onClick={() => { setIsMasking(!isMasking); setIsAnnotating(false); }}
                                  className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${isMasking ? 'bg-white dark:bg-slate-600 shadow text-red-500' : 'text-slate-500 dark:text-slate-400'}`}
                               >
                                   <Eraser size={14} /> Fix/Mask
                               </button>
                           </div>
                       )}
                   </div>
                   
                   {resultImage && (
                       <div className="flex items-center gap-2">
                           {annotations.length > 0 && (
                               <button onClick={handleDownloadComposite} className="text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2">
                                   <Save size={14} /> {t.tools.saveWithLabels}
                               </button>
                           )}
                           <button onClick={handleDownload} className="text-xs font-bold bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 flex items-center gap-2">
                               <Download size={14} /> {t.download}
                           </button>
                       </div>
                   )}
               </div>

               {/* Canvas Area */}
               <div 
                  className="flex-grow flex items-center justify-center p-8 overflow-auto relative bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-slate-50 dark:bg-slate-900"
               >
                   {loading ? (
                       <div className="text-center">
                           <div className="relative w-24 h-24 mx-auto mb-6">
                               <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping"></div>
                               <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                               <Wand2 size={40} className="absolute inset-0 m-auto text-purple-600" />
                           </div>
                           <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">{t.generating}</p>
                           <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Rendering scientific accuracy...</p>
                       </div>
                   ) : resultImage ? (
                       <div 
                          ref={imageContainerRef}
                          className={`relative shadow-2xl rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-700 bg-white dark:bg-black inline-block`}
                          onClick={handleImageClick}
                          style={{ cursor: isAnnotating ? 'text' : isMasking ? 'none' : 'default' }}
                       >
                           {/* Main Image */}
                           <img 
                              ref={imageRef}
                              src={resultImage} 
                              alt="Generated Figure" 
                              className="max-w-full max-h-[600px] object-contain block"
                           />
                           
                           {/* Masking Canvas Overlay */}
                           {isMasking && (
                               <canvas 
                                  ref={canvasRef}
                                  className="absolute inset-0 touch-none pointer-events-auto"
                                  onMouseDown={startDrawing}
                                  onMouseMove={draw}
                                  onMouseUp={stopDrawing}
                                  onMouseLeave={stopDrawing}
                                  style={{ cursor: 'crosshair' }}
                               />
                           )}

                           {/* Visual feedback for drawing cursor */}
                           {isMasking && !isDrawing && (
                               <div className="pointer-events-none absolute w-5 h-5 rounded-full border-2 border-red-500 -translate-x-1/2 -translate-y-1/2 z-20" />
                           )}

                           {/* Annotation Overlay */}
                           {annotations.map(ann => (
                               <div 
                                  key={ann.id}
                                  className="absolute bg-white/90 dark:bg-black/80 px-2 py-1 rounded shadow text-xs font-bold border border-slate-300 dark:border-slate-600 text-black dark:text-white transform -translate-x-1/2 -translate-y-1/2 cursor-default group/label"
                                  style={{ left: `${ann.xPct}%`, top: `${ann.yPct}%` }}
                                  onClick={(e) => e.stopPropagation()}
                               >
                                   {ann.text}
                                   {isAnnotating && (
                                       <button 
                                          onClick={(e) => removeAnnotation(ann.id, e)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/label:opacity-100 transition-opacity"
                                       >
                                           <X size={10} />
                                       </button>
                                   )}
                               </div>
                           ))}

                           {/* Temp Input Box */}
                           {tempAnnotation && (
                               <div 
                                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                  style={{ left: `${tempAnnotation.x}%`, top: `${tempAnnotation.y}%` }}
                               >
                                   <input 
                                      autoFocus
                                      value={tempText}
                                      onChange={(e) => setTempText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && confirmAnnotation()}
                                      onBlur={confirmAnnotation}
                                      className="text-xs p-1 rounded border border-purple-500 shadow-lg outline-none w-32"
                                      placeholder="Label..."
                                   />
                               </div>
                           )}
                       </div>
                   ) : (
                       <div className="text-center text-slate-400 opacity-50">
                           <ImageIcon size={64} className="mx-auto mb-4" />
                           <p>No figure generated yet.</p>
                       </div>
                   )}
               </div>

               {/* Refine / Chat Input / History */}
               <div className="bg-white dark:bg-slate-800 z-10 border-t border-slate-200 dark:border-slate-700">
                   {/* History Strip */}
                   {history.length > 0 && (
                       <div className="flex items-center gap-2 p-2 border-b border-slate-100 dark:border-slate-700 overflow-x-auto custom-scrollbar">
                           <div className="flex-shrink-0 text-xs font-bold text-slate-400 uppercase px-2 flex items-center gap-1">
                               <Clock size={12} /> {t.history}
                           </div>
                           {history.map((url, idx) => (
                               <div 
                                  key={idx}
                                  onClick={() => restoreHistory(url)}
                                  className={`relative w-12 h-12 flex-shrink-0 rounded border cursor-pointer overflow-hidden transition-all hover:opacity-100 ${resultImage === url ? 'border-purple-500 ring-2 ring-purple-100 opacity-100' : 'border-slate-200 opacity-60 hover:border-purple-300'}`}
                               >
                                   <img src={url} className="w-full h-full object-cover" alt={`Version ${history.length - idx}`} />
                               </div>
                           ))}
                       </div>
                   )}

                   {resultImage && (
                       <div className="p-4">
                           {hasMask && (
                               <div className="text-xs text-red-500 font-bold mb-2 flex items-center gap-1 animate-pulse">
                                   <Eraser size={12} /> Mask Mode Active: Describe changes for the masked area.
                               </div>
                           )}
                           <div className="relative">
                               <input 
                                  type="text" 
                                  value={refineInput}
                                  onChange={(e) => setRefineInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                  placeholder={hasMask ? "Describe what to put in the masked area..." : t.refinePlaceholder}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                               />
                               <button 
                                  onClick={handleRefine}
                                  disabled={loading || !refineInput}
                                  className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                               >
                                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                               </button>
                           </div>
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

export default FigureGenerator;
