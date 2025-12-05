

import React, { useState, useRef } from 'react';
import { performPeerReview, generateRebuttalLetter, generateCoverLetter } from '../services/geminiService';
import { Upload, CheckCircle, FileText, Loader2, ShieldCheck, User, Building, BookOpen, AlertTriangle, PenTool, Gavel, Award, Feather, Send, Copy, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language, PeerReviewResponse, TargetType } from '../types';
import { TRANSLATIONS } from '../translations';

interface PeerReviewProps {
  language: Language;
}

const PeerReview: React.FC<PeerReviewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].peer;
  const appName = TRANSLATIONS[language].appName;
  
  // Inputs
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('SCI');
  const [journalName, setJournalName] = useState('');
  
  // States
  const [reviewResult, setReviewResult] = useState<PeerReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Checklist/Summary, 1-3 = Reviewers
  
  // Action Item States
  const [generatingAction, setGeneratingAction] = useState<string | null>(null);
  const [rebuttalLetter, setRebuttalLetter] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setContent(event.target.result as string);
        }
      };
      if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.tex') || selectedFile.name.endsWith('.txt')) {
         reader.readAsText(selectedFile);
      } else {
         setContent(`[Binary file ${selectedFile.name} selected. Please paste extracted text content here if possible, or we will simulate the review based on the filename and context.]`);
      }
    }
  };

  const handleReview = async () => {
    if (!content && !file) return;
    setLoading(true);
    setReviewResult(null);
    setRebuttalLetter(null);
    setCoverLetter(null);
    setActiveTab(0);
    
    const filename = file ? file.name : "Submitted Manuscript";
    const result = await performPeerReview(content, filename, targetType, journalName, language);
    setReviewResult(result);
    setLoading(false);
  };

  const handleGenerateRebuttal = async () => {
    if (!reviewResult) return;
    setGeneratingAction('rebuttal');
    // Aggregate critiques
    const allCritiques = reviewResult.reviewers.map(r => r.critiques.map(c => c.point).join('\n')).join('\n');
    const result = await generateRebuttalLetter(allCritiques, language);
    setRebuttalLetter(result);
    setGeneratingAction(null);
  };

  const handleGenerateCoverLetter = async () => {
    if (!reviewResult) return;
    setGeneratingAction('cover');
    // Use summary as context
    const result = await generateCoverLetter(reviewResult.summary, journalName || targetType, language);
    setCoverLetter(result);
    setGeneratingAction(null);
  };

  const PersonaIcon = ({ type, size = 18 }: { type: string, size?: number }) => {
    if (type === 'Expert') return <Gavel size={size} className="text-amber-600" />;
    if (type === 'Language') return <Feather size={size} className="text-blue-600" />;
    return <Award size={size} className="text-purple-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50">
           <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-600 p-2 rounded-lg text-white shadow-lg shadow-amber-200">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">{t.title}</h2>
           </div>
           <p className="text-slate-500">{t.subtitle}</p>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Inputs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* File Upload Zone */}
            <div 
               className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative"
               onClick={() => fileInputRef.current?.click()}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
                 accept=".pdf,.doc,.docx,.txt,.md,.tex"
               />
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  {file ? <FileText size={24} /> : <Upload size={24} />}
               </div>
               {file ? (
                 <div>
                   <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setFile(null); setContent(''); }}
                     className="text-xs text-red-500 hover:text-red-700 mt-2 font-medium"
                   >
                     Remove File
                   </button>
                 </div>
               ) : (
                 <>
                   <p className="font-bold text-slate-700 text-sm mb-1">{t.uploadTitle}</p>
                   <p className="text-xs text-slate-400">{t.uploadDesc}</p>
                 </>
               )}
            </div>

            {/* Target Settings */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.targetLabel}</label>
                    <div className="grid grid-cols-1 gap-2">
                        {['SCI', 'SSCI', 'EI', 'Coursework'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setTargetType(type as TargetType)}
                                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    targetType === type 
                                    ? 'bg-amber-100 text-amber-900 border-amber-200' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {type === 'SCI' ? 'SCI/EI (Science & Eng)' :
                                 type === 'SSCI' ? 'SSCI (Social Science)' :
                                 type === 'Coursework' ? 'Coursework / Assignment' : type}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.journalLabel}</label>
                    <input 
                        type="text"
                        value={journalName}
                        onChange={(e) => setJournalName(e.target.value)}
                        placeholder="e.g. Nature Communications"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>
            </div>

            {/* Manual Content / Fallback */}
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t.contentLabel}</label>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste content here if no file..."
                className="w-full h-32 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono"
              />
            </div>
            
            <button 
              onClick={handleReview}
              disabled={loading || (!content && !file)}
              className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              {loading ? (
                 <Loader2 className="animate-spin" /> 
              ) : (
                 <> {t.startBtn} <Send size={16} /></>
              )}
            </button>
          </div>

          {/* Right Panel / Review Output */}
          <div className="lg:col-span-8 flex flex-col h-full">
            {!reviewResult && !loading && (
              <div className="flex-grow border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                 <div className="flex gap-4 mb-6 opacity-40">
                    <Gavel size={32} />
                    <Feather size={32} />
                    <Award size={32} />
                 </div>
                 <h3 className="text-slate-400 font-bold text-lg mb-2">{t.pending}</h3>
                 <p className="text-slate-400 text-sm max-w-xs">{t.pendingDesc}</p>
              </div>
            )}
            
            {loading && (
              <div className="flex-grow border border-slate-200 rounded-xl bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                 <Loader2 className="h-10 w-10 text-amber-600 animate-spin mb-4" />
                 <h3 className="text-slate-600 font-bold mb-1">Simulating Review Board</h3>
                 <p className="text-slate-400 text-xs mt-2">Inviting Reviewer #2 (Domain Expert)...</p>
                 <p className="text-slate-400 text-xs">Checking {targetType} Scope Match...</p>
                 <p className="text-slate-400 text-xs">Analyzing Reference Health...</p>
              </div>
            )}

            {reviewResult && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-fadeIn flex flex-col h-full">
                 
                 {/* Tabs */}
                 <div className="flex border-b border-slate-100 bg-slate-50/50 rounded-t-xl overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setActiveTab(0)}
                      className={`flex-1 py-4 px-4 text-sm font-bold whitespace-nowrap flex items-center justify-center gap-2 border-b-2 transition-colors
                        ${activeTab === 0 ? 'border-amber-600 text-amber-700 bg-amber-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                       <ShieldCheck size={16} /> Checklist & Summary
                    </button>
                    {reviewResult.reviewers?.map((reviewer, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(idx + 1)}
                        className={`flex-1 py-4 px-4 text-sm font-bold whitespace-nowrap flex items-center justify-center gap-2 border-b-2 transition-colors
                          ${activeTab === idx + 1 ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                      >
                         <PersonaIcon type={reviewer.icon} size={16} /> {reviewer.roleName.split(' ')[0]}...
                      </button>
                    ))}
                 </div>

                 {/* Content Area */}
                 <div className="p-6 overflow-y-auto max-h-[600px] flex-grow">
                    {activeTab === 0 ? (
                      <div className="space-y-6">
                         {/* Checklist Dashboard */}
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {Object.entries(reviewResult.checklist).map(([key, value]) => (
                                 <div key={key} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{key}</div>
                                     <div className={`font-bold text-sm ${
                                         value === 'Accept' || value === 'High' || value === 'Excellent' || value === 'Yes' ? 'text-green-600' :
                                         value === 'Reject' || value === 'Low' || value === 'No' ? 'text-red-500' : 'text-amber-600'
                                     }`}>
                                         {value}
                                     </div>
                                 </div>
                             ))}
                         </div>

                         <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><CheckCircle size={16} /> Editor's Decision Overview</h4>
                            <p className="text-blue-900/80 text-sm leading-relaxed">{reviewResult.summary}</p>
                         </div>

                         {/* Action Buttons */}
                         <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                             <button 
                               onClick={handleGenerateRebuttal}
                               disabled={!!generatingAction}
                               className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
                             >
                                {generatingAction === 'rebuttal' ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />} 
                                {t.rebuttalBtn}
                             </button>
                             <button 
                               onClick={handleGenerateCoverLetter}
                               disabled={!!generatingAction}
                               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                             >
                                {generatingAction === 'cover' ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                {t.coverLetterBtn}
                             </button>
                         </div>

                         {/* Generated Letters Display */}
                         {(rebuttalLetter || coverLetter) && (
                             <div className="mt-6 animate-fadeIn">
                                 {rebuttalLetter && (
                                     <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
                                         <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase flex justify-between">
                                             <span>Rebuttal Letter Draft</span>
                                             <Copy size={14} className="cursor-pointer hover:text-blue-600" onClick={() => navigator.clipboard.writeText(rebuttalLetter)}/>
                                         </div>
                                         <div className="p-4 bg-slate-50 text-sm font-serif whitespace-pre-wrap max-h-64 overflow-y-auto">{rebuttalLetter}</div>
                                     </div>
                                 )}
                                 {coverLetter && (
                                     <div className="border border-slate-200 rounded-xl overflow-hidden">
                                         <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase flex justify-between">
                                             <span>Cover Letter Draft</span>
                                             <Copy size={14} className="cursor-pointer hover:text-blue-600" onClick={() => navigator.clipboard.writeText(coverLetter)}/>
                                         </div>
                                         <div className="p-4 bg-slate-50 text-sm font-serif whitespace-pre-wrap max-h-64 overflow-y-auto">{coverLetter}</div>
                                     </div>
                                 )}
                             </div>
                         )}
                      </div>
                    ) : (
                      (() => {
                        const reviewer = reviewResult.reviewers[activeTab - 1];
                        return (
                           <div className="animate-fadeIn">
                              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-slate-100">
                                 <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-2">
                                    <PersonaIcon type={reviewer.icon} size={14} /> {reviewer.roleName}
                                 </div>
                                 <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 text-xs font-bold flex items-center gap-2">
                                    <TargetIcon size={14} /> Focus: {reviewer.focusArea}
                                 </div>
                                 <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-2 ml-auto">
                                    Score: {reviewer.score}/10
                                 </div>
                              </div>
                              
                              <div className="space-y-4">
                                  {reviewer.critiques.map((critique, cIdx) => (
                                      <div key={cIdx} className="bg-white border border-slate-200 p-4 rounded-lg hover:border-amber-200 transition-colors">
                                          <div className="flex items-start gap-3">
                                              <div className="bg-red-50 text-red-600 p-1.5 rounded-md mt-0.5 font-bold text-xs">#{cIdx+1}</div>
                                              <div>
                                                  <h4 className="font-bold text-slate-800 text-sm mb-2">{critique.point}</h4>
                                                  {critique.quote && (
                                                      <div className="bg-slate-50 border-l-2 border-slate-300 pl-3 py-2 text-xs text-slate-500 italic mb-2">
                                                          "{critique.quote}"
                                                      </div>
                                                  )}
                                                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                                                      <PenTool size={12} /> Suggestion: {critique.suggestion}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                           </div>
                        );
                      })()
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for icon
const TargetIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export default PeerReview;
