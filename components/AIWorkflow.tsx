
import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, ArrowRight, CheckCircle2, List, FileText, Database, Target, Loader2, RotateCcw, ChevronRight, Zap, Play, Layout, Users, BookOpen, Layers } from 'lucide-react';
import { Language, ThesisDimension, ThesisContextQuestion, ThesisTitleOption, ThesisFramework } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateThesisDimensions, generateThesisContext, generateThesisTitles, generateThesisFramework } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AIWorkflowProps {
  language: Language;
}

const AIWorkflow: React.FC<AIWorkflowProps> = ({ language }) => {
  const t = TRANSLATIONS[language].aiWorkflow;
  
  // Workflow State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [topic, setTopic] = useState('');
  const [dimensions, setDimensions] = useState<ThesisDimension[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<ThesisDimension | null>(null);
  
  const [contextQuestions, setContextQuestions] = useState<ThesisContextQuestion[]>([]);
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({});
  
  const [titles, setTitles] = useState<ThesisTitleOption[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<ThesisTitleOption | null>(null);
  
  const [framework, setFramework] = useState<ThesisFramework | null>(null);

  // Chat History for "Left" Panel Visualization
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Ref for PDF Export
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, currentStep]);

  const steps = [
      { num: 1, label: t.steps[1] },
      { num: 2, label: t.steps[2] },
      { num: 3, label: t.steps[3] },
      { num: 4, label: t.steps[4] },
      { num: 5, label: t.steps[5] },
  ];

  // --- Phase 1: Vague Entry -> Dimensions ---
  const handleStart = async () => {
      if (!topic.trim()) return;
      setLoading(true);
      setChatHistory(prev => [...prev, { role: 'user', text: topic }]);
      
      const res = await generateThesisDimensions(topic, language);
      setDimensions(res);
      
      setChatHistory(prev => [...prev, { 
          role: 'ai', 
          text: language === 'ZH' 
              ? `好的，关于"${topic}"，我为你拆解了以下几个研究方向，请选择一个深入：` 
              : `Okay, regarding "${topic}", I've broken it down into these research directions. Please choose one:` 
      }]);
      
      setCurrentStep(2);
      setLoading(false);
  };

  // --- Phase 2: Select Dimension -> Context Questions ---
  const handleSelectDimension = async (dim: ThesisDimension) => {
      setSelectedDimension(dim);
      setLoading(true);
      setChatHistory(prev => [...prev, { role: 'user', text: dim.title }]);
      
      const res = await generateThesisContext(dim.focus, language);
      setContextQuestions(res);
      setContextAnswers({}); // Reset answers
      
      setChatHistory(prev => [...prev, { 
          role: 'ai', 
          text: language === 'ZH'
              ? `在"${dim.focus}"这个方向下，我们需要进一步明确研究对象和方法。请回答：`
              : `Under "${dim.focus}", we need to clarify the scope and method. Please answer:`
      }]);
      
      setCurrentStep(3);
      setLoading(false);
  };

  // --- Phase 3: Answer Context -> Titles ---
  const handleContextSubmit = async () => {
      if (!selectedDimension || Object.keys(contextAnswers).length < contextQuestions.length) return;
      
      const answerText = Object.values(contextAnswers).join(', ');
      setChatHistory(prev => [...prev, { role: 'user', text: answerText }]);
      setLoading(true);
      
      const res = await generateThesisTitles(selectedDimension.focus, contextAnswers, language);
      setTitles(res);
      
      setChatHistory(prev => [...prev, {
          role: 'ai',
          text: language === 'ZH'
              ? `基于你的选择，我生成了三个不同侧重点的定稿级题目，请选择：`
              : `Based on your choices, I've generated three finalized titles. Please select:`
      }]);
      
      setCurrentStep(4);
      setLoading(false);
  };

  // --- Phase 4: Select Title -> Framework ---
  const handleSelectTitle = async (titleOpt: ThesisTitleOption) => {
      setSelectedTitle(titleOpt);
      setLoading(true);
      setChatHistory(prev => [...prev, { role: 'user', text: titleOpt.title }]);
      
      const res = await generateThesisFramework(titleOpt.title, { ...contextAnswers, variables: titleOpt.variables }, language);
      setFramework(res);
      
      setChatHistory(prev => [...prev, {
          role: 'ai',
          text: language === 'ZH'
              ? `这是为你生成的完整研究框架。包含摘要、假设、目录和参考文献。`
              : `Here is the complete research framework generated for you, including abstract, hypotheses, outline, and references.`
      }]);
      
      setCurrentStep(5);
      setLoading(false);
  };

  const handleRestart = () => {
      setTopic('');
      setDimensions([]);
      setSelectedDimension(null);
      setContextQuestions([]);
      setContextAnswers({});
      setTitles([]);
      setSelectedTitle(null);
      setFramework(null);
      setChatHistory([]);
      setCurrentStep(1);
  };

  const exportPDF = async () => {
      if (!resultRef.current) return;
      try {
          const canvas = await html2canvas(resultRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgProps = pdf.getImageProperties(imgData);
          const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
          let heightLeft = pdfImgHeight;
          let position = 0;
          
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
          heightLeft -= pdfHeight;
          while (heightLeft >= 0) {
            position = heightLeft - pdfImgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
            heightLeft -= pdfHeight;
          }
          pdf.save("Thesis_Framework.pdf");
      } catch (err) {
          alert("Export failed");
      }
  };

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
       
       {/* Progress Header */}
       <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
           <div className="flex justify-between max-w-4xl mx-auto relative">
               <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
               {steps.map((s, i) => (
                   <div key={s.num} className={`flex flex-col items-center gap-1 bg-white dark:bg-slate-800 px-2`}>
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all
                           ${currentStep >= s.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}
                       `}>
                           {currentStep > s.num ? <CheckCircle2 size={14} /> : s.num}
                       </div>
                       <span className={`text-[10px] font-bold uppercase ${currentStep >= s.num ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{s.label}</span>
                   </div>
               ))}
           </div>
       </div>

       <div className="flex-grow flex overflow-hidden">
           
           {/* Left Panel: Chat / Interaction */}
           <div className="w-1/3 min-w-[350px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
               <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                   {chatHistory.map((msg, i) => (
                       <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[90%] p-3 rounded-xl text-sm ${
                               msg.role === 'user' 
                               ? 'bg-indigo-600 text-white rounded-br-none' 
                               : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                           }`}>
                               {msg.text}
                           </div>
                       </div>
                   ))}
                   
                   {/* Phase 1 Input */}
                   {currentStep === 1 && (
                       <div className="mt-4 animate-fadeIn">
                           <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.step1.label}</label>
                               <input 
                                  value={topic}
                                  onChange={e => setTopic(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder={t.step1.placeholder}
                                  autoFocus
                               />
                               <button 
                                  onClick={handleStart}
                                  disabled={!topic.trim() || loading}
                                  className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                               >
                                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                  {t.step1.btn}
                               </button>
                           </div>
                       </div>
                   )}

                   {/* Phase 2 Selection */}
                   {currentStep === 2 && (
                       <div className="space-y-3 animate-slideInRight">
                           {dimensions.map(dim => (
                               <button 
                                  key={dim.id}
                                  onClick={() => handleSelectDimension(dim)}
                                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                               >
                                   <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{dim.title}</div>
                                   <div className="text-xs text-slate-500 dark:text-slate-400">{dim.description}</div>
                               </button>
                           ))}
                           {loading && <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-500"/></div>}
                       </div>
                   )}

                   {/* Phase 3 Context */}
                   {currentStep === 3 && (
                       <div className="space-y-4 animate-slideInRight">
                           {contextQuestions.map((q, idx) => (
                               <div key={q.id} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                   <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{idx + 1}. {q.question}</div>
                                   <div className="grid grid-cols-1 gap-2">
                                       {q.options.map(opt => (
                                           <button
                                              key={opt}
                                              onClick={() => setContextAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                              className={`text-xs p-2 rounded-lg border text-left transition-all ${
                                                  contextAnswers[q.id] === opt 
                                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                              }`}
                                           >
                                               {opt}
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           ))}
                           <button 
                              onClick={handleContextSubmit}
                              disabled={Object.keys(contextAnswers).length < contextQuestions.length || loading}
                              className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg disabled:opacity-50"
                           >
                              {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Generate Titles'}
                           </button>
                       </div>
                   )}

                   {/* Phase 4 Titles */}
                   {currentStep === 4 && (
                       <div className="space-y-3 animate-slideInRight">
                           {titles.map(tOpt => (
                               <div 
                                  key={tOpt.id}
                                  onClick={() => handleSelectTitle(tOpt)}
                                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all bg-white dark:bg-slate-800"
                               >
                                   <div className="font-bold text-indigo-700 dark:text-indigo-300 text-sm mb-2">{tOpt.title}</div>
                                   <div className="flex flex-wrap gap-1 mb-2">
                                       <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600">IV: {tOpt.variables.iv}</span>
                                       <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600">DV: {tOpt.variables.dv}</span>
                                   </div>
                                   <div className="text-xs text-slate-500 italic border-t border-slate-100 dark:border-slate-700 pt-2">{tOpt.rationale}</div>
                               </div>
                           ))}
                           {loading && <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-500"/></div>}
                       </div>
                   )}

                   <div ref={chatEndRef} />
               </div>
           </div>

           {/* Right Panel: Real-time Draft Board */}
           <div className="w-2/3 bg-slate-50 dark:bg-slate-900 overflow-y-auto p-8 custom-scrollbar">
               <div className="max-w-3xl mx-auto">
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                           <Layout className="text-indigo-500" /> Draft Board
                       </h2>
                       <div className="flex gap-2">
                           <button onClick={handleRestart} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"><RotateCcw size={12}/> {t.restart}</button>
                           {framework && <button onClick={exportPDF} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">{t.step5.export}</button>}
                       </div>
                   </div>

                   <div id="draft-content" ref={resultRef} className="space-y-6">
                       {/* Topic Card */}
                       {topic && (
                           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                               <div className="text-xs font-bold text-slate-400 uppercase mb-1">Topic</div>
                               <div className="text-lg font-serif text-slate-800 dark:text-slate-100">{topic}</div>
                           </div>
                       )}

                       {/* Dimension Card */}
                       {selectedDimension && (
                           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn">
                               <div className="text-xs font-bold text-slate-400 uppercase mb-1">Research Dimension</div>
                               <div className="flex items-center gap-2">
                                   <Target className="text-indigo-500" size={16} />
                                   <span className="font-bold text-slate-700 dark:text-slate-200">{selectedDimension.focus}</span>
                               </div>
                               <p className="text-sm text-slate-500 mt-1">{selectedDimension.description}</p>
                           </div>
                       )}

                       {/* Context Card */}
                       {Object.keys(contextAnswers).length > 0 && (
                           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn">
                               <div className="text-xs font-bold text-slate-400 uppercase mb-2">Context & Methodology</div>
                               <div className="flex flex-wrap gap-2">
                                   {Object.values(contextAnswers).map((ans, i) => (
                                       <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                                           {ans}
                                       </span>
                                   ))}
                               </div>
                           </div>
                       )}

                       {/* Final Framework Card */}
                       {framework && (
                           <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-lg animate-slideUp">
                               <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-6 mb-6">
                                   <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-serif">{framework.title}</h1>
                                   <div className="text-sm text-slate-500">Graduation Thesis Framework</div>
                               </div>

                               <div className="space-y-6">
                                   <section>
                                       <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Abstract Draft</h3>
                                       <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg italic">
                                           {framework.abstract}
                                       </p>
                                   </section>

                                   <div className="grid grid-cols-2 gap-6">
                                       <section>
                                           <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Core Definitions</h3>
                                           <ul className="space-y-2">
                                               {framework.definitions.map((def, i) => (
                                                   <li key={i} className="text-sm">
                                                       <span className="font-bold text-slate-700 dark:text-slate-200">{def.term}:</span> <span className="text-slate-500">{def.definition}</span>
                                                   </li>
                                               ))}
                                           </ul>
                                       </section>
                                       <section>
                                           <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Hypotheses</h3>
                                           <ul className="space-y-2">
                                               {framework.hypotheses.map((h, i) => (
                                                   <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                       <span className="font-bold text-indigo-500">H{i+1}:</span> {h}
                                                   </li>
                                               ))}
                                           </ul>
                                       </section>
                                   </div>

                                   <section>
                                       <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Structure</h3>
                                       <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                                           <ReactMarkdown>{framework.chapters.join('\n')}</ReactMarkdown>
                                       </div>
                                   </section>

                                   <section>
                                       <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Key References</h3>
                                       <ul className="space-y-1">
                                           {framework.references.map((ref, i) => (
                                               <li key={i} className="text-xs text-slate-500">
                                                   [{i+1}] {ref.author} ({ref.year}). <strong>{ref.title}</strong>.
                                               </li>
                                           ))}
                                       </ul>
                                   </section>
                               </div>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};

export default AIWorkflow;