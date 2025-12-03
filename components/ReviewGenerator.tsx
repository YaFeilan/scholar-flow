
import React, { useState } from 'react';
import { generateStructuredReview } from '../services/geminiService';
import { FileText, Search, CheckSquare, Settings, Download, ChevronRight, ChevronLeft, FileBadge, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MOCK_PAPERS } from '../constants';
import { Paper, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface ReviewGeneratorProps {
  language: Language;
}

const ReviewGenerator: React.FC<ReviewGeneratorProps> = ({ language: globalLanguage }) => {
  const t = TRANSLATIONS[globalLanguage].review;
  // Wizard State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Criteria
  const [topic, setTopic] = useState('');
  const [databases, setDatabases] = useState<string[]>(['SCI']);
  const [timeRange, setTimeRange] = useState('Last 3 Years');

  // Step 2: Selection
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());

  // Step 3: Config
  const [wordCount, setWordCount] = useState(1000);
  const [outputLanguage, setOutputLanguage] = useState<'ZH' | 'EN'>('ZH'); // Independent output language

  // Step 4: Result
  const [reviewContent, setReviewContent] = useState<string | null>(null);

  // Handlers
  const handleDatabaseToggle = (db: string) => {
    setDatabases(prev => prev.includes(db) ? prev.filter(d => d !== db) : [...prev, db]);
  };

  const handleSearch = () => {
    if (!topic) return;
    setLoading(true);
    setTimeout(() => {
      setSearchResults(MOCK_PAPERS);
      setSelectedPaperIds(new Set(MOCK_PAPERS.map(p => p.id))); // Default select all
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const togglePaper = (id: string) => {
    const next = new Set(selectedPaperIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPaperIds(next);
  };

  const handleGenerate = async () => {
    setStep(4);
    setLoading(true);
    const selectedPapers = searchResults.filter(p => selectedPaperIds.has(p.id));
    const paperDescriptions = selectedPapers.map(p => `${p.title} (${p.year}) - ${p.abstract?.substring(0, 100)}...`);
    
    // Pass outputLanguage to service, which dictates content language
    const result = await generateStructuredReview(topic, paperDescriptions, wordCount, outputLanguage);
    setReviewContent(result);
    setLoading(false);
  };

  const handleDownload = (format: 'Word' | 'PDF') => {
    const element = document.createElement("a");
    const file = new Blob([reviewContent || ''], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Literature_Review_${format}.${format === 'Word' ? 'doc' : 'pdf'}`;
    document.body.appendChild(element);
    element.click();
  };

  const dbOptions = [
    { id: 'Google Scholar', label: globalLanguage === 'ZH' ? '谷歌学术' : 'Google Scholar' },
    { id: 'Sci-Hub', label: 'Sci-Hub' },
    { id: 'SCI', label: 'SCI' },
    { id: 'SSCI', label: 'SSCI' },
    { id: 'EI', label: 'EI' },
  ];

  // Render Helpers
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8 w-full max-w-4xl mx-auto">
      {[
        { num: 1, label: t.steps[1], icon: Search },
        { num: 2, label: t.steps[2], icon: CheckSquare },
        { num: 3, label: t.steps[3], icon: Settings },
        { num: 4, label: t.steps[4], icon: FileText },
      ].map((s, idx) => (
        <div key={s.num} className="flex items-center">
           <div className={`flex flex-col items-center relative z-10 ${step === s.num ? 'text-blue-600' : step > s.num ? 'text-green-600' : 'text-slate-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 bg-white transition-all
                  ${step === s.num ? 'border-blue-600 ring-4 ring-blue-50' : step > s.num ? 'border-green-600 bg-green-50' : 'border-slate-200'}
              `}>
                  <s.icon size={18} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{s.label}</span>
           </div>
           {idx < 3 && (
             <div className={`w-16 h-0.5 mx-2 mb-6 ${step > s.num ? 'bg-green-500' : 'bg-slate-200'}`} />
           )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <StepIndicator />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
        {/* Step 1: Search Strategy */}
        {step === 1 && (
          <div className="p-8 max-w-2xl mx-auto w-full flex-grow flex flex-col justify-center">
             <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6 text-center">{t.scopeTitle}</h2>
             
             <div className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">{t.topicLabel}</label>
                   <input 
                      type="text" 
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Artificial Intelligence in Climate Change Modeling"
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">{t.dbLabel}</label>
                   <div className="flex flex-wrap gap-3">
                      {dbOptions.map(opt => (
                        <button 
                           key={opt.id}
                           onClick={() => handleDatabaseToggle(opt.id)}
                           className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                             databases.includes(opt.id) 
                             ? 'bg-blue-600 text-white border-blue-600' 
                             : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                           }`}
                        >
                           {opt.label}
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">{t.timeLabel}</label>
                   <div className="grid grid-cols-3 gap-3">
                      {['Last 1 Year', 'Last 3 Years', 'Last 5 Years'].map(range => (
                        <button 
                           key={range}
                           onClick={() => setTimeRange(range)}
                           className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                             timeRange === range
                             ? 'bg-blue-50 text-blue-700 border-blue-500' 
                             : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                           }`}
                        >
                           {range}
                        </button>
                      ))}
                   </div>
                </div>

                <button 
                   onClick={handleSearch}
                   disabled={!topic || loading}
                   className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-all flex justify-center items-center mt-4 disabled:opacity-50"
                >
                   {loading ? <Loader2 className="animate-spin" /> : t.searchBtn}
                </button>
             </div>
          </div>
        )}

        {/* Step 2: Selection */}
        {step === 2 && (
          <div className="flex flex-col h-full">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                   <h3 className="font-bold text-slate-800">{t.selectTitle}</h3>
                   <p className="text-sm text-slate-500">Found {searchResults.length} relevant papers for "{topic}" ({timeRange})</p>
                </div>
                <div className="flex gap-2 text-sm text-slate-600">
                   <span>Selected: <span className="font-bold text-blue-600">{selectedPaperIds.size}</span></span>
                </div>
             </div>
             
             <div className="flex-grow p-6 overflow-y-auto max-h-[500px] space-y-3">
                {searchResults.map(paper => (
                   <div 
                     key={paper.id}
                     onClick={() => togglePaper(paper.id)}
                     className={`p-4 rounded-lg border cursor-pointer transition-all flex gap-4 ${
                        selectedPaperIds.has(paper.id) 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-white border-slate-200 hover:border-blue-300'
                     }`}
                   >
                      <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                         selectedPaperIds.has(paper.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                      }`}>
                         {selectedPaperIds.has(paper.id) && <CheckSquare size={14} className="text-white" />}
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm mb-1">{paper.title}</h4>
                         <p className="text-xs text-slate-500 mb-2">{paper.authors.join(', ')} • {paper.journal} • {paper.year}</p>
                         <div className="flex gap-2">
                            {paper.badges.map((b, i) => (
                               <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{b.type} {b.if && `IF:${b.if}`}</span>
                            ))}
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             <div className="p-4 border-t border-slate-100 flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Back</button>
                <button 
                  onClick={() => setStep(3)} 
                  disabled={selectedPaperIds.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                   Next Step <ChevronRight size={16} />
                </button>
             </div>
          </div>
        )}

        {/* Step 3: Configuration */}
        {step === 3 && (
          <div className="p-8 max-w-2xl mx-auto w-full flex-grow flex flex-col justify-center">
             <h2 className="text-2xl font-serif font-bold text-slate-800 mb-8 text-center">{t.configTitle}</h2>
             
             <div className="space-y-8">
                <div>
                   <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold text-slate-700">{t.wordCount}</label>
                      <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{wordCount}</span>
                   </div>
                   <input
                      type="range"
                      min="500"
                      max="4000"
                      step="500"
                      value={wordCount}
                      onChange={(e) => setWordCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                   />
                   <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                      <span>500</span>
                      <span>1500</span>
                      <span>2500</span>
                      <span>3500</span>
                      <span>4000</span>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-4">{t.langLabel}</label>
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setOutputLanguage('ZH')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                           outputLanguage === 'ZH' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                         <span className="text-2xl">🇨🇳</span>
                         <span className="font-bold text-sm">Simplified Chinese</span>
                      </button>
                      <button 
                        onClick={() => setOutputLanguage('EN')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                           outputLanguage === 'EN' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                         <span className="text-2xl">🇺🇸</span>
                         <span className="font-bold text-sm">Academic English</span>
                      </button>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setStep(2)} className="flex-1 px-6 py-3.5 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">Back</button>
                   <button 
                      onClick={handleGenerate}
                      className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2"
                   >
                      {t.genBtn} <FileText size={18} />
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <div className="flex flex-col h-full min-h-[600px]">
             {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-500">
                   <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                   <p className="text-lg font-medium text-slate-800">Synthesizing Literature...</p>
                   <p className="text-sm max-w-md text-center mt-2">Analyzing {selectedPaperIds.size} papers, extracting methodologies, and structuring the {wordCount}-word review in {outputLanguage === 'ZH' ? 'Chinese' : 'English'}.</p>
                </div>
             ) : (
                <>
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className="bg-green-100 p-1.5 rounded text-green-700"><CheckSquare size={16} /></div>
                         <span className="font-bold text-slate-700">{t.complete}</span>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => handleDownload('Word')}
                           className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-blue-700 rounded-md hover:bg-blue-50 text-sm font-medium"
                         >
                            <FileBadge size={14} /> Word (.docx)
                         </button>
                         <button 
                           onClick={() => handleDownload('PDF')}
                           className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                         >
                            <Download size={14} /> PDF
                         </button>
                      </div>
                   </div>
                   <div className="flex-grow p-8 overflow-y-auto prose prose-slate max-w-none prose-headings:font-serif">
                      <ReactMarkdown>{reviewContent || ''}</ReactMarkdown>
                   </div>
                   <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-start">
                      <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
                         <ChevronLeft size={14} /> Start New Review
                      </button>
                   </div>
                </>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ReviewGenerator;
