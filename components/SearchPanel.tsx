
import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Bookmark, ArrowUpDown, X, FileText, Download, Sparkles, Loader2, Globe, Cloud, FolderOpen, UploadCloud, ChevronDown, Layers, Calendar, Clock, Database, Lock, Copy, Check, ExternalLink, AlertTriangle, MessageCircle, Image as ImageIcon, Plus, BookOpen } from 'lucide-react';
import { SearchFilters, Paper, Language } from '../types';
import { MOCK_PAPERS } from '../constants';
import { TRANSLATIONS } from '../translations';
import ReactMarkdown from 'react-markdown';
import { generatePaperInterpretation, searchAcademicPapers, generateSimulatedFullText, extractChartData, parsePaperFromImage } from '../services/geminiService';

interface SearchPanelProps {
  onReviewRequest: (papers: Paper[]) => void;
  language: Language;
}

type ModalTab = 'abstract' | 'fulltext' | 'interpretation';

const SearchPanel: React.FC<SearchPanelProps> = ({ onReviewRequest, language }) => {
  const t = TRANSLATIONS[language].search;
  const appName = TRANSLATIONS[language].appName;
  const [query, setQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SearchFilters>({
    databases: [],
    timeRange: 'All Time',
    partition: [],
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'if' | 'added'>('relevance');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultLimit, setResultLimit] = useState(20);
  const [minCitations, setMinCitations] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [addedAfter, setAddedAfter] = useState<string>('');
  const [addedBefore, setAddedBefore] = useState<string>('');
  
  // Search Mode State
  const [searchSource, setSearchSource] = useState<'online' | 'local'>('online');
  const [localPapers, setLocalPapers] = useState<Paper[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageImportRef = useRef<HTMLInputElement>(null);
  
  // Search Results
  const [results, setResults] = useState<Paper[]>(MOCK_PAPERS);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);

  // Detail Modal State
  const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('abstract');
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [fullTextContent, setFullTextContent] = useState<string | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isGeneratingFullText, setIsGeneratingFullText] = useState(false);
  
  // Simulated State for "Paywall"
  const [simulatedPdfUrl, setSimulatedPdfUrl] = useState<string | null>(null);

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
    setInterpretation(null); 
    // Use extracted full text if available, otherwise clear to allow generation
    setFullTextContent(paper.fullText || null);
    setSimulatedPdfUrl(null);
    setActiveTab(paper.fullText ? 'fulltext' : 'abstract');
  };

  const closePaperModal = () => {
    setViewingPaper(null);
    setInterpretation(null);
    setFullTextContent(null);
    setSimulatedPdfUrl(null);
  };

  const handleInterpret = async () => {
    if (!viewingPaper) return;
    setIsInterpreting(true);
    const result = await generatePaperInterpretation(viewingPaper, language);
    setInterpretation(result);
    setIsInterpreting(false);
  };

  const handleGenerateFullText = async () => {
      if (!viewingPaper || fullTextContent) return;
      setIsGeneratingFullText(true);
      const text = await generateSimulatedFullText(viewingPaper, language);
      setFullTextContent(text);
      setIsGeneratingFullText(false);
  };

  const handleDownload = async () => {
    if (!viewingPaper) return;

    // 1. Local File Download
    if (viewingPaper.source === 'local' && viewingPaper.file) {
      const url = URL.createObjectURL(viewingPaper.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = viewingPaper.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // 2. Online Paper Simulation
    // Copy the Source URL first as requested
    const doi = `https://doi.org/10.1038/s41586-${Math.floor(Math.random() * 10000)}`;
    navigator.clipboard.writeText(doi);
    const urlCopiedMsg = language === 'ZH' ? '链接已复制到剪贴板。' : 'Source URL copied to clipboard.';
    
    // Check if we need to generate full text
    let contentToDownload = fullTextContent;
    if (!contentToDownload) {
        // More descriptive prompt
        const promptMsg = language === 'ZH'
            ? `${urlCopiedMsg}\n\n该文献受版权保护。是否生成 AI 模拟全文并下载？`
            : `${urlCopiedMsg}\n\nPaper is behind paywall. Generate simulated AI full-text?`;
            
        const confirmGen = window.confirm(promptMsg);
        
        if (!confirmGen) return;

        setIsGeneratingFullText(true);
        // Temporarily switch tab to show progress if modal is open
        setActiveTab('fulltext');
        
        contentToDownload = await generateSimulatedFullText(viewingPaper, language);
        setFullTextContent(contentToDownload);
        setIsGeneratingFullText(false);
    }

    if (contentToDownload) {
        const blob = new Blob([contentToDownload], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = viewingPaper.title ? viewingPaper.title.replace(/\s+/g, '_') : 'paper';
        a.download = `${safeTitle}_AI_Simulated.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const copySourceUrl = () => {
      // Simulate a DOI link
      const doi = `https://doi.org/10.1038/s41586-${Math.floor(Math.random() * 10000)}`;
      navigator.clipboard.writeText(doi);
      alert(language === 'ZH' ? '链接已复制' : 'Source URL copied');
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
    
    const foundPapers = await searchAcademicPapers(query, language, resultLimit);
    
    if (foundPapers && foundPapers.length > 0) {
      setResults(foundPapers);
    } else {
       const q = query.toLowerCase();
       const fallbackMocks = MOCK_PAPERS.filter(p => 
          (p.title && p.title.toLowerCase().includes(q)) || 
          (p.authors && p.authors.some(a => a.toLowerCase().includes(q))) ||
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
        return;
      }
      
      const newPapers: Paper[] = (Array.from(e.target.files) as File[]).map((file, idx) => ({
        id: `local-${file.name}-${Date.now()}-${idx}`,
        title: file.name,
        authors: ['Local File'],
        journal: 'Imported',
        year: new Date(file.lastModified).getFullYear(),
        citations: 0,
        badges: [{ type: 'LOCAL' }],
        abstract: 'Click to analyze content.',
        source: 'local',
        file: file,
        addedDate: new Date().toISOString().split('T')[0]
      }));
      setLocalPapers(prev => [...prev, ...newPapers]);
    }
  };

  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsImageAnalyzing(true);
          const file = e.target.files[0];
          
          // Use specific paper parser for full content extraction
          const paper = await parsePaperFromImage(file, language);
          
          if (paper) {
              setLocalPapers(prev => [...prev, paper]);
              setSearchSource('local'); // Switch to local view to see it
              handlePaperClick(paper); // Open modal immediately
          } else {
              // Fallback if parsing fails but shouldn't happen often
              alert(language === 'ZH' ? "无法从图片解析论文内容。" : "Failed to parse paper from image.");
          }
          
          setIsImageAnalyzing(false);
      }
  };

  // Client-side Sort & Filter
  const sortedPapers = useMemo(() => {
    let papers = searchSource === 'online' ? [...results] : [...localPapers];

    // Filter Logic
    const currentYear = new Date().getFullYear();
    
    // Time Range
    if (filters.timeRange === 'Last 1 Year') {
      papers = papers.filter(p => p.year >= currentYear - 1);
    } else if (filters.timeRange === 'Last 3 Years') {
      papers = papers.filter(p => p.year >= currentYear - 3);
    } else if (filters.timeRange === 'Last 5 Years') {
      papers = papers.filter(p => p.year >= currentYear - 5);
    } 
    
    // Database Filter (SCI/SSCI/CJR/EI...)
    if (filters.databases.length > 0) {
      papers = papers.filter(p => {
        if (!p.badges || p.badges.length === 0) return false;
        // Check if paper has ANY of the selected database badges
        return p.badges.some(b => filters.databases.includes(b.type));
      });
    }

    // Partition Filter (Q1-Q4)
    if (filters.partition && filters.partition.length > 0) {
      papers = papers.filter(p => {
          return p.badges?.some(b => b.partition && filters.partition.includes(b.partition));
      });
    }

    if (filterYear) {
      const y = parseInt(filterYear);
      if (!isNaN(y)) {
        papers = papers.filter(p => p.year === y);
      }
    }

    if (minCitations) {
      const min = parseInt(minCitations);
      if (!isNaN(min)) {
        papers = papers.filter(p => p.citations >= min);
      }
    }

    // Added Date Filter (New)
    if (addedAfter) {
      papers = papers.filter(p => {
         const pDate = p.addedDate || '1970-01-01'; 
         return pDate >= addedAfter;
      });
    }

    if (addedBefore) {
      papers = papers.filter(p => {
         const pDate = p.addedDate || '2099-12-31';
         return pDate <= addedBefore;
      });
    }

    return papers.sort((a, b) => {
      if (sortBy === 'date') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'added') return (b.addedDate || '').localeCompare(a.addedDate || '');
      if (sortBy === 'if') {
        const getIf = (p: Paper) => p.badges?.find(badge => badge.if)?.if || 0;
        return getIf(b) - getIf(a);
      }
      return 0; // Relevance
    });
  }, [sortBy, results, localPapers, filters, searchSource, filterYear, minCitations, addedAfter, addedBefore]);

  const FilterButton: React.FC<{ active: boolean; label: string; onClick?: () => void }> = ({ active, label, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
        active 
        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400' 
        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {label}
    </button>
  );

  // Database options including requested SCI/SSCI/CJR
  const dbOptions = [
    { id: 'SCI', label: 'SCI' },
    { id: 'SSCI', label: 'SSCI' },
    { id: 'CJR', label: language === 'ZH' ? '中科院分区(CJR)' : 'CJR/CAS' },
    { id: 'EI', label: 'EI' },
    { id: 'CNKI', label: 'CNKI' },
    { id: 'PubMed', label: 'PubMed' },
  ];

  const partitionOptions = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="text-blue-600" /> {t.title}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
        {/* Source Toggle */}
        <div className="flex justify-center mb-6">
           <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg inline-flex">
              <button 
                 onClick={() => setSearchSource('online')}
                 className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${searchSource === 'online' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                 <Cloud size={16} /> {t.source.online}
              </button>
              <button 
                 onClick={() => setSearchSource('local')}
                 className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${searchSource === 'local' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
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
                  <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-l-lg leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-colors"
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
            
            {/* Detailed Filters */}
             <div className="flex flex-col items-center gap-4">
                {/* Database Filters - Explicit for SCI/SSCI/CJR */}
                <div className="flex items-center gap-2 flex-wrap justify-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mr-1 flex items-center gap-1">
                        <Database size={12} /> DB:
                    </span>
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

                {/* Partition Filters */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mr-1 flex items-center gap-1">
                        <Layers size={12} /> Partition:
                    </span>
                    {partitionOptions.map(opt => (
                        <FilterButton 
                            key={opt} 
                            active={filters.partition.includes(opt)} 
                            label={opt} 
                            onClick={() => {
                            const newParts = filters.partition.includes(opt) 
                                ? filters.partition.filter(p => p !== opt)
                                : [...filters.partition, opt];
                            setFilters({...filters, partition: newParts});
                            }}
                        />
                    ))}
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                     {/* Time Range */}
                     <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-medium">{t.filters.time}:</span>
                        <select 
                           value={filters.timeRange}
                           onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 font-bold text-sm cursor-pointer p-0"
                        >
                           <option className="dark:bg-slate-800">All Time</option>
                           <option className="dark:bg-slate-800">Last 1 Year</option>
                           <option className="dark:bg-slate-800">Last 3 Years</option>
                           <option className="dark:bg-slate-800">Last 5 Years</option>
                        </select>
                        <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
                     </div>
                     
                     {/* Added Date Filters - Specific User Request */}
                     <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-medium flex items-center gap-1"><Clock size={14}/> {language === 'ZH' ? '加入时间:' : 'Date Added:'}</span>
                        <input
                           type="date"
                           value={addedAfter}
                           onChange={(e) => setAddedAfter(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 font-bold text-xs p-0 cursor-pointer w-[110px]"
                           placeholder="Start"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                           type="date"
                           value={addedBefore}
                           onChange={(e) => setAddedBefore(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 font-bold text-xs p-0 cursor-pointer w-[110px]"
                           placeholder="End"
                        />
                     </div>

                     {/* Citation Count Filter */}
                     <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-medium">{language === 'ZH' ? '引用 >' : 'Cited >'}</span>
                        <input
                           type="number"
                           min="0"
                           value={minCitations}
                           onChange={(e) => setMinCitations(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 font-bold text-sm w-12 p-0 placeholder-slate-400"
                           placeholder="0"
                        />
                     </div>
                </div>
             </div>
          </>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div 
                   className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative flex flex-col items-center justify-center h-48"
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
                   <UploadCloud size={40} className="text-blue-400 mb-3" />
                   <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">{t.upload.btn}</h3>
                   <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{t.upload.tip}</p>
                </div>
                
                {/* Image Import Button - Supports "Image to Full Content" request */}
                <div 
                   onClick={() => imageImportRef.current?.click()}
                   className={`border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-8 text-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer relative flex flex-col items-center justify-center h-48 ${isImageAnalyzing ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                >
                   <input 
                     type="file" 
                     ref={imageImportRef} 
                     className="hidden" 
                     accept="image/*"
                     onChange={handleImageImport}
                   />
                   {isImageAnalyzing ? (
                       <Loader2 className="animate-spin text-purple-600 w-10 h-10 mb-3" /> 
                   ) : (
                       <ImageIcon className="text-purple-500 w-10 h-10 mb-3" />
                   )}
                   <h3 className="text-base font-bold text-purple-700 dark:text-purple-300">
                       {isImageAnalyzing ? (language === 'ZH' ? '正在提取全内容...' : 'Extracting Full Content...') : (language === 'ZH' ? '图片转全文 (Full Text Extraction)' : 'Image to Full Text')}
                   </h3>
                   <p className="text-purple-400 dark:text-purple-500 text-xs mt-1">{language === 'ZH' ? '识别全文、公式与图表描述' : 'Extracts full text, formulas & chart descriptions'}</p>
                </div>
            </div>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
      {sortedPapers.length > 0 && (
         <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
               <FileText size={20} className="text-blue-600" /> 
               {searchSource === 'online' ? t.results : t.source.local} 
               <span className="text-slate-400 dark:text-slate-500 text-sm font-normal">({sortedPapers.length})</span>
            </h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t.sort.label}:</span>
                  <select 
                    className="text-sm border-none bg-transparent font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                     <option value="relevance" className="dark:bg-slate-800">{t.sort.relevance}</option>
                     <option value="date" className="dark:bg-slate-800">{t.sort.date}</option>
                     <option value="if" className="dark:bg-slate-800">{t.sort.if}</option>
                     <option value="added" className="dark:bg-slate-800">{t.sort.added}</option>
                  </select>
               </div>
               
               {selectedPapers.size > 0 && (
                 <button 
                    onClick={handleGenerateReview}
                    disabled={isGenerating}
                    className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                 >
                    {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 text-yellow-400" />}
                    {t.generateBtn}
                 </button>
               )}
            </div>
         </div>
      )}

      {/* Papers Grid */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
      <div className="grid grid-cols-1 gap-4">
        {sortedPapers.length === 0 && hasSearched && (
           <div className="text-center py-20 text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>No results found for "{query}". Try different keywords or filters.</p>
           </div>
        )}
        
        {sortedPapers.map(paper => {
          if (!paper) return null;
          return (
          <div 
             key={paper.id} 
             onClick={() => handlePaperClick(paper)}
             className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md group ${selectedPapers.has(paper.id) ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'}`}
          >
             <div className="flex items-start gap-4">
                <div 
                  className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedPapers.has(paper.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-400'}`}
                  onClick={(e) => togglePaperSelection(e, paper.id)}
                >
                   {selectedPapers.has(paper.id) && <Check size={12} className="text-white" />}
                </div>
                
                <div className="flex-grow">
                   <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{paper.title}</h4>
                      <div className="text-right">
                         <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded whitespace-nowrap">{paper.year}</span>
                         {/* Explicitly show Added Date in result item */}
                         {paper.addedDate && (
                            <div className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 flex items-center justify-end gap-1" title="Date Added to Library">
                               <Clock size={10} /> {paper.addedDate}
                            </div>
                         )}
                      </div>
                   </div>
                   
                   <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 italic">
                      {paper.authors.join(', ')} <span className="text-slate-300 dark:text-slate-600 mx-2">|</span> {paper.journal}
                      {paper.citations > 0 && <span className="ml-2 text-slate-400">• {paper.citations} Citations</span>}
                   </p>
                   
                   <div className="flex gap-2 flex-wrap mb-3">
                      {paper.badges?.map((b, i) => (
                         <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            b.type === 'SCI' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                            b.type === 'SSCI' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800' :
                            b.type === 'CJR' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                            b.type === 'Q1' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' :
                            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                         }`}>
                            {b.type} {b.partition && `(${b.partition})`} {b.if && `IF: ${b.if}`}
                         </span>
                      ))}
                   </div>
                   
                   <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {paper.abstract}
                   </p>
                </div>
             </div>
          </div>
          );
        })}
      </div>
      </div>
      </div>
      
      {/* Detail Modal */}
      {viewingPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={closePaperModal}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{viewingPaper.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{viewingPaper.authors.join(', ')} • {viewingPaper.year} • {viewingPaper.journal}</p>
                    </div>
                    <button onClick={closePaperModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <button onClick={() => setActiveTab('abstract')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'abstract' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Abstract</button>
                    <button onClick={() => setActiveTab('fulltext')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'fulltext' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Full Text (Simulated)</button>
                    <button onClick={() => setActiveTab('interpretation')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'interpretation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>AI Interpretation</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {activeTab === 'abstract' && (
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
                            <h4 className="font-bold uppercase text-xs text-slate-400">Abstract</h4>
                            <p>{viewingPaper.abstract}</p>
                            <div className="flex gap-2 mt-4">
                                {viewingPaper.badges?.map((b, i) => (
                                    <span key={i} className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                        {b.type} {b.partition}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'fulltext' && (
                        <div className="space-y-4">
                            {fullTextContent ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{fullTextContent}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-slate-500 mb-4">{language === 'ZH' ? '全文未加载。点击生成模拟全文（由于版权限制）。' : 'Full text not loaded. Generate simulated text (due to copyright).'}</p>
                                    <button 
                                        onClick={handleGenerateFullText}
                                        disabled={isGeneratingFullText}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        {isGeneratingFullText ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                                        {language === 'ZH' ? '生成模拟全文' : 'Generate Simulated Full Text'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'interpretation' && (
                        <div className="space-y-4">
                            {interpretation ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <ReactMarkdown>{interpretation}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <button 
                                        onClick={handleInterpret} 
                                        disabled={isInterpreting}
                                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-purple-200 dark:shadow-none"
                                    >
                                        {isInterpreting ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                        {language === 'ZH' ? '开始 AI 深度解读' : 'Start AI Deep Interpretation'}
                                    </button>
                                    <p className="text-xs text-slate-400 mt-3">{language === 'ZH' ? '分析核心贡献、方法论优缺点' : 'Analyzes core contributions, methodology pros/cons'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <button onClick={copySourceUrl} className="text-slate-500 hover:text-blue-600 text-sm font-bold flex items-center gap-2">
                        <ExternalLink size={16} /> Source Link
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleDownload} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                            <Download size={16} /> PDF
                        </button>
                        <button 
                            onClick={(e) => {
                                if (viewingPaper) {
                                    togglePaperSelection(e as any, viewingPaper.id);
                                    closePaperModal();
                                }
                            }}
                            className={`${selectedPapers.has(viewingPaper.id) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'} px-6 py-2 rounded-lg font-bold transition-colors border`}
                        >
                            {selectedPapers.has(viewingPaper.id) ? (language === 'ZH' ? '取消选择' : 'Deselect') : (language === 'ZH' ? '加入综述列表' : 'Add to Review List')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
