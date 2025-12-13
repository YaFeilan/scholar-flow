import React from 'react';
import { 
  Search, FileText, TrendingUp, BookOpen, User, Globe, PenTool, CheckSquare, 
  MonitorPlay, Lightbulb, ClipboardCheck, Moon, Sun, MessagesSquare, 
  Briefcase, BarChart2, Terminal, Beaker, Table2, Network, Gem, Image as ImageIcon, 
  Calendar, ShieldAlert, Workflow, MessageSquare, Zap 
} from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
}

const Navbar: React.FC<NavbarProps> = ({ language, setLanguage, currentView, setCurrentView }) => {
  const t = TRANSLATIONS[language].nav;
  const groupT = TRANSLATIONS[language].groups;

  // Define Group Structure mapping ViewStates to Categories
  const navGroups = [
    {
      id: 'discovery',
      title: groupT.discovery,
      items: [
        { id: ViewState.AI_WORKFLOW, label: t.aiWorkflow, icon: <Zap size={16} /> },
        { id: ViewState.SEARCH, label: t.search, icon: <Search size={16} /> },
        { id: ViewState.TRENDS, label: t.trends, icon: <TrendingUp size={16} /> },
        { id: ViewState.TRACK, label: t.track, icon: <BookOpen size={16} /> },
        { id: ViewState.CONFERENCE_FINDER, label: t.conference, icon: <Calendar size={16} /> },
      ]
    },
    {
      id: 'planning',
      title: groupT.planning,
      items: [
        { id: ViewState.IDEA_GUIDE, label: t.idea, icon: <Lightbulb size={16} /> },
        { id: ViewState.RESEARCH_DISCUSSION, label: t.discussion, icon: <MessagesSquare size={16} /> },
        { id: ViewState.OPENING_REVIEW, label: t.opening, icon: <ClipboardCheck size={16} /> },
        { id: ViewState.GRANT_APPLICATION, label: t.grant, icon: <Briefcase size={16} /> },
        { id: ViewState.TITLE_PRISM, label: t.titlePrism, icon: <Gem size={16} /> },
      ]
    },
    {
      id: 'execution',
      title: groupT.execution,
      items: [
        { id: ViewState.EXPERIMENT_DESIGN, label: t.experimentDesign, icon: <Beaker size={16} /> },
        { id: ViewState.DATA_ANALYSIS, label: t.data, icon: <BarChart2 size={16} /> },
        { id: ViewState.CODE_ASSISTANT, label: t.code, icon: <Terminal size={16} /> },
        { id: ViewState.CHART_EXTRACTION, label: t.chart, icon: <Table2 size={16} /> },
        { id: ViewState.FIGURE_GEN, label: t.figure, icon: <ImageIcon size={16} /> },
        { id: ViewState.FLOWCHART, label: t.flowchart, icon: <Network size={16} /> },
      ]
    },
    {
      id: 'writing',
      title: groupT.writing,
      items: [
        { id: ViewState.REVIEW_GENERATION, label: t.review, icon: <FileText size={16} /> },
        { id: ViewState.POLISH, label: t.polish, icon: <PenTool size={16} /> },
        { id: ViewState.ADVISOR, label: t.advisor, icon: <User size={16} /> },
        { id: ViewState.PEER_REVIEW, label: t.peer, icon: <CheckSquare size={16} /> },
        { id: ViewState.PPT_GENERATION, label: t.ppt, icon: <MonitorPlay size={16} /> },
      ]
    },
    {
      id: 'utility',
      title: groupT.utility,
      items: [
        { id: ViewState.PDF_CHAT, label: t.pdfChat, icon: <MessageSquare size={16} /> },
        { id: ViewState.KNOWLEDGE_GRAPH, label: t.knowledge, icon: <Network size={16} /> },
        { id: ViewState.AI_DETECTOR, label: t.aiDetector, icon: <ShieldAlert size={16} /> },
      ]
    }
  ];

  return (
    <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Workflow className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-serif font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          {TRANSLATIONS[language].appName}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'EN' ? 'ZH' : 'EN')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2 text-sm font-bold"
        >
          <Globe size={18} />
          <span>{language}</span>
        </button>

        {/* Theme Toggle (Mock for now, could act as real toggle if state lifted) */}
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Moon size={18} className="hidden dark:block" />
          <Sun size={18} className="block dark:hidden" />
        </button>
        
        {/* User Profile (Mock) */}
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
            <User size={16} className="text-slate-500 dark:text-slate-300" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;