import React from 'react';
import { 
  Search, FileText, TrendingUp, BookOpen, User, Globe, PenTool, CheckSquare, 
  MonitorPlay, Lightbulb, ClipboardCheck, Moon, Sun, BarChart2, ChevronDown, 
  ChevronRight, Menu, Terminal, Beaker, MessageSquare, PanelLeftClose, 
  PanelLeftOpen, Network, Image as ImageIcon, Table2, Briefcase, Calendar, 
  ShieldAlert, Bot, Sparkles, MessagesSquare, Gem, Workflow, Zap 
} from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, collapsed, setCollapsed, language }) => {
  const t = TRANSLATIONS[language].nav;
  const groupT = TRANSLATIONS[language].groups;

  const navGroups = [
    {
      id: 'discovery',
      title: groupT.discovery,
      items: [
        { id: ViewState.AI_WORKFLOW, label: t.aiWorkflow, icon: <Zap size={20} /> },
        { id: ViewState.SEARCH, label: t.search, icon: <Search size={20} /> },
        { id: ViewState.TRENDS, label: t.trends, icon: <TrendingUp size={20} /> },
        { id: ViewState.TRACK, label: t.track, icon: <BookOpen size={20} /> },
        { id: ViewState.CONFERENCE_FINDER, label: t.conference, icon: <Calendar size={20} /> },
      ]
    },
    {
      id: 'planning',
      title: groupT.planning,
      items: [
        { id: ViewState.IDEA_GUIDE, label: t.idea, icon: <Lightbulb size={20} /> },
        { id: ViewState.RESEARCH_DISCUSSION, label: t.discussion, icon: <MessagesSquare size={20} /> },
        { id: ViewState.OPENING_REVIEW, label: t.opening, icon: <ClipboardCheck size={20} /> },
        { id: ViewState.GRANT_APPLICATION, label: t.grant, icon: <Briefcase size={20} /> },
        { id: ViewState.TITLE_PRISM, label: t.titlePrism, icon: <Gem size={20} /> },
      ]
    },
    {
      id: 'execution',
      title: groupT.execution,
      items: [
        { id: ViewState.EXPERIMENT_DESIGN, label: t.experimentDesign, icon: <Beaker size={20} /> },
        { id: ViewState.DATA_ANALYSIS, label: t.data, icon: <BarChart2 size={20} /> },
        { id: ViewState.CODE_ASSISTANT, label: t.code, icon: <Terminal size={20} /> },
        { id: ViewState.CHART_EXTRACTION, label: t.chart, icon: <Table2 size={20} /> },
        { id: ViewState.FIGURE_GEN, label: t.figure, icon: <ImageIcon size={20} /> },
        { id: ViewState.FLOWCHART, label: t.flowchart, icon: <Network size={20} /> },
      ]
    },
    {
      id: 'writing',
      title: groupT.writing,
      items: [
        { id: ViewState.REVIEW_GENERATION, label: t.review, icon: <FileText size={20} /> },
        { id: ViewState.POLISH, label: t.polish, icon: <PenTool size={20} /> },
        { id: ViewState.ADVISOR, label: t.advisor, icon: <User size={20} /> },
        { id: ViewState.PEER_REVIEW, label: t.peer, icon: <CheckSquare size={20} /> },
        { id: ViewState.PPT_GENERATION, label: t.ppt, icon: <MonitorPlay size={20} /> },
      ]
    },
    {
      id: 'utility',
      title: groupT.utility,
      items: [
        { id: ViewState.PDF_CHAT, label: t.pdfChat, icon: <MessageSquare size={20} /> },
        { id: ViewState.KNOWLEDGE_GRAPH, label: t.knowledge, icon: <Network size={20} /> },
        { id: ViewState.AI_DETECTOR, label: t.aiDetector, icon: <ShieldAlert size={20} /> },
      ]
    }
  ];

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-slate-800 transition-all duration-300 ${collapsed ? 'items-center' : ''}`}>
      {/* Toggle Button */}
      <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-3 pb-6 space-y-6">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${currentView === item.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'}
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : ''}
              >
                <div className={`${currentView === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            ))}
            {collapsed && <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-2"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;