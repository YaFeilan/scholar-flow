
import React, { useState, useRef } from 'react';
import { FileText, Feather, ShieldCheck, Send, Loader2, Sparkles, AlertTriangle, CheckCircle, Download, BookOpen, Key, Briefcase, Upload, Link, Trash2, List, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateGrantJustification, polishGrantProposal, checkGrantFormat } from '../services/geminiService';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface GrantApplicationProps {
  language: Language;
}

const GrantApplication: React.FC<GrantApplicationProps> = ({ language }) => {
  const t = TRANSLATIONS[language].grant;
  const [activeTab, setActiveTab] = useState<'rationale' | 'polish' | 'check'>('rationale');
  
  // Rationale State
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [rationaleResult, setRationaleResult] = useState('');
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [doiInput, setDoiInput] = useState('');
  const [genMode, setGenMode] = useState<'full' | 'status' | 'significance'>('full');
  const refFileInputRef = useRef<HTMLInputElement>(null);
  
  // Polish State
  const [polishText, setPolishText] = useState('');
  const [sectionType, setSectionType] = useState('significance');
  const [polishResult, setPolishResult] = useState('');
  
  // Check State
  const [checkText, setCheckText] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);

  const handleRationale = async () => {
      if (!topic.trim()) return;
      setLoading(true);
      const kws = keywords.split(/[,，]/).map(k => k.trim()).filter(k => k);
      
      const references: { type: 'pdf' | 'doi', content: string | File }[] = [];
      
      // Add DOIs
      doiInput.split('\n').forEach(doi => {
          if (doi.trim()) references.push({ type: 'doi', content: doi.trim() });
      });
      
      // Add Files
      refFiles.forEach(file => {
          references.push({ type: 'pdf', content: file });
      });

      const res = await generateGrantJustification(topic, kws, language, references, genMode);
      setRationaleResult(res);
      setLoading(false);
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = (Array.from(e.target.files) as File[]).filter(f => f.type === 'application/pdf');
          setRefFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Limit to 10
      }
  };

  const removeRefFile = (index: number) => {
      setRefFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePolish = async () => {
      if (!polishText.trim()) return;
      setLoading(true);
      const res = await polishGrantProposal(polishText, sectionType, language);
      setPolishResult(res);
      setLoading(false);
  };

  const handleCheck = async () => {
      if (!checkText.trim()) return;
      setLoading(true);
      const res = await checkGrantFormat(checkText, language);
      setCheckResult(res);
      setLoading(false);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('Copied!');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="text-indigo-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
           {/* Left Panel: Inputs & Config */}
           <div className="lg:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               {/* Tabs */}
               <div className="flex border-b border-slate-200 dark:border-slate-700">
                   <button 
                      onClick={() => setActiveTab('rationale')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'rationale' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                       <BookOpen size={16} /> {t.tabs.rationale}
                   </button>
                   <button 
                      onClick={() => setActiveTab('polish')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'polish' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                       <Feather size={16} /> {t.tabs.polish}
                   </button>
                   <button 
                      onClick={() => setActiveTab('check')}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'check' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                       <ShieldCheck size={16} /> {t.tabs.check}
                   </button>
               </div>

               <div className="p-6 flex-grow overflow-y-auto space-y-6">
                   {activeTab === 'rationale' && (
                       <div className="space-y-4 animate-fadeIn">
                           <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.rationale.title}</h3>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.rationale.topic}</label>
                               <textarea 
                                  value={topic}
                                  onChange={(e) => setTopic(e.target.value)}
                                  placeholder={t.rationale.placeholder}
                                  className="w-full h-20 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
                               />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                                   <Key size={12} /> {t.rationale.keywords}
                               </label>
                               <input 
                                  value={keywords}
                                  onChange={(e) => setKeywords(e.target.value)}
                                  placeholder="e.g. Mechanism, Pathway, Target"
                                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
                               />
                           </div>

                           {/* Reference Section */}
                           <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1">
                                   <BookOpen size={12} /> {t.rationale.references}
                               </label>
                               
                               {/* File Upload */}
                               <div className="mb-3">
                                   <button 
                                      onClick={() => refFileInputRef.current?.click()}
                                      className="w-full bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                   >
                                       <Upload size={14} /> {t.rationale.refUpload}
                                   </button>
                                   <input 
                                      type="file" 
                                      multiple 
                                      ref={refFileInputRef} 
                                      className="hidden" 
                                      accept="application/pdf"
                                      onChange={handleRefFileChange}
                                   />
                                   {refFiles.length > 0 && (
                                       <div className="mt-2 space-y-1">
                                           {refFiles.map((f, i) => (
                                               <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                                   <span className="truncate max-w-[200px]">{f.name}</span>
                                                   <button onClick={() => removeRefFile(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                                               </div>
                                           ))}
                                           <div className="text-[10px] text-slate-400 text-right">{refFiles.length}/10 {t.rationale.fileLimit}</div>
                                       </div>
                                   )}
                               </div>

                               {/* DOI Input */}
                               <div>
                                   <textarea 
                                      value={doiInput}
                                      onChange={(e) => setDoiInput(e.target.value)}
                                      placeholder={t.rationale.refDoi}
                                      className="w-full h-16 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white dark:bg-slate-800"
                                   />
                               </div>
                               <p className="text-[10px] text-slate-400 mt-2 italic flex items-start gap-1">
                                   <Sparkles size={10} className="mt-0.5" />
                                   {t.rationale.refHint}
                               </p>
                           </div>

                           {/* Generation Mode Selector */}
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.rationale.modeLabel}</label>
                               <div className="grid grid-cols-1 gap-2">
                                   <button 
                                      onClick={() => setGenMode('full')}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${genMode === 'full' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                   >
                                       <List size={14} className={genMode === 'full' ? 'text-indigo-600' : 'text-slate-400'} />
                                       {t.rationale.modes.full}
                                   </button>
                                   <button 
                                      onClick={() => setGenMode('status')}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${genMode === 'status' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                   >
                                       <BookOpen size={14} className={genMode === 'status' ? 'text-indigo-600' : 'text-slate-400'} />
                                       {t.rationale.modes.status}
                                   </button>
                                   <button 
                                      onClick={() => setGenMode('significance')}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${genMode === 'significance' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                   >
                                       <Lightbulb size={14} className={genMode === 'significance' ? 'text-indigo-600' : 'text-slate-400'} />
                                       {t.rationale.modes.significance}
                                   </button>
                               </div>
                           </div>

                           <button 
                              onClick={handleRationale}
                              disabled={loading || !topic}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                           >
                               {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                               {t.rationale.btn}
                           </button>
                       </div>
                   )}

                   {activeTab === 'polish' && (
                       <div className="space-y-4 animate-fadeIn">
                           <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.polish.title}</h3>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.polish.section}</label>
                               <select 
                                  value={sectionType}
                                  onChange={(e) => setSectionType(e.target.value)}
                                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-slate-200"
                               >
                                   {Object.entries(t.polish.sections).map(([k, v]) => (
                                       <option key={k} value={k}>{v}</option>
                                   ))}
                               </select>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.polish.content}</label>
                               <textarea 
                                  value={polishText}
                                  onChange={(e) => setPolishText(e.target.value)}
                                  placeholder={t.polish.placeholder}
                                  className="w-full h-48 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
                               />
                           </div>
                           <button 
                              onClick={handlePolish}
                              disabled={loading || !polishText}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                           >
                               {loading ? <Loader2 className="animate-spin" /> : <Feather size={18} />}
                               {t.polish.btn}
                           </button>
                       </div>
                   )}

                   {activeTab === 'check' && (
                       <div className="space-y-4 animate-fadeIn">
                           <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.check.title}</h3>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.check.upload}</label>
                               <textarea 
                                  value={checkText}
                                  onChange={(e) => setCheckText(e.target.value)}
                                  placeholder="Paste full proposal text here..."
                                  className="w-full h-64 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
                               />
                           </div>
                           <button 
                              onClick={handleCheck}
                              disabled={loading || !checkText}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                           >
                               {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                               {t.check.btn}
                           </button>
                       </div>
                   )}
               </div>
           </div>

           {/* Right Panel: Output */}
           <div className="lg:w-2/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
               <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                   {loading && (
                       <div className="flex flex-col items-center justify-center h-full text-slate-400">
                           <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                           <p>AI is analyzing grant context...</p>
                       </div>
                   )}

                   {!loading && activeTab === 'rationale' && rationaleResult && (
                       <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                           <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                               <h3 className="text-lg font-bold text-indigo-600 m-0">Project Rationale Draft ({t.rationale.modes[genMode]})</h3>
                               <button onClick={() => copyToClipboard(rationaleResult)} className="text-slate-400 hover:text-indigo-600"><Download size={18}/></button>
                           </div>
                           <ReactMarkdown>{rationaleResult}</ReactMarkdown>
                       </div>
                   )}

                   {!loading && activeTab === 'polish' && polishResult && (
                       <div>
                           <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                               <h3 className="text-lg font-bold text-indigo-600 m-0">Polished Proposal</h3>
                               <button onClick={() => copyToClipboard(polishResult)} className="text-slate-400 hover:text-indigo-600"><Download size={18}/></button>
                           </div>
                           <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                               {polishResult}
                           </div>
                       </div>
                   )}

                   {!loading && activeTab === 'check' && checkResult && (
                       <div className="space-y-6">
                           <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
                               <h3 className="text-lg font-bold text-indigo-600 m-0">Compliance Review Report</h3>
                               <span className={`px-3 py-1 rounded-full text-sm font-bold ${checkResult.score > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                   Score: {checkResult.score}/100
                               </span>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                   <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">Innovation</span>
                                   <span className="font-bold text-slate-800 dark:text-slate-200">{checkResult.innovationRating}</span>
                               </div>
                               <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                   <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Feasibility</span>
                                   <span className="font-bold text-slate-800 dark:text-slate-200">{checkResult.feasibilityRating}</span>
                               </div>
                           </div>

                           {checkResult.issues && checkResult.issues.length > 0 && (
                               <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                                   <h4 className="text-sm font-bold text-red-700 dark:text-red-300 flex items-center gap-2 mb-2">
                                       <AlertTriangle size={16} /> {t.check.issues}
                                   </h4>
                                   <ul className="list-disc pl-5 space-y-1 text-sm text-red-800 dark:text-red-200">
                                       {checkResult.issues.map((issue: string, i: number) => (
                                           <li key={i}>{issue}</li>
                                       ))}
                                   </ul>
                               </div>
                           )}

                           {checkResult.suggestions && checkResult.suggestions.length > 0 && (
                               <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                                   <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-2">
                                       <Sparkles size={16} /> {t.check.suggestions}
                                   </h4>
                                   <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                                       {checkResult.suggestions.map((sug: string, i: number) => (
                                           <li key={i}>{sug}</li>
                                       ))}
                                   </ul>
                               </div>
                           )}
                       </div>
                   )}

                   {!loading && !rationaleResult && !polishResult && !checkResult && (
                       <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                           <Briefcase size={64} className="mb-4 opacity-50" />
                           <p>Select a tool on the left to start.</p>
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

export default GrantApplication;
