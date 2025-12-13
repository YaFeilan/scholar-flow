
import React, { useState } from 'react';
import { 
  Search, FileText, TrendingUp, BookOpen, User, Globe, PenTool, CheckSquare, 
  MonitorPlay, Lightbulb, ClipboardCheck, Moon, Sun, MessagesSquare, 
  Briefcase, BarChart2, Terminal, Beaker, Table2, Network, Gem, Image as ImageIcon, 
  Calendar, ShieldAlert, Workflow, MessageSquare 
} from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, language, setLanguage, darkMode, toggleDarkMode }) => {
  const t = TRANSLATIONS[language].nav;
  const groupT = TRANSLATIONS[language].groups;
  const appName = TRANSLATIONS[language].appName;

  // Define Group Structure mapping ViewStates to Categories
  const navGroups = [
    {
      id: 'discovery',
      title: groupT.discovery,
      items: [
        { id: ViewState.SEARCH, label: t.search, icon: <Search size={16} /> },
        { id: ViewState.TRENDS, label: t.trends, icon: <TrendingUp size={16} /> },
        { id: ViewState.TRACK, label: t.track, icon: <BookOpen size={16} /> },
        { id: ViewState.CONFERENCE_FINDER, label: t.conference, icon: <Calendar size={16} /> },
      ]
    },
    {
      id: 'experiment',
      title: groupT.experiment,
      items: [
        { id: ViewState.DATA_ANALYSIS, label: t.data, icon: <BarChart2 size={16} /> },
        { id: ViewState.CODE_ASSISTANT, label: t.code, icon: <Terminal size={16} /> },
        { id: ViewState.EXPERIMENT_DESIGN, label: t.experimentDesign, icon: <Beaker size={16} /> },
        { id: ViewState.CHART_EXTRACTION, label: t.chart, icon: <Table2 size={16} /> },
        { id: ViewState.PDF_CHAT, label: t.pdfChat, icon: <MessageSquare size={16} /> },
        { id: ViewState.KNOWLEDGE_GRAPH, label: t.knowledge, icon: <Network size={16} /> },
      ]
    },
    {
      id: 'writing',
      title: groupT.writing,
      items: [
        { id: ViewState.REVIEW_GENERATION, label: t.review, icon: <FileText size={16} /> },
        { id: ViewState.POLISH, label: t.polish, icon: <PenTool size={16} /> },
        { id: ViewState.TITLE_PRISM, label: t.titlePrism, icon: <Gem size={16} /> },
        { id: ViewState.FIGURE_GEN, label: t.figure, icon: <ImageIcon size={16} /> },
        { id: ViewState.FLOWCHART, label: t.flowchart, icon: <Workflow size={16} /> },
        { id: ViewState.PPT_GENERATION, label: t.ppt, icon: <MonitorPlay size={16} /> },
      ]
    },
    {
      id: 'publish',
      title: groupT.publish,
      items: [
        { id: ViewState.IDEA_GUIDE, label: t.idea, icon: <Lightbulb size={16} /> },
        { id: ViewState.OPENING_REVIEW, label: t.opening, icon: <ClipboardCheck size={16} /> },
        { id: ViewState.GRANT_APPLICATION, label: t.grant, icon: <Briefcase size={16} /> },
        { id: ViewState.RESEARCH_DISCUSSION, label: t.discussion, icon: <MessagesSquare size={16} /> },
        { id: ViewState.ADVISOR, label: t.advisor, icon: <User size={16} /> },
        { id: ViewState.PEER_REVIEW, label: t.peer, icon: <CheckSquare size={16} /> },
        { id: ViewState.AI_DETECTOR, label: t.aiDetector, icon: <ShieldAlert size={16} /> },
      ]
    }
  ];

  // Determine active group based on current view
  const activeGroup = navGroups.find(g => g.items.some(i => i.id === currentView)) || navGroups[0];
  const [selectedGroup, setSelectedGroup] = useState(activeGroup.id);

  // Sync selected group when view changes externally
  React.useEffect(() => {
      const group = navGroups.find(g => g.items.some(i => i.id === currentView));
      if (group) setSelectedGroup(group.id);
  }, [currentView]);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Row 1: Branding & Global Controls */}
        <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center cursor-pointer group" onClick={() => setView(ViewState.SEARCH)}>
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg mr-3 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 group-hover:shadow-blue-300 dark:group-hover:shadow-blue-900 transition-all">
              <BookOpen className="text-white h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tracking-tight leading-none">{appName}</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block mt-0.5">AI Research Platform</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all mr-1"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>

             <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              onClick={() => setLanguage(language === 'EN' ? 'ZH' : 'EN')}
             >
               <Globe size={14} />
               <span>{language === 'ZH' ? '中文' : 'English'}</span>
             </button>
          </div>
        </div>

        {/* Row 2: Level 1 Navigation (Categories) */}
        <div className="flex justify-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {navGroups.map(group => (
                <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 
                        ${selectedGroup === group.id 
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}
                    `}
                >
                    {group.title}
                </button>
            ))}
        </div>

        {/* Row 3: Level 2 Navigation (Tools) */}
        <div className="py-3 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900">
          <div className="flex items-center justify-center gap-2 min-w-max px-4">
            {navGroups.find(g => g.id === selectedGroup)?.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap border
                  ${currentView === item.id 
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'}
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
