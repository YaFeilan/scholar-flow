
import React, { useState } from 'react';
import { Search, FileText, TrendingUp, BookOpen, User, Globe, PenTool, CheckSquare, MonitorPlay, Lightbulb, ClipboardCheck, Moon, Sun, BarChart2, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, language, setLanguage, darkMode, toggleDarkMode }) => {
  const t = TRANSLATIONS[language];
  const navT = t.nav;
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
      'planning': true,
      'experiment': true,
      'writing': true,
      'publish': true
  });

  const toggleGroup = (group: string) => {
      setOpenGroups(prev => ({...prev, [group]: !prev[group]}));
  };

  const navGroups = [
      {
          id: 'planning',
          title: t.groups.planning,
          items: [
             { label: navT.idea, icon: <Lightbulb size={16} />, id: ViewState.IDEA_GUIDE },
             { label: navT.trends, icon: <TrendingUp size={16} />, id: ViewState.TRENDS },
             { label: navT.search, icon: <Search size={16} />, id: ViewState.SEARCH },
             { label: navT.opening, icon: <ClipboardCheck size={16} />, id: ViewState.OPENING_REVIEW },
          ]
      },
      {
          id: 'experiment',
          title: t.groups.experiment,
          items: [
             { label: navT.data, icon: <BarChart2 size={16} />, id: ViewState.DATA_ANALYSIS },
             { label: navT.track, icon: <BookOpen size={16} />, id: ViewState.TRACK },
          ]
      },
      {
          id: 'writing',
          title: t.groups.writing,
          items: [
             { label: navT.review, icon: <FileText size={16} />, id: ViewState.REVIEW_GENERATION },
             { label: navT.polish, icon: <PenTool size={16} />, id: ViewState.POLISH },
             { label: navT.ppt, icon: <MonitorPlay size={16} />, id: ViewState.PPT_GENERATION },
          ]
      },
      {
          id: 'publish',
          title: t.groups.publish,
          items: [
             { label: navT.advisor, icon: <User size={16} />, id: ViewState.ADVISOR },
             { label: navT.peer, icon: <CheckSquare size={16} />, id: ViewState.PEER_REVIEW },
          ]
      }
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'ZH' : 'EN');
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-colors duration-200 flex-shrink-0">
       {/* Brand Header */}
       <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(ViewState.SEARCH)}>
             <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/50">
                <BookOpen className="text-white h-5 w-5" />
             </div>
             <div>
                <h1 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">Research Assistant</h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">AI Platform</p>
             </div>
          </div>
       </div>

       {/* Navigation Scroll Area */}
       <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-6">
          {navGroups.map(group => (
              <div key={group.id}>
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                      {group.title}
                      {openGroups[group.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  
                  {openGroups[group.id] && (
                      <div className="space-y-1 animate-fadeIn">
                          {group.items.map(item => (
                              <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                  ${currentView === item.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                                `}
                              >
                                  {item.icon}
                                  {item.label}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          ))}
       </div>

       {/* Footer Controls */}
       <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
           <div className="flex items-center justify-between">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all"
                title="Toggle Theme"
              >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all"
              >
                  <Globe size={14} />
                  {language === 'ZH' ? '中文' : 'English'}
              </button>
           </div>
       </div>
    </div>
  );
};

export default Sidebar;