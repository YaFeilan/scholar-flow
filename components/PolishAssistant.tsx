
import React, { useState, useRef } from 'react';
import { PenTool, Upload, FileText, ArrowRight, Check, Loader2, RefreshCw } from 'lucide-react';
import { polishContent } from '../services/geminiService';
import { PolishResult, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface PolishAssistantProps {
  language: Language;
}

const PolishAssistant: React.FC<PolishAssistantProps> = ({ language }) => {
  const t = TRANSLATIONS[language].polish;
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolishResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // If it is PDF or Image, we use the file directly via Gemini multimodal
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
          setInputText(''); // Clear text to indicate file mode
      } else {
          // For legacy support of text/md files, we read content
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) setInputText(ev.target.result as string);
          };
          if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.tex') || selectedFile.name.endsWith('.txt')) {
             reader.readAsText(selectedFile);
          } else {
             // Fallback for unknown types if needed
             setInputText(`[File ${selectedFile.name} selected]`);
          }
      }
    }
  };

  const handlePolish = async () => {
    if (activeTab === 'text' && !inputText) return;
    if (activeTab === 'file' && !file && !inputText) return;

    setLoading(true);
    
    // Determine what to send: File object or Text string
    let contentToPolish: string | File = inputText;
    
    if (activeTab === 'file') {
        if (file && (!inputText || inputText.startsWith('[File'))) {
             // Use the file object for PDF/Images
             contentToPolish = file;
        }
    }

    const data = await polishContent(contentToPolish, language);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
         <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-600 rounded-full mb-4">
            <PenTool size={24} />
         </div>
         <h2 className="text-3xl font-serif font-bold text-slate-900">{t.title}</h2>
         <p className="text-slate-500 max-w-xl mx-auto mt-2">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Left Column: Input */}
         <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
               
               <div className="p-6">
                  {activeTab === 'text' ? (
                     <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full h-64 border border-slate-200 rounded-lg p-4 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                     />
                  ) : (
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-64 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                     >
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md,.tex" onChange={handleFileChange} />
                        <Upload size={32} className="text-slate-400 mb-4" />
                        {file ? (
                           <div className="text-center">
                              <p className="font-bold text-slate-700">{file.name}</p>
                              <p className="text-xs text-slate-400 mt-1">Ready to polish</p>
                           </div>
                        ) : (
                           <div className="text-center text-slate-500">
                              <p className="font-medium">Click to upload file</p>
                              <p className="text-xs mt-1">PDF, .txt, .md, .tex supported</p>
                           </div>
                        )}
                     </div>
                  )}

                  <div className="mt-4 flex justify-end">
                     <button 
                        onClick={handlePolish}
                        disabled={loading || (activeTab === 'text' && !inputText) || (activeTab === 'file' && !file)}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                     >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        {t.btn}
                     </button>
                  </div>
               </div>
            </div>

            {/* Change List (Desktop: Below Input) */}
            {result && (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <FileText size={18} className="text-slate-400" /> 
                     {t.revisionNotes}
                  </h3>
                  <div className="space-y-4">
                     {result.changes.map((change, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">
                           <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide
                                 ${change.category === 'Grammar' ? 'bg-red-100 text-red-700' : 
                                   change.category === 'Vocabulary' ? 'bg-amber-100 text-amber-700' :
                                   change.category === 'Tone' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                 }`}>
                                 {change.category}
                              </span>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-center mb-2">
                              <div className="bg-red-50 text-red-800 p-2 rounded line-through opacity-70">
                                 {change.original}
                              </div>
                              <ArrowRight size={14} className="text-slate-400 mx-auto transform rotate-90 sm:rotate-0" />
                              <div className="bg-green-50 text-green-800 p-2 rounded font-medium">
                                 {change.revised}
                              </div>
                           </div>
                           <p className="text-xs text-slate-500 italic">
                              <span className="font-semibold text-slate-600 not-italic">Reason: </span>
                              {change.reason}
                           </p>
                        </div>
                     ))}
                     {result.changes.length === 0 && (
                        <p className="text-slate-500 text-sm italic text-center py-4">No major errors found. Your text is already in good shape!</p>
                     )}
                  </div>
               </div>
            )}
         </div>

         {/* Right Column: Result */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
               <span className="font-bold text-slate-800">{t.outputTitle}</span>
               {result && <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">AI-Enhanced</span>}
            </div>
            
            <div className="flex-grow p-6">
               {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                     <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <PenTool size={20} className="text-blue-500" />
                        </div>
                     </div>
                     <p>Analyzing syntax and style...</p>
                  </div>
               ) : result ? (
                  <div className="animate-fadeIn space-y-6">
                     <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                        <span className="font-bold block mb-1">{t.feedback}:</span>
                        {result.overallComment}
                     </div>
                     <div className="prose prose-slate max-w-none text-base leading-7 text-slate-800 font-serif">
                        {result.polishedText.split('\n').map((para, i) => (
                           <p key={i}>{para}</p>
                        ))}
                     </div>
                     <div className="flex justify-end pt-4 border-t border-slate-100 mt-8">
                        <button 
                           onClick={() => navigator.clipboard.writeText(result.polishedText)}
                           className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                           <Check size={14} /> Copy to Clipboard
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                     <FileText size={64} className="mb-4 opacity-50" />
                     <p>Polished text will appear here</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default PolishAssistant;
