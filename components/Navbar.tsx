
import React from 'react';
import { Search, FileText, TrendingUp, BookOpen, User, Globe, PenTool, CheckSquare, MonitorPlay, Lightbulb, ClipboardCheck, Moon, Sun } from 'lucide-react';
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
  const appName = TRANSLATIONS[language].appName;

  const navItems = [
    { label: 'Search', icon: <Search size={16} />, id: ViewState.SEARCH, text: t.search },
    { label: 'Opening', icon: <ClipboardCheck size={16} />, id: ViewState.OPENING_REVIEW, text: t.opening },
    { label: 'Idea', icon: <Lightbulb size={16} />, id: ViewState.IDEA_GUIDE, text: t.idea },
    { label: 'Review', icon: <FileText size={16} />, id: ViewState.REVIEW_GENERATION, text: t.review },
    { label: 'PPT', icon: <MonitorPlay size={16} />, id: ViewState.PPT_GENERATION, text: t.ppt },
    { label: 'Tracking', icon: <BookOpen size={16} />, id: ViewState.TRACK, text: t.track },
    { label: 'Trends', icon: <TrendingUp size={16} />, id: ViewState.TRENDS, text: t.trends },
    { label: 'Advisor', icon: <User size={16} />, id: ViewState.ADVISOR, text: t.advisor },
    { label: 'Peer Review', icon: <CheckSquare size={16} />, id: ViewState.PEER_REVIEW, text: t.peer },
    { label: 'Polish', icon: <PenTool size={16} />, id: ViewState.POLISH, text: t.polish },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'ZH' : 'EN');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: Branding and Global Actions */}
        <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
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
              onClick={toggleLanguage}
             >
               <Globe size={14} />
               <span>{language === 'ZH' ? '中文' : 'English'}</span>
             </button>
             <div className="h-9 w-9 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-md border-2 border-white dark:border-slate-700 ring-1 ring-slate-100 dark:ring-slate-800 cursor-pointer ml-1">
                RA
             </div>
          </div>
        </div>

        {/* Row 2: Navigation Menu */}
        <div className="py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-start md:justify-center gap-1 min-w-max px-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                   if (Object.values(ViewState).includes(item.id as ViewState)) {
                    setView(item.id as ViewState);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap
                  ${currentView === item.id 
                    ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200 dark:ring-blue-800 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {item.icon}
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;