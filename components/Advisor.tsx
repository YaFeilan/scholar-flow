import React, { useState, useMemo } from 'react';
import { User, BookOpen, Send, Loader2, Award, AlertTriangle, TrendingUp, TrendingDown, Minus, Copy, CheckCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateAdvisorReport } from '../services/geminiService';
import { Language, AdvisorReport } from '../types';
import { TRANSLATIONS } from '../translations';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface AdvisorProps {
  language: Language;
}

const Advisor: React.FC<AdvisorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].advisor;
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [journal, setJournal] = useState('');
  const [reviewFocus, setReviewFocus] = useState(''); // New State
  const [currentReport, setCurrentReport] = useState<AdvisorReport | null>(null);
  const [history, setHistory] = useState<AdvisorReport[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!title || !journal) return;
    setLoading(true);
    
    // Store current report to history if it exists before generating new one
    if (currentReport) {
        setHistory(prev => [currentReport, ...prev]);
    }
    setCurrentReport(null);

    const result = await generateAdvisorReport(title, journal, abstract, language, reviewFocus);
    if (result) {
        setCurrentReport(result);
    }
    setLoading(false);
  };

  const handleApplyTitle = (newTitle: string) => {
      setTitle(newTitle.replace(/^"|"$/g, '')); // Remove quotes if present
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
  };

  // Radar Data Transformation
  const radarData = useMemo(() => {
    if (!currentReport || !currentReport.radar) return [];
    const r = currentReport.radar;
    // Defensive check to ensure we don't access properties of undefined
    return [
      { subject: t.radar?.topic || 'Topic', A: r.topic || 0, fullMark: 100 },
      { subject: t.radar?.method || 'Method', A: r.method || 0, fullMark: 100 },
      { subject: t.radar?.novelty || 'Novelty', A: r.novelty || 0, fullMark: 100 },
      { subject: t.radar?.scope || 'Scope', A: r.scope || 0, fullMark: 100 },
      { subject: t.radar?.style || 'Style', A: r.style || 0, fullMark: 100 },
    ];
  }, [currentReport, t]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <User size={20} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-800">{t.title}</h2>
            </div>
            <p className="text-slate-500 text-sm">{t.subtitle}</p>
          </div>
          {currentReport && (
             <div className="flex gap-4 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase text-slate-400">Match Level</span>
                    <span className={`px-2 py-1 rounded ${
                        currentReport.matchLevel === 'High' ? 'bg-green-100 text-green-700' : 
                        currentReport.matchLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{currentReport.matchLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase text-slate-400">Score</span>
                    <span className="bg-slate-900 text-white px-3 py-1 rounded">{currentReport.matchScore}/100</span>
                </div>
             </div>
          )}
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Panel: Inputs & History */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-grow overflow-y-auto">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" />
              Submission Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.paperTitle}</label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A Novel Hierarchical Attention Network..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.paperAbstract} (Optional)</label>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder={t.abstractPlaceholder}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.journalTitle}</label>
                <input
                  type="text"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="e.g. Nature Communications"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* New Review Focus Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.focusLabel || 'Review Focus (Optional)'}</label>
                <textarea
                  value={reviewFocus}
                  onChange={(e) => setReviewFocus(e.target.value)}
                  placeholder={t.focusPlaceholder || 'e.g. Focus on methodological novelty...'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20 text-sm leading-relaxed"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !title || !journal}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-100"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {t.btn}
              </button>
            </div>

            {/* History Sidebar */}
            {history.length > 0 && (
                <div className="mt-8 border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock size={12} /> {t.history}
                    </h4>
                    <div className="space-y-2">
                        {history.map((h, i) => (
                            <div key={h.timestamp} onClick={() => setCurrentReport(h)} className="bg-slate-50 p-2 rounded border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${h.matchLevel === 'High' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{h.matchScore} pts</span>
                                    <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-xs text-slate-600 truncate opacity-70">
                                   Ver {history.length - i}: {h.analysis.substring(0, 30)}...
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          {currentReport ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-grow overflow-y-auto p-6 animate-fadeIn">
                
                {/* Top Row: Radar & Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Radar Chart */}
                    <div className="h-64 w-full relative">
                        <div className="absolute top-0 left-0 text-xs font-bold text-slate-400 uppercase">Match Dimensions</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar name="Score" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Analysis Text */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-blue-900 mb-2">AI Analysis</h4>
                            <p className="text-sm text-blue-800 leading-relaxed">{currentReport.analysis}</p>
                        </div>
                        
                        {/* Keyword Trends */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Keyword Trends (3 Years)</h4>
                            <div className="flex flex-wrap gap-2">
                                {Array.isArray(currentReport.keywords) && currentReport.keywords.map((kw, i) => (
                                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium">
                                        {kw.term}
                                        {kw.trend === 'Rising' && <TrendingUp size={12} className="text-green-500" />}
                                        {kw.trend === 'Falling' && <TrendingDown size={12} className="text-red-500" />}
                                        {kw.trend === 'Stable' && <Minus size={12} className="text-slate-400" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Title & Risks */}
                    <div className="space-y-6">
                        {/* Title Optimization */}
                        <div>
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-lg">
                                Title Optimization
                            </h4>
                            <div className="space-y-3">
                                {Array.isArray(currentReport.titleSuggestions) && currentReport.titleSuggestions.map((sug, i) => (
                                    <div key={i} className="bg-slate-50 rounded-lg border border-slate-200 p-3 hover:border-blue-300 transition-colors group">
                                        <div className="text-xs text-red-500 mb-1 font-medium">{sug.issue}</div>
                                        <div className="font-bold text-slate-800 text-sm mb-2 leading-snug">"{sug.revised}"</div>
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => copyToClipboard(sug.revised)}
                                                className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                                            >
                                                <Copy size={12} /> Copy
                                            </button>
                                            <button 
                                                onClick={() => handleApplyTitle(sug.revised)}
                                                className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded flex items-center gap-1 hover:bg-blue-700"
                                            >
                                                <CheckCircle size={12} /> {t.apply}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Assessment */}
                        <div>
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-lg">
                                <AlertTriangle className="text-amber-500" size={18} /> {t.risks}
                            </h4>
                            <div className="space-y-2">
                                {Array.isArray(currentReport.riskAssessment) && currentReport.riskAssessment.map((risk, i) => (
                                    <div key={i} className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
                                        risk.severity === 'High' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                                    }`}>
                                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="font-bold text-xs uppercase opacity-70 block mb-0.5">{risk.severity} Risk</span>
                                            {risk.risk}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Improvement & Alternatives */}
                    <div className="space-y-6">
                        {/* Specific Improvements */}
                        <div>
                             <h4 className="font-bold text-slate-800 mb-3 text-lg">Content Suggestions</h4>
                             <div className="space-y-3">
                                {Array.isArray(currentReport.improvementSuggestions) && currentReport.improvementSuggestions.map((imp, i) => (
                                    <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 border-b border-slate-200">
                                            {imp.content}
                                        </div>
                                        <div className="p-3 text-sm text-green-700 bg-green-50/30 italic">
                                            "{imp.example}"
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* Alternative Journals */}
                        {Array.isArray(currentReport.alternatives) && currentReport.alternatives.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 text-lg">{t.alternatives}</h4>
                                <div className="space-y-2">
                                    {currentReport.alternatives.map((alt, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{alt.name}</div>
                                                <div className="text-xs text-slate-500">{alt.reason}</div>
                                            </div>
                                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">IF: {alt.impactFactor}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* References */}
                         <div>
                             <h4 className="font-bold text-slate-800 mb-3 text-lg">Relevant References</h4>
                             <div className="bg-slate-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {Array.isArray(currentReport.references) && currentReport.references.map((ref, i) => (
                                    <div key={i} className="text-xs text-slate-600 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                        <span className="font-bold">{ref.title}</span> ({ref.year}) - {ref.author}
                                    </div>
                                ))}
                             </div>
                             <button 
                                onClick={() => {
                                    const bib = Array.isArray(currentReport.references) ? currentReport.references.map(r => `@article{ref${r.year}, title={${r.title}}, author={${r.author}}, year={${r.year}}}`).join('\n') : '';
                                    copyToClipboard(bib);
                                }}
                                className="w-full mt-2 text-xs font-bold text-slate-500 hover:text-blue-600 py-1 border border-slate-200 rounded hover:bg-slate-50"
                             >
                                Copy BibTeX
                             </button>
                         </div>
                    </div>
                </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-8 text-center">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                 <BookOpen className="text-slate-300" size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-400 mb-2">No Analysis Yet</h3>
               <p className="text-slate-400 text-sm max-w-xs">Enter your paper details and abstract on the left to receive a comprehensive matching report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Advisor;