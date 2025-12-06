import React, { useState } from 'react';
import { Search, FileText, TrendingUp, BookOpen, User, Globe, PenTool, CheckSquare, MonitorPlay, Lightbulb, ClipboardCheck, Moon, Sun, BarChart2, ChevronDown, ChevronRight, Menu, Terminal, Beaker, MessageSquare, PanelLeftClose, PanelLeftOpen, Network, Image as ImageIcon, Table2, Briefcase, Calendar } from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, language, setLanguage, darkMode, toggleDarkMode, collapsed, toggleCollapse }) => {
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
             { label: navT.idea, icon: <Lightbulb size={20} />, id: ViewState.IDEA_GUIDE },
             { label: navT.trends, icon: <TrendingUp size={20} />, id: ViewState.TRENDS },
             { label: navT.search, icon: <Search size={20} />, id: ViewState.SEARCH },
             { label: navT.pdfChat, icon: <MessageSquare size={20} />, id: ViewState.PDF_CHAT }, 
             { label: navT.knowledge, icon: <Network size={20} />, id: ViewState.KNOWLEDGE_GRAPH },
             { label: navT.opening, icon: <ClipboardCheck size={20} />, id: ViewState.OPENING_REVIEW },
             { label: navT.grant, icon: <Briefcase size={20} />, id: ViewState.GRANT_APPLICATION }, 
          ]
      },
      {
          id: 'experiment',
          title: t.groups.experiment,
          items: [
             { label: navT.experimentDesign, icon: <Beaker size={20} />, id: ViewState.EXPERIMENT_DESIGN },
             { label: navT.data, icon: <BarChart2 size={20} />, id: ViewState.DATA_ANALYSIS },
             { label: navT.chart, icon: <Table2 size={20} />, id: ViewState.CHART_EXTRACTION },
             { label: navT.code, icon: <Terminal size={20} />, id: ViewState.CODE_ASSISTANT },
             { label: navT.track, icon: <BookOpen size={20} />, id: ViewState.TRACK },
          ]
      },
      {
          id: 'writing',
          title: t.groups.writing,
          items: [
             { label: navT.review, icon: <FileText size={20} />, id: ViewState.REVIEW_GENERATION },
             { label: navT.polish, icon: <PenTool size={20} />, id: ViewState.POLISH },
             { label: navT.figure, icon: <ImageIcon size={20} />, id: ViewState.FIGURE_GEN },
             { label: navT.ppt, icon: <MonitorPlay size={20} />, id: ViewState.PPT_GENERATION },
          ]
      },
      {
          id: 'publish',
          title: t.groups.publish,
          items: [
             { label: navT.advisor, icon: <User size={20} />, id: ViewState.ADVISOR },
             { label: navT.peer, icon: <CheckSquare size={20} />, id: ViewState.PEER_REVIEW },
             { label: navT.conference, icon: <Calendar size={20} />, id: ViewState.CONFERENCE_FINDER }, // New
          ]
      }
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'ZH' : 'EN');
  };

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-all duration-300 flex-shrink-0 relative`}>
       {/* Collapse Toggle Button */}
       <button 
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md z-50 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
       >
           {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
       </button>

       {/* Brand Header */}
       <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex ${collapsed ? 'justify-center' : 'items-center gap-3'} transition-all`}>
          <div className="cursor-pointer bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/50 flex-shrink-0" onClick={() => setView(ViewState.SEARCH)}>
             <BookOpen className="text-white h-5 w-5" />
          </div>
          {!collapsed && (
             <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">Research</h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Assistant</p>
             </div>
          )}
       </div>

       {/* Navigation Scroll Area */}
       <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-6">
          {navGroups.map(group => (
              <div key={group.id} className="border-b border-slate-50 dark:border-slate-800/50 pb-4 last:border-0">
                  {!collapsed ? (
                      <button 
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-600 dark:hover:text-slate-300 px-2"
                      >
                          {group.title}
                          {openGroups[group.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                  ) : (
                      <div className="text-[10px] font-bold text-slate-300 dark:text-slate-700 text-center mb-2 uppercase">{group.title.substring(0,2)}</div>
                  )}
                  
                  {(openGroups[group.id] || collapsed) && (
                      <div className="space-y-1 animate-fadeIn">
                          {group.items.map(item => (
                              <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                                  ${currentView === item.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                                  ${collapsed ? 'justify-center' : ''}
                                `}
                                title={collapsed ? item.label : undefined}
                              >
                                  {item.icon}
                                  {!collapsed && <span>{item.label}</span>}
                                  {collapsed && currentView === item.id && (
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                                  )}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          ))}
       </div>

       {/* Footer Controls */}
       <div className={`p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 ${collapsed ? 'flex-col gap-4 items-center' : ''}`}>
           <div className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between'}`}>
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all"
                title="Toggle Theme"
              >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button 
                onClick={toggleLanguage}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all ${collapsed ? 'justify-center' : ''}`}
              >
                  <Globe size={16} />
                  {!collapsed && (language === 'ZH' ? '中文' : 'English')}
              </button>
           </div>
       </div>
    </div>
  );
};

export default Sidebar;