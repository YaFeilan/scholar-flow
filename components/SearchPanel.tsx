
import React, { useState, useMemo } from 'react';
import { Search, Filter, Bookmark, ArrowUpDown, X, FileText, Download, Sparkles, Loader2 } from 'lucide-react';
import { SearchFilters, Paper, Language } from '../types';
import { MOCK_PAPERS } from '../constants';
import { TRANSLATIONS } from '../translations';
import ReactMarkdown from 'react-markdown';
import { generatePaperInterpretation } from '../services/geminiService';

interface SearchPanelProps {
  onReviewRequest: (papers: Paper[]) => void;
  language: Language;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onReviewRequest, language }) => {
  const t = TRANSLATIONS[language].search;
  const appName = TRANSLATIONS[language].appName;
  const [query, setQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SearchFilters>({
    databases: ['Google Scholar', 'SCI'],
    timeRange: 'Last 3 Years',
    partition: ['Q1', 'Q2'],
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'if'>('relevance');
  const [isGenerating, setIsGenerating] = useState(false);

  // Detail Modal State
  const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);

  const togglePaperSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedPapers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPapers(newSelected);
  };

  const handlePaperClick = (paper: Paper) => {
    setViewingPaper(paper);
    setInterpretation(null); // Reset previous interpretation
  };

  const closePaperModal = () => {
    setViewingPaper(null);
    setInterpretation(null);
  };

  const handleInterpret = async () => {
    if (!viewingPaper) return;
    setIsInterpreting(true);
    const result = await generatePaperInterpretation(viewingPaper, language);
    setInterpretation(result);
    setIsInterpreting(false);
  };

  const handleDownload = () => {
    alert("Downloading PDF... (Simulation)");
  };

  const handleGenerateReview = async () => {
    if (selectedPapers.size === 0) return;
    setIsGenerating(true);
    const papersToReview = MOCK_PAPERS.filter(p => selectedPapers.has(p.id));
    await onReviewRequest(papersToReview);
    setIsGenerating(false);
  };

  // Sort Papers Logic
  const sortedPapers = useMemo(() => {
    const papers = [...MOCK_PAPERS];
    return papers.sort((a, b) => {
      if (sortBy === 'date') {
        return b.year - a.year;
      }
      if (sortBy === 'if') {
        const getIf = (p: Paper) => p.badges.find(badge => badge.if)?.if || 0;
        return getIf(b) - getIf(a);
      }
      return 0; // relevance (original order)
    });
  }, [sortBy]);

  const FilterButton: React.FC<{ active: boolean; label: string; onClick?: () => void }> = ({ active, label, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
        active 
        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );

  const dbOptions = [
    { id: 'Google Scholar', label: language === 'ZH' ? '谷歌学术' : 'Google Scholar' },
    { id: 'Sci-Hub', label: 'Sci-Hub' },
    { id: 'SCI', label: 'SCI' },
    { id: 'SSCI', label: 'SSCI' },
    { id: 'EI', label: 'EI' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Search Bar Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-2xl font-serif font-bold text-center text-slate-800 mb-2">{t.title}</h2>
        <p className="text-center text-slate-500 mb-6 text-sm">{t.subtitle}</p>
        
        <div className="flex gap-0 mb-6 max-w-4xl mx-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-l-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-base"
              placeholder={t.placeholder}
            />
          </div>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-r-lg hover:bg-blue-700 font-medium flex items-center transition-colors">
            <Search className="mr-2 h-5 w-5" />
            {t.btn}
          </button>
        </div>

        {/* Filters Grid */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Databases */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.filters.db}</label>
            <div className="flex flex-wrap gap-2">
              {dbOptions.map(opt => (
                <FilterButton 
                  key={opt.id} 
                  label={opt.label} 
                  active={filters.databases.includes(opt.id)} 
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      databases: prev.databases.includes(opt.id) ? prev.databases.filter(d => d !== opt.id) : [...prev.databases, opt.id]
                    }));
                  }}
                />
              ))}
            </div>
          </div>

          {/* Time Range - Expanded */}
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.filters.time}</label>
            <div className="flex flex-wrap gap-2">
              {['Last 1 Year', 'Last 3 Years', 'Last 5 Years'].map(range => (
                <FilterButton 
                  key={range} 
                  label={range.replace('Last ', '')} 
                  active={filters.timeRange === range}
                  onClick={() => setFilters({...filters, timeRange: range})}
                />
              ))}
              <input 
                  type="text" 
                  placeholder={t.filters.custom + (language === 'ZH' ? ' (如 2022-2024)' : ' (e.g. 2022-2024)')}
                  className={`px-3 py-1.5 text-sm rounded-md border bg-white text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[150px] ${
                    !filters.timeRange.startsWith('Last') && filters.timeRange ? 'border-blue-500 ring-1 ring-blue-500 text-blue-700' : 'border-slate-200'
                  }`}
                  onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
                  value={!filters.timeRange.startsWith('Last') ? filters.timeRange : ''}
               />
            </div>
          </div>

          {/* Partition */}
           <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.filters.partition}</label>
            <div className="flex gap-2">
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                <FilterButton 
                  key={q} 
                  label={q} 
                  active={filters.partition.includes(q)} 
                  onClick={() => {
                     setFilters(prev => ({
                      ...prev,
                      partition: prev.partition.includes(q) ? prev.partition.filter(p => p !== q) : [...prev.partition, q]
                    }));
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Results List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2">
             <div className="flex gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded">
                   <ArrowUpDown size={14} className="text-slate-400" />
                   <span className="font-medium text-xs uppercase tracking-wide text-slate-500 mr-1">{t.sort.label}:</span>
                   <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                   >
                      <option value="relevance">{t.sort.relevance}</option>
                      <option value="date">{t.sort.date}</option>
                      <option value="if">{t.sort.if}</option>
                   </select>
                </div>
                <button className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">
                   <Bookmark size={14} className="mr-2"/> Saved
                </button>
             </div>
             <span className="text-sm text-slate-500">{sortedPapers.length} {t.results}</span>
          </div>

          {sortedPapers.map((paper) => (
            <div key={paper.id} 
                 className={`bg-white p-5 rounded-lg border shadow-sm transition-all hover:shadow-md ${selectedPapers.has(paper.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 mb-1">
                   {paper.badges.map((b, idx) => (
                     <span key={idx} className={`text-xs px-1.5 py-0.5 rounded font-semibold ${b.type === 'SCI' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                       {b.type} {b.if && `IF: ${b.if}`}
                     </span>
                   ))}
                </div>
                {/* Selection Checkbox */}
                 <div 
                   onClick={(e) => togglePaperSelection(e, paper.id)}
                   className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${selectedPapers.has(paper.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 hover:border-blue-400'}`}
                 >
                    {selectedPapers.has(paper.id) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                 </div>
              </div>
              <h3 
                className="text-lg font-bold text-slate-800 mb-1 hover:text-blue-600 leading-tight cursor-pointer"
                onClick={() => handlePaperClick(paper)}
              >
                {paper.title}
              </h3>
              <p className="text-sm text-slate-600 mb-3">{paper.authors.join(', ')}</p>
              <div className="flex items-center text-xs text-slate-500 gap-4">
                 <span className="italic">{paper.journal}</span>
                 <span className="flex items-center">📅 {paper.year}</span>
                 <span className="flex items-center">❝ {paper.citations} Cited</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Smart Review Card */}
          <div className="bg-gradient-to-br from-secondary to-purple-800 rounded-xl p-6 text-white shadow-lg sticky top-24">
            <div className="flex items-center gap-2 mb-2 opacity-90">
               <span className="p-1 bg-white/20 rounded">✨</span>
               <span className="text-xs font-bold tracking-wider uppercase">{appName}</span>
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2">{t.smartReview}</h3>
            <p className="text-purple-100 text-sm mb-6 opacity-90">{t.smartReviewDesc}</p>
            
            <div className="bg-black/20 rounded-lg p-3 mb-4 flex justify-between items-center">
              <span className="text-sm font-medium">Selected Papers</span>
              <span className="bg-white text-purple-900 font-bold px-2 py-0.5 rounded text-sm">{selectedPapers.size}</span>
            </div>
             <div className="w-full bg-white/30 h-1.5 rounded-full mb-6">
                <div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.min((selectedPapers.size / 5) * 100, 100)}%` }}></div>
             </div>

            <button 
              onClick={handleGenerateReview}
              disabled={isGenerating || selectedPapers.size === 0}
              className="w-full bg-white text-purple-700 font-bold py-3 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isGenerating ? 'Generating...' : t.generateBtn}
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">{t.topicAnalysis}</h4>
             <div className="flex justify-between items-end mb-6">
                <span className="text-slate-600">Avg. Impact Factor</span>
                <span className="text-2xl font-bold text-slate-800">10.4</span>
             </div>
             <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">{t.topJournals}</p>
                <div className="flex flex-wrap gap-2">
                   <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">Pattern Recognition</span>
                   <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">IEEE Transactions on Neural...</span>
                   <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">J. Biomedical Informatics</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Paper Details Modal */}
      {viewingPaper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closePaperModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
               <div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif leading-tight mb-2 pr-8">{viewingPaper.title}</h3>
                  <p className="text-sm text-slate-600">{viewingPaper.authors.join(', ')}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">{viewingPaper.journal} • {viewingPaper.year}</p>
               </div>
               <button onClick={closePaperModal} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full border border-slate-200">
                  <X size={20} />
               </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <FileText size={18} className="text-blue-500"/> Abstract
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed text-justify">
                      {viewingPaper.abstract || "No abstract available for this paper."}
                    </p>
                  </div>
                  
                  {/* Interpretation Result Area */}
                  {(isInterpreting || interpretation) && (
                     <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                           <Sparkles size={18} className="text-indigo-600"/> {t.interpretationResult}
                        </h4>
                        {isInterpreting ? (
                           <div className="flex items-center gap-2 text-indigo-600">
                              <Loader2 className="animate-spin" size={20} />
                              <span className="font-medium text-sm">{t.interpreting}</span>
                           </div>
                        ) : (
                           <div className="prose prose-sm prose-indigo max-w-none">
                              <ReactMarkdown>{interpretation || ''}</ReactMarkdown>
                           </div>
                        )}
                     </div>
                  )}
               </div>

               <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Actions</h4>
                     <button 
                       onClick={handleDownload}
                       className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-colors mb-3 text-sm"
                     >
                        <Download size={16} /> {t.download}
                     </button>
                     <button 
                       onClick={handleInterpret}
                       className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-sm"
                     >
                        <Sparkles size={16} /> {t.interpret}
                     </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Metrics</h4>
                     <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Citations</span>
                        <span className="font-bold">{viewingPaper.citations}</span>
                     </div>
                     <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Impact Factor</span>
                        <span className="font-bold">{viewingPaper.badges.find(b => b.if)?.if || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Partition</span>
                        <span className="font-bold bg-blue-100 text-blue-700 px-1.5 rounded text-xs flex items-center">
                           {viewingPaper.badges.find(b => b.partition)?.partition || viewingPaper.badges.find(b => b.type.startsWith('Q'))?.type || 'N/A'}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
