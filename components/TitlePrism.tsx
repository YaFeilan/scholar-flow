
import React, { useState, useEffect } from 'react';
import { Gem, Zap, Search, Gavel, Users, Copy, Loader2, RefreshCw } from 'lucide-react';
import { Language, TitleRefinementResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateTitleOptimization } from '../services/geminiService';

interface TitlePrismProps {
  language: Language;
}

const TitlePrism: React.FC<TitlePrismProps> = ({ language }) => {
  const t = TRANSLATIONS[language].titlePrism;
  
  // State
  const [draftTitle, setDraftTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TitleRefinementResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Loading animation effect
  useEffect(() => {
    let interval: any;
    if (loading) {
      const messages = language === 'ZH' 
        ? ["🔍 正在分析语义结构...", "🧠 正在调用学术知识库...", "✨ 正在生成优化建议..."]
        : ["🔍 Analyzing semantic structure...", "🧠 Consulting academic knowledge base...", "✨ Generating optimization suggestions..."];
      
      let index = 0;
      setLoadingMessage(messages[0]);
      
      interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading, language]);

  const handleOptimize = async () => {
    if (!draftTitle) return;
    setLoading(true);
    const data = await generateTitleOptimization(draftTitle, abstract, target, language);
    setResult(data);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t.copy + '!');
  };

  // Helper for Council Icons using Emojis based on user request
  const getPersonaIcon = (role: string) => {
    switch(role) {
        case 'Reviewer': return <div className="text-4xl filter drop-shadow-md">😡</div>;
        case 'Editor': return <div className="text-4xl filter drop-shadow-md">🧐</div>;
        case 'SEO': return <div className="text-4xl filter drop-shadow-md">🤓</div>;
        case 'Generalist': return <div className="text-4xl filter drop-shadow-md">😎</div>;
        default: return <Gem size={32} className="text-slate-500" />;
    }
  };

  const getPersonaColor = (role: string) => {
      switch(role) {
          case 'Reviewer': return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300';
          case 'Editor': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-300';
          case 'Generalist': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300';
          case 'SEO': return 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-700 dark:text-green-300';
          default: return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
      }
  };

  const getRoleLabel = (role: string) => {
      if (language === 'ZH') {
          switch(role) {
              case 'Reviewer': return '严厉审稿人';
              case 'Editor': return '期刊主编';
              case 'Generalist': return '跨学科读者';
              case 'SEO': return 'SEO 专家';
          }
      }
      return role;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       {/* Header */}
       <div className="flex-shrink-0 mb-6 bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
              <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                  <Gem className="text-purple-400" /> {t.title}
              </h2>
              <p className="text-sm text-slate-400">{t.subtitle}</p>
          </div>
          <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
              <UserIcon />
          </div>
       </div>

       <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
           
           {/* Left Panel: Input */}
           <div className="lg:col-span-4 flex flex-col gap-4 h-full bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar">
               <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wide mb-2">{t.inputSection}</h3>
               
               <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t.draftTitle}</label>
                   <textarea 
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder={t.draftPlaceholder}
                      className="w-full h-24 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                   />
               </div>

               <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t.abstract}</label>
                   <textarea 
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      placeholder={t.abstractPlaceholder}
                      className="w-full h-32 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                   />
               </div>

               <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t.target}</label>
                   <input 
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder={t.targetPlaceholder}
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                   />
               </div>

               <div>
                   <button 
                      onClick={handleOptimize}
                      disabled={loading || !draftTitle}
                      className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:grayscale"
                   >
                      {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="white" />}
                      {loading ? (language === 'ZH' ? '正在优化...' : 'Optimizing...') : t.optimizeBtn}
                   </button>
                   {loading && (
                       <div className="mt-3 text-xs text-center text-slate-500 dark:text-slate-400 animate-pulse font-medium transition-all duration-300">
                           {loadingMessage}
                       </div>
                   )}
               </div>
           </div>

           {/* Right Panel: Results */}
           <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
               {/* 1. The Council Diagnosis */}
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                   <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4">{t.councilTitle}</h3>
                   
                   {!result ? (
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {[1, 2, 3, 4].map((i) => (
                               <div key={i} className="h-32 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-pulse"></div>
                           ))}
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                           {result.council.map((member, idx) => (
                               <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow relative overflow-hidden group">
                                   <div className="mb-3 transform group-hover:scale-110 transition-transform">
                                       {getPersonaIcon(member.role)}
                                   </div>
                                   <div className={`text-xs font-bold px-2 py-0.5 rounded mb-2 ${getPersonaColor(member.role)}`}>
                                       [{getRoleLabel(member.role)}]
                                   </div>
                                   <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg w-full mb-1">
                                       <p className="text-xs font-bold text-slate-700 dark:text-slate-300">"{member.critiqueQuote}"</p>
                                   </div>
                                   <p className="text-[10px] text-slate-500 mt-1 leading-tight">{member.feedback}</p>
                               </div>
                           ))}
                       </div>
                   )}
               </div>

               {/* 2. Refined Options */}
               <div className="flex-grow bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                   <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4">{t.optionsTitle}</h3>
                   
                   {!result ? (
                       <div className="flex flex-col gap-4 flex-grow justify-center items-center text-slate-400">
                           <RefreshCw size={48} className="mb-4 opacity-20" />
                           <p>Optimize to see refined titles.</p>
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow animate-fadeIn">
                           {result.options.map((opt, idx) => (
                               <div key={idx} className={`rounded-xl border p-5 flex flex-col h-full relative transition-all hover:shadow-lg
                                   ${opt.type === 'Safe' ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300' : 
                                     opt.type === 'Impact' ? 'bg-orange-50/50 border-orange-200 hover:border-orange-300' : 
                                     'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'}
                               `}>
                                   <div className="flex justify-between items-start mb-3">
                                       <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider
                                           ${opt.type === 'Safe' ? 'bg-blue-100 text-blue-700' : 
                                             opt.type === 'Impact' ? 'bg-orange-100 text-orange-700' : 
                                             'bg-emerald-100 text-emerald-700'}
                                       `}>
                                           {language === 'ZH' ? (opt.type === 'Safe' ? '标准学术型' : opt.type === 'Impact' ? '高影响力型' : '两段式结构') : opt.type}
                                       </span>
                                       <button onClick={() => copyToClipboard(opt.title)} className="text-slate-400 hover:text-slate-700 p-1">
                                           <Copy size={14} />
                                       </button>
                                   </div>
                                   
                                   <h4 className="font-bold text-slate-800 dark:text-slate-900 text-md leading-snug mb-4 flex-grow">
                                       {opt.title}
                                   </h4>
                                   
                                   <div className="text-xs text-slate-500 border-t border-slate-200/50 pt-3 mt-auto">
                                       <span className="font-bold mr-1">*</span> {opt.rationale}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

// Simple User Icon Placeholder for Header
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-slate-300">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

export default TitlePrism;
