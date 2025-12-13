
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, ShieldAlert, Network, Lightbulb, Send, Loader2, BarChart2, CheckCircle2, AlertTriangle, Play, RefreshCw, Zap, Plus, X, Users, Bot, Image as ImageIcon, Flame, Search, Check, Clock } from 'lucide-react';
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

interface PersonaConfig {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
}

const ResearchDiscussion: React.FC<ResearchDiscussionProps> = ({ language }) => {
  const t = TRANSLATIONS[language].discussion;
  
  // State
  const [topic, setTopic] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null); // New state for image
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscussionAnalysisResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Persona Management State
  const [personas, setPersonas] = useState<PersonaConfig[]>([
      { id: 'Reviewer', name: t.personas.reviewer, description: "Critical, finds loopholes, focuses on rigor.", icon: ShieldAlert, color: 'red' },
      { id: 'Interdisciplinary', name: t.personas.interdisciplinary, description: "Suggests interdisciplinary angles, helpful, expansionist.", icon: Network, color: 'blue' },
      { id: 'Mentor', name: t.personas.mentor, description: "Uses Socratic questioning, guides big picture thinking.", icon: Lightbulb, color: 'amber' },
      { id: 'Quarrel', name: language === 'ZH' ? '苛刻审稿人 (争吵模式)' : 'Harsh Reviewer (Quarrel Mode)', description: "Extreme skeptic, ruthless critic.", icon: Flame, color: 'orange' }
  ]);
  
  // Role Selection Mechanism
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<Set<string>>(new Set(['Reviewer', 'Interdisciplinary', 'Mentor']));
  const [personaSearch, setPersonaSearch] = useState('');
  const [selectionTimestamp, setSelectionTimestamp] = useState<number | null>(null);
  
  const [activePersonaId, setActivePersonaId] = useState<string>('Reviewer');
  const [showAddPersona, setShowAddPersona] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaDesc, setNewPersonaDesc] = useState('');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, result]);

  // Rotating Loading Messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      const messages = language === 'ZH' 
        ? ["导师吵架中...", "中门对狙中...", "宣武门对掏中...", "正在分析课题...", "各方观点激烈碰撞中..."]
        : ["Mentors are arguing...", "Intense debate in progress...", "Analyzing feasibility...", "Gathering perspectives..."];
      
      let index = 0;
      setLoadingMessage(messages[0]);
      
      interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading, language]);

  const handleStartDiscussion = async () => {
    if ((!topic.trim() && !imageFile) || selectedPersonaIds.size === 0) return;
    setLoading(true);
    setResult(null);
    setChatHistory([]);
    setSelectionTimestamp(Date.now()); // Record timestamp
    
    // Pass imageFile if present
    const analysis = await generateResearchDiscussion(topic, language, imageFile || undefined);
    if (analysis) {
        setResult(analysis);
    }
    setLoading(false);
  };

  const handleAddPersona = () => {
      if (newPersonaName.trim()) {
          const newId = `Custom-${Date.now()}`;
          const newP: PersonaConfig = {
              id: newId,
              name: newPersonaName,
              description: newPersonaDesc || "Expert in the field.",
              icon: Bot,
              color: 'purple'
          };
          setPersonas([...personas, newP]);
          
          // Auto-select newly added persona
          const newSet = new Set(selectedPersonaIds);
          newSet.add(newId);
          setSelectedPersonaIds(newSet);
          
          setNewPersonaName('');
          setNewPersonaDesc('');
          setShowAddPersona(false);
      }
  };

  const removePersona = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPersonas(prev => prev.filter(p => p.id !== id));
      if (activePersonaId === id) {
          const remaining = personas.filter(p => p.id !== id);
          setActivePersonaId(remaining[0]?.id || '');
      }
      const newSet = new Set(selectedPersonaIds);
      newSet.delete(id);
      setSelectedPersonaIds(newSet);
  };

  const togglePersonaSelection = (id: string) => {
      const newSet = new Set(selectedPersonaIds);
      if (newSet.has(id)) {
          newSet.delete(id);
          // If deselecting the active tab, switch to another available one
          if (activePersonaId === id && newSet.size > 0) {
              const firstAvailable = Array.from(newSet)[0];
              setActivePersonaId(firstAvailable);
          }
      } else {
          newSet.add(id);
      }
      setSelectedPersonaIds(newSet);
      setSelectionTimestamp(Date.now());
  };

  const filteredPersonas = useMemo(() => {
      return personas.filter(p => 
          p.name.toLowerCase().includes(personaSearch.toLowerCase()) || 
          (p.description && p.description.toLowerCase().includes(personaSearch.toLowerCase()))
      );
  }, [personas, personaSearch]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setImageFile(e.target.files[0]);
      }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !result) return;
    
    const userMsg = chatInput;
    setChatInput('');
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
        const activeP = personas.find(p => p.id === activePersonaId);
        
        let personaContext = activeP ? `${activeP.name} (${activeP.description})` : activePersonaId;

        // Custom intense prompt for Quarrel Mode
        if (activePersonaId === 'Quarrel') {
            personaContext = `
            ROLE: Extremely Harsh Academic Reviewer (Quarrel Mode).
            STANCE: Extreme skepticism. Fundamentally question all assumptions and methodologies.
            BEHAVIOR:
            1. Systematically attack: Theory, Experiment Design, Data Reliability, Conclusion Validity.
            2. Output at least 3 specific technical critiques per response.
            3. Use strong, provocative language (e.g., "completely untenable", "lacks rigor").
            4. NEVER compromise. Escalate criticism upon rebuttal.
            5. MANDATORY: Cite at least 2 authoritative references to back up your attacks.
            TONE: Professional but aggressive, sarcastic, fiery.
            `;
        }

        const apiHistory = newHistory.map(m => ({ role: m.role, text: m.text }));
        
        const response = await chatWithDiscussionPersona(topic, personaContext, userMsg, apiHistory, language);
        
        setChatHistory(prev => [...prev, { role: 'ai', text: response, persona: activeP?.name || activePersonaId }]);
    } catch (e) {
        console.error(e);
    }
    setChatLoading(false);
  };

  // Radar Data
  const radarData = result ? [
      { subject: t.scorecard.theory, A: Number(result.scorecard.theory) || 0, fullMark: 10 },
      { subject: t.scorecard.method, A: Number(result.scorecard.method) || 0, fullMark: 10 },
      { subject: t.scorecard.app, A: Number(result.scorecard.application) || 0, fullMark: 10 },
  ] : [];

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
                   <div className="relative">
                       <textarea 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder={t.placeholder}
                          className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-transparent"
                       />
                       {/* Image Upload Button inside textarea area */}
                       <div className="absolute bottom-3 right-3 flex items-center gap-2">
                           {imageFile && (
                               <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded flex items-center gap-1 border border-purple-200">
                                   <ImageIcon size={10} /> {imageFile.name}
                                   <button onClick={() => setImageFile(null)} className="hover:text-red-500"><X size={10}/></button>
                               </div>
                           )}
                           <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="text-slate-400 hover:text-purple-600 transition-colors"
                              title="Upload Image Context"
                           >
                               <ImageIcon size={18} />
                               <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={handleImageUpload}
                               />
                           </button>
                       </div>
                   </div>
                   
                   {/* Enhanced Role Selection Mechanism */}
                   <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                       <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={12}/> {t.participantsHeader}</span>
                               <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                   {selectedPersonaIds.size} / {personas.length}
                               </span>
                           </div>
                           <button onClick={() => setShowAddPersona(!showAddPersona)} className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                               {showAddPersona ? <X size={12} /> : <Plus size={12} />}
                               {showAddPersona ? 'Cancel' : t.addRole}
                           </button>
                       </div>
                       
                       {showAddPersona && (
                           <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg mb-3 animate-fadeIn border border-indigo-100 dark:border-indigo-800">
                               <input 
                                  className="w-full mb-2 p-2 text-xs border border-indigo-200 dark:border-indigo-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900"
                                  placeholder={language === 'ZH' ? "角色名称 (如：统计学家)" : "Role Name (e.g. Statistician)"}
                                  value={newPersonaName}
                                  onChange={e => setNewPersonaName(e.target.value)}
                               />
                               <input 
                                  className="w-full mb-2 p-2 text-xs border border-indigo-200 dark:border-indigo-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900"
                                  placeholder={language === 'ZH' ? "角色描述/侧重点" : "Role Description / Focus"}
                                  value={newPersonaDesc}
                                  onChange={e => setNewPersonaDesc(e.target.value)}
                               />
                               <button 
                                  onClick={handleAddPersona}
                                  className="w-full bg-indigo-600 text-white text-xs font-bold py-1.5 rounded hover:bg-indigo-700 transition-colors"
                               >
                                  Add & Select
                               </button>
                           </div>
                       )}

                       {/* Search & List */}
                       <div className="relative mb-2">
                           <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                           <input 
                              type="text" 
                              value={personaSearch}
                              onChange={(e) => setPersonaSearch(e.target.value)}
                              placeholder={language === 'ZH' ? "搜索角色..." : "Search roles..."}
                              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                           />
                       </div>

                       <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                           {filteredPersonas.map(p => {
                               const isSelected = selectedPersonaIds.has(p.id);
                               return (
                                   <div 
                                      key={p.id} 
                                      onClick={() => togglePersonaSelection(p.id)}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                          isSelected 
                                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' 
                                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                                      }`}
                                   >
                                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                           {isSelected && <Check size={10} className="text-white" />}
                                       </div>
                                       <div className={`p-1.5 rounded-full bg-${p.color}-100 dark:bg-${p.color}-900/50 text-${p.color}-600 dark:text-${p.color}-400`}>
                                           <p.icon size={12} />
                                       </div>
                                       <div className="flex-grow min-w-0">
                                           <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{p.name}</div>
                                           <div className="text-[10px] text-slate-400 truncate">{p.description}</div>
                                       </div>
                                       {!['Reviewer', 'Interdisciplinary', 'Mentor', 'Quarrel'].includes(p.id) && (
                                           <button onClick={(e) => removePersona(p.id, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                               <X size={12} />
                                           </button>
                                       )}
                                   </div>
                               );
                           })}
                           {filteredPersonas.length === 0 && (
                               <div className="text-center text-xs text-slate-400 py-4">No roles found.</div>
                           )}
                       </div>
                   </div>

                   <button 
                      onClick={handleStartDiscussion}
                      disabled={loading || selectedPersonaIds.size === 0 || (!topic.trim() && !imageFile)}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-indigo-100 dark:shadow-none"
                   >
                      {loading ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                      {loading ? loadingMessage : t.btn}
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
                       <MessageSquare size={64} className="mb-4 opacity-50" />
                       <p className="font-bold text-lg">Start a discussion to unlock insights.</p>
                       <p className="text-sm mt-2">Select roles and click 'Start Discussion'.</p>
                   </div>
               ) : (
                   <>
                       {/* Header Info */}
                       <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                           <span className="flex items-center gap-1 font-mono"><Clock size={10} /> Session Started: {selectionTimestamp ? new Date(selectionTimestamp).toLocaleTimeString() : ''}</span>
                           <span>Participating Roles: {selectedPersonaIds.size}</span>
                       </div>

                       {/* Persona Tabs - Filtered by Selection */}
                       <div className="flex p-2 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 gap-2 overflow-x-auto no-scrollbar">
                           {personas.filter(p => selectedPersonaIds.has(p.id)).map(p => (
                               <button
                                  key={p.id}
                                  onClick={() => setActivePersonaId(p.id)}
                                  className={`flex-1 min-w-[100px] py-3 px-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition-all
                                      ${activePersonaId === p.id 
                                          ? `bg-${p.color === 'red' ? 'red' : p.color === 'orange' ? 'orange' : 'indigo'}-600 text-white border-transparent shadow-md` 
                                          : 'bg-slate-50 dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600 hover:bg-slate-100'}
                                  `}
                               >
                                  <p.icon size={14} />
                                  <span className="truncate">{p.name}</span>
                               </button>
                           ))}
                           {selectedPersonaIds.size === 0 && (
                               <div className="w-full text-center text-xs text-red-400 py-2">No roles selected. Please select roles on the left.</div>
                           )}
                       </div>

                       {/* Chat Feed */}
                       <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
                           {/* Initial Comments as System Messages */}
                           {chatHistory.length === 0 && (
                               <div className="space-y-4">
                                   {/* Only show initial comments for active selected personas */}
                                   {selectedPersonaIds.has('Reviewer') && (
                                       <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl rounded-tl-none animate-fadeIn">
                                           <div className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><ShieldAlert size={12}/> {t.personas.reviewer} Initial Thoughts</div>
                                           <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{result.initialComments.reviewer}</p>
                                       </div>
                                   )}
                                   {selectedPersonaIds.has('Interdisciplinary') && (
                                       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl rounded-tl-none animate-fadeIn" style={{animationDelay: '100ms'}}>
                                           <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1"><Network size={12}/> {t.personas.interdisciplinary} Initial Thoughts</div>
                                           <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{result.initialComments.collaborator}</p>
                                       </div>
                                   )}
                                   {selectedPersonaIds.has('Mentor') && (
                                       <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl rounded-tl-none animate-fadeIn" style={{animationDelay: '200ms'}}>
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
                                  placeholder={`Reply to ${personas.find(p => p.id === activePersonaId)?.name || 'selected role'}...`}
                                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                               />
                               <button 
                                  onClick={handleSendMessage}
                                  disabled={!chatInput.trim() || chatLoading || selectedPersonaIds.size === 0}
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
