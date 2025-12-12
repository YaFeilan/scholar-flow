
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Minimize2, Sparkles, Heart, Loader2, ArrowRight } from 'lucide-react';
import { ViewState, Language } from '../types';
import { chatWithAssistant } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface VirtualAssistantProps {
  language: Language;
  currentView: ViewState;
}

type Expression = 'neutral' | 'happy' | 'thinking' | 'wink' | 'surprised' | 'focused';
type AnimationType = 'idle' | 'bounce' | 'scan' | 'write' | 'float';

const VirtualAssistant: React.FC<VirtualAssistantProps> = ({ language, currentView }) => {
  const [expression, setExpression] = useState<Expression>('neutral');
  const [animation, setAnimation] = useState<AnimationType>('idle');
  const [message, setMessage] = useState('');
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tips Database
  const tips: Record<string, string[]> = {
    general: language === 'ZH' 
      ? ["科研不易，但你很棒！🌟", "喝口水休息一下吧！💧", "深呼吸，放松一下！✨", "记得保存你的进度哦！💾", "我在为你加油！😤"]
      : ["Research is hard, but you're great! 🌟", "Hydrate! 💧", "Deep breath, relax! ✨", "Don't forget to save! 💾", "Cheering for you! 😤"],
    SEARCH: language === 'ZH' 
      ? ["左侧可以筛选【加入时间】哦。", "试试筛选 CJR 分区查看高水平期刊。", "上传图片可以一键生成论文全文。"]
      : ["Filter by 'Date Added' on the left.", "Try CJR partition filters.", "Upload images to generate full text."],
    TRENDS: language === 'ZH'
      ? ["点击热点词可以查看相关论文。", "切换到'图谱'视图看关联。", "有些冷门方向可能是蓝海哦！"]
      : ["Click keywords to drill down.", "Try 'Graph' view.", "Niche topics might be opportunities!"],
    POLISH: language === 'ZH'
      ? ["试着切换'学术'语气。", "对比模式可以看出修改细节。", "你可以跟AI对话微调结果。"]
      : ["Try 'Academic' tone.", "Use Diff view to see changes.", "Chat with AI to refine."],
  };

  // Determine appearance based on view
  useEffect(() => {
      setExpression('neutral');
      setAnimation('float');

      switch(currentView) {
          case ViewState.SEARCH:
          case ViewState.PDF_CHAT:
              setExpression('focused');
              break;
          case ViewState.IDEA_GUIDE:
          case ViewState.TRENDS:
              setExpression('thinking');
              break;
          case ViewState.POLISH:
          case ViewState.GRANT_APPLICATION:
              setExpression('neutral');
              setAnimation('write');
              break;
          default:
              setAnimation('float');
      }
  }, [currentView]);

  // Message cycle
  useEffect(() => {
    if (isChatOpen || isMinimized) return;
    const updateMessage = () => {
      const contextTips = tips[currentView] || tips.general;
      const allTips = [...contextTips, ...tips.general];
      const randomTip = Math.random() > 0.7 ? tips.general[0] : allTips[Math.floor(Math.random() * allTips.length)];
      setMessage(randomTip);
    };
    updateMessage();
    const interval = setInterval(updateMessage, 8000); 
    return () => clearInterval(interval);
  }, [currentView, language, isMinimized, isChatOpen]);

  useEffect(() => {
      if (isChatOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handleChatSubmit = async () => {
      if (!chatInput.trim()) return;
      const userMsg = chatInput;
      setChatInput('');
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setLoading(true);
      setExpression('thinking');

      const response = await chatWithAssistant(userMsg, currentView, language, messages);
      
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setLoading(false);
      setExpression('happy');
      setTimeout(() => setExpression('neutral'), 3000);
  };

  const toggleChat = () => {
      if (isMinimized) setIsMinimized(false);
      else {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen && messages.length === 0) {
              const greeting = language === 'ZH' ? '你好！我是你的专属科研助手。' : 'Hi there! I am your research assistant.';
              setMessages([{ role: 'ai', text: greeting }]);
          }
      }
  };

  // Improved Character SVG: Natural, Cute, Professional
  const CharacterSVG = () => (
    <svg 
      viewBox="0 0 200 220" 
      className={`w-full h-full drop-shadow-xl transition-transform duration-700
        ${animation === 'bounce' ? 'animate-bounce-short' : ''}
        ${animation === 'float' ? 'animate-float' : ''}
      `}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5E3C" /> {/* Warm Brown */}
          <stop offset="100%" stopColor="#5D4037" /> {/* Darker Brown */}
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* --- BACK HAIR (Long Natural Flow) --- */}
      <path d="M60,80 C40,120 30,180 40,200 C50,210 150,210 160,200 C170,180 160,120 140,80" fill="#5D4037" />

      {/* --- BODY (Professional Coat) --- */}
      <g transform="translate(0, 10)">
          <path d="M70,140 L60,210 C60,210 140,210 140,210 L130,140 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1"/>
          {/* Collar */}
          <path d="M70,140 L90,160 L90,210" fill="none" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M130,140 L110,160 L110,210" fill="none" stroke="#CBD5E1" strokeWidth="2" />
          {/* Inner Shirt */}
          <path d="M90,140 L100,155 L110,140" fill="#E0F2FE" />
          <circle cx="100" cy="150" r="2" fill="#0EA5E9" />
      </g>

      {/* --- HEAD --- */}
      <g>
          {/* Face Shape - Softer */}
          <path d="M60,90 C60,50 140,50 140,90 C140,130 120,145 100,145 C80,145 60,130 60,90" fill="#FFF1F2" />
          {/* Blush - Subtle */}
          <ellipse cx="70" cy="105" rx="5" ry="3" fill="#FDA4AF" opacity="0.4" />
          <ellipse cx="130" cy="105" rx="5" ry="3" fill="#FDA4AF" opacity="0.4" />
      </g>

      {/* --- EYES (Simpler, Friendly) --- */}
      <g transform="translate(0, 2)">
          {expression !== 'wink' && expression !== 'happy' && (
              <>
                  {/* Left */}
                  <g transform="translate(75, 95)">
                      <ellipse cx="0" cy="0" rx="6" ry="8" fill="#334155" />
                      <circle cx="-2" cy="-3" r="2.5" fill="white" />
                      <path d="M-6,-4 Q-3,-8 6,-4" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.8"/>
                  </g>
                  {/* Right */}
                  <g transform="translate(125, 95)">
                      <ellipse cx="0" cy="0" rx="6" ry="8" fill="#334155" />
                      <circle cx="-2" cy="-3" r="2.5" fill="white" />
                      <path d="M-6,-4 Q-3,-8 6,-4" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.8"/>
                  </g>
              </>
          )}
          {expression === 'happy' && (
              <>
                  <path d="M68,95 Q75,90 82,95" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M118,95 Q125,90 132,95" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              </>
          )}
          
          {/* Glasses (Optional based on state) */}
          {(expression === 'focused' || animation === 'scan') && (
              <g opacity="0.9">
                  <circle cx="75" cy="95" r="11" fill="rgba(255,255,255,0.1)" stroke="#1E293B" strokeWidth="1" />
                  <circle cx="125" cy="95" r="11" fill="rgba(255,255,255,0.1)" stroke="#1E293B" strokeWidth="1" />
                  <line x1="86" y1="95" x2="114" y2="95" stroke="#1E293B" strokeWidth="1" />
              </g>
          )}
      </g>

      {/* --- FRONT HAIR (Natural Bangs) --- */}
      <g>
          <path d="M60,90 C60,60 80,50 100,50 C120,50 140,60 140,90" fill="none" /> 
          <path d="M60,90 C50,55 90,40 100,60 C110,40 150,55 140,90 L135,85 Q120,60 100,70 Q80,60 65,85 Z" fill="url(#hairGrad)" />
          {/* Hair Clip */}
          <rect x="125" y="65" width="10" height="3" rx="1" fill="#3B82F6" transform="rotate(10 130 66)" />
      </g>

      {/* --- MOUTH --- */}
      <path d="M96,120 Q100,123 104,120" fill="none" stroke="#9F1239" strokeWidth="1.5" strokeLinecap="round" />

      {/* --- ARMS (Subtle) --- */}
      {animation === 'write' ? (
          <g className="animate-write-hand">
             <path d="M130,160 L120,180" stroke="#F8FAFC" strokeWidth="8" strokeLinecap="round" />
             <line x1="120" y1="180" x2="115" y2="190" stroke="#334155" strokeWidth="2" /> {/* Pen */}
          </g>
      ) : (
          <g>
             <path d="M70,160 Q65,180 80,185" fill="none" stroke="#F8FAFC" strokeWidth="8" strokeLinecap="round" />
             <path d="M130,160 Q135,180 120,185" fill="none" stroke="#F8FAFC" strokeWidth="8" strokeLinecap="round" />
          </g>
      )}

      {/* --- EMOTES --- */}
      {expression === 'thinking' && (
          <g className="animate-bounce" style={{animationDuration: '2s'}}>
              <text x="150" y="60" fontSize="20" fill="#F59E0B">?</text>
          </g>
      )}
    </svg>
  );

  if (isMinimized) {
      return (
          <div className="fixed bottom-6 right-6 z-50 animate-fadeIn" title="Open Assistant">
              <button 
                onClick={() => setIsMinimized(false)}
                className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg border-2 border-blue-100 dark:border-blue-900 flex items-center justify-center hover:scale-110 transition-transform overflow-hidden relative group"
              >
                  <div className="absolute inset-0 p-1.5 group-hover:p-1 transition-all">
                      <CharacterSVG />
                  </div>
              </button>
          </div>
      );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        {/* Chat Window */}
        <div className={`mb-2 pointer-events-auto transition-all duration-300 transform origin-bottom-right 
            ${isChatOpen ? 'scale-100 opacity-100' : isMinimized ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        >
            {isChatOpen ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900 w-[320px] h-[450px] flex flex-col animate-slideUp overflow-hidden">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-blue-50 dark:bg-slate-900 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-600" />
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Research Assistant</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Minimize2 size={14} /></button>
                            <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 rounded"><X size={14} /></button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none'
                                }`}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl rounded-bl-none shadow-sm border border-slate-200 dark:border-slate-700">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div className="relative">
                            <input 
                               type="text" 
                               value={chatInput}
                               onChange={(e) => setChatInput(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                               placeholder={language === 'ZH' ? "问点什么..." : "Ask me anything..."}
                               className="w-full pl-3 pr-10 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <button 
                               onClick={handleChatSubmit}
                               disabled={!chatInput.trim() || loading}
                               className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-[240px] relative animate-fadeIn mb-2 cursor-pointer hover:scale-105 transition-transform" onClick={toggleChat}>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                       className="absolute -top-2 -right-2 bg-white text-slate-300 hover:text-slate-500 rounded-full p-0.5 border border-slate-100 shadow-sm"
                    >
                        <Minimize2 size={10} />
                    </button>
                    <div className="text-slate-800 dark:text-slate-200 text-sm font-medium mb-3 leading-relaxed">
                        {message || (language === 'ZH' ? "科研不易，但你很棒！🌟" : "Research is hard, but you're doing great! 🌟")}
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-colors hover:bg-blue-100">
                            <MessageCircle size={12} />
                            <span>{language === 'ZH' ? '点击对话' : 'Click to Chat'}</span>
                        </div>
                        <Heart size={16} className="text-pink-400 fill-pink-400" />
                    </div>
                </div>
            )}
        </div>

        {/* Character */}
        <div 
           className="w-32 h-32 pointer-events-auto cursor-pointer hover:scale-105 transition-transform relative"
           onClick={() => { setAnimation('bounce'); setTimeout(() => setAnimation('idle'), 500); toggleChat(); }}
           onMouseEnter={() => setExpression('happy')}
           onMouseLeave={() => setExpression('neutral')}
        >
            <CharacterSVG />
        </div>
        
        <style>{`
            @keyframes bounce-short {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            .animate-bounce-short {
                animation: bounce-short 0.4s ease-in-out;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
            }
            .animate-float {
                animation: float 4s ease-in-out infinite;
            }
            @keyframes write-hand {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(-1px, 1px) rotate(-3deg); }
                75% { transform: translate(1px, -1px) rotate(3deg); }
            }
            .animate-write-hand {
                animation: write-hand 0.5s ease-in-out infinite;
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-slideUp {
                animation: slideUp 0.3s ease-out;
            }
        `}</style>
    </div>
  );
};

export default VirtualAssistant;
