
import React, { useState, useRef, useEffect } from 'react';
import { Target, Compass, Anchor, GitMerge, ShieldAlert, FileText, Send, Loader2, AlertTriangle, ArrowRight, CheckCircle2, RotateCcw, Quote, Brain, X, MessageSquare, Lightbulb } from 'lucide-react';
import { Language, SandboxGapAnalysis, SandboxTheory, SandboxModel, SandboxMethodCritique, SandboxFramework } from '../types';
import { TRANSLATIONS } from '../translations';
import { scanResearchGap, recommendTheories, constructConceptualModel, critiqueMethodology, generateSubmissionFramework } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface JournalSandboxProps {
  language: Language;
}

const JournalSandbox: React.FC<JournalSandboxProps> = ({ language }) => {
  const t = TRANSLATIONS[language].journalSandbox;
  
  // Workflow State
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Gap Hunting
  const [domain, setDomain] = useState('');
  const [targetJournal, setTargetJournal] = useState('');
  const [problem, setProblem] = useState('');
  const [gapAnalysis, setGapAnalysis] = useState<SandboxGapAnalysis | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  // Step 2: Theory
  const [theories, setTheories] = useState<SandboxTheory[]>([]);
  const [selectedTheory, setSelectedTheory] = useState<SandboxTheory | null>(null);

  // Step 3: Model
  const [model, setModel] = useState<SandboxModel | null>(null);

  // Step 4: Method
  const [method, setMethod] = useState('');
  const [methodCritique, setMethodCritique] = useState<SandboxMethodCritique | null>(null);

  // Step 5: Framework
  const [framework, setFramework] = useState<SandboxFramework | null>(null);

  // Reviewer 2 State
  const [reviewerComment, setReviewerComment] = useState('');
  const [showReviewer, setShowReviewer] = useState(true);

  // Handlers
  const handleScanGap = async () => {
      if (!domain || !problem) return;
      setLoading(true);
      setReviewerComment(t.reviewer.typing);
      
      const res = await scanResearchGap(domain, targetJournal || "General Top Tier", problem, language);
      if (res) {
          setGapAnalysis(res);
          setReviewerComment(res.reviewerComment);
      }
      setLoading(false);
  };

  const handleSelectPath = async (pathId: string) => {
      setSelectedPathId(pathId);
      setLoading(true);
      const path = gapAnalysis?.blueOceanPaths.find(p => p.id === pathId);
      
      const res = await recommendTheories(domain, path?.description || "", language);
      setTheories(res);
      setStep(2);
      setReviewerComment("Theory selection is critical. Don't pick something outdated.");
      setLoading(false);
  };

  const handleSelectTheory = async (theory: SandboxTheory) => {
      setSelectedTheory(theory);
      setLoading(true);
      const path = gapAnalysis?.blueOceanPaths.find(p => p.id === selectedPathId);
      
      const res = await constructConceptualModel(theory.name, path?.description || "", language);
      if (res) {
          setModel(res);
          setReviewerComment(res.reviewerComment);
          setStep(3);
      }
      setLoading(false);
  };

  const handleConfirmModel = () => {
      setStep(4);
      setReviewerComment(t.step4.question);
  };

  const handleSubmitMethod = async () => {
      if (!method.trim()) return;
      setLoading(true);
      
      const res = await critiqueMethodology(method, model, targetJournal, language);
      if (res) {
          setMethodCritique(res);
          setReviewerComment(res.reviewerComment);
      }
      setLoading(false);
  };

  const handleGenerateFramework = async () => {
      setLoading(true);
      const allData = {
          domain, problem, targetJournal,
          path: gapAnalysis?.blueOceanPaths.find(p => p.id === selectedPathId),
          theory: selectedTheory,
          model,
          method,
          methodCritique
      };
      
      const res = await generateSubmissionFramework(allData, language);
      if (res) {
          setFramework(res);
          setReviewerComment("Framework generated. It's a start, but the writing needs polish.");
          setStep(5);
      }
      setLoading(false);
  };

  const handleRestart = () => {
      setStep(1);
      setGapAnalysis(null);
      setSelectedPathId(null);
      setTheories([]);
      setSelectedTheory(null);
      setModel(null);
      setMethod('');
      setMethodCritique(null);
      setFramework(null);
      setReviewerComment('');
  };

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
       
       {/* Main Workflow Area */}
       <div className="flex-grow flex flex-col h-full overflow-hidden p-6 transition-all duration-300 mr-[300px]">
           <div className="flex justify-between items-center mb-6">
               <div>
                   <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                       <Target className="text-indigo-600" /> {t.title}
                   </h2>
                   <p className="text-slate-500 text-sm">{t.subtitle}</p>
               </div>
               {step > 1 && (
                   <button onClick={handleRestart} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
                       <RotateCcw size={14} /> Restart
                   </button>
               )}
           </div>

           {/* Progress Bar */}
           <div className="flex items-center justify-between mb-8 px-4 relative">
               <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
               {Object.entries(t.steps).map(([num, label]) => {
                   const n = parseInt(num);
                   return (
                       <div key={num} className={`flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                               ${step >= n ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}
                           `}>
                               {step > n ? <CheckCircle2 size={16} /> : n}
                           </div>
                           <span className={`text-[10px] font-bold uppercase ${step >= n ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
                       </div>
                   );
               })}
           </div>

           <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 pb-10">
               {/* Step 1: Gap Hunting */}
               {step === 1 && (
                   <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
                       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                           <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.step1.domainLabel}</label>
                                       <input value={domain} onChange={e => setDomain(e.target.value)} className="w-full border rounded-lg p-2 text-sm" placeholder={t.step1.domainPlaceholder} />
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.step1.journalLabel}</label>
                                       <input value={targetJournal} onChange={e => setTargetJournal(e.target.value)} className="w-full border rounded-lg p-2 text-sm" placeholder={t.step1.journalPlaceholder} />
                                   </div>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.step1.problemLabel}</label>
                                   <textarea value={problem} onChange={e => setProblem(e.target.value)} className="w-full h-24 border rounded-lg p-2 text-sm resize-none" placeholder={t.step1.problemPlaceholder} />
                               </div>
                               <button onClick={handleScanGap} disabled={loading || !domain || !problem} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50">
                                   {loading ? <Loader2 className="animate-spin"/> : <Target size={18} />} {t.step1.btn}
                               </button>
                           </div>
                       </div>

                       {gapAnalysis && (
                           <div className="space-y-4 animate-slideInRight">
                               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                                   <h4 className="text-red-700 font-bold text-sm flex items-center gap-2 mb-1"><AlertTriangle size={16}/> {t.step1.redOcean}</h4>
                                   <p className="text-red-600 text-xs">{gapAnalysis.redOceanWarning}</p>
                               </div>
                               
                               <h4 className="font-bold text-slate-700 mt-6 flex items-center gap-2"><Compass size={18} className="text-blue-500"/> {t.step1.blueOcean}</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {gapAnalysis.blueOceanPaths.map((path) => (
                                       <div key={path.id} onClick={() => handleSelectPath(path.id)} className="bg-white border-2 border-blue-50 hover:border-blue-500 p-4 rounded-xl cursor-pointer transition-all shadow-sm group">
                                           <div className="flex justify-between items-start mb-2">
                                               <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">{path.type}</span>
                                               <ArrowRight size={16} className="text-blue-300 group-hover:text-blue-600" />
                                           </div>
                                           <h5 className="font-bold text-slate-800 text-sm mb-1">{path.title}</h5>
                                           <p className="text-xs text-slate-500 leading-relaxed">{path.description}</p>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}
                   </div>
               )}

               {/* Step 2: Theory */}
               {step === 2 && (
                   <div className="max-w-3xl mx-auto animate-fadeIn">
                       <h3 className="text-xl font-bold text-slate-800 mb-2">{t.step2.title}</h3>
                       <p className="text-slate-500 text-sm mb-6">{t.step2.subtitle}</p>
                       
                       <div className="grid grid-cols-1 gap-4">
                           {theories.map((theory, idx) => (
                               <div key={idx} className="bg-white p-5 rounded-xl border hover:border-indigo-400 shadow-sm transition-all group">
                                   <div className="flex items-start justify-between">
                                       <div>
                                           <h4 className="font-bold text-indigo-700 text-lg flex items-center gap-2">
                                               <Anchor size={18} /> {theory.name}
                                           </h4>
                                           <p className="text-sm text-slate-600 mt-2 leading-relaxed">{theory.description}</p>
                                           <div className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-500 italic border-l-2 border-slate-300">
                                               {theory.relevance}
                                           </div>
                                       </div>
                                       <button onClick={() => handleSelectTheory(theory)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors flex-shrink-0 ml-4">
                                           {t.step2.selectBtn}
                                       </button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               {/* Step 3: Model */}
               {step === 3 && model && (
                   <div className="max-w-4xl mx-auto animate-fadeIn">
                       <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                           <GitMerge className="text-indigo-600" /> Conceptual Model
                       </h3>
                       
                       {/* Visual Model */}
                       <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-8 flex items-center justify-center gap-4 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                           
                           {/* IV */}
                           <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center w-48 shadow-sm z-10">
                               <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">IV</div>
                               <div className="font-bold text-slate-700 text-sm">{model.iv}</div>
                           </div>
                           
                           <ArrowRight className="text-slate-300" />
                           
                           {/* Mediator */}
                           <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center w-48 shadow-sm z-10 relative">
                               <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">Mediator</div>
                               <div className="font-bold text-slate-700 text-sm">{model.mediator}</div>
                               
                               {/* Moderator hanging above */}
                               {model.moderator && (
                                   <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 p-2 rounded-lg text-center w-40 shadow-sm text-xs">
                                       <div className="font-bold text-slate-700 mb-1">{model.moderator}</div>
                                       <div className="text-[10px] text-amber-500 uppercase">Moderator</div>
                                       <div className="absolute bottom-[-20px] left-1/2 w-0.5 h-5 bg-slate-300 -translate-x-1/2"></div>
                                       <div className="absolute bottom-[-24px] left-1/2 text-slate-300">↓</div>
                                   </div>
                               )}
                           </div>

                           <ArrowRight className="text-slate-300" />

                           {/* DV */}
                           <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center w-48 shadow-sm z-10">
                               <div className="text-[10px] font-bold text-green-400 uppercase mb-1">DV</div>
                               <div className="font-bold text-slate-700 text-sm">{model.dv}</div>
                           </div>
                       </div>

                       {/* Hypotheses */}
                       <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                           <h4 className="font-bold text-slate-700 mb-4">{t.step3.hypotheses}</h4>
                           <ul className="space-y-3">
                               {model.hypotheses.map((h, i) => (
                                   <li key={i} className="flex gap-3 text-sm text-slate-600 bg-white p-3 rounded border border-slate-100">
                                       <span className="font-bold text-indigo-500">H{i+1}:</span> {h}
                                   </li>
                               ))}
                           </ul>
                       </div>

                       <div className="mt-6 flex justify-end">
                           <button onClick={handleConfirmModel} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                               Next: Method
                           </button>
                       </div>
                   </div>
               )}

               {/* Step 4: Method Defense */}
               {step === 4 && (
                   <div className="max-w-2xl mx-auto animate-fadeIn space-y-6">
                       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                           <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
                           <h3 className="text-lg font-bold text-slate-800 mb-2">{t.step4.question}</h3>
                           
                           <div className="relative mt-4">
                               <input 
                                  value={method}
                                  onChange={e => setMethod(e.target.value)}
                                  className="w-full p-4 border rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none pr-12"
                                  placeholder={t.step4.placeholder}
                                  disabled={!!methodCritique}
                               />
                               <button onClick={handleSubmitMethod} disabled={loading || !!methodCritique || !method} className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white px-4 rounded-lg font-bold hover:bg-black disabled:opacity-50">
                                   {loading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                               </button>
                           </div>
                       </div>

                       {methodCritique && (
                           <div className="animate-slideUp">
                               <div className={`p-5 rounded-xl border-l-4 mb-4 shadow-sm bg-white ${methodCritique.verdict === 'Risky' ? 'border-red-500' : 'border-green-500'}`}>
                                   <div className="flex justify-between items-center mb-2">
                                       <span className={`font-bold text-sm uppercase px-2 py-0.5 rounded ${methodCritique.verdict === 'Risky' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Verdict: {methodCritique.verdict}</span>
                                   </div>
                                   <p className="text-sm text-slate-700 mb-4">{methodCritique.critique}</p>
                                   
                                   <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3">
                                       <Lightbulb size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                       <div>
                                           <div className="text-xs font-bold text-blue-700 uppercase mb-1">{t.step4.suggestion}</div>
                                           <p className="text-xs text-blue-900">{methodCritique.suggestion}</p>
                                       </div>
                                   </div>
                               </div>
                               
                               <button onClick={handleGenerateFramework} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                   {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Generate Final Framework'}
                               </button>
                           </div>
                       )}
                   </div>
               )}

               {/* Step 5: Framework */}
               {step === 5 && framework && (
                   <div className="max-w-4xl mx-auto animate-fadeIn bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                       <div className="text-center border-b border-slate-100 pb-6 mb-6">
                           <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">{framework.title}</h1>
                           <div className="text-sm text-slate-500 font-mono">Submission Ready Synopsis</div>
                       </div>

                       <div className="space-y-8">
                           <section>
                               <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Abstract Logic</h3>
                               <p className="text-sm text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-lg">{framework.abstract}</p>
                           </section>

                           <div className="grid grid-cols-3 gap-4">
                               <div className="bg-blue-50 p-4 rounded-lg">
                                   <div className="text-xs font-bold text-blue-500 uppercase mb-2">Hook</div>
                                   <p className="text-xs text-slate-700">{framework.introduction.hook}</p>
                               </div>
                               <div className="bg-red-50 p-4 rounded-lg">
                                   <div className="text-xs font-bold text-red-500 uppercase mb-2">Gap</div>
                                   <p className="text-xs text-slate-700">{framework.introduction.gap}</p>
                               </div>
                               <div className="bg-green-50 p-4 rounded-lg">
                                   <div className="text-xs font-bold text-green-500 uppercase mb-2">Contribution</div>
                                   <p className="text-xs text-slate-700">{framework.introduction.contribution}</p>
                               </div>
                           </div>

                           <section>
                               <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Methodology Plan</h3>
                               <ReactMarkdown className="prose prose-sm max-w-none text-slate-700">{framework.methodPlan}</ReactMarkdown>
                           </section>

                           <section>
                               <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Robustness Checks</h3>
                               <ReactMarkdown className="prose prose-sm max-w-none text-slate-700">{framework.robustness}</ReactMarkdown>
                           </section>
                       </div>
                   </div>
               )}
           </div>
       </div>

       {/* Reviewer 2 Sidebar */}
       <div className={`fixed right-0 top-[80px] bottom-0 w-[300px] bg-slate-900 text-white shadow-2xl flex flex-col transition-transform duration-300 z-20 ${showReviewer ? 'translate-x-0' : 'translate-x-[300px]'}`}>
           <button 
              onClick={() => setShowReviewer(!showReviewer)}
              className="absolute top-4 -left-10 bg-slate-900 text-white p-2 rounded-l-lg shadow-lg"
           >
               {showReviewer ? <ArrowRight size={16} /> : <MessageSquare size={16} />}
           </button>

           <div className="p-6 border-b border-slate-700">
               <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center border-2 border-slate-700">
                       <span className="text-xl">🤬</span>
                   </div>
                   <div>
                       <h3 className="font-bold text-red-400 text-sm">Reviewer #2</h3>
                       <p className="text-[10px] text-slate-400">{loading ? t.reviewer.typing : t.reviewer.status}</p>
                   </div>
               </div>
           </div>

           <div className="flex-grow p-6 overflow-y-auto">
               {reviewerComment ? (
                   <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative animate-slideInRight">
                       <Quote size={24} className="text-slate-600 absolute -top-2 -left-2 fill-slate-700" />
                       <p className="text-sm leading-relaxed text-slate-300 italic font-serif">
                           "{reviewerComment}"
                       </p>
                   </div>
               ) : (
                   <div className="text-center text-slate-600 text-xs mt-10">
                       Waiting for you to make a mistake...
                   </div>
               )}
           </div>
           
           <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
               Reviewer Severity: Extreme
           </div>
       </div>

    </div>
  );
};

export default JournalSandbox;
