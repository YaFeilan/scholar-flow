
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Minimize2, Sparkles, Heart, Loader2, ArrowRight, Maximize2 } from 'lucide-react';
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
              setExpression('focused');
              break;
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
      // Default to the first motivational message more often to match screenshot vibe
      const randomTip = Math.random() > 0.6 ? (language === 'ZH' ? "科研不易，但你很棒！🌟" : "Research is hard, but you're great! 🌟") : allTips[Math.floor(Math.random() * allTips.length)];
      setMessage(randomTip);
    };
    // Initialize immediately
    if (!message) updateMessage();
    
    const interval = setInterval(updateMessage, 10000); 
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

  // Improved Character SVG based on prompt
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
        <linearGradient id="purpleHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333EA" /> 
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* --- BACK HAIR (Bun & Flow) --- */}
      <circle cx="50" cy="50" r="25" fill="#7E22CE" stroke="#581C87" strokeWidth="2" /> {/* Left Bun */}
      <circle cx="150" cy="50" r="25" fill="#7E22CE" stroke="#581C87" strokeWidth="2" /> {/* Right Bun */}
      {/* Hair Sticks */}
      <line x1="20" y1="70" x2="60" y2="40" stroke="#E9D5FF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="20" cy="70" r="4" fill="#C084FC" />
      <line x1="180" y1="70" x2="140" y2="40" stroke="#E9D5FF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="180" cy="70" r="4" fill="#C084FC" />

      {/* --- BODY (Purple Outfit) --- */}
      <g transform="translate(0, 10)">
          {/* Dress Base */}
          <path d="M60,140 L50,210 C50,210 150,210 150,210 L140,140 Z" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="2"/>
          {/* Frilly Collar */}
          <path d="M65,140 Q80,155 100,145 Q120,155 135,140" fill="#E9D5FF" stroke="#C084FC" strokeWidth="2" />
          {/* Bow Tie */}
          <path d="M90,155 L80,165 L90,175 L100,165 Z" fill="#7C3AED" />
          <path d="M110,155 L120,165 L110,175 L100,165 Z" fill="#7C3AED" />
          <circle cx="100" cy="165" r="5" fill="#6D28D9" />
          {/* Sleeves */}
          <path d="M50,150 Q40,170 55,185" fill="#A78BFA" stroke="#8B5CF6" strokeWidth="2" />
          <path d="M150,150 Q160,170 145,185" fill="#A78BFA" stroke="#8B5CF6" strokeWidth="2" />
      </g>

      {/* --- HEAD --- */}
      <g>
          {/* Face */}
          <path d="M60,90 C60,50 140,50 140,90 C140,130 120,145 100,145 C80,145 60,130 60,90" fill="#FFF1F2" />
          {/* Blush */}
          <ellipse cx="75" cy="110" rx="6" ry="4" fill="#FDA4AF" opacity="0.5" />
          <ellipse cx="125" cy="110" rx="6" ry="4" fill="#FDA4AF" opacity="0.5" />
      </g>

      {/* --- HAIR BANGS --- */}
      <path d="M60,90 C60,60 100,50 140,90" fill="none" stroke="#7E22CE" strokeWidth="0" /> 
      <path d="M60,85 Q80,50 100,60 Q120,50 140,85 Q140,110 135,120 Q120,80 100,90 Q80,80 65,120 Q60,110 60,85" fill="url(#purpleHairGrad)" />

      {/* --- EYES --- */}
      <g transform="translate(0, 5)">
          {expression !== 'wink' ? (
              <>
                  <g transform="translate(75, 95)">
                      <ellipse cx="0" cy="0" rx="7" ry="9" fill="#4C1D95" />
                      <circle cx="-2" cy="-3" r="3" fill="white" />
                      <path d="M-7,-5 Q0,-9 7,-5" fill="none" stroke="#4C1D95" strokeWidth="1.5" />
                  </g>
                  <g transform="translate(125, 95)">
                      <ellipse cx="0" cy="0" rx="7" ry="9" fill="#4C1D95" />
                      <circle cx="-2" cy="-3" r="3" fill="white" />
                      <path d="M-7,-5 Q0,-9 7,-5" fill="none" stroke="#4C1D95" strokeWidth="1.5" />
                  </g>
              </>
          ) : (
              <>
                  <g transform="translate(75, 95)">
                      <ellipse cx="0" cy="0" rx="7" ry="9" fill="#4C1D95" />
                      <circle cx="-2" cy="-3" r="3" fill="white" />
                  </g>
                  <path d="M118,95 Q125,90 132,95" fill="none" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" />
              </>
          )}
      </g>

      {/* --- MOUTH --- */}
      <path d="M96,125 Q100,128 104,125" fill="none" stroke="#9F1239" strokeWidth="1.5" strokeLinecap="round" />

      {/* --- MOON PROP --- */}
      <g transform="translate(100, 175) scale(0.8)">
          <path d="M-20,0 A20,20 0 1,1 20,0 A15,15 0 1,0 -20,0 Z" fill="url(#moonGrad)" stroke="#3B82F6" strokeWidth="1" filter="url(#softGlow)" transform="rotate(-30)" />
      </g>
      
      {/* --- HANDS HOLDING MOON --- */}
      <circle cx="85" cy="175" r="6" fill="#FFF1F2" />
      <circle cx="115" cy="175" r="6" fill="#FFF1F2" />

      {/* --- EMOTES --- */}
      {expression === 'thinking' && (
          <g className="animate-bounce" style={{animationDuration: '2s'}}>
              <text x="150" y="60" fontSize="24" fill="#F59E0B">?</text>
          </g>
      )}
      {expression === 'focused' && (
          <g transform="translate(100, 85) scale(0.8)">
               <circle cx="-25" cy="10" r="12" fill="none" stroke="#1E293B" strokeWidth="2" opacity="0.5"/>
               <circle cx="25" cy="10" r="12" fill="none" stroke="#1E293B" strokeWidth="2" opacity="0.5"/>
               <line x1="-13" y1="10" x2="13" y2="10" stroke="#1E293B" strokeWidth="2" opacity="0.5"/>
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
        {/* Chat Window / Notification Bubble */}
        <div className={`mb-4 pointer-events-auto transition-all duration-300 transform origin-bottom-right 
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
                <div 
                   className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 max-w-[260px] relative animate-fadeIn mb-2 cursor-pointer hover:-translate-y-1 transition-transform group"
                   onClick={toggleChat}
                >
                    {/* Close/Minimize Button - Matching screenshot X/Arrows circle style */}
                    <button 
                       onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                       className="absolute -top-3 -right-3 bg-white dark:bg-slate-700 text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300 rounded-full p-1.5 shadow-sm border border-slate-100 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Maximize2 size={12} className="rotate-45" /> {/* Use rotate to simulate X-like expand/collapse icon */}
                    </button>

                    <div className="text-slate-800 dark:text-slate-100 text-base font-medium mb-4 leading-relaxed tracking-wide">
                        {message || (language === 'ZH' ? "科研不易，但你很棒！🌟" : "Research is hard, but you're doing great! 🌟")}
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50">
                            <MessageCircle size={16} />
                            <span>{language === 'ZH' ? '点击对话' : 'Click to Chat'}</span>
                        </div>
                        <div className="p-2">
                            <Heart size={24} className="text-pink-400 fill-pink-400 drop-shadow-sm" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Character */}
        <div 
           className="w-36 h-36 pointer-events-auto cursor-pointer hover:scale-105 transition-transform relative mr-4"
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
