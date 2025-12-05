
import React, { useState, useRef } from 'react';
import { performPeerReview } from '../services/geminiService';
import { Upload, CheckCircle, FileText, Loader2, ShieldCheck, Lightbulb, AlertTriangle, Users, BookOpen, User, Zap, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language, PeerReviewResponse } from '../types';
import { TRANSLATIONS } from '../translations';

interface PeerReviewProps {
  language: Language;
}

const PeerReview: React.FC<PeerReviewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].peer;
  const appName = TRANSLATIONS[language].appName;
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [reviewResult, setReviewResult] = useState<PeerReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Summary, 1-3 = Reviewers
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
    setActiveTab(0);
    const filename = file ? file.name : "Submitted Manuscript";
    const result = await performPeerReview(content, filename, language);
    setReviewResult(result);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50">
           <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">{t.title}</h2>
           </div>
           <p className="text-slate-500">{t.subtitle}</p>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Inputs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* File Upload Zone */}
            <div 
               className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative"
               onClick={() => fileInputRef.current?.click()}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
                 accept=".pdf,.doc,.docx,.txt,.md,.tex"
               />
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  {file ? <FileText size={32} /> : <Upload size={32} />}
               </div>
               {file ? (
                 <div>
                   <p className="font-bold text-slate-800 text-lg">{file.name}</p>
                   <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setFile(null); setContent(''); }}
                     className="text-xs text-red-500 hover:text-red-700 mt-2 font-medium"
                   >
                     Remove File
                   </button>
                 </div>
               ) : (
                 <>
                   <p className="font-bold text-slate-700 text-lg mb-1">{t.uploadTitle}</p>
                   <p className="text-sm text-slate-400">{t.uploadDesc}</p>
                 </>
               )}
            </div>

            {/* Manual Content / Fallback */}
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-bold text-slate-700">{t.contentLabel}</label>
                 <span className="text-xs text-slate-400">Extracted text</span>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content will appear here after upload, or paste directly..."
                className="w-full h-48 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-mono leading-relaxed"
              />
            </div>
            
            <button 
              onClick={handleReview}
              disabled={loading || (!content && !file)}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? (
                 <>
                   <Loader2 className="animate-spin" /> Panel Reviewing...
                 </>
              ) : (
                 <> {t.startBtn} <span className="text-xl">➤</span></>
              )}
            </button>
          </div>

          {/* Right Panel / Review Output */}
          <div className="lg:col-span-7">
            {!reviewResult && !loading && (
              <div className="h-full border border-slate-200 rounded-xl bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                 <div className="flex gap-4 mb-6 opacity-50">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><Users size={24}/></div>
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><FileText size={24}/></div>
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><CheckCircle size={24}/></div>
                 </div>
                 <h3 className="text-slate-400 font-bold text-lg mb-2">{t.pending}</h3>
                 <p className="text-slate-400 text-sm max-w-xs">{t.pendingDesc}</p>
              </div>
            )}
            
            {loading && (
              <div className="h-full border border-slate-200 rounded-xl bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                 <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                 <h3 className="text-slate-600 font-bold mb-1">Simulating Review Panel</h3>
                 <p className="text-slate-400 text-sm">Reviewer 1 is analyzing methodology...</p>
                 <p className="text-slate-400 text-sm">Reviewer 2 is checking innovation...</p>
                 <p className="text-slate-400 text-sm">Editor is drafting summary...</p>
              </div>
            )}

            {reviewResult && (
              <div className="bg-white rounded-xl border border-slate-200 h-full flex flex-col shadow-sm animate-fadeIn">
                 {/* Tabs */}
                 <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setActiveTab(0)}
                      className={`flex-1 py-4 px-4 text-sm font-bold whitespace-nowrap flex items-center justify-center gap-2 border-b-2 transition-colors
                        ${activeTab === 0 ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                       <FileText size={16} /> Executive Summary
                    </button>
                    {reviewResult.reviewers.map((reviewer) => (
                      <button
                        key={reviewer.id}
                        onClick={() => setActiveTab(reviewer.id)}
                        className={`flex-1 py-4 px-4 text-sm font-bold whitespace-nowrap flex items-center justify-center gap-2 border-b-2 transition-colors
                          ${activeTab === reviewer.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                      >
                         <User size={16} /> Reviewer {reviewer.id}
                      </button>
                    ))}
                 </div>

                 {/* Content Area */}
                 <div className="p-6 overflow-y-auto max-h-[600px] flex-grow">
                    {activeTab === 0 ? (
                      <div className="prose prose-sm prose-slate max-w-none">
                         <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><CheckCircle size={16} /> Editor's Decision Overview</h4>
                            <p className="text-blue-900/80 text-sm leading-relaxed">{reviewResult.summary}</p>
                         </div>
                      </div>
                    ) : (
                      (() => {
                        const reviewer = reviewResult.reviewers.find(r => r.id === activeTab);
                        if (!reviewer) return null;
                        return (
                           <div className="animate-fadeIn">
                              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-slate-100">
                                 <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 text-xs font-bold flex items-center gap-2">
                                    <BookOpen size={14} /> Role: {reviewer.role}
                                 </div>
                                 <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 text-xs font-bold flex items-center gap-2">
                                    <TargetIcon size={14} /> Focus: {reviewer.focus}
                                 </div>
                                 <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-2 ml-auto">
                                    Rating: {'★'.repeat(reviewer.rating)}{'☆'.repeat(5 - reviewer.rating)}
                                 </div>
                              </div>
                              <div className="prose prose-sm prose-slate max-w-none">
                                <ReactMarkdown components={{
                                   h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mt-6 mb-4 flex items-center gap-2" {...props} />,
                                   li: ({node, ...props}) => <li className="my-1" {...props} />
                                }}>
                                   {reviewer.content}
                                </ReactMarkdown>
                              </div>
                           </div>
                        );
                      })()
                    )}
                 </div>

                 <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center text-xs text-slate-500">
                    <div className="flex gap-4">
                       <span className="flex items-center gap-1"><Lightbulb size={12} /> Multi-Perspective Analysis</span>
                       <span className="flex items-center gap-1"><AlertTriangle size={12} /> AI Simulated Feedback</span>
                    </div>
                    <span>Generated by {appName} Panel</span>
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
