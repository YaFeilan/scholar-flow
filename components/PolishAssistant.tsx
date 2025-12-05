

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PenTool, Upload, FileText, ArrowRight, Check, Loader2, RefreshCw, X, RotateCcw, MessageCircle, Download, ToggleLeft, ToggleRight, History, Settings, Lock } from 'lucide-react';
import { polishContent, refinePolish } from '../services/geminiService';
import { PolishResult, Language, PolishConfig, PolishMode, PolishTone, PolishField, PolishChange } from '../types';
import { TRANSLATIONS } from '../translations';

interface PolishAssistantProps {
  language: Language;
}

const PolishAssistant: React.FC<PolishAssistantProps> = ({ language }) => {
  const t = TRANSLATIONS[language].polish;
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  
  // Input State
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Configuration State
  const [config, setConfig] = useState<PolishConfig>({
      mode: 'EnToEn',
      tone: 'Academic',
      field: 'General',
      glossary: ''
  });

  // Output State & History
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PolishResult[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<'clean' | 'diff'>('clean');
  
  // Interactive State
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [hoveredChangeId, setHoveredChangeId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentResult = useMemo(() => {
     if (currentVersionIndex >= 0 && currentVersionIndex < history.length) {
         return history[currentVersionIndex];
     }
     return null;
  }, [history, currentVersionIndex]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
          setInputText(''); 
      } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) setInputText(ev.target.result as string);
          };
          if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.tex') || selectedFile.name.endsWith('.txt')) {
             reader.readAsText(selectedFile);
          }
      }
    }
  };

  const handlePolish = async () => {
    if (activeTab === 'text' && !inputText) return;
    if (activeTab === 'file' && !file && !inputText) return;

    setLoading(true);
    
    let contentToPolish: string | File = inputText;
    if (activeTab === 'file') {
        if (file && (!inputText || inputText.startsWith('[File'))) {
             contentToPolish = file;
        }
    }

    const data = await polishContent(contentToPolish, language, config);
    if (data) {
        setHistory(prev => [...prev, data]);
        setCurrentVersionIndex(prev => prev + 1);
    }
    setLoading(false);
  };

  const handleAcceptReject = (changeId: string, action: 'accept' | 'reject') => {
      if (!currentResult) return;
      
      // We update the state in the current version (simplified for this demo)
      // Ideally we would fork a new version, but to keep it snappy we mutate local state copy
      const newHistory = [...history];
      const result = newHistory[currentVersionIndex];
      const changeIndex = result.changes.findIndex(c => c.id === changeId);
      
      if (changeIndex > -1) {
          const change = result.changes[changeIndex];
          if (change.status === action + 'ed') return; // Already done

          // If Rejecting: We need to revert the text in `polishedText`
          // NOTE: This is a simplified "Revert" visual. Real text reverting requires precise indices.
          // For this demo, we will mark the change status and update the UI rendering based on status.
          
          change.status = action === 'accept' ? 'accepted' : 'rejected';
          
          // If rejected, we might want to swap the text back in the display if we were supporting true editor.
          // For now, the DiffView will handle showing the correct version based on status.
          
          setHistory(newHistory);
      }
  };

  const handleRefine = async () => {
      if (!chatInput || !currentResult) return;
      setChatLoading(true);
      const newResult = await refinePolish(currentResult.polishedText, chatInput, language);
      if (newResult) {
          setHistory(prev => [...prev, newResult]);
          setCurrentVersionIndex(prev => prev + 1);
          setChatInput('');
      }
      setChatLoading(false);
  };

  const handleExport = () => {
      if (!currentResult) return;
      
      // Create a HTML blob that Word can interpret as tracked changes
      // Word interprets <ins> as insertion and <del> as deletion
      let htmlContent = `<html><body>`;
      
      // Naive construction: We take the polished text and inject marks. 
      // A robust solution needs exact matching. Here we simulate "Track Changes" export by listing them at bottom.
      
      htmlContent += `<h3>Polished Document (Version ${currentVersionIndex + 1})</h3>`;
      htmlContent += `<p>${currentResult.polishedText.replace(/\n/g, '<br/>')}</p>`;
      
      htmlContent += `<hr/><h3>Revision History</h3>`;
      currentResult.changes.forEach(c => {
          if (c.status !== 'rejected') {
             htmlContent += `<p><b>${c.category}:</b> <del>${c.original}</del> -> <ins>${c.revised}</ins> <i>(${c.reason})</i></p>`;
          }
      });
      htmlContent += `</body></html>`;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Polished_v${currentVersionIndex + 1}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Helper to highlight text in the main view
  const renderHighlightedText = () => {
      if (!currentResult) return null;
      let text = currentResult.polishedText;
      
      // If View Mode is Diff, we attempt to visualize changes
      // Since we don't have exact indices from LLM, we use string matching (limitations apply)
      if (viewMode === 'diff') {
          return (
              <div className="whitespace-pre-wrap leading-relaxed text-slate-800">
                  {text.split('\n').map((para, pIdx) => (
                      <p key={pIdx} className="mb-4">
                          {para.split(' ').map((word, wIdx) => {
                             // Naive matching: Check if this word is part of any "revised" text in changes
                             // Ideally we highlight full phrases.
                             // For this demo, we will simply highlight the phrases found in the changes list that exist in text.
                             return <span key={wIdx}>{word} </span>
                          })}
                          {/* Overlay changes strategy for demo */}
                          {/* We will render the full text, but use a highlighter logic */}
                          {highlightChangesInPara(para)}
                      </p>
                  ))}
              </div>
          );
      }

      return (
          <div className="whitespace-pre-wrap leading-relaxed text-slate-800 font-serif">
              {text}
          </div>
      );
  };

  const highlightChangesInPara = (para: string) => {
      // This function attempts to find 'revised' text in paragraph and wrap it
      if (!currentResult) return para;
      
      let elements: React.ReactNode[] = [para];
      
      currentResult.changes.filter(c => c.status !== 'rejected').forEach(change => {
          const newElements: React.ReactNode[] = [];
          elements.forEach(el => {
              if (typeof el === 'string' && el.includes(change.revised)) {
                  const parts = el.split(change.revised);
                  parts.forEach((part, i) => {
                      newElements.push(part);
                      if (i < parts.length - 1) {
                          newElements.push(
                              <span 
                                key={`${change.id}-${i}`}
                                className={`cursor-pointer transition-colors border-b-2 ${
                                    hoveredChangeId === change.id ? 'bg-green-200 border-green-500' : 'bg-green-50 border-green-200'
                                }`}
                                onMouseEnter={() => setHoveredChangeId(change.id)}
                                onMouseLeave={() => setHoveredChangeId(null)}
                                title={`${change.category}: ${change.reason}`}
                              >
                                {change.revised}
                              </span>
                          );
                      }
                  });
              } else {
                  newElements.push(el);
              }
          });
          elements = newElements;
      });
      
      return <>{elements}</>;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6 flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="text-purple-600" /> {t.title}
            </h2>
            <p className="text-slate-500 text-sm">{t.subtitle}</p>
         </div>
         {/* Version History */}
         {history.length > 0 && (
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                 <button 
                   onClick={() => setCurrentVersionIndex(Math.max(0, currentVersionIndex - 1))}
                   disabled={currentVersionIndex <= 0}
                   className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"
                 >
                    <ArrowRight className="rotate-180" size={16} />
                 </button>
                 <span className="text-xs font-bold text-slate-600 px-2">
                    {t.control.version} {currentVersionIndex + 1} / {history.length}
                 </span>
                 <button 
                   onClick={() => setCurrentVersionIndex(Math.min(history.length - 1, currentVersionIndex + 1))}
                   disabled={currentVersionIndex >= history.length - 1}
                   className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"
                 >
                    <ArrowRight size={16} />
                 </button>
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-hidden">
         {/* Left Column: Input & Settings */}
         <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
            
            {/* Input Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col min-h-[400px]">
               <div className="flex border-b border-slate-100">
                  <button 
                     className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'text' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                     onClick={() => setActiveTab('text')}
                  >
                     {t.tabText}
                  </button>
                  <button 
                     className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'file' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                     onClick={() => setActiveTab('file')}
                  >
                     {t.tabFile}
                  </button>
               </div>
               
               <div className="p-4 flex-grow flex flex-col">
                  {activeTab === 'text' ? (
                     <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full h-full min-h-[200px] border-none p-2 text-sm leading-relaxed focus:ring-0 outline-none resize-none bg-transparent"
                     />
                  ) : (
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-grow border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors m-2"
                     >
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md,.tex" onChange={handleFileChange} />
                        <Upload size={32} className="text-slate-400 mb-4" />
                        {file ? (
                           <div className="text-center">
                              <p className="font-bold text-slate-700">{file.name}</p>
                           </div>
                        ) : (
                           <div className="text-center text-slate-500">
                              <p className="font-medium">Click to upload</p>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
                    <Settings size={16} /> Configuration
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{t.config.mode}</label>
                        <select 
                          className="w-full text-xs font-bold bg-white border border-slate-200 rounded p-2"
                          value={config.mode}
                          onChange={(e) => setConfig({...config, mode: e.target.value as PolishMode})}
                        >
                            <option value="EnToEn">{t.config.modes.EnToEn}</option>
                            <option value="CnToEn">{t.config.modes.CnToEn}</option>
                            <option value="EnToCn">{t.config.modes.EnToCn}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{t.config.tone}</label>
                        <select 
                          className="w-full text-xs font-bold bg-white border border-slate-200 rounded p-2"
                          value={config.tone}
                          onChange={(e) => setConfig({...config, tone: e.target.value as PolishTone})}
                        >
                            <option value="Academic">{t.config.tones.Academic}</option>
                            <option value="Native">{t.config.tones.Native}</option>
                            <option value="Concise">{t.config.tones.Concise}</option>
                            <option value="Paraphrase">{t.config.tones.Paraphrase}</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{t.config.field}</label>
                        <select 
                          className="w-full text-xs font-bold bg-white border border-slate-200 rounded p-2"
                          value={config.field}
                          onChange={(e) => setConfig({...config, field: e.target.value as PolishField})}
                        >
                            <option value="General">{t.config.fields.General}</option>
                            <option value="CS">{t.config.fields.CS}</option>
                            <option value="Medicine">{t.config.fields.Medicine}</option>
                            <option value="Engineering">{t.config.fields.Engineering}</option>
                            <option value="SocialSciences">{t.config.fields.SocialSciences}</option>
                            <option value="Economics">{t.config.fields.Economics}</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                            <Lock size={10} /> {t.config.glossary}
                        </label>
                        <input 
                           type="text"
                           placeholder="e.g. Twin Transitions, Transformer"
                           className="w-full text-xs bg-white border border-slate-200 rounded p-2"
                           value={config.glossary}
                           onChange={(e) => setConfig({...config, glossary: e.target.value})}
                        />
                    </div>
                </div>

                <button 
                    onClick={handlePolish}
                    disabled={loading || (activeTab === 'text' && !inputText) || (activeTab === 'file' && !file)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    {t.btn}
                </button>
            </div>
         </div>

         {/* Center Column: Editor / Result */}
         <div className="lg:col-span-5 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex bg-slate-200 rounded-lg p-1">
                    <button 
                       onClick={() => setViewMode('clean')}
                       className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${viewMode === 'clean' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                    >
                       <ToggleLeft size={14} /> {t.control.cleanView}
                    </button>
                    <button 
                       onClick={() => setViewMode('diff')}
                       className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${viewMode === 'diff' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                    >
                       <ToggleRight size={14} /> {t.control.diffView}
                    </button>
                </div>
                <button onClick={handleExport} className="text-slate-500 hover:text-blue-600">
                    <Download size={18} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow p-8 overflow-y-auto">
                {currentResult ? (
                    renderHighlightedText()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p>Polished text will appear here</p>
                    </div>
                )}
            </div>

            {/* Chat Input (Iterative Refinement) */}
            {currentResult && (
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="relative">
                        <input 
                           type="text"
                           value={chatInput}
                           onChange={(e) => setChatInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                           placeholder={t.control.chatPlaceholder}
                           className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-sm"
                        />
                        <MessageCircle className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <button 
                           onClick={handleRefine}
                           disabled={chatLoading || !chatInput}
                           className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                        >
                           {chatLoading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>
            )}
         </div>

         {/* Right Column: Changes List */}
         <div className="lg:col-span-3 flex flex-col bg-slate-50 border-l border-slate-200 overflow-hidden h-full">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-700 bg-white">
                {t.revisionNotes} 
                {currentResult && <span className="ml-2 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{currentResult.changes.length}</span>}
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {currentResult?.changes.map((change) => (
                    <div 
                      key={change.id}
                      className={`bg-white rounded-lg border p-3 shadow-sm transition-all cursor-pointer ${
                          hoveredChangeId === change.id ? 'ring-2 ring-blue-400 border-blue-400' : 
                          change.status === 'rejected' ? 'opacity-50 border-slate-200' : 'border-slate-200 hover:border-blue-300'
                      }`}
                      onMouseEnter={() => setHoveredChangeId(change.id)}
                      onMouseLeave={() => setHoveredChangeId(null)}
                    >
                        <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide
                                 ${change.category === 'Grammar' ? 'bg-red-100 text-red-700' : 
                                   change.category === 'Vocabulary' ? 'bg-amber-100 text-amber-700' :
                                   change.category === 'Tone' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                 }`}>
                                 {change.category}
                             </span>
                             <div className="flex gap-1">
                                 {change.status === 'pending' && (
                                     <>
                                        <button onClick={(e) => { e.stopPropagation(); handleAcceptReject(change.id, 'accept') }} className="p-1 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded" title={t.control.accept}>
                                            <Check size={14} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleAcceptReject(change.id, 'reject') }} className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded" title={t.control.reject}>
                                            <X size={14} />
                                        </button>
                                     </>
                                 )}
                                 {change.status === 'accepted' && <Check size={14} className="text-green-600" />}
                                 {change.status === 'rejected' && <RotateCcw size={14} className="text-slate-400" />}
                             </div>
                        </div>
                        
                        <div className="text-xs space-y-1 mb-2">
                            <div className="text-red-800 line-through bg-red-50 inline px-1 rounded">{change.original}</div>
                            <div className="text-slate-400 flex justify-center"><ArrowRight size={12} className="rotate-90" /></div>
                            <div className="text-green-800 font-bold bg-green-50 inline px-1 rounded">{change.revised}</div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic border-t border-slate-100 pt-2 mt-2">
                            {change.reason}
                        </p>
                    </div>
                ))}
                {!currentResult && (
                    <div className="text-center text-slate-400 mt-10 text-sm">
                        No changes yet.
                    </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default PolishAssistant;
