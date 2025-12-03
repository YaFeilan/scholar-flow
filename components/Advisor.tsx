
import React, { useState } from 'react';
import { User, BookOpen, Send, Loader2, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateAdvisorReport } from '../services/geminiService';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface AdvisorProps {
  language: Language;
}

const Advisor: React.FC<AdvisorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].advisor;
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!title || !journal) return;
    setLoading(true);
    setReport(null);
    const result = await generateAdvisorReport(title, journal, language);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <User size={24} className="text-blue-300" />
              </div>
              <h2 className="text-3xl font-serif font-bold">{t.title}</h2>
            </div>
            <p className="text-blue-200 max-w-xl">{t.subtitle}</p>
          </div>
          <div className="hidden md:block opacity-30">
            <Award size={120} />
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" />
              Submission Details
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.paperTitle}</label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A Novel Hierarchical Attention Network for Document Classification"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.journalTitle}</label>
                <input
                  type="text"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="e.g. IEEE Transactions on Pattern Analysis and Machine Intelligence"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !title || !journal}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" /> Analyzing Fit...
                  </>
                ) : (
                  <>
                    <Send size={18} /> {t.btn}
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h4 className="font-bold text-blue-900 text-sm mb-2">Pro Tip</h4>
            <p className="text-blue-700 text-xs leading-relaxed">
              Journals often look for specific keywords in titles. Our AI analyzes the last 3 years of publications to suggest high-impact terminology tailored to your specific target journal.
            </p>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-7">
          {report ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-fadeIn">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between rounded-t-xl">
                 <span className="font-bold text-slate-800 flex items-center gap-2">
                    <Award size={18} className="text-amber-500" /> {t.reportTitle}
                 </span>
                 <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">AI Generated</span>
              </div>
              <div className="p-8 overflow-y-auto prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-slate-800">
                <ReactMarkdown components={{
                  h3: ({node, ...props}) => <h3 className="text-xl font-bold text-blue-900 border-b border-slate-100 pb-2 mb-4" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />
                }}>
                  {report}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                 <BookOpen className="text-slate-300" size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-400 mb-2">No Analysis Yet</h3>
               <p className="text-slate-400 text-sm max-w-xs">Enter your paper details on the left to receive a comprehensive matching report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Advisor;
