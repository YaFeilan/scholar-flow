
import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, ArrowRight, CheckCircle2, List, FileText, Database, Target, Loader2, RotateCcw, ChevronRight, Zap, Play } from 'lucide-react';
import { Language, WorkflowProblem, WorkflowAngle, WorkflowFramework } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateWorkflowProblems, generateWorkflowRefinement, generateWorkflowFramework } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AIWorkflowProps {
  language: Language;
}

const AIWorkflow: React.FC<AIWorkflowProps> = ({ language }) => {
  const t = TRANSLATIONS[language].aiWorkflow;
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [direction, setDirection] = useState('');
  const [problems, setProblems] = useState<WorkflowProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<WorkflowProblem | null>(null);
  const [angles, setAngles] = useState<WorkflowAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<WorkflowAngle | null>(null);
  const [framework, setFramework] = useState<WorkflowFramework | null>(null);

  // Ref for PDF Export
  const resultRef = useRef<HTMLDivElement>(null);

  const steps = [
      { num: 1, label: t.steps[1] },
      { num: 2, label: t.steps[2] },
      { num: 3, label: t.steps[3] },
      { num: 4, label: t.steps[4] },
  ];

  const handleStart = async () => {
      if (!direction.trim()) return;
      setLoading(true);
      const res = await generateWorkflowProblems(direction, language);
      setProblems(res);
      setCurrentStep(2);
      setLoading(false);
  };

  const handleSelectProblem = async (problem: WorkflowProblem) => {
      setSelectedProblem(problem);
      setLoading(true);
      const res = await generateWorkflowRefinement(problem.title, language);
      setAngles(res);
      setCurrentStep(3);
      setLoading(false);
  };

  const handleSelectAngle = async (angle: WorkflowAngle) => {
      if (!selectedProblem?.title || !angle?.title) return; // Fix: Defensive check with optional chaining
      setSelectedAngle(angle);
      setLoading(true);
      const res = await generateWorkflowFramework(selectedProblem.title, angle.title, language);
      setFramework(res);
      setCurrentStep(4);
      setLoading(false);
  };

  const handleRestart = () => {
      setDirection('');
      setProblems([]);
      setSelectedProblem(null);
      setAngles([]);
      setSelectedAngle(null);
      setFramework(null);
      setCurrentStep(1);
  };

  const exportFramework = async () => {
      if (!framework || !selectedProblem || !selectedAngle || !resultRef.current) return;
      
      try {
          // Use html2canvas to capture the rendered DOM element (preserves styles and Chinese fonts)
          const canvas = await html2canvas(resultRef.current, {
              scale: 2, // High resolution
              useCORS: true, // Handle any external images properly
              backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgProps = pdf.getImageProperties(imgData);
          const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          let heightLeft = pdfImgHeight;
          let position = 0;
          
          // Add first page
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
          heightLeft -= pdfHeight;
          
          // Add subsequent pages if content overflows
          while (heightLeft >= 0) {
            position = heightLeft - pdfImgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
            heightLeft -= pdfHeight;
          }
          
          pdf.save("Research_Workflow.pdf");
      } catch (err) {
          console.error("PDF Export Error", err);
          alert(language === 'ZH' ? "PDF 导出失败" : "Failed to export PDF");
      }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       {/* Header */}
       <div className="flex-shrink-0 mb-8">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Zap className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       {/* Progress Steps */}
       <div className="flex justify-between mb-8 px-10 relative">
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
           {steps.map((s, i) => (
               <div key={s.num} className={`flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                       ${currentStep >= s.num ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}
                   `}>
                       {currentStep > s.num ? <CheckCircle2 size={16} /> : s.num}
                   </div>
                   <span className={`text-xs font-bold ${currentStep >= s.num ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{s.label}</span>
               </div>
           ))}
       </div>

       {/* Main Content Area */}
       <div className="flex-grow overflow-y-auto custom-scrollbar relative">
           
           {/* Step 1: Direction */}
           {currentStep === 1 && (
               <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
                   <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                       <Lightbulb size={48} className="text-amber-500 mx-auto mb-6" />
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t.step1.label}</h3>
                       <div className="relative mb-6">
                           <input 
                              type="text" 
                              value={direction}
                              onChange={(e) => setDirection(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                              className="w-full text-lg p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                              placeholder={t.step1.placeholder}
                           />
                       </div>
                       <button 
                          onClick={handleStart}
                          disabled={!direction.trim() || loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                       >
                          {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                          {loading ? t.loading.problems : t.step1.btn}
                       </button>
                   </div>
               </div>
           )}

           {/* Step 2: Problem Selection */}
           {currentStep === 2 && (
               <div className="max-w-4xl mx-auto animate-slideInRight pb-10">
                   <div className="text-center mb-8">
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.step2.title}</h3>
                       <p className="text-slate-500 dark:text-slate-400">{t.step2.subtitle}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {problems.map((prob) => (
                           prob ? (
                           <div 
                              key={prob.id}
                              onClick={() => handleSelectProblem(prob)}
                              className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                           >
                               <div className="flex justify-between items-start mb-3">
                                   <div className={`px-2 py-1 rounded text-xs font-bold ${
                                       prob.difficulty === 'High' ? 'bg-red-100 text-red-700' : 
                                       prob.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                   }`}>
                                       {prob.difficulty}
                                   </div>
                                   <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                               </div>
                               <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight">{prob.title}</h4>
                               <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{prob.description}</p>
                           </div>
                           ) : null
                       ))}
                   </div>
                   {loading && (
                       <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                           <div className="text-center">
                               <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-2" />
                               <p className="font-bold text-slate-700 dark:text-slate-300">{t.loading.angles}</p>
                           </div>
                       </div>
                   )}
                   <div className="mt-8 text-center">
                       <button onClick={handleRestart} className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center justify-center gap-1 mx-auto"><RotateCcw size={14}/> {t.restart}</button>
                   </div>
               </div>
           )}

           {/* Step 3: Angle Refinement */}
           {currentStep === 3 && selectedProblem && (
               <div className="max-w-4xl mx-auto animate-slideInRight pb-10">
                   <button onClick={() => setCurrentStep(2)} className="text-sm text-slate-500 hover:text-blue-600 mb-6 flex items-center gap-1">← {t.back}</button>
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-8 border border-blue-100 dark:border-blue-800">
                       <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Selected Problem</span>
                       <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{selectedProblem.title}</h3>
                   </div>
                   
                   <div className="text-center mb-8">
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.step3.title}</h3>
                       <p className="text-slate-500 dark:text-slate-400">{t.step3.subtitle}</p>
                   </div>

                   <div className="space-y-4">
                       {angles.map((angle) => (
                           angle ? (
                           <div 
                              key={angle.id}
                              onClick={() => handleSelectAngle(angle)}
                              className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer flex items-center gap-6 group"
                           >
                               <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                   <Target size={20} />
                               </div>
                               <div className="flex-grow">
                                   <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{angle.title}</h4>
                                   <p className="text-sm text-slate-600 dark:text-slate-400">
                                       <span className="font-bold text-slate-400 mr-1">{t.step3.rationale}:</span>
                                       {angle.rationale}
                                   </p>
                               </div>
                               <ArrowRight className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                           </div>
                           ) : null
                       ))}
                   </div>
                   {loading && (
                       <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                           <div className="text-center">
                               <Loader2 size={40} className="animate-spin text-purple-600 mx-auto mb-2" />
                               <p className="font-bold text-slate-700 dark:text-slate-300">{t.loading.framework}</p>
                           </div>
                       </div>
                   )}
               </div>
           )}

           {/* Step 4: Final Framework */}
           {currentStep === 4 && framework && selectedProblem && selectedAngle && (
               <div className="max-w-5xl mx-auto animate-fadeIn pb-10">
                   <div className="flex justify-between items-center mb-6">
                       <button onClick={() => setCurrentStep(3)} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">← {t.back}</button>
                       <div className="flex gap-2">
                           <button onClick={handleRestart} className="text-sm font-bold text-slate-500 hover:text-slate-800 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">{t.restart}</button>
                           <button onClick={exportFramework} className="text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors shadow-md">{t.step4.export}</button>
                       </div>
                   </div>

                   {/* Wrapped with Ref for Printing */}
                   <div ref={resultRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                       <div className="bg-slate-900 text-white p-8">
                           <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">{direction}</div>
                           <h2 className="text-2xl font-bold mb-4 font-serif">{selectedProblem.title}</h2>
                           <div className="inline-block bg-blue-600/30 border border-blue-500/50 px-4 py-2 rounded-lg text-sm">
                               <span className="font-bold text-blue-200 mr-2">Focus:</span>
                               {selectedAngle.title}
                           </div>
                       </div>

                       <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                           {/* Left Col */}
                           <div className="space-y-8">
                               <section>
                                   <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                                       <List className="text-blue-500" /> {t.step4.logic}
                                   </h3>
                                   <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                       <ReactMarkdown>{framework.framework}</ReactMarkdown>
                                   </div>
                               </section>
                               <section>
                                   <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                                       <Zap className="text-amber-500" /> {t.step4.innovation}
                                   </h3>
                                   <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-xl border border-amber-100 dark:border-amber-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                       <ReactMarkdown>{framework.innovation}</ReactMarkdown>
                                   </div>
                               </section>
                           </div>

                           {/* Right Col */}
                           <div className="space-y-8">
                               <section>
                                   <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                                       <FileText className="text-purple-500" /> {t.step4.method}
                                   </h3>
                                   <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                       <ReactMarkdown>{framework.methodology}</ReactMarkdown>
                                   </div>
                               </section>
                               <section>
                                   <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                                       <Database className="text-emerald-500" /> {t.step4.data}
                                   </h3>
                                   <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                       <ReactMarkdown>{framework.dataSources}</ReactMarkdown>
                                   </div>
                               </section>
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
