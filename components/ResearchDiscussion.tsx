
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ShieldAlert, Network, Lightbulb, Send, Loader2, BarChart2, CheckCircle2, AlertTriangle, Play, RefreshCw, Zap } from 'lucide-react';
import { Language, DiscussionAnalysisResult, DiscussionPersonaType } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateResearchDiscussion, chatWithDiscussionPersona } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface ResearchDiscussionProps {
  language: Language;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  persona?: DiscussionPersonaType;
}

const ResearchDiscussion: React.FC<ResearchDiscussionProps> = ({ language }) => {
  const t = TRANSLATIONS[language].discussion;
  
  // State
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscussionAnalysisResult | null>(null);
  
  // Chat State
  const [activePersona, setActivePersona] = useState<DiscussionPersonaType>('Reviewer');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, result]);

  const handleStartDiscussion = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setChatHistory([]);
    
    const analysis = await generateResearchDiscussion(topic, language);
    if (analysis) {
        setResult(analysis);
        // Initialize chat with opening statements, but don't display them as "messages" yet, just store them conceptually or show in UI cards
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !result) return;
    
    const userMsg = chatInput;
    setChatInput('');
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
        // Filter history for context relevant to this persona or global context?
        // Let's send global context for better continuity, but formatted.
        const apiHistory = newHistory.map(m => ({ role: m.role, text: m.text }));
        
        const response = await chatWithDiscussionPersona(topic, activePersona, userMsg, apiHistory, language);
        
        setChatHistory(prev => [...prev, { role: 'ai', text: response, persona: activePersona }]);
    } catch (e) {
        console.error(e);
    }
    setChatLoading(false);
  };

  // Radar Data
  const radarData = result ? [
      { subject: t.scorecard.theory, A: result.scorecard.theory, fullMark: 10 },
      { subject: t.scorecard.method, A: result.scorecard.method, fullMark: 10 },
      { subject: t.scorecard.app, A: result.scorecard.application, fullMark: 10 },
  ] : [];

  const PersonaButton = ({ type, icon: Icon, label }: { type: DiscussionPersonaType, icon: any, label: string }) => (
      <button
          onClick={() => setActivePersona(type)}
          className={`flex-1 py-3 px-4 rounded-lg border font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${activePersona === type 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}
          `}
      >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
      </button>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="text-indigo-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
           {/* Left: Input & Analysis Dashboard */}
           <div className="lg:w-5/12 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
               <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                   <textarea 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={t.placeholder}
                      className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-transparent"
                   />
                   <button 
                      onClick={handleStartDiscussion}
                      disabled={loading || !topic.trim()}
                      className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                   >
                      {loading ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                      {loading ? t.analyzing : t.btn}
                   </button>
               </div>

               {result && (
                   <div className="flex flex-col gap-6 animate-fadeIn">
                       {/* Innovation Scorecard */}
                       <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                           <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                               <BarChart2 className="text-blue-500" size={18} /> {t.scorecard.title}
                           </h3>
                           <div className="flex items-center">
                               <div className="w-1/2 h-40">
                                   <ResponsiveContainer width="100%" height="100%">
                                       <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                           <PolarGrid />
                                           <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                           <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
                                           <Radar name="Score" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                                       </RadarChart>
                                   </ResponsiveContainer>
                               </div>
                               <div className="w-1/2 text-xs space-y-2">
                                   <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded">
                                       <span className="font-bold text-slate-700 dark:text-slate-200 block">{t.scorecard.theory}: {result.scorecard.theory}/10</span>
                                       <span className="text-slate-500 dark:text-slate-400">{result.scorecard.theoryReason}</span>
                                   </div>
                                   <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded">
                                       <span className="font-bold text-slate-700 dark:text-slate-200 block">{t.scorecard.method}: {result.scorecard.method}/10</span>
                                       <span className="text-slate-500 dark:text-slate-400">{result.scorecard.methodReason}</span>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Feasibility Check */}
                       <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                           <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                               <CheckCircle2 className="text-green-500" size={18} /> {t.feasibility.title}
                           </h3>
                           <div className="space-y-3">
                               <div className="flex gap-3">
                                   <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg h-fit"><AlertTriangle size={16} className="text-blue-600" /></div>
                                   <div>
                                       <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{t.feasibility.data}</h4>
                                       <p className="text-xs text-slate-600 dark:text-slate-400">{result.feasibility.data}</p>
                                   </div>
                               </div>
                               <div className="flex gap-3">
                                   <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg h-fit"><Zap size={16} className="text-purple-600" /></div>
                                   <div>
                                       <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{t.feasibility.tech}</h4>
                                       <p className="text-xs text-slate-600 dark:text-slate-400">{result.feasibility.tech}</p>
                                   </div>
                               </div>
                               <div className="flex gap-3">
                                   <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg h-fit"><ShieldAlert size={16} className="text-amber-600" /></div>
                                   <div>
                                       <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{t.feasibility.ethics}</h4>
                                       <p className="text-xs text-slate-600 dark:text-slate-400">{result.feasibility.ethics}</p>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
           </div>

           {/* Right: Chat Interface */}
           <div className="lg:w-7/12 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
               {!result ? (
                   <div className="flex-grow flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                       <MessageSquare size={64} className="mb-4" />
                       <p className="font-bold text-lg">Start a discussion to unlock insights.</p>
                   </div>
               ) : (
                   <>
                       {/* Persona Tabs */}
                       <div className="flex p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 gap-2">
                           <PersonaButton type="Reviewer" icon={ShieldAlert} label={t.personas.reviewer} />
                           <PersonaButton type="Collaborator" icon={Network} label={t.personas.collaborator} />
                           <PersonaButton type="Mentor" icon={Lightbulb} label={t.personas.mentor} />
                       </div>

                       {/* Chat Feed */}
                       <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
                           {/* Initial Comments as System Messages */}
                           {chatHistory.length === 0 && (
                               <div className="space-y-4">
                                   {activePersona === 'Reviewer' && (
                                       <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl rounded-tl-none">
                                           <div className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><ShieldAlert size={12}/> {t.personas.reviewer} Initial Thoughts</div>
                                           <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{result.initialComments.reviewer}</p>
                                       </div>
                                   )}
                                   {activePersona === 'Collaborator' && (
                                       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl rounded-tl-none">
                                           <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1"><Network size={12}/> {t.personas.collaborator} Initial Thoughts</div>
                                           <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{result.initialComments.collaborator}</p>
                                       </div>
                                   )}
                                   {activePersona === 'Mentor' && (
                                       <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl rounded-tl-none">
                                           <div className="text-xs font-bold text-amber-600 mb-1 flex items-center gap-1"><Lightbulb size={12}/> {t.personas.mentor} Initial Thoughts</div>
                                           <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{result.initialComments.mentor}</p>
                                       </div>
                                   )}
                               </div>
                           )}

                           {chatHistory.map((msg, idx) => (
                               <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[85%] rounded-xl p-3 shadow-sm text-sm leading-relaxed 
                                       ${msg.role === 'user' 
                                           ? 'bg-indigo-600 text-white rounded-br-none' 
                                           : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-bl-none'}
                                   `}>
                                       {msg.persona && <div className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider">{msg.persona}</div>}
                                       <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{msg.text}</ReactMarkdown>
                                   </div>
                               </div>
                           ))}
                           {chatLoading && (
                               <div className="flex justify-start">
                                   <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl rounded-bl-none p-3 shadow-sm">
                                       <Loader2 size={16} className="animate-spin text-slate-400" />
                                   </div>
                               </div>
                           )}
                           <div ref={messagesEndRef} />
                       </div>

                       {/* Input Area */}
                       <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                           <div className="relative">
                               <input 
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                  placeholder={`Reply to ${activePersona}...`}
                                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                               />
                               <button 
                                  onClick={handleSendMessage}
                                  disabled={!chatInput.trim() || chatLoading}
                                  className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                               >
                                  <Send size={16} />
                               </button>
                           </div>
                       </div>
                   </>
               )}
           </div>
       </div>
    </div>
  );
};

export default ResearchDiscussion;
