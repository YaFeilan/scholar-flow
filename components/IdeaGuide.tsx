
import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Send, Loader2, BookOpen, Target, ArrowRight, MessageCircle, ChevronDown, Key, Database, Cpu, FileText, ExternalLink, Download, Layout, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import { generateResearchIdeas, generateIdeaFollowUp } from '../services/geminiService';
import { Language, IdeaGuideResult, IdeaFollowUpResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface IdeaGuideProps {
  language: Language;
  initialTopic?: string;
  onClearInitialTopic?: () => void;
}

const IdeaGuide: React.FC<IdeaGuideProps> = ({ language, initialTopic, onClearInitialTopic }) => {
  const t = TRANSLATIONS[language].idea;
  const [topic, setTopic] = useState('');
  const [focus, setFocus] = useState('General');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdeaGuideResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Deep Dive State
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState<number | null>(null);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<IdeaFollowUpResult | null>(null);

  // Auto-trigger when initialTopic is provided
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      const autoGenerate = async () => {
        setLoading(true);
        setResult(null);
        setSelectedDirectionIndex(null);
        setFollowUpResult(null);
        const data = await generateResearchIdeas(initialTopic, language, focus);
        setResult(data);
        setLoading(false);
        if (onClearInitialTopic) {
          onClearInitialTopic();
        }
      };
      autoGenerate();
    }
  }, [initialTopic, language]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !file) return;
    setLoading(true);
    setResult(null);
    setSelectedDirectionIndex(null); // Reset deep dive
    setFollowUpResult(null);
    const data = await generateResearchIdeas(topic, language, focus, file || undefined);
    setResult(data);
    setLoading(false);
  };

  const handleSelectDirection = (index: number) => {
    if (selectedDirectionIndex === index) {
      setSelectedDirectionIndex(null); // Deselect
    } else {
      setSelectedDirectionIndex(index);
      setFollowUpQuery('');
      setFollowUpResult(null);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!result || selectedDirectionIndex === null || !followUpQuery.trim()) return;
    
    setFollowUpLoading(true);
    const direction = result.directions[selectedDirectionIndex];
    const data = await generateIdeaFollowUp(topic, direction.angle, followUpQuery, language);
    setFollowUpResult(data);
    setFollowUpLoading(false);
  };

  const handleExportProposal = async () => {
    if (!resultsRef.current) return;
    
    // Capture the results area as an image to preserve Chinese characters/Unicode
    const canvas = await html2canvas(resultsRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10; 

    // If image height exceeds page, we might need multi-page logic, but for simple export, scaling to fit width and adding pages is complex.
    // For now, we fit width and let it span pages if supported, but addImage puts it on one. 
    // A robust multi-page implementation cuts the canvas. Simple version scales to width.
    
    const scaledHeight = imgHeight * (pdfWidth / imgWidth);
    
    if (scaledHeight > pdfHeight) {
        // Multi-page logic roughly
        let heightLeft = scaledHeight;
        let position = 0;
        let pageHeight = pdfHeight; 

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - scaledHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
          heightLeft -= pageHeight;
        }
    } else {
        pdf.addImage(imgData, 'PNG', 0, imgY, pdfWidth, scaledHeight);
    }

    pdf.save('Research_Results.pdf');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 mb-8 border border-amber-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3">
                <div className="bg-amber-400 p-2 rounded-lg text-white shadow-lg shadow-amber-200">
                  <Lightbulb size={24} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-amber-900 whitespace-nowrap">{t.title}</h2>
             </div>
             <p className="text-amber-800/70 max-w-2xl">{t.subtitle}</p>
           </div>
           
           {result && (
              <button 
                onClick={handleExportProposal}
                className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-amber-50 flex items-center gap-2 transition-colors"
              >
                <Download size={18} /> {t.exportProposal}
              </button>
           )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-12">
           <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 flex flex-col md:flex-row items-start gap-2">
              <div className="flex-grow w-full relative">
                 <textarea
                   value={topic}
                   onChange={(e) => setTopic(e.target.value)}
                   placeholder={t.placeholder}
                   className="w-full bg-transparent border-none text-lg px-4 py-3 focus:ring-0 outline-none resize-none h-24 placeholder-slate-400 text-slate-700"
                 />
                 <div className="absolute bottom-2 left-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">{t.focus.label}</span>
                    <select 
                      value={focus} 
                      onChange={(e) => setFocus(e.target.value)}
                      className="text-xs font-bold text-slate-600 bg-slate-100 border-none rounded py-1 pl-2 pr-6 cursor-pointer focus:ring-0"
                    >
                       <option value="General">{t.focus.general}</option>
                       <option value="Data-Driven">{t.focus.data}</option>
                       <option value="Policy-Oriented">{t.focus.policy}</option>
                       <option value="Theory-Heavy">{t.focus.theory}</option>
                    </select>
                    
                    {/* Image Upload Trigger */}
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <input 
                       type="file" 
                       ref={fileInputRef}
                       className="hidden" 
                       accept="image/*"
                       onChange={handleFileChange}
                    />
                    <button 
                       onClick={() => fileInputRef.current?.click()}
                       className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${file ? 'bg-purple-100 text-purple-700' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
                       title="Upload image for inspiration"
                    >
                       <ImageIcon size={14} /> 
                       {file ? <span className="max-w-[80px] truncate">{file.name}</span> : <span>Image</span>}
                    </button>
                    {file && (
                        <button onClick={(e) => {e.stopPropagation(); setFile(null);}} className="text-slate-400 hover:text-red-500">
                            <X size={12} />
                        </button>
                    )}
                 </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || (!topic && !file)}
                className="w-full md:w-auto bg-amber-500 text-white px-8 rounded-lg font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 h-24 flex-shrink-0"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}
                <span className="text-sm whitespace-nowrap">{t.btn}</span>
              </button>
           </div>
        </div>

        {/* Results */}
        {loading && (
           <div className="lg:col-span-12 text-center py-20">
              <div className="relative inline-block">
                 <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lightbulb size={20} className="text-amber-500" />
                 </div>
              </div>
              <p className="text-amber-600 font-bold mt-4 animate-pulse">{t.generating}</p>
           </div>
        )}

        {result && (
           <div ref={resultsRef} className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50 p-4 rounded-xl">
              {/* Research Directions */}
              <div className="lg:col-span-8 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                        <Target className="text-blue-600" /> {t.directions}
                    </h3>
                    <button 
                      onClick={handleGenerate}
                      className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Regenerate
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-6">
                    {result.directions?.map((dir, idx) => {
                       const isSelected = selectedDirectionIndex === idx;
                       const isDimmed = selectedDirectionIndex !== null && !isSelected;

                       return (
                          <div 
                            key={idx} 
                            className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden
                              ${isSelected ? 'border-amber-500 shadow-md ring-1 ring-amber-100' : 'border-slate-200 shadow-sm hover:shadow-md'}
                              ${isDimmed ? 'opacity-60 scale-95' : 'opacity-100'}
                            `}
                          >
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                 <div>
                                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direction {idx + 1}</div>
                                     <h4 className="text-xl font-bold text-slate-800 leading-tight">{dir.angle}</h4>
                                 </div>
                                 <button 
                                   onClick={() => handleSelectDirection(idx)}
                                   className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 flex-shrink-0
                                      ${isSelected 
                                        ? 'bg-amber-500 text-white border-amber-500' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}
                                   `}
                                 >
                                    {isSelected ? <ChevronDown size={14} /> : <MessageCircle size={14} />}
                                    {t.selectDirection}
                                 </button>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed mb-6 border-l-2 border-slate-200 pl-3">{dir.description}</p>
                              
                              {/* Methodology & Data Badges */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                 <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Cpu size={12} /> {t.methodology}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700">{dir.methodology}</div>
                                 </div>
                                 <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Database size={12} /> {t.dataSources}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700">{dir.dataSources}</div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Titles */}
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <BookOpen size={12} /> {t.titles}
                                    </h5>
                                    <ul className="space-y-2">
                                        {dir.recommendedTitles?.map((title, tIdx) => (
                                        <li key={tIdx} className="flex items-start gap-2 text-sm text-slate-700 font-medium leading-snug">
                                            <ArrowRight size={14} className="mt-0.5 text-amber-500 flex-shrink-0" />
                                            {title}
                                        </li>
                                        ))}
                                    </ul>
                                  </div>
                                  
                                  {/* Core Papers */}
                                  <div>
                                     <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <FileText size={12} /> {t.corePapers}
                                     </h5>
                                     {dir.corePapers && dir.corePapers.length > 0 ? (
                                        <ul className="space-y-2">
                                            {dir.corePapers.map((paper, pIdx) => (
                                            <li key={pIdx} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600">
                                                <div className="font-bold text-slate-800">{paper.title}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">{paper.author} • {paper.year}</div>
                                            </li>
                                            ))}
                                        </ul>
                                     ) : (
                                         <p className="text-xs text-slate-400 italic">No specific papers generated.</p>
                                     )}
                                  </div>
                              </div>
                            </div>

                            {/* Deep Dive Section */}
                            {isSelected && (
                               <div className="bg-amber-50/50 border-t border-amber-100 p-6 animate-fadeIn">
                                  <h5 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                     <MessageCircle size={18} /> {(t.followUpPlaceholder || '').split('...')[0]}
                                  </h5>
                                  <div className="flex gap-2 mb-6">
                                     <input 
                                       type="text" 
                                       value={followUpQuery}
                                       onChange={(e) => setFollowUpQuery(e.target.value)}
                                       className="flex-grow border border-amber-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                       placeholder={t.followUpPlaceholder}
                                       onKeyDown={(e) => e.key === 'Enter' && handleFollowUpSubmit()}
                                     />
                                     <button 
                                       onClick={handleFollowUpSubmit}
                                       disabled={followUpLoading || !followUpQuery}
                                       className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                     >
                                       {followUpLoading ? <Loader2 className="animate-spin h-4 w-4" /> : t.followUpBtn}
                                     </button>
                                  </div>

                                  {/* Deep Dive Result */}
                                  {followUpResult && (
                                     <div className="bg-white rounded-lg border border-amber-100 p-5 shadow-sm animate-fadeIn">
                                        {/* Logic Tree Visualization */}
                                        {followUpResult.logicPath && followUpResult.logicPath.length > 0 && (
                                            <div className="mb-6 overflow-x-auto pb-2">
                                                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                                    <Layout size={12} /> {t.logicFlow}
                                                </h6>
                                                <div className="flex items-center min-w-max">
                                                    {followUpResult.logicPath.map((step, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <div className="bg-blue-50 text-blue-800 border border-blue-100 px-3 py-2 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap">
                                                                {step}
                                                            </div>
                                                            {idx < followUpResult.logicPath.length - 1 && (
                                                                <ArrowRight size={16} className="text-slate-300 mx-2" />
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                           <h6 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">{t.deepDive}</h6>
                                           <p className="text-slate-700 text-sm leading-relaxed">{followUpResult.analysis}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                           {followUpResult.suggestions?.map((sug, sIdx) => (
                                              <div key={sIdx} className="bg-slate-50 p-3 rounded border border-slate-100">
                                                 <div className="font-bold text-slate-800 text-sm mb-1">{sug.title}</div>
                                                 <div className="text-xs text-slate-500">{sug.detail}</div>
                                              </div>
                                           ))}
                                        </div>

                                        <div>
                                           <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                              <Key size={12} /> {t.keywords}
                                           </h6>
                                           <div className="flex flex-wrap gap-2">
                                              {followUpResult.recommendedTerms?.map((term, kIdx) => (
                                                 <span key={kIdx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full border border-slate-200 font-medium">
                                                    {term}
                                                 </span>
                                              ))}
                                           </div>
                                        </div>
                                     </div>
                                  )}
                               </div>
                            )}
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* Recommended Journals */}
              <div className="lg:col-span-4 space-y-6">
                 <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                    <BookOpen className="text-green-600" /> {t.journals}
                 </h3>
                 
                 <div className="space-y-4">
                    {result.journals?.map((journal, idx) => (
                       <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-fadeIn" style={{animationDelay: `${idx * 150}ms`}}>
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-800 leading-tight">{journal.name}</h4>
                             <ExternalLink size={14} className="text-slate-300 hover:text-blue-500 cursor-pointer" />
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                             <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">IF: {journal.impactFactor}</span>
                             {journal.reviewCycle && (
                                <span className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200">{journal.reviewCycle}</span>
                             )}
                             {journal.acceptanceRate && (
                                <span className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200">Acc: {journal.acceptanceRate}</span>
                             )}
                          </div>
                          
                          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2 mt-2">
                             {journal.reason}
                          </p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default IdeaGuide;