
import React, { useState, useRef } from 'react';
import { performPeerReview } from '../services/geminiService';
import { Upload, CheckCircle, FileText, Loader2, ShieldCheck, Lightbulb, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface PeerReviewProps {
  language: Language;
}

const PeerReview: React.FC<PeerReviewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].peer;
  const appName = TRANSLATIONS[language].appName;
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
          <div className="lg:col-span-6 space-y-6">
            
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
                   <Loader2 className="animate-spin" /> Processing...
                 </>
              ) : (
                 <> {t.startBtn} <span className="text-xl">➤</span></>
              )}
            </button>
          </div>

          {/* Right Panel / Review Output */}
          <div className="lg:col-span-6">
            {!reviewResult ? (
              <div className="h-full border border-slate-200 rounded-xl bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                 <div className="flex gap-4 mb-6 opacity-50">
                    <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                    <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                    <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                 </div>
                 <h3 className="text-slate-400 font-bold text-lg mb-2">{t.pending}</h3>
                 <p className="text-slate-400 text-sm max-w-xs">{t.pendingDesc}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 h-full flex flex-col shadow-sm animate-fadeIn">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white rounded-t-xl">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                       <CheckCircle size={18} className="text-green-500" /> Review Report
                    </span>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">AI Generated</span>
                 </div>
                 <div className="p-6 overflow-y-auto max-h-[600px] prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown components={{
                       h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mt-6 mb-4 flex items-center gap-2" {...props} />,
                       li: ({node, ...props}) => <li className="my-1" {...props} />
                    }}>
                       {reviewResult}
                    </ReactMarkdown>
                 </div>
                 <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center text-xs text-slate-500">
                    <div className="flex gap-4">
                       <span className="flex items-center gap-1"><Lightbulb size={12} /> Innovation Check</span>
                       <span className="flex items-center gap-1"><AlertTriangle size={12} /> Method Check</span>
                    </div>
                    <span>Generated by {appName}</span>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerReview;