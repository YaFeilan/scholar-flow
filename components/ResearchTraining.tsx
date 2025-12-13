
import React, { useState } from 'react';
import { Dumbbell, ArrowRight, Loader2, RefreshCw, CheckCircle2, ShieldAlert, BookOpen, PenTool } from 'lucide-react';
import { Language, TrainingSession, TrainingAnalysis } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateTrainingTopic, analyzeTrainingAnswers } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface ResearchTrainingProps {
  language: Language;
}

const ResearchTraining: React.FC<ResearchTrainingProps> = ({ language }) => {
  const t = TRANSLATIONS[language].training;
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState('');
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<TrainingAnalysis | null>(null);

  const handleStart = async () => {
      if (!direction.trim()) return;
      setLoading(true);
      const res = await generateTrainingTopic(direction, language);
      if (res) {
          setSession(res);
          setAnswers({});
          setStep(2);
      }
      setLoading(false);
  };

  const handleSubmitDefense = async () => {
      if (!session) return;
      setLoading(true);
      const qaPairs = session.questions.map(q => ({
          question: q.text,
          answer: answers[q.id] || "No answer provided."
      }));
      
      const res = await analyzeTrainingAnswers(session.topic, qaPairs, language);
      if (res) {
          setAnalysis(res);
          setStep(3);
      }
      setLoading(false);
  };

  const handleRestart = () => {
      setStep(1);
      setDirection('');
      setSession(null);
      setAnswers({});
      setAnalysis(null);
  };

  const radarData = analysis ? [
      { subject: 'Logic', A: analysis.score, fullMark: 100 },
      { subject: 'Feasibility', A: Math.max(20, analysis.score - 10), fullMark: 100 }, // Mock variation
      { subject: 'Innovation', A: Math.min(100, analysis.score + 5), fullMark: 100 },
      { subject: 'Rigor', A: analysis.score, fullMark: 100 },
      { subject: 'Clarity', A: Math.max(30, analysis.score - 5), fullMark: 100 },
  ] : [];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       {/* Header */}
       <div className="flex-shrink-0 mb-8">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Dumbbell className="text-indigo-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       {/* Main Content */}
       <div className="flex-grow overflow-y-auto custom-scrollbar relative">
           
           {/* Step 1: Direction Input */}
           {step === 1 && (
               <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
                   <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-10 text-center">
                       <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                           <BookOpen size={32} className="text-indigo-600" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">{t.step1.label}</h3>
                       <input 
                          type="text" 
                          value={direction}
                          onChange={(e) => setDirection(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                          className="w-full text-lg p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 mb-6 text-center"
                          placeholder={t.step1.placeholder}
                       />
                       <button 
                          onClick={handleStart}
                          disabled={!direction.trim() || loading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-full transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 mx-auto disabled:opacity-50 transform hover:scale-105"
                       >
                          {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                          {loading ? t.loading.generating : t.step1.btn}
                       </button>
                   </div>
               </div>
           )}

           {/* Step 2: Defense Q&A */}
           {step === 2 && session && (
               <div className="max-w-3xl mx-auto pb-10 animate-slideInRight">
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 mb-8 text-center">
                       <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block mb-2">{t.step2.topic}</span>
                       <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 font-serif leading-snug">{session.topic}</h3>
                   </div>
                   
                   <p className="text-center text-slate-500 dark:text-slate-400 mb-8 italic">{t.step2.instruction}</p>

                   <div className="space-y-8">
                       {session.questions.map((q, idx) => (
                           <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                               <div className="flex items-start gap-3 mb-4">
                                   <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{idx + 1}</div>
                                   <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{q.text}</h4>
                               </div>
                               <textarea 
                                  value={answers[q.id] || ''}
                                  onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                                  placeholder="Type your answer here..."
                                  className="w-full h-32 p-4 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 dark:bg-slate-900"
                               />
                           </div>
                       ))}
                   </div>

                   <div className="mt-10 text-center">
                       <button 
                          onClick={handleSubmitDefense}
                          disabled={loading || Object.keys(answers).length < session.questions.length}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-12 rounded-full transition-all shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          {loading ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
                          {loading ? t.loading.analyzing : t.step2.submitBtn}
                       </button>
                   </div>
               </div>
           )}

           {/* Step 3: Analysis Report */}
           {step === 3 && analysis && (
               <div className="max-w-5xl mx-auto pb-10 animate-fadeIn">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       {/* Left: Score & Radar */}
                       <div className="lg:col-span-5 flex flex-col gap-6">
                           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                               <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t.step3.score}</h4>
                               <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-6">{analysis.score}</div>
                               <div className="h-64 w-full">
                                   <ResponsiveContainer width="100%" height="100%">
                                       <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                           <PolarGrid />
                                           <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                           <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                           <Radar name="Capability" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                                       </RadarChart>
                                   </ResponsiveContainer>
                               </div>
                           </div>
                       </div>

                       {/* Right: Feedback Details */}
                       <div className="lg:col-span-7 flex flex-col gap-6">
                           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                               <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                   <PenTool className="text-blue-500" /> {t.step3.feedback}
                               </h4>
                               <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                   {analysis.feedback}
                               </p>
                           </div>

                           <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 p-6">
                               <h4 className="text-lg font-bold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                                   <ShieldAlert size={20} /> {t.step3.weaknesses}
                               </h4>
                               <ul className="space-y-2">
                                   {analysis.weaknesses.map((w, i) => (
                                       <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-200">
                                           <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                                           {w}
                                       </li>
                                   ))}
                               </ul>
                           </div>

                           <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 p-6">
                               <h4 className="text-lg font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                                   <CheckCircle2 size={20} /> {t.step3.suggestions}
                               </h4>
                               <ul className="space-y-2">
                                   {analysis.suggestions.map((s, i) => (
                                       <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-200">
                                           <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                                           {s}
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       </div>
                   </div>

                   <div className="mt-10 text-center">
                       <button 
                          onClick={handleRestart}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-8 rounded-full transition-colors flex items-center justify-center gap-2 mx-auto"
                       >
                          <RefreshCw size={16} /> {t.step3.restart}
                       </button>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};

export default ResearchTraining;
