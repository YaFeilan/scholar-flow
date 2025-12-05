

import React, { useState, useEffect } from 'react';
import { Lightbulb, Send, Loader2, BookOpen, Target, ArrowRight, MessageCircle, ChevronDown, Key } from 'lucide-react';
import { generateResearchIdeas, generateIdeaFollowUp } from '../services/geminiService';
import { Language, IdeaGuideResult, IdeaFollowUpResult } from '../types';
import { TRANSLATIONS } from '../translations';

interface IdeaGuideProps {
  language: Language;
  initialTopic?: string;
  onClearInitialTopic?: () => void;
}

const IdeaGuide: React.FC<IdeaGuideProps> = ({ language, initialTopic, onClearInitialTopic }) => {
  const t = TRANSLATIONS[language].idea;
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdeaGuideResult | null>(null);

  // Deep Dive State
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState<number | null>(null);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<IdeaFollowUpResult | null>(null);

  // Auto-trigger when initialTopic is provided
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      const autoGenerate = async () => {
        setLoading(true);
        setResult(null);
        setSelectedDirectionIndex(null);
        setFollowUpResult(null);
        const data = await generateResearchIdeas(initialTopic, language);
        setResult(data);
        setLoading(false);
        if (onClearInitialTopic) {
          onClearInitialTopic();
        }
      };
      autoGenerate();
    }
  }, [initialTopic, language]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setSelectedDirectionIndex(null); // Reset deep dive
    setFollowUpResult(null);
    const data = await generateResearchIdeas(topic, language);
    setResult(data);
    setLoading(false);
  };

  const handleSelectDirection = (index: number) => {
    if (selectedDirectionIndex === index) {
      setSelectedDirectionIndex(null); // Deselect
    } else {
      setSelectedDirectionIndex(index);
      setFollowUpQuery('');
      setFollowUpResult(null);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!result || selectedDirectionIndex === null || !followUpQuery.trim()) return;
    
    setFollowUpLoading(true);
    const direction = result.directions[selectedDirectionIndex];
    const data = await generateIdeaFollowUp(topic, direction.angle, followUpQuery, language);
    setFollowUpResult(data);
    setFollowUpLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 mb-8 border border-amber-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-6">
           <div className="flex items-center gap-3">
              <div className="bg-amber-400 p-2 rounded-lg text-white shadow-lg shadow-amber-200">
                <Lightbulb size={24} />
              </div>
              <h2 className="text-3xl font-serif font-bold text-amber-900 whitespace-nowrap">{t.title}</h2>
           </div>
           <p className="text-amber-800/70 max-w-2xl pb-1.5">{t.subtitle}</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-12">
           <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 flex items-start gap-2">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.placeholder}
                className="flex-grow bg-transparent border-none text-lg px-4 py-3 focus:ring-0 outline-none resize-none h-20 placeholder-slate-400 text-slate-700"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !topic}
                className="bg-amber-500 text-white px-8 rounded-lg font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 h-20 flex-shrink-0"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}
                <span className="text-sm whitespace-nowrap">{t.btn}</span>
              </button>
           </div>
        </div>

        {/* Results */}
        {loading && (
           <div className="lg:col-span-12 text-center py-20">
              <div className="relative inline-block">
                 <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lightbulb size={20} className="text-amber-500" />
                 </div>
              </div>
              <p className="text-amber-600 font-bold mt-4 animate-pulse">{t.generating}</p>
           </div>
        )}

        {result && (
           <>
              {/* Research Directions */}
              <div className="lg:col-span-8 space-y-6">
                 <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                    <Target className="text-blue-600" /> {t.directions}
                 </h3>
                 
                 <div className="grid grid-cols-1 gap-6">
                    {result.directions.map((dir, idx) => {
                       const isSelected = selectedDirectionIndex === idx;
                       const isDimmed = selectedDirectionIndex !== null && !isSelected;

                       return (
                          <div 
                            key={idx} 
                            className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden
                              ${isSelected ? 'border-amber-500 shadow-md ring-1 ring-amber-100' : 'border-slate-200 shadow-sm hover:shadow-md'}
                              ${isDimmed ? 'opacity-60 scale-95' : 'opacity-100'}
                            `}
                          >
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                 <h4 className="text-lg font-bold text-slate-800">{dir.angle}</h4>
                                 <button 
                                   onClick={() => handleSelectDirection(idx)}
                                   className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1
                                      ${isSelected 
                                        ? 'bg-amber-500 text-white border-amber-500' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}
                                   `}
                                 >
                                    {isSelected ? <ChevronDown size={14} /> : <MessageCircle size={14} />}
                                    {t.selectDirection}
                                 </button>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed mb-6">{dir.description}</p>
                              
                              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                 <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <BookOpen size={12} /> {t.titles}
                                 </h5>
                                 <ul className="space-y-2">
                                    {dir.recommendedTitles.map((title, tIdx) => (
                                       <li key={tIdx} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                                          <ArrowRight size={14} className="mt-1 text-amber-500 flex-shrink-0" />
                                          {title}
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                            </div>

                            {/* Deep Dive Section */}
                            {isSelected && (
                               <div className="bg-amber-50/50 border-t border-amber-100 p-6 animate-fadeIn">
                                  <h5 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                     <MessageCircle size={18} /> {t.followUpPlaceholder.split('...')[0]}
                                  </h5>
                                  <div className="flex gap-2 mb-6">
                                     <input 
                                       type="text" 
                                       value={followUpQuery}
                                       onChange={(e) => setFollowUpQuery(e.target.value)}
                                       className="flex-grow border border-amber-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                       placeholder={t.followUpPlaceholder}
                                       onKeyDown={(e) => e.key === 'Enter' && handleFollowUpSubmit()}
                                     />
                                     <button 
                                       onClick={handleFollowUpSubmit}
                                       disabled={followUpLoading || !followUpQuery}
                                       className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                     >
                                       {followUpLoading ? <Loader2 className="animate-spin h-4 w-4" /> : t.followUpBtn}
                                     </button>
                                  </div>

                                  {/* Deep Dive Result */}
                                  {followUpResult && (
                                     <div className="bg-white rounded-lg border border-amber-100 p-5 shadow-sm animate-fadeIn">
                                        <div className="mb-4">
                                           <h6 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">{t.deepDive}</h6>
                                           <p className="text-slate-700 text-sm leading-relaxed">{followUpResult.analysis}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                           {followUpResult.suggestions.map((sug, sIdx) => (
                                              <div key={sIdx} className="bg-slate-50 p-3 rounded border border-slate-100">
                                                 <div className="font-bold text-slate-800 text-sm mb-1">{sug.title}</div>
                                                 <div className="text-xs text-slate-500">{sug.detail}</div>
                                              </div>
                                           ))}
                                        </div>

                                        <div>
                                           <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                              <Key size={12} /> {t.keywords}
                                           </h6>
                                           <div className="flex flex-wrap gap-2">
                                              {followUpResult.recommendedTerms.map((term, kIdx) => (
                                                 <span key={kIdx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                                                    {term}
                                                 </span>
                                              ))}
                                           </div>
                                        </div>
                                     </div>
                                  )}
                               </div>
                            )}
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* Recommended Journals */}
              <div className="lg:col-span-4 space-y-6">
                 <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                    <BookOpen className="text-green-600" /> {t.journals}
                 </h3>
                 
                 <div className="space-y-4">
                    {result.journals.map((journal, idx) => (
                       <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-fadeIn" style={{animationDelay: `${idx * 150}ms`}}>
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-800 leading-tight">{journal.name}</h4>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                             <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">IF: {journal.impactFactor}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2 mt-2">
                             {journal.reason}
                          </p>
                       </div>
                    ))}
                 </div>
              </div>
           </>
        )}
      </div>
    </div>
  );
};

export default IdeaGuide;
