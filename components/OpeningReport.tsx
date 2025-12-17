
import React, { useState, useRef, useEffect } from 'react';
import { Target, BookOpen, Compass, List, FileText, CheckCircle, ArrowRight, Loader2, RefreshCw, Cpu, Database, Network, MessageSquare, AlertTriangle, Lightbulb, UserCheck, Play, Download } from 'lucide-react';
import { Language, OpeningTopicSuggestion, OpeningLitReview, OpeningMethodology, OpeningOutlineItem, OpeningSimulatedDefense } from '../types';
import { TRANSLATIONS } from '../translations';
import { 
    generateOpeningTopicSuggestions, 
    generateOpeningLitReview, 
    recommendOpeningMethod, 
    generateOpeningOutline, 
    fillOpeningContent, 
    simulateOpeningDefense 
} from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface OpeningReportProps {
  language: Language;
}

interface OutlineItemProps {
  item: OpeningOutlineItem;
  onUpdate: (id: string, val: string) => void;
  onExpand: (id: string) => void | Promise<void>;
}

// Draggable List Item Component (Simplified for brevity, standard React DnD logic implied or simple swapping)
const OutlineItem: React.FC<OutlineItemProps> = ({ item, onUpdate, onExpand }) => {
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 mb-2 hover:shadow-sm transition-all">
            <div className="flex justify-between items-center mb-2">
                <input 
                    value={item.title}
                    onChange={(e) => onUpdate(item.id, e.target.value)}
                    className="font-bold text-sm bg-transparent outline-none w-full"
                />
                <button onClick={() => onExpand(item.id)} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                    <SparklesIcon size={12} /> Auto-Fill
                </button>
            </div>
            <textarea 
                value={item.content}
                readOnly
                className="w-full text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded resize-none h-20 outline-none"
            />
        </div>
    );
};

