
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SearchPanel from './components/SearchPanel';
import TrendDashboard from './components/TrendDashboard';
import PeerReview from './components/PeerReview';
import ReviewGenerator from './components/ReviewGenerator';
import ReferenceTracker from './components/ReferenceTracker';
import PolishAssistant from './components/PolishAssistant';
import Advisor from './components/Advisor';
import PPTGenerator from './components/PPTGenerator';
import IdeaGuide from './components/IdeaGuide';
import OpeningReview from './components/OpeningReview';
import DataAnalysis from './components/DataAnalysis';
import CodeAssistant from './components/CodeAssistant';
import ExperimentDesign from './components/ExperimentDesign';
import PDFChat from './components/PDFChat';
import KnowledgeGraph from './components/KnowledgeGraph';
import FigureGenerator from './components/FigureGenerator'; // New Import
import { ViewState, Paper, Language } from './types';
import { generateLiteratureReview } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.IDEA_GUIDE); // Start with Idea Guide in new flow
  const [language, setLanguage] = useState<Language>('EN');
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ideaTopic, setIdeaTopic] = useState<string>('');
  
  // Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check local storage or system preference on initial load
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleReviewRequest = async (papers: Paper[]) => {
    // Show modal immediately with loading state (handled inside by waiting for content)
    setShowReviewModal(true);
    setGeneratedReview("Generating comprehensive review based on selected papers...");
    
    // Format papers for Gemini
    const paperDescriptions = papers.map(p => 
      `Title: ${p.title}. Abstract: ${p.abstract || 'N/A'}. Year: ${p.year}`
    );
    
    const result = await generateLiteratureReview(paperDescriptions, language);
    setGeneratedReview(result);
  };

  const closeModal = () => {
    setShowReviewModal(false);
    setGeneratedReview(null);
  };

  const handleNavigateToIdea = (topic: string) => {
    setIdeaTopic(topic);
    setCurrentView(ViewState.IDEA_GUIDE);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar Layout */}
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        language={language} 
        setLanguage={setLanguage}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        collapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="h-full">
            {currentView === ViewState.SEARCH && (
            <SearchPanel onReviewRequest={handleReviewRequest} language={language} />
            )}
            {currentView === ViewState.IDEA_GUIDE && (
            <IdeaGuide 
                language={language} 
                initialTopic={ideaTopic} 
                onClearInitialTopic={() => setIdeaTopic('')}
            />
            )}
            {currentView === ViewState.PDF_CHAT && (
            <PDFChat 
                language={language} 
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
            />
            )}
            {currentView === ViewState.KNOWLEDGE_GRAPH && (
            <KnowledgeGraph language={language} />
            )}
            {currentView === ViewState.REVIEW_GENERATION && (
            <ReviewGenerator language={language} />
            )}
            {currentView === ViewState.TRACK && (
            <ReferenceTracker language={language} />
            )}
            {currentView === ViewState.TRENDS && (
            <TrendDashboard language={language} onNavigateToIdea={handleNavigateToIdea} />
            )}
            {currentView === ViewState.ADVISOR && (
            <Advisor language={language} />
            )}
            {currentView === ViewState.PEER_REVIEW && (
            <PeerReview language={language} />
            )}
            {currentView === ViewState.POLISH && (
            <PolishAssistant language={language} />
            )}
            {currentView === ViewState.FIGURE_GEN && (
            <FigureGenerator language={language} />
            )}
            {currentView === ViewState.PPT_GENERATION && (
            <PPTGenerator language={language} />
            )}
            {currentView === ViewState.OPENING_REVIEW && (
            <OpeningReview language={language} />
            )}
            {currentView === ViewState.DATA_ANALYSIS && (
            <DataAnalysis language={language} />
            )}
            {currentView === ViewState.CODE_ASSISTANT && (
            <CodeAssistant language={language} />
            )}
            {currentView === ViewState.EXPERIMENT_DESIGN && (
            <ExperimentDesign language={language} />
            )}
        </div>
      </main>

      {/* Modal for Generated Literature Review (From Search Panel) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold font-serif text-slate-800 dark:text-slate-100">Generated Review</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto prose prose-slate dark:prose-invert max-w-none flex-grow">
               <ReactMarkdown>{generatedReview || ''}</ReactMarkdown>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Close</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Export PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
