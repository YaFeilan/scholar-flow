
import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Bookmark, ArrowUpDown, X, FileText, Download, Sparkles, Loader2, Globe, Cloud, FolderOpen, UploadCloud, ChevronDown } from 'lucide-react';
import { SearchFilters, Paper, Language } from '../types';
import { MOCK_PAPERS } from '../constants';
import { TRANSLATIONS } from '../translations';
import ReactMarkdown from 'react-markdown';
import { generatePaperInterpretation, searchAcademicPapers } from '../services/geminiService';

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
    timeRange: 'All Time',
    partition: ['Q1', 'Q2'],
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'if'>('relevance');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultLimit, setResultLimit] = useState(20);
  const [minCitations, setMinCitations] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  
  // Search Mode State
  const [searchSource, setSearchSource] = useState<'online' | 'local'>('online');
  const [localPapers, setLocalPapers] = useState<Paper[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search Results
  const [results, setResults] = useState<Paper[]>(MOCK_PAPERS);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
    // For local papers, we might need to pass the file content if supported
    const result = await generatePaperInterpretation(viewingPaper, language);
    setInterpretation(result);
    setIsInterpreting(false);
  };

  const handleDownload = () => {
    if (viewingPaper?.source === 'local' && viewingPaper.file) {
      // Create a URL for the local file and download it
      const url = URL.createObjectURL(viewingPaper.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = viewingPaper.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("Downloading PDF... (Simulation for Online Papers)");
    }
  };

  const handleGenerateReview = async () => {
    if (selectedPapers.size === 0) return;
    setIsGenerating(true);
    const activeList = searchSource === 'online' ? results : localPapers;
    const papersToReview = activeList.filter(p => selectedPapers.has(p.id));
    await onReviewRequest(papersToReview);
    setIsGenerating(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    
    // Perform real search via Gemini
    const foundPapers = await searchAcademicPapers(query, language, resultLimit);
    
    if (foundPapers.length > 0) {
      setResults(foundPapers);
    } else {
       // Fallback logic for demo purposes if API fails or returns nothing
       const q = query.toLowerCase();
       const fallbackMocks = MOCK_PAPERS.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.authors.some(a => a.toLowerCase().includes(q)) ||
          (p.abstract && p.abstract.toLowerCase().includes(q))
       );
       setResults(fallbackMocks);
    }
    
    setIsSearching(false);
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 100) {
        alert(language === 'ZH' ? '一次最多只能上传100篇论文。' : 'You can only upload a maximum of 100 papers at a time.');
        // Slice the first 100
        const files = Array.from(e.target.files).slice(0, 100) as File[];
        const newPapers: Paper[] = files.map((file, idx) => ({
           id: `local-${file.name}-${Date.now()}-${idx}`,
           title: file.name,
           authors: ['Local Author'],
           journal: 'Local Repository',
           year: new Date(file.lastModified).getFullYear(),
           citations: 0,
           badges: [{ type: 'LOCAL' }],
           abstract: 'Local file content not yet analyzed.',
           source: 'local',
           file: file
        }));
        setLocalPapers(prev => [...prev, ...newPapers]);
        return;
      }
      
      const newPapers: Paper[] = (Array.from(e.target.files) as File[]).map((file, idx) => ({
        id: `local-${file.name}-${Date.now()}-${idx}`,
        title: file.name,
        authors: ['Local Author'],
        journal: 'Local Repository',
        year: new Date(file.lastModified).getFullYear(),
        citations: 0,
        badges: [{ type: 'LOCAL' }],
        abstract: 'Local file content not yet analyzed.',
        source: 'local',
        file: file
      }));
      setLocalPapers(prev => [...prev, ...newPapers]);
    }
  };

  const handleBatchInterpret = async () => {
    // Placeholder for future batch functionality
    alert("Batch interpretation started for selected local files...");
  };

  // Client-side Sort & Filter of the fetched results
  const sortedPapers = useMemo(() => {
    // Switch data source based on toggle
    let papers = searchSource === 'online' ? [...results] : [...localPapers];

    // Online specific filters
    if (searchSource === 'online') {
      const currentYear = new Date().getFullYear();
      if (filters.timeRange === 'Last 1 Year') {
        papers = papers.filter(p => p.year >= currentYear - 1);
      } else if (filters.timeRange === 'Last 3 Years') {
        papers = papers.filter(p => p.year >= currentYear - 3);
      } else if (filters.timeRange === 'Last 5 Years') {
        papers = papers.filter(p => p.year >= currentYear - 5);
      } 
      
      const dbFilters = filters.databases.filter(d => ['SCI', 'SSCI', 'EI', 'CNKI'].includes(d));
      if (dbFilters.length > 0) {
        papers = papers.filter(p => {
          if (!p.badges || p.badges.length === 0) return true;
          return p.badges.some(b => dbFilters.includes(b.type));
        });
      }
    }

    // Apply specific year filter
    if (filterYear) {
      const y = parseInt(filterYear);
      if (!isNaN(y)) {
        papers = papers.filter(p => p.year === y);
      }
    }

    // Apply minimum citations filter
    if (minCitations) {
      const min = parseInt(minCitations);
      if (!isNaN(min)) {
        papers = papers.filter(p => p.citations >= min);
      }
    }

    // Sort
    return papers.sort((a, b) => {
      if (sortBy === 'date') {
        return b.year - a.year;
      }
      if (sortBy === 'if') {
        const getIf = (p: Paper) => p.badges?.find(badge => badge.if)?.if || 0;
        return getIf(b) - getIf(a);
      }
      return 0; // Relevance
    });
  }, [sortBy, results, localPapers, filters, searchSource, filterYear, minCitations]);

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
    { id: 'CNKI', label: language === 'ZH' ? '中国知网' : 'CNKI' },
    { id: 'SCI', label: 'SCI' },
    { id: 'SSCI', label: 'SSCI' },
    { id: 'EI', label: 'EI' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Search Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-2xl font-serif font-bold text-center text-slate-800 mb-2">{t.title}</h2>
        <p className="text-center text-slate-500 mb-6 text-sm">{t.subtitle}</p>
        
        {/* Source Toggle */}
        <div className="flex justify-center mb-6">
           <div className="bg-slate-100 p-1 rounded-lg inline-flex">
              <button 
                 onClick={() => setSearchSource('online')}
                 className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${searchSource === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <Cloud size={16} /> {t.source.online}
              </button>
              <button 
                 onClick={() => setSearchSource('local')}
                 className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${searchSource === 'local' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <FolderOpen size={16} /> {t.source.local}
              </button>
           </div>
        </div>
        
        {searchSource === 'online' ? (
          <>
            <div className="flex gap-0 mb-6 max-w-4xl mx-auto">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-l-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-base"
                  placeholder={t.placeholder}
                />
              </div>
              <button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-r-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="animate-spin" /> : t.btn}
              </button>
            </div>
            
            {/* Filters */}
             <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-2">
                    {dbOptions.map(opt => (
                        <FilterButton 
                            key={opt.id} 
                            active={filters.databases.includes(opt.id)} 
                            label={opt.label} 
                            onClick={() => {
                            const newDbs = filters.databases.includes(opt.id) 
                                ? filters.databases.filter(d => d !== opt.id)
                                : [...filters.databases, opt.id];
                            setFilters({...filters, databases: newDbs});
                            }}
                        />
                    ))}
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                     {/* Time Range */}
                     <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-medium">{t.filters.time}:</span>
                        <select 
                           value={filters.timeRange}
                           onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 font-bold text-sm cursor-pointer p-0"
                        >
                           <option>All Time</option>
                           <option>Last 1 Year</option>
                           <option>Last 3 Years</option>
                           <option>Last 5 Years</option>
                        </select>
                        <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
                     </div>
                     
                     {/* Specific Year Filter */}
                     <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-medium">{language === 'ZH' ? '年份' : 'Year'}:</span>
                        <input
                           type="number"
                           value={filterYear}
                           onChange={(e) => setFilterYear(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 font-bold text-sm w-16 p-0 placeholder-slate-400"
                           placeholder={language === 'ZH' ? '全部' : 'All'}
                        />
                     </div>

                     {/* Citation Count Filter */}
                     <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-medium">{language === 'ZH' ? '引用 >' : 'Cited >'}</span>
                        <input
                           type="number"
                           min="0"
                           value={minCitations}
                           onChange={(e) => setMinCitations(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 font-bold text-sm w-12 p-0 placeholder-slate-400"
                           placeholder="0"
                        />
                     </div>

                     {/* Result Limit Filter */}
                     <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-medium">{t.filters.resultCount}:</span>
                        <select 
                           value={resultLimit}
                           onChange={(e) => setResultLimit(Number(e.target.value))}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 font-bold text-sm cursor-pointer p-0"
                        >
                           {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                              <option key={val} value={val}>{val}</option>
                           ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
                     </div>
                </div>
             </div>
          </>
        ) : (
            <div 
               className="max-w-2xl mx-auto border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer relative"
               onClick={() => fileInputRef.current?.click()}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 multiple 
                 className="hidden" 
                 onChange={handleLocalUpload}
                 accept=".pdf,.doc,.docx,.txt,.md"
               />
               <UploadCloud size={48} className="mx-auto text-blue-400 mb-4" />
               <h3 className="text-lg font-bold text-slate-700">{t.upload.btn}</h3>
               <p className="text-slate-400 text-sm mt-2">{t.upload.tip}</p>
               <p className="text-xs text-slate-300 mt-4">{t.upload.drag}</p>
            </div>
        )}
      </div>

      {/* Results Area */}
      {sortedPapers.length > 0 && (
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <FileText size={20} className="text-blue-600" /> 
               {searchSource === 'online' ? t.results : t.source.local} 
               <span className="text-slate-400 text-sm font-normal">({sortedPapers.length})</span>
            </h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-slate-500">{t.sort.label}:</span>
                  <select 
                    className="text-sm border-none bg-transparent font-bold text-slate-700 focus:ring-0 cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                     <option value="relevance">{t.sort.relevance}</option>
                     <option value="date">{t.sort.date}</option>
                     <option value="if">{t.sort.if}</option>
                  </select>
               </div>
               
               {selectedPapers.size > 0 && (
                 <button 
                    onClick={handleGenerateReview}
                    disabled={isGenerating}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                 >
                    {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 text-yellow-400" />}
                    {t.generateBtn}
                 </button>
               )}
               {searchSource === 'local' && selectedPapers.size > 0 && (
                  <button 
                    onClick={handleBatchInterpret}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    {t.batchInterpret}
                  </button>
               )}
            </div>
         </div>
      )}

      {/* Papers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {sortedPapers.length === 0 && hasSearched && (
           <div className="text-center py-20 text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>No results found for "{query}". Try different keywords or filters.</p>
           </div>
        )}
        
        {sortedPapers.map(paper => (
          <div 
             key={paper.id} 
             onClick={() => handlePaperClick(paper)}
             className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md group ${selectedPapers.has(paper.id) ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200 hover:border-blue-300'}`}
          >
             <div className="flex items-start gap-4">
                <div 
                  className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedPapers.has(paper.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}
                  onClick={(e) => togglePaperSelection(e, paper.id)}
                >
                   {selectedPapers.has(paper.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                </div>
                
                <div className="flex-grow">
                   <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-slate-800 leading-tight mb-1 group-hover:text-blue-700 transition-colors">{paper.title}</h4>
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded ml-2 whitespace-nowrap">{paper.year}</span>
                   </div>
                   
                   <p className="text-sm text-slate-600 mb-2 italic">
                      {paper.authors.join(', ')} <span className="text-slate-300 mx-2">|</span> {paper.journal}
                      {paper.citations > 0 && <span className="ml-2 text-slate-400">• {paper.citations} Citations</span>}
                   </p>
                   
                   <div className="flex gap-2 flex-wrap mb-3">
                      {paper.badges.map((b, i) => (
                         <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            b.type === 'SCI' ? 'bg-green-50 text-green-700 border-green-200' :
                            b.type === 'Q1' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            b.type === 'LOCAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                         }`}>
                            {b.type} {b.partition && `(${b.partition})`} {b.if && `IF: ${b.if}`}
                         </span>
                      ))}
                   </div>
                   
                   <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {paper.abstract || "No abstract available."}
                   </p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {viewingPaper && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closePaperModal}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                  <div>
                     <h2 className="text-xl font-bold text-slate-900 leading-tight mb-2">{viewingPaper.title}</h2>
                     <p className="text-sm text-slate-500">{viewingPaper.authors.join(', ')} • {viewingPaper.year}</p>
                  </div>
                  <button onClick={closePaperModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                  <div className="flex gap-2 mb-6">
                     <button 
                        onClick={handleInterpret}
                        disabled={isInterpreting}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                     >
                        {isInterpreting ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        {t.interpret}
                     </button>
                     <button 
                        onClick={handleDownload}
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                     >
                        <Download className="h-4 w-4" />
                        {t.download}
                     </button>
                  </div>
                  
                  {interpretation && (
                     <div className="mb-6 bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                           <Sparkles size={14} className="text-purple-500" /> {t.interpretationResult}
                        </h3>
                        <div className="prose prose-sm prose-slate max-w-none">
                           <ReactMarkdown>{interpretation}</ReactMarkdown>
                        </div>
                     </div>
                  )}
                  
                  <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide opacity-50">Abstract</h3>
                  <p className="text-slate-700 leading-relaxed text-base">
                     {viewingPaper.abstract || "No abstract available for this paper."}
                  </p>
                  
                  {viewingPaper.source === 'local' && (
                     <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-800 text-sm">
                        <span className="font-bold">Note:</span> This is a local file. AI analysis uses the extracted text content.
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default SearchPanel;
    