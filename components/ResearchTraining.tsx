
import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, ArrowRight, Loader2, RefreshCw, CheckCircle2, ShieldAlert, BookOpen, PenTool, Mic, Send, Timer, FileText, Upload, Volume2, MessageSquare, Zap, Lightbulb } from 'lucide-react';
import { Language, TrainingSession, TrainingAnalysis, TrainingPersonaStyle, BattleMessage } from '../types';
import { TRANSLATIONS } from '../translations';
import { initiateTrainingSession, submitTrainingTurn, generateTrainingReport, getTrainingHint } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

interface ResearchTrainingProps {
  language: Language;
}

const ResearchTraining: React.FC<ResearchTrainingProps> = ({ language }) => {
  const t = TRANSLATIONS[language].training;
  
  // Phase Management
  const [phase, setPhase] = useState<'setup' | 'battle' | 'report'>('setup');
  const [loading, setLoading] = useState(false);
  
  // Setup State
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [persona, setPersona] = useState<TrainingPersonaStyle>('Methodology');
  
  // Battle State
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isRecording, setIsRecording] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState<string | null>(null);
  const [turnAnalysis, setTurnAnalysis] = useState<BattleMessage['analysis'] | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Timer Logic
  useEffect(() => {
      let timer: any;
      if (phase === 'battle' && !turnAnalysis && timeLeft > 0) {
          timer = setInterval(() => {
              setTimeLeft(prev => prev - 1);
          }, 1000);
      } else if (timeLeft === 0 && phase === 'battle' && !turnAnalysis) {
          // Auto-submit on timeout
          handleTurnSubmit();
      }
      return () => clearInterval(timer);
  }, [phase, timeLeft, turnAnalysis]);

  // Scroll to bottom
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.history, turnAnalysis]);

  // --- Setup Logic ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setFile(e.target.files[0]);
          setTopic(`Based on file: ${e.target.files[0].name}`);
      }
  };

  const handleStart = async () => {
      if (!topic.trim()) return;
      setLoading(true);
      const newSession = await initiateTrainingSession(topic, persona, language, file || undefined);
      if (newSession) {
          setSession(newSession);
          setPhase('battle');
          setTimeLeft(120);
          speakText(newSession.history[0].content);
      }
      setLoading(false);
  };

  // --- Battle Logic ---

  const handleTurnSubmit = async () => {
      if (!session || (!currentInput.trim() && timeLeft > 0)) return;
      setLoading(true);
      
      const answer = currentInput.trim() || "(No answer provided due to timeout)";
      
      // Get AI Response (Critique + Next Q)
      const newMessages = await submitTrainingTurn(session, answer, language, file || undefined);
      
      if (newMessages.length === 2) {
          const userMsg = newMessages[0];
          const aiMsg = newMessages[1];
          
          // Update Session
          const updatedHistory = [...session.history, userMsg];
          setSession({ ...session, history: updatedHistory });
          
          // Show Analysis First
          setTurnAnalysis(userMsg.analysis);
          setCurrentInput('');
          
          // Delay next question slightly for UX
          setTimeout(() => {
              // Add AI follow-up to history but don't clear analysis yet
              setSession(prev => prev ? ({
                  ...prev,
                  history: [...prev.history, aiMsg],
                  currentTurn: prev.currentTurn + 1
              }) : null);
              
              speakText(aiMsg.content);
              
              // End game check
              if (session.currentTurn >= session.maxTurns) {
                  finishTraining(updatedHistory);
              }
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
      // Wait a moment before showing report
      setTimeout(async () => {
          const report = await generateTrainingReport({ ...session, history: finalHistory }, language);
          if (report) {
              setSession(prev => prev ? ({ ...prev, finalReport: report }) : null);
              setPhase('report');
          }
          setLoading(false);
      }, 1500);
  };

  const handleVoiceInput = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Speech recognition not supported in this browser.");
          return;
      }

      if (isRecording) {
          recognitionRef.current?.stop();
          setIsRecording(false);
          return;
      }

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = language === 'ZH' ? 'zh-CN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCurrentInput(prev => prev + ' ' + transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  const speakText = (text: string) => {
      if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language === 'ZH' ? 'zh-CN' : 'en-US';
          window.speechSynthesis.speak(utterance);
      }
  };

  const handleGetHint = async () => {
      if (!session || session.history.length === 0) return;
      setLoading(true);
      const lastAiMsg = session.history[session.history.length - 1];
      if (lastAiMsg.role === 'ai') {
          const hint = await getTrainingHint(lastAiMsg.content, language);
          setShowHint(hint);
          setHintsUsed(prev => prev + 1);
      }
      setLoading(false);
  };

  const handleRestart = () => {
      setPhase('setup');
      setSession(null);
      setTopic('');
      setFile(null);
      setCurrentInput('');
      setTurnAnalysis(null);
      setHintsUsed(0);
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
       <div className="flex-shrink-0 mb-4 flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Dumbbell className="text-indigo-600" /> {t.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
          </div>
          {phase === 'battle' && session && (
              <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
                  <div className="text-xs font-bold text-slate-500 uppercase">{t.battle.turn}</div>
                  <div className="flex gap-1">
                      {Array.from({ length: session.maxTurns }).map((_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full ${i < session.currentTurn ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                      ))}
                  </div>
              </div>
          )}
       </div>

       {/* Main Content Area */}
       <div className="flex-grow overflow-hidden relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
           
           {/* Phase 1: Setup */}
           {phase === 'setup' && (
               <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
                   <div className="w-full max-w-2xl space-y-8">
                       {/* Input Selection */}
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
                               <div className="flex items-center justify-between mb-4">
                                   <PenTool size={32} className="text-indigo-500" />
                               </div>
                               <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{t.setup.topicLabel}</h3>
                               <input 
                                  value={topic}
                                  onChange={(e) => setTopic(e.target.value)}
                                  placeholder={t.setup.placeholder}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                               />
                           </div>
                       </div>

                       {/* Persona Selection */}
                       <div>
                           <label className="block text-sm font-bold text-slate-500 uppercase mb-4 text-center">{t.setup.personaLabel}</label>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               {[
                                   { id: 'Methodology', icon: ShieldAlert, color: 'blue', title: t.setup.personas.method, desc: t.setup.personas.methodDesc },
                                   { id: 'Innovation', icon: Lightbulb, color: 'amber', title: t.setup.personas.innov, desc: t.setup.personas.innovDesc },
                                   { id: 'Practical', icon: Zap, color: 'green', title: t.setup.personas.prac, desc: t.setup.personas.pracDesc },
                               ].map((p) => (
                                   <div 
                                      key={p.id}
                                      onClick={() => setPersona(p.id as TrainingPersonaStyle)}
                                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${persona === p.id ? `border-${p.color}-500 bg-${p.color}-50 dark:bg-${p.color}-900/20` : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                   >
                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-${p.color}-100 text-${p.color}-600`}>
                                           <p.icon size={20} />
                                       </div>
                                       <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{p.title}</h4>
                                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                                   </div>
                               ))}
                           </div>
                       </div>

                       <button 
                          onClick={handleStart}
                          disabled={!topic || loading}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                          {loading ? "Initializing Battle..." : t.setup.btn}
                       </button>
                   </div>
               </div>
           )}

           {/* Phase 2: Battle */}
           {phase === 'battle' && session && (
               <div className="h-full flex flex-col">
                   {/* Chat History */}
                   <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                       {session.history.map((msg, idx) => (
                           <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                               <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative ${
                                   msg.role === 'user' 
                                   ? 'bg-indigo-600 text-white rounded-br-sm' 
                                   : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                               }`}>
                                   <div className="flex items-start gap-3">
                                       {msg.role === 'ai' && <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 mt-1"><ShieldAlert size={14} /></div>}
                                       <div className="prose prose-sm dark:prose-invert max-w-none">
                                           <ReactMarkdown>{msg.content}</ReactMarkdown>
                                       </div>
                                       {msg.role === 'ai' && (
                                           <button onClick={() => speakText(msg.content)} className="opacity-50 hover:opacity-100 ml-2"><Volume2 size={14}/></button>
                                       )}
                                   </div>
                                   
                                   {/* Embedded Analysis Card for User Message */}
                                   {msg.role === 'user' && msg.analysis && (
                                       <div className="mt-3 pt-3 border-t border-white/20">
                                           <div className="flex items-center justify-between mb-2">
                                               <span className="text-xs font-bold uppercase opacity-80">Score: {msg.analysis.score}/100</span>
                                               <CheckCircle2 size={14} className="text-green-300" />
                                           </div>
                                       </div>
                                   )}
                               </div>
                           </div>
                       ))}
                       {loading && (
                           <div className="flex justify-start">
                               <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                                   <Loader2 className="animate-spin text-indigo-600" />
                                   <span className="text-sm text-slate-500">{t.battle.aiThinking}</span>
                               </div>
                           </div>
                       )}
                       <div ref={messagesEndRef} />
                   </div>

                   {/* Analysis Overlay (if active) */}
                   {turnAnalysis && (
                       <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-sm flex items-end justify-center p-6 animate-fadeIn">
                           <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                               <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                                   <h3 className="font-bold flex items-center gap-2"><Zap size={18} /> {t.battle.turnReport}</h3>
                                   <span className="text-2xl font-black">{turnAnalysis.score}</span>
                               </div>
                               <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="space-y-4">
                                       <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                           <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.battle.original}</h4>
                                           <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{session.history[session.history.length - 1].content}"</p>
                                       </div>
                                       <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                           <h4 className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> {t.battle.better}</h4>
                                           <p className="text-sm text-green-800 dark:text-green-200 font-medium">{turnAnalysis.optimizedVersion}</p>
                                       </div>
                                   </div>
                                   <div className="space-y-4">
                                       <div className="grid grid-cols-2 gap-4">
                                           <div>
                                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.battle.strengths}</h4>
                                               <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                                                   {turnAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                               </ul>
                                           </div>
                                           <div>
                                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.battle.weaknesses}</h4>
                                               <ul className="text-xs space-y-1 text-red-600 dark:text-red-400 list-disc list-inside">
                                                   {turnAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                               </ul>
                                           </div>
                                       </div>
                                       <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">
                                           <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2">Logic Analysis</h4>
                                           <p className="text-xs text-indigo-800 dark:text-indigo-200">{turnAnalysis.logicAnalysis}</p>
                                       </div>
                                   </div>
                               </div>
                               <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
                                   <button 
                                      onClick={nextQuestion}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                                   >
                                      {t.battle.nextQ} <ArrowRight size={16} />
                                   </button>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* Input Bar */}
                   <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                       {/* Timer & Hints */}
                       <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-4">
                               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${timeLeft < 30 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'}`}>
                                   <Timer size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                               </div>
                               <button 
                                  onClick={handleGetHint}
                                  disabled={!!showHint}
                                  className="text-xs text-amber-500 hover:text-amber-600 font-bold flex items-center gap-1"
                               >
                                   <Lightbulb size={14} /> {t.battle.hint}
                               </button>
                           </div>
                           {showHint && (
                               <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded animate-fadeIn max-w-md truncate">
                                   💡 {showHint}
                               </div>
                           )}
                       </div>

                       <div className="relative flex items-center gap-2">
                           <button 
                              onMouseDown={handleVoiceInput}
                              onMouseUp={handleVoiceInput}
                              className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}
                           >
                               <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
                           </button>
                           
                           <input 
                              value={currentInput}
                              onChange={(e) => setCurrentInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleTurnSubmit()}
                              disabled={loading || !!turnAnalysis}
                              placeholder={isRecording ? "Listening..." : "Type your defense..."}
                              className="flex-grow p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                           />
                           
                           <button 
                              onClick={handleTurnSubmit}
                              disabled={!currentInput.trim() || loading || !!turnAnalysis}
                              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                           >
                               <Send size={20} />
                           </button>
                       </div>
                   </div>
               </div>
           )}

           {/* Phase 3: Final Report */}
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
                                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                       <PolarGrid />
                                       <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                                       <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                       <Radar name="Capability" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                                   </RadarChart>
                               </ResponsiveContainer>
                           </div>

                           <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                               <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-4 flex items-center gap-2">
                                   <CheckCircle2 size={18} /> {t.report.actionPlan}
                               </h3>
                               <ul className="space-y-3">
                                   {session.finalReport.actionPlan.map((step, i) => (
                                       <li key={i} className="flex gap-3 text-sm text-indigo-700 dark:text-indigo-300">
                                           <span className="bg-indigo-200 dark:bg-indigo-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                                           {step}
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       </div>

                       <div className="text-center pt-8">
                           <button onClick={handleRestart} className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-900 transition-colors shadow-lg">
                               {t.report.restart}
                           </button>
                       </div>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};

export default ResearchTraining;
