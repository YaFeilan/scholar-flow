import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, ArrowRight, Loader2, RefreshCw, CheckCircle2, ShieldAlert, BookOpen, PenTool, Mic, Send, Timer, FileText, Upload, Volume2, MessageSquare, Zap, Lightbulb, Brain, Layers, GraduationCap, X, ChevronRight, Gavel, Scale, Search, Play, ExternalLink, Quote } from 'lucide-react';
import { Language, TrainingSession, TrainingAnalysis, TrainingPersonaStyle, BattleMessage, LogicEvaluation, FallacyExercise } from '../types';
import { TRANSLATIONS } from '../translations';
import { 
    initiateTrainingSession, 
    submitTrainingTurn, 
    generateTrainingReport, 
    getTrainingHint, 
    generateFallacyExercise, 
    evaluateFallacy, 
    generateReconstructionExercise, 
    evaluateReconstruction, 
    initiateHypothesisTest, 
    continueHypothesisTest 
} from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ResearchTrainingProps {
  language: Language;
  initialMode?: 'defense' | 'logic';
}

const EvaluationCard: React.FC<{ evaluation: LogicEvaluation, title?: string }> = ({ evaluation, title }) => {
    const radarData = [
        { subject: 'Accuracy', A: evaluation.accuracy, fullMark: 100 },
        { subject: 'Clarity', A: evaluation.clarity, fullMark: 100 },
        { subject: 'Structure', A: evaluation.structure, fullMark: 100 },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 animate-fadeIn">
            {title && <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                            <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#a78bfa" fillOpacity={0.5} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-4 text-sm">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <span className="font-bold text-green-700 dark:text-green-300 block mb-1">Verdict</span>
                        <p className="text-slate-700 dark:text-slate-300">{evaluation.layer1_verdict}</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">Logic Analysis</span>
                        <div className="prose prose-sm dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{evaluation.layer2_logic_latex}</ReactMarkdown>
                        </div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                        <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">Key Takeaway</span>
                        <p className="text-slate-700 dark:text-slate-300">{evaluation.layer3_takeaway}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResearchTraining: React.FC<ResearchTrainingProps> = ({ language, initialMode = 'defense' }) => {
  const t = TRANSLATIONS[language].training;
  
  // Main Navigation State
  const [activeMode, setActiveMode] = useState<'defense' | 'logic'>(initialMode);
  const [logicModule, setLogicModule] = useState<'fallacy' | 'reconstruction' | 'stress'>('fallacy');

  useEffect(() => {
    if (initialMode) setActiveMode(initialMode);
  }, [initialMode]);

  // Defense Battle State (Existing)
  const [phase, setPhase] = useState<'setup' | 'battle' | 'report'>('setup');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [persona, setPersona] = useState<TrainingPersonaStyle>('Methodology');
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); 
  const [isRecording, setIsRecording] = useState(false);
  const [showHint, setShowHint] = useState<string | null>(null);
  const [turnAnalysis, setTurnAnalysis] = useState<BattleMessage['analysis'] | null>(null);
  
  // Logic Training State
  const [fallacyExercise, setFallacyExercise] = useState<FallacyExercise | null>(null);
  const [selectedFallacyText, setSelectedFallacyText] = useState('');
  const [fallacyReason, setFallacyReason] = useState('');
  const [fallacyType, setFallacyType] = useState('strawman');
  const [logicEvaluation, setLogicEvaluation] = useState<LogicEvaluation | null>(null);

  // Reconstruction State - Updated to handle object with reference
  const [reconstructionData, setReconstructionData] = useState<{text: string, reference: string} | null>(null);
  const [reconForm, setReconForm] = useState({ premise: '', evidence: '', conclusion: '' });
  
  const [stressHypothesis, setStressHypothesis] = useState('');
  const [stressHistory, setStressHistory] = useState<{role:string, content:string}[]>([]);
  const [stressStarted, setStressStarted] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
      let timer: any;
      if (activeMode === 'defense' && phase === 'battle' && !turnAnalysis && timeLeft > 0) {
          timer = setInterval(() => {
              setTimeLeft(prev => prev - 1);
          }, 1000);
      } else if (timeLeft === 0 && phase === 'battle' && !turnAnalysis) {
          handleTurnSubmit();
      }
      return () => clearInterval(timer);
  }, [activeMode, phase, timeLeft, turnAnalysis]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.history, turnAnalysis, stressHistory]);

  // --- Defense Battle Logic (Existing) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setFile(e.target.files[0]);
          setTopic(`Based on file: ${e.target.files[0].name}`);
      }
  };

  const handleStartDefense = async () => {
      if (!topic.trim()) return;
      setLoading(true);
      const newSession = await initiateTrainingSession(topic, persona, language, file || undefined);
      if (newSession) {
          setSession(newSession);
          setPhase('battle');
          setTimeLeft(120);
      }
      setLoading(false);
  };

  const handleTurnSubmit = async () => {
      if (!session || (!currentInput.trim() && timeLeft > 0)) return;
      setLoading(true);
      const answer = currentInput.trim() || "(No answer provided due to timeout)";
      const newMessages = await submitTrainingTurn(session, answer, language, file || undefined);
      if (newMessages.length === 2) {
          const userMsg = newMessages[0];
          const aiMsg = newMessages[1];
          const updatedHistory = [...session.history, userMsg];
          setSession({ ...session, history: updatedHistory });
          setTurnAnalysis(userMsg.analysis);
          setCurrentInput('');
          setTimeout(() => {
              setSession(prev => prev ? ({ ...prev, history: [...prev.history, aiMsg], currentTurn: prev.currentTurn + 1 }) : null);
              if (session.currentTurn >= session.maxTurns) finishTraining(updatedHistory);
          }, 2000);
      }
      setLoading(false);
  };

  const nextQuestion = () => {
      setTurnAnalysis(null);
      setTimeLeft(120);
      setShowHint(null);
  };

  const finishTraining = async (finalHistory: BattleMessage[]) => {
      if (!session) return;
      setLoading(true);
      setTimeout(async () => {
          const report = await generateTrainingReport({ ...session, history: finalHistory }, language);
          if (report) {
              setSession(prev => prev ? ({ ...prev, finalReport: report }) : null);
              setPhase('report');
          }
          setLoading(false);
      }, 1500);
  };

  // --- Logic Training Logic ---

  // Fallacy Detective
  const startFallacy = async () => {
      setLoading(true);
      setLogicEvaluation(null);
      setSelectedFallacyText('');
      setFallacyReason('');
      const ex = await generateFallacyExercise(language);
      setFallacyExercise(ex);
      setLoading(false);
  };

  const checkFallacy = async () => {
      if (!fallacyExercise) return;
      setLoading(true);
      const evalResult = await evaluateFallacy(fallacyExercise.text, selectedFallacyText || "No selection", `${fallacyType}: ${fallacyReason}`, language);
      setLogicEvaluation(evalResult);
      setLoading(false);
  };

  const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
          setSelectedFallacyText(selection.toString().trim());
      }
  };

  // Argument Reconstruction
  const startReconstruction = async () => {
      setLoading(true);
      setLogicEvaluation(null);
      setReconForm({ premise: '', evidence: '', conclusion: '' });
      const data = await generateReconstructionExercise(language);
      setReconstructionData(data);
      setLoading(false);
  };

  const checkReconstruction = async () => {
      if (!reconstructionData) return;
      setLoading(true);
      const evalResult = await evaluateReconstruction(reconstructionData.text, reconForm, language);
      setLogicEvaluation(evalResult);
      setLoading(false);
  };

  // Stress Test
  const startStressTest = async () => {
      if (!stressHypothesis.trim()) return;
      setLoading(true);
      setStressStarted(true);
      const firstQ = await initiateHypothesisTest(stressHypothesis, language);
      setStressHistory([{ role: 'ai', content: firstQ }]);
      setLoading(false);
  };

  const submitStressReply = async () => {
      if (!currentInput.trim()) return;
      const userMsg = currentInput;
      setCurrentInput('');
      const newHistory = [...stressHistory, { role: 'user', content: userMsg }];
      setStressHistory(newHistory);
      setLoading(true);
      
      const res = await continueHypothesisTest(newHistory, userMsg, language);
      if (res.analysis) setLogicEvaluation(res.analysis);
      setStressHistory(prev => [...prev, { role: 'ai', content: res.text }]);
      setLoading(false);
  };

  // --- Render Helpers ---
  const radarData = session?.finalReport ? [
      { subject: 'Logic', A: session.finalReport.radar.logic, fullMark: 100 },
      { subject: 'Theory', A: session.finalReport.radar.theory, fullMark: 100 },
      { subject: 'Innovation', A: session.finalReport.radar.innovation, fullMark: 100 },
      { subject: 'Expression', A: session.finalReport.radar.expression, fullMark: 100 },
      { subject: 'Response', A: session.finalReport.radar.response, fullMark: 100 },
  ] : [];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       {/* Header */}
       <div className="flex-shrink-0 mb-6 flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Dumbbell className="text-indigo-600" /> {activeMode === 'defense' ? t.menu.defense : t.menu.logic}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
          </div>
          
          {/* Main Navigation Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                 onClick={() => setActiveMode('defense')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeMode === 'defense' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}
              >
                  <ShieldAlert size={16}/> {t.menu.defense}
              </button>
              <button 
                 onClick={() => setActiveMode('logic')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeMode === 'logic' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
              >
                  <Brain size={16}/> {t.menu.logic}
              </button>
          </div>
       </div>

       {/* Main Content */}
       <div className="flex-grow overflow-hidden relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
           
           {/* === LOGIC TRAINING MODE === */}
           {activeMode === 'logic' && (
               <div className="flex flex-col h-full">
                   {/* Sub-menu */}
                   <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                       <button onClick={() => { setLogicModule('fallacy'); setLogicEvaluation(null); }} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${logicModule === 'fallacy' ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-transparent text-slate-500'}`}>{t.logic.fallacy}</button>
                       <button onClick={() => { setLogicModule('reconstruction'); setLogicEvaluation(null); }} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${logicModule === 'reconstruction' ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-transparent text-slate-500'}`}>{t.logic.reconstruction}</button>
                       <button onClick={() => { setLogicModule('stress'); setLogicEvaluation(null); }} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${logicModule === 'stress' ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-transparent text-slate-500'}`}>{t.logic.stress}</button>
                   </div>

                   <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                       {/* 1. Fallacy Detective */}
                       {logicModule === 'fallacy' && (
                           <div className="max-w-4xl mx-auto space-y-6">
                               {!fallacyExercise ? (
                                   <div className="text-center py-20">
                                       <Search size={48} className="text-purple-300 mx-auto mb-4" />
                                       <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">{t.fallacy.task}</h3>
                                       <button onClick={startFallacy} disabled={loading} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto">
                                           {loading ? <Loader2 className="animate-spin"/> : <Play size={20}/>} Start Detective
                                       </button>
                                   </div>
                               ) : (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       <div className="space-y-4">
                                           <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                                               <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 px-3 py-1 rounded-bl-xl text-xs font-bold">Case File</div>
                                               <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-100 font-serif" onMouseUp={handleTextSelection}>
                                                   {fallacyExercise.text}
                                               </p>
                                               <p className="text-xs text-slate-400 mt-4 italic text-center">(Select the flawed text segment)</p>
                                           </div>
                                           {selectedFallacyText && (
                                               <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                                                   <span className="font-bold">Selection:</span> "{selectedFallacyText}"
                                               </div>
                                           )}
                                       </div>
                                       <div className="space-y-4">
                                           <div>
                                               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.fallacy.reason}</label>
                                               <select 
                                                  value={fallacyType}
                                                  onChange={(e) => setFallacyType(e.target.value)}
                                                  className="w-full mb-3 p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                               >
                                                   {Object.entries(t.fallacy.types).map(([k, v]) => (
                                                       <option key={k} value={v}>{v}</option>
                                                   ))}
                                               </select>
                                               <textarea 
                                                  value={fallacyReason}
                                                  onChange={(e) => setFallacyReason(e.target.value)}
                                                  className="w-full h-32 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                  placeholder="Why is this a fallacy?"
                                               />
                                           </div>
                                           <button 
                                              onClick={checkFallacy}
                                              disabled={loading || !selectedFallacyText}
                                              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
                                           >
                                              {loading ? <Loader2 className="animate-spin mx-auto"/> : t.fallacy.check}
                                           </button>
                                           {logicEvaluation && <EvaluationCard evaluation={logicEvaluation} title="Detective Report" />}
                                           {logicEvaluation && (
                                               <button onClick={startFallacy} className="w-full border border-purple-200 text-purple-600 py-2 rounded-lg text-sm font-bold hover:bg-purple-50">Next Case</button>
                                           )}
                                       </div>
                                   </div>
                               )}
                           </div>
                       )}

                       {/* 2. Argument Reconstruction */}
                       {logicModule === 'reconstruction' && (
                           <div className="max-w-5xl mx-auto space-y-6">
                               {!reconstructionData ? (
                                   <div className="text-center py-20">
                                       <Layers size={48} className="text-purple-300 mx-auto mb-4" />
                                       <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">{t.reconstruction.task}</h3>
                                       <button onClick={startReconstruction} disabled={loading} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto">
                                           {loading ? <Loader2 className="animate-spin"/> : <Play size={20}/>} Start Exercise
                                       </button>
                                   </div>
                               ) : (
                                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                       <div className="space-y-4">
                                           <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-fit relative">
                                               <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1">
                                                   <BookOpen size={12}/> Academic Abstract
                                               </div>
                                               <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Source Text</h4>
                                               <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-sm">
                                                   {reconstructionData.text}
                                               </p>
                                               <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                   <div className="flex items-start gap-2 text-xs text-slate-500">
                                                       <Quote size={12} className="mt-0.5 flex-shrink-0" />
                                                       <div className="italic">
                                                           {reconstructionData.reference}
                                                       </div>
                                                   </div>
                                                   <a 
                                                       href={`https://scholar.google.com/scholar?q=${encodeURIComponent(reconstructionData.reference)}`} 
                                                       target="_blank" 
                                                       rel="noopener noreferrer"
                                                       className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-bold"
                                                   >
                                                       Verify on Google Scholar <ExternalLink size={10} />
                                                   </a>
                                               </div>
                                           </div>
                                       </div>
                                       <div className="space-y-4">
                                           <div>
                                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.reconstruction.premise}</label>
                                               <textarea value={reconForm.premise} onChange={e => setReconForm({...reconForm, premise: e.target.value})} className="w-full p-3 border rounded-lg text-sm h-24 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Identify the core premises..." />
                                           </div>
                                           <div>
                                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.reconstruction.evidence}</label>
                                               <textarea value={reconForm.evidence} onChange={e => setReconForm({...reconForm, evidence: e.target.value})} className="w-full p-3 border rounded-lg text-sm h-24 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="What evidence supports the premises?" />
                                           </div>
                                           <div>
                                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.reconstruction.conclusion}</label>
                                               <textarea value={reconForm.conclusion} onChange={e => setReconForm({...reconForm, conclusion: e.target.value})} className="w-full p-3 border rounded-lg text-sm h-24 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="State the final conclusion..." />
                                           </div>
                                           <button onClick={checkReconstruction} disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50">
                                               {loading ? <Loader2 className="animate-spin mx-auto"/> : t.reconstruction.evaluate}
                                           </button>
                                           {logicEvaluation && <EvaluationCard evaluation={logicEvaluation} title="Structure Analysis" />}
                                           {logicEvaluation && (
                                               <button onClick={startReconstruction} className="w-full border border-purple-200 text-purple-600 py-2 rounded-lg text-sm font-bold hover:bg-purple-50">Next Abstract</button>
                                           )}
                                       </div>
                                   </div>
                               )}
                           </div>
                       )}

                       {/* 3. Hypothesis Stress Test */}
                       {logicModule === 'stress' && (
                           <div className="max-w-3xl mx-auto h-full flex flex-col">
                               {!stressStarted ? (
                                   <div className="flex-grow flex flex-col items-center justify-center p-8">
                                       <Scale size={48} className="text-purple-300 mb-6" />
                                       <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Socratic Stress Test</h3>
                                       <input 
                                          value={stressHypothesis}
                                          onChange={e => setStressHypothesis(e.target.value)}
                                          placeholder={t.stress.placeholder}
                                          className="w-full max-w-lg p-4 rounded-xl border border-slate-300 dark:border-slate-600 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                       />
                                       <button onClick={startStressTest} disabled={!stressHypothesis.trim() || loading} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                                           {loading ? <Loader2 className="animate-spin"/> : <Zap size={20}/>} {t.stress.start}
                                       </button>
                                   </div>
                               ) : (
                                   <div className="flex flex-col h-full">
                                       <div className="flex-grow overflow-y-auto space-y-4 p-4 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                           {stressHistory.map((msg, i) => (
                                               <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                   <div className={`max-w-[80%] p-4 rounded-xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                                                       <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{msg.content}</ReactMarkdown>
                                                   </div>
                                               </div>
                                           ))}
                                           {loading && <div className="flex justify-start"><div className="bg-white p-4 rounded-xl shadow-sm"><Loader2 className="animate-spin text-purple-600"/></div></div>}
                                           <div ref={messagesEndRef} />
                                       </div>
                                       
                                       {logicEvaluation && (
                                           <div className="mb-4">
                                               <EvaluationCard evaluation={logicEvaluation} title="Live Feedback" />
                                           </div>
                                       )}

                                       <div className="relative">
                                           <input 
                                              value={currentInput}
                                              onChange={e => setCurrentInput(e.target.value)}
                                              onKeyDown={e => e.key === 'Enter' && submitStressReply()}
                                              disabled={loading}
                                              className="w-full p-3 pr-12 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
                                              placeholder="Defend your hypothesis..."
                                           />
                                           <button onClick={submitStressReply} disabled={loading || !currentInput.trim()} className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                               <Send size={16} />
                                           </button>
                                       </div>
                                   </div>
                               )}
                           </div>
                       )}
                   </div>
               </div>
           )}

           {/* === DEFENSE BATTLE MODE (Existing Code) === */}
           {activeMode === 'defense' && (
               <>
                   {/* Phase 1: Setup */}
                   {phase === 'setup' && (
                       <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
                           <div className="w-full max-w-2xl space-y-8">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                       <div className="flex items-center justify-between mb-4">
                                           <FileText size={32} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                           {file && <CheckCircle2 size={20} className="text-green-500" />}
                                       </div>
                                       <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{t.setup.uploadLabel}</h3>
                                       <p className="text-xs text-slate-500">{file ? file.name : "PDF / Word"}</p>
                                       <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                                   </div>
                                   <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border-2 border-transparent hover:border-indigo-500 transition-all">
                                       <div className="flex items-center justify-between mb-4"><PenTool size={32} className="text-indigo-500" /></div>
                                       <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{t.setup.topicLabel}</h3>
                                       <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t.setup.placeholder} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-500 uppercase mb-4 text-center">{t.setup.personaLabel}</label>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                       {[{ id: 'Methodology', icon: ShieldAlert, color: 'blue', title: t.setup.personas.method, desc: t.setup.personas.methodDesc }, { id: 'Innovation', icon: Lightbulb, color: 'amber', title: t.setup.personas.innov, desc: t.setup.personas.innovDesc }, { id: 'Practical', icon: Zap, color: 'green', title: t.setup.personas.prac, desc: t.setup.personas.pracDesc }].map((p) => (
                                           <div key={p.id} onClick={() => setPersona(p.id as TrainingPersonaStyle)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${persona === p.id ? `border-${p.color}-500 bg-${p.color}-50 dark:bg-${p.color}-900/20` : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                               <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-${p.color}-100 text-${p.color}-600`}><p.icon size={20} /></div>
                                               <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{p.title}</h4>
                                               <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                               <button onClick={handleStartDefense} disabled={!topic || loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50">
                                  {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                                  {loading ? "Initializing..." : t.setup.btn}
                               </button>
                           </div>
                       </div>
                   )}

                   {/* Phase 2: Battle */}
                   {phase === 'battle' && session && (
                       <div className="h-full flex flex-col">
                           <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                               {session.history.map((msg, idx) => (
                                   <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                       <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'}`}>
                                           <div className="flex items-start gap-3">
                                               {msg.role === 'ai' && <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 mt-1"><ShieldAlert size={14} /></div>}
                                               <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                           </div>
                                           {msg.role === 'user' && msg.analysis && (
                                               <div className="mt-3 pt-3 border-t border-white/20">
                                                   <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase opacity-80">Score: {msg.analysis.score}/100</span><CheckCircle2 size={14} className="text-green-300" /></div>
                                               </div>
                                           )}
                                       </div>
                                   </div>
                               ))}
                               {loading && <div className="flex justify-start"><div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3"><Loader2 className="animate-spin text-indigo-600" /><span className="text-sm text-slate-500">{t.battle.aiThinking}</span></div></div>}
                               <div ref={messagesEndRef} />
                           </div>
                           {turnAnalysis && (
                               <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-sm flex items-end justify-center p-6 animate-fadeIn">
                                   <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                                       <div className="p-4 bg-indigo-600 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Zap size={18} /> {t.battle.turnReport}</h3><span className="text-2xl font-black">{turnAnalysis.score}</span></div>
                                       <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                           <div className="space-y-4">
                                               <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.battle.original}</h4><p className="text-sm text-slate-700 dark:text-slate-300 italic">"{session.history[session.history.length - 1].content}"</p></div>
                                               <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800"><h4 className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> {t.battle.better}</h4><p className="text-sm text-green-800 dark:text-green-200 font-medium">{turnAnalysis.optimizedVersion}</p></div>
                                           </div>
                                           <div className="space-y-4">
                                               <div className="grid grid-cols-2 gap-4">
                                                   <div><h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.battle.strengths}</h4><ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">{turnAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                                                   <div><h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.battle.weaknesses}</h4><ul className="text-xs space-y-1 text-red-600 dark:text-red-400 list-disc list-inside">{turnAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                                               </div>
                                               <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl"><h4 className="text-xs font-bold text-indigo-700 uppercase mb-2">Logic Analysis</h4><p className="text-xs text-indigo-800 dark:text-indigo-200">{turnAnalysis.logicAnalysis}</p></div>
                                           </div>
                                       </div>
                                       <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end"><button onClick={nextQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">{t.battle.nextQ} <ArrowRight size={16} /></button></div>
                                   </div>
                               </div>
                           )}
                           <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                               <div className="flex justify-between items-center mb-3">
                                   <div className="flex items-center gap-4">
                                       <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${timeLeft < 30 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'}`}><Timer size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                                       <button className="text-xs text-amber-500 hover:text-amber-600 font-bold flex items-center gap-1"><Lightbulb size={14} /> {t.battle.hint}</button>
                                   </div>
                               </div>
                               <div className="relative flex items-center gap-2">
                                   <button className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}><Mic size={20} className={isRecording ? 'animate-pulse' : ''} /></button>
                                   <input value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTurnSubmit()} disabled={loading || !!turnAnalysis} placeholder="Type your defense..." className="flex-grow p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                   <button onClick={handleTurnSubmit} disabled={!currentInput.trim() || loading || !!turnAnalysis} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"><Send size={20} /></button>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* Phase 3: Report */}
                   {phase === 'report' && session?.finalReport && (
                       <div className="h-full overflow-y-auto p-8 animate-fadeIn">
                           <div className="max-w-4xl mx-auto space-y-8">
                               <div className="text-center">
                                   <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t.report.title}</h2>
                                   <div className="text-6xl font-black text-indigo-600 mb-4">{session.finalReport.overallScore}</div>
                                   <p className="text-slate-500 max-w-xl mx-auto">{session.finalReport.summary}</p>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                   <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-80">
                                       <ResponsiveContainer width="100%" height="100%">
                                           <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}><PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} /><Radar name="Capability" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} /></RadarChart>
                                       </ResponsiveContainer>
                                   </div>
                                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                       <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-4 flex items-center gap-2"><CheckCircle2 size={18} /> {t.report.actionPlan}</h3>
                                       <ul className="space-y-3">{session.finalReport.actionPlan.map((step, i) => <li key={i} className="flex gap-3 text-sm text-indigo-700 dark:text-indigo-300"><span className="bg-indigo-200 dark:bg-indigo-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>{step}</li>)}</ul>
                                   </div>
                               </div>
                               <div className="text-center pt-8"><button className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-900 transition-colors shadow-lg">{t.report.restart}</button></div>
                           </div>
                       </div>
                   )}
               </>
           )}
       </div>
    </div>
  );
};

export default ResearchTraining;