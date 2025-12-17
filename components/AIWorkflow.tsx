
import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, ArrowRight, CheckCircle2, List, FileText, Database, Target, Loader2, RotateCcw, ChevronRight, Zap, Play, Layout, Users, BookOpen, Layers, Search } from 'lucide-react';
import { Language, WorkflowProblem, WorkflowAngle, WorkflowFramework } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateWorkflowProblems, generateWorkflowRefinement, generateWorkflowFramework } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AIWorkflowProps {
  language: Language;
}

const AIWorkflow: React.FC<AIWorkflowProps> = ({ language }) => {
  const t = TRANSLATIONS[language].aiWorkflow;
  
  // State
  const [direction, setDirection] = useState('');
  const [problems, setProblems] = useState<WorkflowProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<WorkflowProblem | null>(null);
  const [angles, setAngles] = useState<WorkflowAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<WorkflowAngle | null>(null);
  const [framework, setFramework] = useState<WorkflowFramework | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleStart = async () => {
      if (!direction.trim()) return;
      setLoading(true);
      const res = await generateWorkflowProblems(direction, language);
      setProblems(res);
      setStep(2);
      setLoading(false);
  };

  const handleSelectProblem = async (problem: WorkflowProblem) => {
      setSelectedProblem(problem);
      setLoading(true);
      const res = await generateWorkflowRefinement(problem.title, language);
      setAngles(res);
      setStep(3);
      setLoading(false);
  };

  const handleSelectAngle = async (angle: WorkflowAngle) => {
      setSelectedAngle(angle);
      setLoading(true);
      if (selectedProblem) {
          const res = await generateWorkflowFramework(selectedProblem.title, angle.title, language);
          setFramework(res);
          setStep(4);
      }
      setLoading(false);
  };

  const handleRestart = () => {
      setDirection('');
      setProblems([]);
      setSelectedProblem(null);
      setAngles([]);
      setSelectedAngle(null);
      setFramework(null);
      setStep(1);
  };

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-6">
       
       <div className="mb-6 flex justify-between items-center">
           <div>
               <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                   <Zap className="text-amber-500" /> {t.title}
               </h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
           </div>
           {step > 1 && (
               <button onClick={handleRestart} className="text-sm flex items-center gap-1 text-slate-500 hover:text-slate-700">
                   <RotateCcw size={14} /> {t.restart}
               </button>
           )}
       </div>

       <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
           
           {/* Column 1: Direction & Problems */}
           <div className={`flex flex-col gap-4 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
               <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.step1.label}</label>
                   <input 
                      value={direction}
                      onChange={e => setDirection(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleStart()}
                      disabled={step > 1}
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm mb-3 outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder={t.step1.placeholder}
                   />
                   {step === 1 && (
                       <button 
                          onClick={handleStart}
                          disabled={!direction.trim() || loading}
                          className="w-full bg-amber-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                          {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                          {t.step1.btn}
                       </button>
                   )}
               </div>

               {step >= 2 && (
                   <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3">
                       <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                           <List size={16} /> {t.problems}
                       </h3>
                       {problems.map(prob => (
                           <div 
                              key={prob.id}
                              onClick={() => step === 2 && handleSelectProblem(prob)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                  selectedProblem?.id === prob.id 
                                  ? 'bg-amber-50 border-amber-500 shadow-md ring-1 ring-amber-200' 
                                  : step === 2 ? 'bg-white border-slate-200 hover:border-amber-300' : 'bg-slate-100 border-transparent opacity-60'
                              }`}
                           >
                               <div className="font-bold text-sm text-slate-800 mb-1">{prob.title}</div>
                               <div className="text-xs text-slate-500">{prob.description}</div>
                               <div className="mt-2 text-[10px] font-bold text-amber-600 uppercase bg-amber-100 inline-block px-2 py-0.5 rounded">{prob.difficulty} Difficulty</div>
                           </div>
                       ))}
                   </div>
               )}
           </div>

           {/* Column 2: Angles */}
           {step >= 3 && (
               <div className="flex flex-col gap-4 animate-fadeIn">
                   <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                       <Target size={16} /> {t.angles}
                   </h3>
                   <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3">
                       {angles.map(angle => (
                           <div 
                              key={angle.id}
                              onClick={() => step === 3 && handleSelectAngle(angle)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                  selectedAngle?.id === angle.id 
                                  ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-200' 
                                  : step === 3 ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-slate-100 border-transparent opacity-60'
                              }`}
                           >
                               <div className="font-bold text-sm text-slate-800 mb-2">{angle.title}</div>
                               <p className="text-xs text-slate-600 leading-relaxed">{angle.rationale}</p>
                           </div>
                       ))}
                       {loading && step === 3 && <div className="flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}
                   </div>
               </div>
           )}

           {/* Column 3 & 4: Framework */}
           {step >= 4 && framework && (
               <div className="md:col-span-2 flex flex-col gap-4 animate-slideInRight h-full">
                   <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                       <Layout size={16} /> {t.framework}
                   </h3>
                   <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 flex-grow overflow-y-auto custom-scrollbar">
                       <div className="prose prose-sm dark:prose-invert max-w-none">
                           <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">{selectedAngle?.title}</h2>
                           
                           <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Logic Flow</h4>
                               <ReactMarkdown>{framework.framework}</ReactMarkdown>
                           </div>

                           <div className="grid grid-cols-2 gap-4 mb-6">
                               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                   <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Methodology</h4>
                                   <p className="text-sm text-slate-700 dark:text-slate-200">{framework.methodology}</p>
                               </div>
                               <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                   <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">Data Sources</h4>
                                   <p className="text-sm text-slate-700 dark:text-slate-200">{framework.dataSources}</p>
                               </div>
                           </div>

                           <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                               <h4 className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-1"><Lightbulb size={12}/> Innovation Point</h4>
                               <p className="text-sm text-slate-700 dark:text-slate-200">{framework.innovation}</p>
                           </div>
                       </div>
                   </div>
               </div>
           )}

       </div>
    </div>
  );
};

export default AIWorkflow;
