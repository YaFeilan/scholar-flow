
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Terminal, Play, Code, Bug, BookOpen, Loader2, Copy, Check, Paperclip, X, StopCircle, RefreshCw, Send, Plus, History, Trash2, ArrowRight } from 'lucide-react';
import { Language, CodeSession, CodeMessage } from '../types';
import { TRANSLATIONS } from '../translations';
import { performCodeAssistance } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface CodeAssistantProps {
  language: Language;
}

const CodeAssistant: React.FC<CodeAssistantProps> = ({ language }) => {
  const t = TRANSLATIONS[language].code;
  
  // State
  const [sessions, setSessions] = useState<CodeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Current Task State
  const [mode, setMode] = useState<'generate' | 'debug' | 'explain'>('generate');
  const [langSelect, setLangSelect] = useState<'Python' | 'R' | 'MATLAB'>('Python');
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Chat/Output State
  const [streamingContent, setStreamingContent] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);

  // Initialize new session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
        createNewSession();
    } else if (!currentSessionId) {
        setCurrentSessionId(sessions[0].id);
    }
  }, [sessions]);

  // Scroll to bottom on new messages
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, streamingContent]);

  const createNewSession = () => {
      const newSession: CodeSession = {
          id: Date.now().toString(),
          title: `${t.newSession} ${sessions.length + 1}`,
          messages: [],
          lastModified: Date.now(),
          language: langSelect
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setInput('');
      setFile(null);
      setStreamingContent('');
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
          setCurrentSessionId(null);
      }
  };

  const updateSessionMessages = (id: string, newMessages: CodeMessage[]) => {
      setSessions(prev => prev.map(s => {
          if (s.id === id) {
              return { ...s, messages: newMessages, lastModified: Date.now() };
          }
          return s;
      }));
  };

  const handleRun = async (isFollowUp: boolean = false) => {
    const textToSend = isFollowUp ? followUpInput : input;
    if (!textToSend.trim() && !file) return;

    if (!currentSessionId) return;

    // Create a user message
    const userMsg: CodeMessage = {
        role: 'user',
        text: textToSend,
        timestamp: Date.now(),
        attachments: file ? [{ name: file.name, type: file.type }] : undefined
    };

    const updatedMessages = [...(currentSession?.messages || []), userMsg];
    updateSessionMessages(currentSessionId, updatedMessages);
    
    // Clear inputs
    if (isFollowUp) setFollowUpInput('');
    // Note: We might want to keep the main input context for 'Debug' mode, but usually clearing is expected in chat flow
    // For 'Debug' we often want to keep the code there. Let's stick to clearing for now as it moves to history.
    if (!isFollowUp) setInput(''); 

    setLoading(true);
    setStreamingContent('');

    const ac = new AbortController();
    setAbortController(ac);

    // Convert internal message format to history format for service
    const historyForService = updatedMessages.map(m => ({ role: m.role, text: m.text }));
    // Remove the last one as it is the current prompt (service handles prompt separate usually, or we can include it)
    // The service signature expects 'history' and 'input'. 
    // We will pass the history excluding the *current* prompt, and pass current prompt as input.
    const historyPayload = historyForService.slice(0, -1); 

    try {
        await performCodeAssistance(
            textToSend, 
            isFollowUp ? 'generate' : mode, // Follow ups are usually generation/chat
            langSelect, 
            language, 
            historyPayload, 
            file || undefined,
            (partial) => {
                setStreamingContent(partial);
            },
            ac.signal
        );

        // On complete
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                // Determine final content - we need to fetch the final state of streamingContent
                // However, inside this async callback, state might be stale.
                // Best to rely on the functional update or the final result.
                // Actually performCodeAssistance returns the full text.
                return s; 
            }
            return s;
        }));
    } catch (e) {
        console.error(e);
    }
    
    // Since performCodeAssistance returns the full text, we capture it via the state effect or directly if we awaited the result. 
    // But `performCodeAssistance` updates via callback. The return value is final text.
    // Let's grab the final text from the state setter in a clean way? 
    // Easier: performCodeAssistance returns Promise<string>.
    
    // Re-call with result
    setAbortController(null);
    setLoading(false);
  };

  // Wrapper to handle the promise result correctly
  const executeRun = async (isFollowUp: boolean) => {
      const textToSend = isFollowUp ? followUpInput : input;
      if (!textToSend.trim() && !file) return;
      if (!currentSessionId) return;

      const userMsg: CodeMessage = {
        role: 'user',
        text: textToSend,
        timestamp: Date.now(),
        attachments: file ? [{ name: file.name, type: file.type }] : undefined
      };

      const prevMessages = currentSession?.messages || [];
      updateSessionMessages(currentSessionId, [...prevMessages, userMsg]);
      
      if (isFollowUp) setFollowUpInput('');
      else setInput('');
      if (file && !isFollowUp) setFile(null); // Clear file after sending

      setLoading(true);
      setStreamingContent('');
      
      const ac = new AbortController();
      setAbortController(ac);

      const historyPayload = prevMessages.map(m => ({ role: m.role, text: m.text }));

      const finalText = await performCodeAssistance(
          textToSend,
          isFollowUp ? 'generate' : mode,
          langSelect,
          language,
          historyPayload,
          file || undefined,
          (partial) => setStreamingContent(partial),
          ac.signal
      );

      // Add Model Message
      const modelMsg: CodeMessage = {
          role: 'model',
          text: finalText,
          timestamp: Date.now()
      };
      
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
            return { ...s, messages: [...s.messages, modelMsg] };
        }
        return s;
      }));

      setStreamingContent('');
      setLoading(false);
      setAbortController(null);
  };

  const handleStop = () => {
      if (abortController) {
          abortController.abort();
          setAbortController(null);
          setLoading(false);
          // Save what we have so far
          if (streamingContent && currentSessionId) {
              const modelMsg: CodeMessage = {
                  role: 'model',
                  text: streamingContent + "\n\n*[Generation stopped by user]*",
                  timestamp: Date.now()
              };
              setSessions(prev => prev.map(s => {
                  if (s.id === currentSessionId) {
                      return { ...s, messages: [...s.messages, modelMsg] };
                  }
                  return s;
              }));
              setStreamingContent('');
          }
      }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Line numbers generation
  const lineNumbers = useMemo(() => {
      const lines = input.split('\n').length;
      return Array.from({ length: Math.max(10, lines) }, (_, i) => i + 1);
  }, [input]);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Sidebar: History */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
         <div className="p-4 border-b border-slate-200">
             <button 
                onClick={createNewSession}
                className="w-full bg-slate-900 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-slate-800 transition-colors"
             >
                 <Plus size={16} /> {t.newSession}
             </button>
         </div>
         <div className="flex-grow overflow-y-auto p-2 space-y-1">
             <div className="text-xs font-bold text-slate-400 uppercase px-2 py-2 flex items-center gap-2">
                 <History size={12} /> {t.history}
             </div>
             {sessions.map(session => (
                 <div 
                    key={session.id}
                    onClick={() => setCurrentSessionId(session.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                        currentSessionId === session.id ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                 >
                     <span className="truncate flex-grow pr-2">{session.messages.length > 0 ? session.messages[0].text.substring(0, 20) + '...' : session.title}</span>
                     <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                         <Trash2 size={14} />
                     </button>
                 </div>
             ))}
         </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left: Input & Config */}
          <div className="lg:col-span-5 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-200 space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <Terminal className="text-emerald-600" />
                    <h2 className="text-lg font-bold text-slate-800">{t.title}</h2>
                 </div>
                 
                 {/* Mode & Lang */}
                 <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-100 p-1 rounded-lg flex">
                         {['generate', 'debug', 'explain'].map((m) => (
                             <button
                                key={m}
                                onClick={() => setMode(m as any)}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex justify-center items-center gap-1 ${mode === m ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                             >
                                {m === 'generate' && <Code size={12} />}
                                {m === 'debug' && <Bug size={12} />}
                                {m === 'explain' && <BookOpen size={12} />}
                                {m === 'generate' ? 'Gen' : m}
                             </button>
                         ))}
                     </div>
                     <select 
                        value={langSelect}
                        onChange={(e) => setLangSelect(e.target.value as any)}
                        className="bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-700 px-2 cursor-pointer focus:ring-2 focus:ring-emerald-500"
                     >
                        <option value="Python">Python</option>
                        <option value="R">R</option>
                        <option value="MATLAB">MATLAB</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="C++">C++</option>
                     </select>
                 </div>
             </div>

             {/* Editor Area */}
             <div className="flex-grow flex flex-col overflow-hidden relative bg-slate-50">
                <div className="flex-grow flex relative">
                    {/* Line Numbers (only relevant if input has content or debug mode) */}
                    {(mode === 'debug' || mode === 'explain' || input.split('\n').length > 1) && (
                        <div className="w-8 flex-shrink-0 bg-slate-100 border-r border-slate-200 text-[10px] text-slate-400 font-mono text-right py-4 pr-1 select-none overflow-hidden">
                            {lineNumbers.map(n => <div key={n} className="leading-6 h-6">{n}</div>)}
                        </div>
                    )}
                    
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.inputPlaceholder[mode]}
                        className="flex-grow bg-transparent border-none resize-none p-4 text-sm font-mono text-slate-700 leading-6 outline-none placeholder-slate-400"
                        spellCheck={false}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                executeRun(false);
                            }
                        }}
                    />
                </div>

                {/* File Upload & Actions */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        {file && (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100">
                                <Paperclip size={12} /> {file.name}
                                <button onClick={() => setFile(null)} className="hover:text-emerald-900"><X size={12} /></button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                            title={t.upload}
                        >
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                            <Paperclip size={18} />
                        </button>
                        
                        {loading ? (
                             <button 
                                onClick={handleStop}
                                className="flex-grow bg-red-50 text-red-600 font-bold py-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                             >
                                <StopCircle size={18} /> {t.stopBtn}
                             </button>
                        ) : (
                             <button 
                                onClick={() => executeRun(false)}
                                disabled={!input.trim() && !file}
                                className="flex-grow bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                             >
                                <Play size={18} /> {t.btn}
                             </button>
                        )}
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-slate-400 font-mono">{t.shortcut}</span>
                    </div>
                </div>
             </div>
          </div>

          {/* Right: Chat Output */}
          <div className="lg:col-span-7 bg-slate-50 flex flex-col overflow-hidden relative">
              <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 {!currentSession || currentSession.messages.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                         <Terminal size={64} className="mb-4" />
                         <p className="text-lg font-bold">Code Assistant Ready</p>
                         <p className="text-sm">Select a mode and start coding.</p>
                     </div>
                 ) : (
                     <>
                        {currentSession.messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-white border border-slate-200' : 'bg-slate-900 text-slate-100'}`}>
                                    {msg.role === 'user' && (
                                        <div className="text-xs font-bold text-slate-400 mb-1 uppercase">You</div>
                                    )}
                                    {msg.attachments && (
                                        <div className="mb-2 inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                                            <Paperclip size={10} /> {msg.attachments[0].name}
                                        </div>
                                    )}
                                    <div className={`prose prose-sm ${msg.role === 'model' ? 'prose-invert' : 'prose-slate'} max-w-none`}>
                                        <ReactMarkdown
                                            components={{
                                                code({className, children, ...props}: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return match ? (
                                                    <div className="rounded-md overflow-hidden my-2 border border-slate-700/50">
                                                        <div className="bg-black/30 px-3 py-1 text-[10px] text-slate-400 font-mono flex justify-between items-center">
                                                            <span>{match[1]}</span>
                                                            <button 
                                                                onClick={() => handleCopy(String(children))} 
                                                                className="hover:text-white"
                                                            >
                                                                <Copy size={10} />
                                                            </button>
                                                        </div>
                                                        <pre className="p-3 !bg-slate-950 !m-0 overflow-x-auto text-xs">
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                                }
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && streamingContent && (
                            <div className="flex justify-start">
                                <div className="max-w-[90%] rounded-xl p-4 shadow-sm bg-slate-900 text-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-xs text-emerald-400 font-mono">
                                        <Loader2 size={12} className="animate-spin" /> Generating...
                                    </div>
                                    <div className="prose prose-sm prose-invert max-w-none">
                                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                     </>
                 )}
              </div>

              {/* Follow-up Input */}
              <div className="p-4 bg-white border-t border-slate-200">
                  <div className="relative">
                      <input 
                        type="text" 
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        placeholder={t.followUpPlaceholder}
                        onKeyDown={(e) => e.key === 'Enter' && executeRun(true)}
                        disabled={loading}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      />
                      <button 
                         onClick={() => executeRun(true)}
                         disabled={loading || !followUpInput.trim()}
                         className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                         {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      </button>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default CodeAssistant;
