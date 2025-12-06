import React, { useState } from 'react';
import { Calendar, Search, MapPin, ExternalLink, Filter, Loader2, BookOpen, Clock, AlertTriangle, Globe, BarChart2, CheckCircle2 } from 'lucide-react';
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
  
  // Filters
  const [filterRank, setFilterRank] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'passed'>('upcoming');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPartition, setFilterPartition] = useState('All');
  const [minH5, setMinH5] = useState<string>('');

  const handleSearch = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    const data = await findConferences(topic, language);
    setResult(data);
    setLoading(false);
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter Logic for Conferences
  const filteredConferences = result?.conferences.filter(c => {
      // Rank Filter
      if (filterRank !== 'All' && c.rank !== filterRank) return false;
      
      // Status Filter
      const days = getDaysLeft(c.deadline);
      if (filterStatus === 'upcoming' && days < 0) return false;
      if (filterStatus === 'passed' && days >= 0) return false;

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
      if (minH5 && c.h5Index) {
          if (c.h5Index < parseInt(minH5)) return false;
      }

      return true;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Filter Logic for Journals
  const filteredJournals = result?.journals.filter(j => {
      // Partition Filter
      if (filterPartition !== 'All' && j.partition !== filterPartition) return false;
      
      // Status Filter
      const days = getDaysLeft(j.deadline);
      if (filterStatus === 'upcoming' && days < 0) return false;
      if (filterStatus === 'passed' && days >= 0) return false;

      return true;
  });

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
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.topicLabel}</label>
            <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Computer Vision, Large Language Models"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-900 dark:text-slate-100"
            />
            </div>
            <button
            onClick={handleSearch}
            disabled={loading || !topic}
            className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
            {loading ? t.searching : t.searchBtn}
            </button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
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

            {/* Metrics Filter (Split Input) */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><BarChart2 size={12}/> {t.filters.h5}</label>
                    <input 
                        type="number"
                        placeholder="0"
                        value={minH5}
                        onChange={(e) => setMinH5(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><BookOpen size={12}/> {t.filters.partition}</label>
                    <select 
                        value={filterPartition}
                        onChange={(e) => setFilterPartition(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900"
                    >
                        <option value="All">All</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      {result && (
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
          {/* Conferences List */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="text-blue-500" size={20} /> {t.conferences}
                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500 ml-2">{filteredConferences?.length || 0}</span>
             </div>
             <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {filteredConferences?.length === 0 && (
                    <div className="text-center text-slate-400 py-10">No conferences found matching criteria.</div>
                )}
                {filteredConferences?.map((conf, idx) => {
                    const daysLeft = getDaysLeft(conf.deadline);
                    const isUrgent = daysLeft > 0 && daysLeft <= 30;
                    const isPassed = daysLeft < 0;

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
                                  {!isPassed && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-xs ml-1">{daysLeft} {t.daysLeft}</span>}
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
                                  {conf.tags.map((tag, i) => (
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

          {/* Journals List */}
          <div className="lg:col-span-1 flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="text-purple-500" size={20} /> {t.journals}
             </div>
             <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                {filteredJournals?.length === 0 && (
                    <div className="text-center text-slate-400 py-10">No special issues found.</div>
                )}
                {filteredJournals?.map((journal, idx) => {
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
                                {daysLeft > 0 ? (
                                    <span className="text-purple-600 font-bold ml-auto">{daysLeft} {t.daysLeft}</span>
                                ) : (
                                    <span className="text-slate-400 font-bold ml-auto">Closed</span>
                                )}
                            </div>
                        </div>
                    );
                })}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferenceFinder;