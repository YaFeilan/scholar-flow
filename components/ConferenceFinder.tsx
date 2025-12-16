
import React, { useState } from 'react';
import { Calendar, Search, MapPin, ExternalLink, Filter, Loader2, BookOpen, Clock, AlertTriangle, Globe, BarChart2, CheckCircle2, ListFilter, ArrowDownUp } from 'lucide-react';
import { Language, ConferenceFinderResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { findConferences } from '../services/geminiService';

interface ConferenceFinderProps {
  language: Language;
}

const ConferenceFinder: React.FC<ConferenceFinderProps> = ({ language }) => {
  const t = TRANSLATIONS[language].conference;
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConferenceFinderResult | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'conf' | 'journal'>('all');
  const [filterRank, setFilterRank] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'passed' | 'tba'>('upcoming');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPartition, setFilterPartition] = useState('All');
  const [minH5, setMinH5] = useState<string>('all');
  
  // Sorting
  const [sortOption, setSortOption] = useState<'deadline' | 'rank' | 'h5'>('deadline');

  const quickTags = ['🔥 LLM', 'Computer Vision', 'Robotics', 'NLP', 'Bioinformatics', 'ICLR', 'AAAI'];

  const handleSearch = async (overrideTopic?: string) => {
    const query = overrideTopic || topic;
    if (!query.trim()) return;
    if (overrideTopic) setTopic(overrideTopic);
    
    setLoading(true);
    setResult(null);
    setSearchAttempted(true);
    try {
        const data = await findConferences(query, language);
        setResult(data);
    } catch (e) {
        console.error("Search failed", e);
    }
    setLoading(false);
  };

  const getDaysLeft = (deadline: string) => {
    if (!deadline || deadline.toLowerCase().includes('tba')) return 999; // Treat TBA as far future
    const today = new Date();
    const target = new Date(deadline);
    if (isNaN(target.getTime())) return 999;
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRankValue = (rank: string) => {
      if (rank === 'CCF-A') return 3;
      if (rank === 'CCF-B') return 2;
      if (rank === 'CCF-C') return 1;
      return 0;
  };

  // Filter Logic for Conferences
  const filteredConferences = result?.conferences?.filter(c => {
      // Type Filter (Component Level View Logic handled in Render, but filter list here too for safety)
      if (filterType === 'journal') return false;

      // Rank Filter
      if (filterRank !== 'All' && c.rank !== filterRank) return false;
      
      // Status Filter
      const isTBA = c.deadline && c.deadline.toLowerCase().includes('tba');
      const days = getDaysLeft(c.deadline);
      
      if (filterStatus === 'tba') {
          if (!isTBA) return false;
      } else if (filterStatus === 'upcoming') {
          if (days < 0 && !isTBA) return false; // Hide passed, keep TBA as they are technically upcoming
      } else if (filterStatus === 'passed') {
          if (days >= 0 || isTBA) return false;
      }

      // Location/Region Filter
      if (filterLocation !== 'all') {
          const reg = c.region ? c.region.toLowerCase() : '';
          const loc = c.location ? c.location.toLowerCase() : '';
          const target = filterLocation.toLowerCase();
          
          if (filterLocation === 'na') {
              if (!reg.includes('north america') && !reg.includes('usa') && !loc.includes('usa') && !loc.includes('canada')) return false;
          } else {
              if (!reg.includes(target) && !loc.includes(target)) return false;
          }
      }

      // H5 Metric Filter
      if (minH5 !== 'all' && c.h5Index) {
          const threshold = parseInt(minH5);
          if (c.h5Index < threshold) return false;
      }

      return true;
  }).sort((a, b) => {
      // Sorting
      if (sortOption === 'deadline') {
          const da = getDaysLeft(a.deadline);
          const db = getDaysLeft(b.deadline);
          // Put passed events at bottom if mixed, but usually filtered out
          if (da < 0 && db >= 0) return 1;
          if (da >= 0 && db < 0) return -1;
          return da - db;
      } else if (sortOption === 'rank') {
          return getRankValue(b.rank) - getRankValue(a.rank);
      } else if (sortOption === 'h5') {
          return (b.h5Index || 0) - (a.h5Index || 0);
      }
      return 0;
  });

  // Filter Logic for Journals
  const filteredJournals = result?.journals?.filter(j => {
      if (filterType === 'conf') return false;

      // Partition Filter
      if (filterPartition !== 'All' && j.partition !== filterPartition) return false;
      
      // Status Filter
      const isTBA = j.deadline && j.deadline.toLowerCase().includes('tba');
      const days = getDaysLeft(j.deadline);
      
      if (filterStatus === 'tba') {
          if (!isTBA) return false;
      } else if (filterStatus === 'upcoming') {
          if (days < 0 && !isTBA) return false;
      } else if (filterStatus === 'passed') {
          if (days >= 0 || isTBA) return false;
      }

      return true;
  });

  const hasResults = (filteredConferences && filteredConferences.length > 0) || (filteredJournals && filteredJournals.length > 0);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="text-blue-600" /> {t.title}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 space-y-4">
        {/* Search Row */}
        <div>
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow w-full">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.topicLabel}</label>
                <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g. Computer Vision, ICLR, AAAI"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-900 dark:text-slate-100"
                />
                </div>
                <button
                onClick={() => handleSearch()}
                disabled={loading || !topic}
                className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
                {loading ? t.searching : t.searchBtn}
                </button>
            </div>
            {/* Quick Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
                {quickTags.map(tag => (
                    <button 
                       key={tag}
                       onClick={() => handleSearch(tag)}
                       className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 px-2.5 py-1 rounded-full border border-transparent hover:border-blue-200 transition-all text-slate-600 dark:text-slate-300 font-medium"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
            {/* Type Filter */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><ListFilter size={12}/> {t.filters.type}</label>
               <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900"
               >
                  <option value="all">{t.filters.typeOpts.all}</option>
                  <option value="conf">{t.filters.typeOpts.conf}</option>
                  <option value="journal">{t.filters.typeOpts.journal}</option>
               </select>
            </div>

            {/* Status Filter */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Clock size={12}/> {t.filters.status}</label>
               <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900"
               >
                  <option value="all">{t.filters.statusOpts.all}</option>
                  <option value="upcoming">{t.filters.statusOpts.upcoming}</option>
                  <option value="passed">{t.filters.statusOpts.passed}</option>
                  <option value="tba">{t.filters.statusOpts.tba}</option>
               </select>
            </div>

            {/* Rank Filter (CCF) */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Filter size={12}/> {t.rankLabel}</label>
               <select 
                  value={filterRank}
                  onChange={(e) => setFilterRank(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900"
               >
                  <option value="All">All Ranks</option>
                  <option value="CCF-A">CCF-A</option>
                  <option value="CCF-B">CCF-B</option>
                  <option value="CCF-C">CCF-C</option>
               </select>
            </div>

            {/* Metrics Filter H5 */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><BarChart2 size={12}/> {t.filters.metrics}</label>
                <select 
                    value={minH5}
                    onChange={(e) => setMinH5(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900"
                >
                    <option value="all">{t.filters.h5Opts.all}</option>
                    <option value="20">{t.filters.h5Opts.gt20}</option>
                    <option value="50">{t.filters.h5Opts.gt50}</option>
                    <option value="100">{t.filters.h5Opts.gt100}</option>
                </select>
            </div>

            {/* Location Filter */}
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Globe size={12}/> {t.filters.location}</label>
               <select 
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900"
               >
                  <option value="all">{t.filters.locationOpts.all}</option>
                  <option value="asia">{t.filters.locationOpts.asia}</option>
                  <option value="europe">{t.filters.locationOpts.europe}</option>
                  <option value="na">{t.filters.locationOpts.na}</option>
                  <option value="online">{t.filters.locationOpts.online}</option>
               </select>
            </div>
        </div>
      </div>

      {searchAttempted && !loading && !hasResults && (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 opacity-60">
              <Search size={48} className="mb-4" />
              <p className="text-lg font-bold">No conferences found.</p>
              <p className="text-sm mt-2">Try adjusting your filters or search keywords.</p>
          </div>
      )}

      {hasResults && (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-hidden">
          {/* Conferences List */}
          {(filterType === 'all' || filterType === 'conf') && (
              <div className={`${filterType === 'conf' ? 'col-span-1 md:col-span-2 lg:col-span-3' : 'col-span-1 md:col-span-2'} flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700`}>
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-blue-500" size={20} /> {t.conferences}
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500 ml-2">{filteredConferences?.length || 0}</span>
                    </div>
                    {/* Sort Controls */}
                    <div className="flex items-center gap-2">
                        <ArrowDownUp size={14} className="text-slate-400" />
                        <select 
                           value={sortOption}
                           onChange={(e) => setSortOption(e.target.value as any)}
                           className="text-xs border-none bg-transparent font-bold text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
                        >
                           <option value="deadline">{t.sort.deadline}</option>
                           <option value="rank">{t.sort.rank}</option>
                           <option value="h5">{t.sort.h5}</option>
                        </select>
                    </div>
                 </div>
                 <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {filteredConferences?.length === 0 && (
                        <div className="text-center text-slate-400 py-10">No conferences found matching criteria.</div>
                    )}
                    {filteredConferences?.map((conf, idx) => {
                        const isTBA = conf.deadline && conf.deadline.toLowerCase().includes('tba');
                        const daysLeft = getDaysLeft(conf.deadline);
                        const isUrgent = !isTBA && daysLeft > 0 && daysLeft <= 30;
                        const isPassed = !isTBA && daysLeft < 0;

                        return (
                          <div key={idx} className={`border rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group ${isUrgent ? 'border-red-200 bg-red-50/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                              {/* Rank Badge */}
                              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold text-white
                                  ${conf.rank === 'CCF-A' ? 'bg-amber-500' : conf.rank === 'CCF-B' ? 'bg-blue-500' : 'bg-green-600'}
                              `}>
                                  {conf.rank}
                              </div>

                              <div className="flex justify-between items-start mb-2 pr-12">
                                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{conf.name}</h3>
                              </div>
                              
                              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                  <div className={`flex items-center gap-1.5 font-mono font-bold ${isUrgent ? 'text-red-600' : isPassed ? 'text-slate-400' : 'text-blue-600'}`}>
                                      <Clock size={14} /> 
                                      {conf.deadline} 
                                      {!isPassed && !isTBA && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-xs ml-1">{daysLeft} {t.daysLeft}</span>}
                                      {isPassed && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-xs ml-1">Passed</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                      <MapPin size={14} /> {conf.location}
                                  </div>
                                  {conf.h5Index && (
                                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 font-bold text-xs">
                                          H5: {conf.h5Index}
                                      </div>
                                  )}
                                  {conf.conferenceDate && (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                          <Calendar size={14} /> Event: {conf.conferenceDate}
                                      </div>
                                  )}
                              </div>
                              
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{conf.description}</p>
                              
                              <div className="flex justify-between items-center">
                                  <div className="flex gap-2">
                                      {conf.tags && conf.tags.map((tag, i) => (
                                          <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">{tag}</span>
                                      ))}
                                  </div>
                                  {conf.website && (
                                      <a href={conf.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1">
                                          {t.website} <ExternalLink size={12} />
                                      </a>
                                  )}
                              </div>
                          </div>
                        );
                    })}
                 </div>
              </div>
          )}

          {/* Journals List */}
          {(filterType === 'all' || filterType === 'journal') && (
              <div className={`${filterType === 'journal' ? 'col-span-1 md:col-span-2 lg:col-span-3' : 'col-span-1'} flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700`}>
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="text-purple-500" size={20} /> {t.journals}
                 </div>
                 <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                    {filteredJournals?.length === 0 && (
                        <div className="text-center text-slate-400 py-10">No special issues found.</div>
                    )}
                    {filteredJournals?.map((journal, idx) => {
                        if (!journal) return null;
                        const isTBA = journal.deadline && journal.deadline.toLowerCase().includes('tba');
                        const daysLeft = getDaysLeft(journal.deadline);
                        return (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-100 dark:border-slate-700 shadow-sm hover:border-purple-300 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{journal.name}</h4>
                                    <div className="flex gap-1">
                                        {journal.partition && (
                                            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">{journal.partition}</span>
                                        )}
                                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">IF: {journal.impactFactor}</span>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-purple-700 mb-2">{journal.title}</p>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock size={12} /> {journal.deadline}
                                    {!isTBA && daysLeft > 0 ? (
                                        <span className="text-purple-600 font-bold ml-auto">{daysLeft} {t.daysLeft}</span>
                                    ) : !isTBA ? (
                                        <span className="text-slate-400 font-bold ml-auto">Closed</span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                 </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConferenceFinder;
