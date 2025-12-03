
import React from 'react';
import { Search, FileText, TrendingUp, BookOpen, User, Globe, PenTool, CheckSquare } from 'lucide-react';
import { ViewState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, language, setLanguage }) => {
  const t = TRANSLATIONS[language].nav;
  const appName = TRANSLATIONS[language].appName;

  const navItems = [
    { label: 'Search', icon: <Search size={18} />, id: ViewState.SEARCH, text: t.search },
    { label: 'Review', icon: <FileText size={18} />, id: ViewState.REVIEW_GENERATION, text: t.review },
    { label: 'Tracking', icon: <BookOpen size={18} />, id: ViewState.TRACK, text: t.track },
    { label: 'Trends', icon: <TrendingUp size={18} />, id: ViewState.TRENDS, text: t.trends },
    { label: 'Advisor', icon: <User size={18} />, id: ViewState.ADVISOR, text: t.advisor },
    { label: 'Peer Review', icon: <CheckSquare size={18} />, id: ViewState.PEER_REVIEW, text: t.peer },
    { label: 'Polish', icon: <PenTool size={18} />, id: ViewState.POLISH, text: t.polish },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'ZH' : 'EN');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setView(ViewState.SEARCH)}>
              <div className="bg-blue-600 p-1.5 rounded-lg mr-2">
                <BookOpen className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">{appName}</span>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (Object.values(ViewState).includes(item.id as ViewState)) {
                      setView(item.id as ViewState);
                    }
                  }}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
                    ${currentView === item.id 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.text}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors"
              onClick={toggleLanguage}
            >
              <Globe size={18} className="mr-1.5" />
              <span>{language === 'ZH' ? '中文' : 'English'}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer">
              RA
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;