// Custom minimal icons
const SparklesIcon = ({size}: {size: number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;

const OpeningReport: React.FC<OpeningReportProps> = ({ language }) => {
  const t = TRANSLATIONS[language].openingReport;
  
  // State
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [broadArea, setBroadArea] = useState('');
  const [topics, setTopics] = useState<OpeningTopicSuggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<OpeningTopicSuggestion | null>(null);
  
  const [litReview, setLitReview] = useState<OpeningLitReview | null>(null);
  
  const [domain, setDomain] = useState('Science');
  const [researchType, setResearchType] = useState('Empirical');
  const [methodology, setMethodology] = useState<OpeningMethodology | null>(null);
  
  const [outline, setOutline] = useState<OpeningOutlineItem[]>([]);
  
  const [defense, setDefense] = useState<OpeningSimulatedDefense | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  // -- Handlers --

  // Step 1: Topic
  const handleAnalyzeTopic = async () => {
      if (!broadArea.trim()) return;
      setLoading(true);
      const res = await generateOpeningTopicSuggestions(broadArea, language);
      setTopics(res);
      setLoading(false);
  };

  const handleSelectTopic = (topic: OpeningTopicSuggestion) => {
      setSelectedTopic(topic);
      setStep(2);
      // Auto-trigger Lit Review generation for smooth flow
      generateLitReview(topic.title);
  };

  // Step 2: Lit Review
  const generateLitReview = async (title: string) => {
      setLoading(true);
      const res = await generateOpeningLitReview(title, language);
      setLitReview(res);
      setLoading(false);
  };

  // Step 3: Methodology
  const handleRecommendMethod = async () => {
      if (!selectedTopic) return;
      setLoading(true);
      const res = await recommendOpeningMethod(selectedTopic.title, domain, researchType, language);
      setMethodology(res);
      setLoading(false);
  };

  // Step 4: Outline
  const handleGenerateOutline = async () => {
      if (!selectedTopic || !methodology) return;
      setLoading(true);
      const res = await generateOpeningOutline(selectedTopic.title, methodology.recommendedMethod, language);
      setOutline(res);
      setLoading(false);
  };

  const handleFillContent = async (id: string) => {
      const item = outline.find(i => i.id === id);
      if (!item || !selectedTopic) return;
      
      // Local loading state could be handled, but global for simplicity
      const newContent = await fillOpeningContent(item.title, selectedTopic.title, language);
      setOutline(prev => prev.map(i => i.id === id ? { ...i, content: newContent } : i));
  };

  // Step 5: Defense
  const handleStartDefense = async () => {
      setLoading(true);
      const framework = {
          topic: selectedTopic,
          litReview,
          methodology,
          outline
      };
      const res = await simulateOpeningDefense(framework, language);
      setDefense(res);
      setLoading(false);
  };

  const handleExportPDF = async () => {
      if (!reportRef.current) return;
      try {
          const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
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
          pdf.save("Opening_Report.pdf");
      } catch (err) {
          console.error(err);
      }
  };

  const StepIndicator = () => (
      <div className="flex justify-between items-center mb-8 px-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
          {[1, 2, 3, 4, 5].map(num => (
              <div key={num} className={`flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-2`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                      ${step >= num ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}
                  `}>
                      {step > num ? <CheckCircle size={16} /> : num}
                  </div>
                  <span className={`text-[10px] font-bold uppercase mt-1 ${step >= num ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {t.steps[num as 1|2|3|4|5]}
                  </span>
              </div>
          ))}
      </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6 flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="text-indigo-600" /> {t.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
          </div>
          <button onClick={() => setStep(1)} className="text-xs text-slate-500 flex items-center gap-1 hover:text-indigo-600">
              <RefreshCw size={14} /> Restart
          </button>
       </div>

       <StepIndicator />

       <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
           
           {/* Left Panel: Interaction */}
           <div className="lg:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                   
                   {/* Step 1: Topic */}
                   {step === 1 && (
                       <div className="space-y-6 animate-fadeIn">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.step1.label}</label>
                               <textarea 
                                  value={broadArea}
                                  onChange={e => setBroadArea(e.target.value)}
                                  className="w-full p-3 border rounded-lg text-sm h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                  placeholder={t.step1.placeholder}
                               />
                               <button 
                                  onClick={handleAnalyzeTopic}
                                  disabled={!broadArea.trim() || loading}
                                  className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                               >
                                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />}
                                  {t.step1.btn}
                               </button>
                           </div>

                           <div className="space-y-3">
                               {topics.map(topic => (
                                   <div key={topic.id} className="border rounded-xl p-4 hover:border-indigo-500 cursor-pointer transition-all bg-slate-50 dark:bg-slate-900/50 group" onClick={() => handleSelectTopic(topic)}>
                                       <div className="font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-indigo-600">{topic.title}</div>
                                       <div className="flex gap-2 mb-2">
                                           <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t.step1.innov}: {topic.innovationScore}</span>
                                           <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">{t.step1.feas}: {topic.feasibilityScore}</span>
                                           <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{t.step1.work}: {topic.workloadScore}</span>
                                       </div>
                                       <p className="text-xs text-slate-500">{topic.comment}</p>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {/* Step 2: Lit Review (Loading State mostly) */}
                   {step === 2 && (
                       <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fadeIn">
                           {loading ? (
                               <>
                                   <Loader2 size={48} className="animate-spin text-indigo-500" />
                                   <p className="text-slate-600 font-medium">{t.step2.generating}</p>
                               </>
                           ) : (
                               <>
                                   <BookOpen size={48} className="text-green-500" />
                                   <h3 className="text-lg font-bold text-slate-800">{t.step2.gap}</h3>
                                   <p className="text-sm text-slate-500 px-4 mb-4">{litReview?.researchGap}</p>
                                   <button onClick={() => setStep(3)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                       Next: Methodology <ArrowRight size={16} />
                                   </button>
                               </>
                           )}
                       </div>
                   )}

                   {/* Step 3: Methodology */}
                   {step === 3 && (
                       <div className="space-y-6 animate-fadeIn">
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.step3.domainLabel}</label>
                                   <select value={domain} onChange={e => setDomain(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-900">
                                       {Object.entries(t.step3.domains).map(([k,v]) => <option key={k} value={k}>{v as string}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.step3.typeLabel}</label>
                                   <select value={researchType} onChange={e => setResearchType(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-900">
                                       {Object.entries(t.step3.types).map(([k,v]) => <option key={k} value={k}>{v as string}</option>)}
                                   </select>
                               </div>
                           </div>
                           <button onClick={handleRecommendMethod} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                               {loading ? <Loader2 className="animate-spin" size={16}/> : <Compass size={16}/>} {t.step3.btn}
                           </button>
                           
                           {methodology && (
                               <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-4">
                                   <h4 className="font-bold text-indigo-700 mb-2">{methodology.recommendedMethod}</h4>
                                   <p className="text-xs text-slate-600 mb-4">{methodology.reason}</p>
                                   <button onClick={() => setStep(4)} className="w-full border border-indigo-500 text-indigo-600 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50">
                                       Confirm & Next
                                   </button>
                               </div>
                           )}
                       </div>
                   )}

                   {/* Step 4: Outline */}
                   {step === 4 && (
                       <div className="space-y-4 animate-fadeIn">
                           {outline.length === 0 ? (
                               <div className="text-center py-10">
                                   <List size={48} className="mx-auto text-slate-300 mb-4" />
                                   <button onClick={handleGenerateOutline} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">
                                       {loading ? <Loader2 className="animate-spin" /> : t.step4.genOutline}
                                   </button>
                               </div>
                           ) : (
                               <div className="space-y-2">
                                   <p className="text-xs text-slate-400 text-center mb-2">{t.step4.dragTip}</p>
                                   {outline.map(item => (
                                       <OutlineItem 
                                          key={item.id} 
                                          item={item} 
                                          onUpdate={(id, val) => setOutline(prev => prev.map(i => i.id === id ? {...i, title: val} : i))} 
                                          onExpand={handleFillContent}
                                       />
                                   ))}
                                   <button onClick={() => { setStep(5); handleStartDefense(); }} className="w-full mt-4 bg-indigo-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                                       Finalize & Defend <ArrowRight size={16}/>
                                   </button>
                               </div>
                           )}
                       </div>
                   )}

                   {/* Step 5: Defense */}
                   {step === 5 && defense && (
                       <div className="space-y-6 animate-fadeIn">
                           <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl">
                               <h3 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                                   <UserCheck size={20} /> {t.step5.title}
                               </h3>
                               <p className="text-sm text-red-800 italic mb-4">"{defense.overallComment}"</p>
                               
                               <div className="space-y-4">
                                   {defense.questions.map((q, i) => (
                                       <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-100 dark:border-red-900 shadow-sm">
                                           <div className="text-xs font-bold text-red-500 uppercase mb-1">{t.step5.question} {i+1}</div>
                                           <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{q.question}</p>
                                           <div className="text-xs text-slate-500 mb-2"><AlertTriangle size={10} className="inline mr-1"/> Weakness: {q.weakness}</div>
                                           <div className="bg-green-50 text-green-800 text-xs p-2 rounded border border-green-100">
                                               <span className="font-bold">{t.step5.answer}:</span> {q.suggestedAnswer}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           </div>

           {/* Right Panel: Live Document Preview */}
           <div className="lg:w-2/3 bg-slate-50 dark:bg-slate-900 overflow-y-auto p-8 custom-scrollbar">
               <div ref={reportRef} className="max-w-4xl mx-auto bg-white dark:bg-slate-800 min-h-[800px] shadow-lg rounded-xl p-10 border border-slate-200 dark:border-slate-700 relative">
                   {selectedTopic ? (
                       <div className="space-y-8">
                           <div className="text-center border-b pb-6 border-slate-100 dark:border-slate-700">
                               <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{selectedTopic.title}</h1>
                               <p className="text-slate-500">Opening Report / Thesis Proposal</p>
                           </div>

                           {litReview && (
                               <section>
                                   <h2 className="text-lg font-bold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">1. Literature Review & Gap</h2>
                                   <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600">
                                       <ReactMarkdown>{litReview.reviewText}</ReactMarkdown>
                                   </div>
                                   <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800">
                                       <strong>Gap Identified:</strong> {litReview.researchGap}
                                   </div>
                               </section>
                           )}

                           {methodology && (
                               <section>
                                   <h2 className="text-lg font-bold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">2. Methodology & Roadmap</h2>
                                   <p className="text-sm text-slate-700 mb-4">{methodology.reason}</p>
                                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-xs overflow-x-auto">
                                       {methodology.roadmapMermaid}
                                   </div>
                                   {/* Ideally render Mermaid here, keeping simple text for now */}
                                   <p className="text-xs text-center text-slate-400 mt-2">(Technical Roadmap Visualization)</p>
                               </section>
                           )}

                           {outline.length > 0 && (
                               <section>
                                   <h2 className="text-lg font-bold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">3. Proposed Outline</h2>
                                   <div className="space-y-4">
                                       {outline.map((item, i) => (
                                           <div key={item.id}>
                                               <h3 className="font-bold text-slate-800 text-md">{i+1}. {item.title}</h3>
                                               <p className="text-sm text-slate-600 mt-1 pl-4 border-l-2 border-slate-100">{item.content || "(Content to be filled...)"}</p>
                                           </div>
                                       ))}
                                   </div>
                               </section>
                           )}
                       </div>
                   ) : (
                       <div className="flex flex-col items-center justify-center h-full text-slate-300">
                           <FileText size={64} className="mb-4 opacity-50" />
                           <p className="text-xl font-medium">Opening Report Preview</p>
                           <p className="text-sm">Complete the steps on the left to build your proposal.</p>
                       </div>
                   )}
                   
                   {/* Export Fab */}
                   {selectedTopic && (
                       <button onClick={handleExportPDF} className="absolute top-8 right-8 text-slate-400 hover:text-indigo-600 transition-colors" title="Export PDF">
                           <Download size={24} />
                       </button>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

export default OpeningReport;
