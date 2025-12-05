
import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Wand2, Upload, Download, RefreshCw, PenTool, ImagePlus, Loader2, Sparkles, MessageCircle, Send } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateScientificFigure } from '../services/geminiService';

interface FigureGeneratorProps {
  language: Language;
}

const FigureGenerator: React.FC<FigureGeneratorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].figure;
  
  const [mode, setMode] = useState<'generate' | 'polish'>('generate');
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [style, setStyle] = useState('Nature');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Refine chat
  const [refineInput, setRefineInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    if (mode === 'polish' && !imageFile) return;

    setLoading(true);
    const result = await generateScientificFigure(prompt, style, mode, imageFile || undefined);
    if (result) {
        setResultImage(result);
    }
    setLoading(false);
  };

  const handleRefine = async () => {
      if (!refineInput || !resultImage) return;
      // For refinement, we essentially treat the current result as the input image and polish it
      setLoading(true);
      
      // Convert base64 data URL back to file object simulation if needed, or just pass context logic.
      // But generateScientificFigure accepts a File object.
      // We need to convert the base64 string back to a Blob/File to pass it to the service for 'polish' mode.
      
      try {
          const res = await fetch(resultImage);
          const blob = await res.blob();
          const file = new File([blob], "refined_image.png", { type: "image/png" });
          
          const newResult = await generateScientificFigure(refineInput, style, 'polish', file);
          if (newResult) {
              setResultImage(newResult);
              setRefineInput('');
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

                   {/* Inputs */}
                   <div className="space-y-4">
                       {mode === 'polish' && (
                           <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                           >
                               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} />
                               {imageFile ? (
                                   <div className="relative">
                                       <img src={URL.createObjectURL(imageFile)} alt="Upload" className="max-h-32 mx-auto rounded shadow-sm" />
                                       <div className="text-xs text-slate-500 mt-2 font-bold">{imageFile.name}</div>
                                   </div>
                               ) : (
                                   <div className="flex flex-col items-center text-slate-400">
                                       <Upload size={32} className="mb-2" />
                                       <span className="text-sm font-bold">{t.input.uploadLabel}</span>
                                   </div>
                               )}
                           </div>
                       )}

                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.input.promptLabel}</label>
                           <textarea 
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder={t.input.promptPlaceholder}
                              className="w-full h-32 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-transparent text-slate-800 dark:text-slate-100"
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.input.styleLabel}</label>
                           <div className="grid grid-cols-2 gap-2">
                               {Object.entries(t.styles).map(([key, label]) => (
                                   <button 
                                      key={key}
                                      onClick={() => setStyle(key)}
                                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left truncate
                                         ${style === key 
                                            ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300'}
                                      `}
                                   >
                                       {label}
                                   </button>
                               ))}
                           </div>
                       </div>
                   </div>

                   <button 
                      onClick={handleGenerate}
                      disabled={loading || !prompt || (mode === 'polish' && !imageFile)}
                      className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none"
                   >
                      {loading ? <Loader2 className="animate-spin" /> : <ImagePlus size={18} />}
                      {t.btn}
                   </button>
               </div>
           </div>

           {/* Right Panel: Preview */}
           <div className="lg:col-span-8 flex flex-col h-full">
               <div className="flex-grow bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center relative overflow-hidden group">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 opacity-5 pointer-events-none" 
                        style={{backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                   </div>

                   {loading ? (
                       <div className="text-center z-10">
                           <div className="relative w-24 h-24 mx-auto mb-4">
                               <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                               <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                               <Sparkles className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={24} />
                           </div>
                           <p className="text-slate-500 font-bold animate-pulse">{t.generating}</p>
                       </div>
                   ) : resultImage ? (
                       <div className="relative w-full h-full flex items-center justify-center p-8">
                           <img src={resultImage} alt="Generated Figure" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                           <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={handleDownload} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-black flex items-center gap-2">
                                   <Download size={16} /> {t.download}
                               </button>
                           </div>
                       </div>
                   ) : (
                       <div className="text-center text-slate-400 dark:text-slate-600">
                           <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                           <p className="font-medium">No figure generated yet.</p>
                       </div>
                   )}
               </div>

               {/* Refinement Bar */}
               {resultImage && (
                   <div className="mt-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                       <MessageCircle className="text-purple-500 flex-shrink-0" size={20} />
                       <input 
                          type="text" 
                          value={refineInput}
                          onChange={(e) => setRefineInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                          placeholder={t.refinePlaceholder}
                          className="flex-grow bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                       />
                       <button 
                          onClick={handleRefine}
                          disabled={loading || !refineInput}
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 p-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                       >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                       </button>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default FigureGenerator;
