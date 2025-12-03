
import React, { useState } from 'react';
import { Upload, Search, BookOpen, Layers, Tag, Loader2, FileText } from 'lucide-react';
import { trackCitationNetwork } from '../services/geminiService';
import { TrackedReference, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface ReferenceTrackerProps {
  language: Language;
}

const ReferenceTracker: React.FC<ReferenceTrackerProps> = ({ language }) => {
  const t = TRANSLATIONS[language].track;
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrackedReference[] | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleTrack = async (inputQuery: string, isFile: boolean) => {
    if (!inputQuery) return;
    setLoading(true);
    setResults(null);
    const data = await trackCitationNetwork(inputQuery, isFile, language);
    setResults(data);
    setLoading(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setQuery(file.name);
      handleTrack(file.name, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">{t.title}</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">{t.subtitle}</p>
      </div>

      {/* Input Area */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-12">
        <div className="flex border-b border-slate-100">
          <button 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => { setActiveTab('search'); setResults(null); setQuery(''); }}
          >
            <Search size={18} /> {t.tabSearch}
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => { setActiveTab('upload'); setResults(null); setQuery(''); }}
          >
            <Upload size={18} /> {t.tabUpload}
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'search' ? (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholder}
                className="flex-grow border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleTrack(query, false)}
              />
              <button 
                onClick={() => handleTrack(query, false)}
                disabled={loading || !query}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : t.btn}
              </button>
            </div>
          ) : (
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <FileText size={24} />
              </div>
              <p className="font-bold text-slate-700 mb-1">{t.dragDrop}</p>
              <p className="text-xs text-slate-400">PDF, DOCX (Max 10MB)</p>
              <input 
                type="file" 
                className="hidden" 
                id="file-upload"
                onChange={(e) => {
                  if(e.target.files?.[0]) {
                    setQuery(e.target.files[0].name);
                    handleTrack(e.target.files[0].name, true);
                  }
                }}
              />
              <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
            </div>
          )}
        </div>
      </div>

      {/* Results Area */}
      {loading && (
        <div className="text-center py-12">
           <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
           <p className="text-slate-500 font-medium">Analyzing citation network & classifying references...</p>
        </div>
      )}

      {results && (
        <div className="animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{t.resultsTitle}</h3>
              <p className="text-sm text-slate-500">Categorized by technical contribution</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {results.map((category, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <Tag size={16} className="text-blue-500" />
                    {category.category}
                  </span>
                  <span className="bg-white text-slate-500 text-xs px-2 py-1 rounded border border-slate-200 font-mono">
                    {category.papers.length} Refs
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {category.papers.map((paper, pIdx) => (
                    <div key={pIdx} className="group">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                          {paper.title}
                        </h4>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                          {paper.year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic mb-1">{paper.author}</p>
                      <p className="text-xs text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-50">
                        <span className="font-bold text-blue-700">Role:</span> {paper.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceTracker;
