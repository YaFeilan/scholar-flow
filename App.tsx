
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
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
import FigureGenerator from './components/FigureGenerator';
import ChartExtraction from './components/ChartExtraction';
import GrantApplication from './components/GrantApplication';
import ConferenceFinder from './components/ConferenceFinder'; 
import AIDetector from './components/AIDetector'; 
import ResearchDiscussion from './components/ResearchDiscussion';
import TitlePrism from './components/TitlePrism';
import FlowchartGenerator from './components/FlowchartGenerator';
import VirtualAssistant from './components/VirtualAssistant';
import { ViewState, Paper, Language, ModelProvider } from './types';
import { generateLiteratureReview, setModelProvider } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { X, BookOpen, Key, ArrowRight, Github, Star, Heart, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SEARCH);
  const [language, setLanguage] = useState<Language>('EN');
  const [modelProvider, setModelProviderState] = useState<ModelProvider>('Gemini');
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ideaTopic, setIdeaTopic] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any[][] | null>(null);
  const [pdfChatFile, setPdfChatFile] = useState<File | null>(null);
  
  // API Key State
  const [hasKey, setHasKey] = useState(false);
  const [keyCheckLoading, setKeyCheckLoading] = useState(true);

  // Sidebar State (Legacy, keeping for PDFChat prop compatibility but always false/unused in layout)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
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

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if ((window as any).aistudio) {
            const has = await (window as any).aistudio.hasSelectedApiKey();
            setHasKey(has);
        } else {
            // Fallback for development environments without the injection
            setHasKey(false);
        }
      } catch (e) {
        console.error("API Key check failed", e);
        setHasKey(false);
      } finally {
        setKeyCheckLoading(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
      // Try to use the AI Studio dialog if available
      if ((window as any).aistudio) {
          try {
            await (window as any).aistudio.openSelectKey();
          } catch(e) {
              console.error("Failed to select key", e);
          }
      }
      
      // Always set hasKey to true to allow entry, 
      // ensuring the button works even if the API/Wrapper fails or is missing.
      setHasKey(true);
  };

  const handleSetModelProvider = (provider: ModelProvider) => {
      setModelProviderState(provider);
      setModelProvider(provider);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleReviewRequest = async (papers: Paper[]) => {
    setShowReviewModal(true);
    setGeneratedReview("Generating comprehensive review based on selected papers...");
    
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

  const handleSendDataToAnalysis = (data: any[][]) => {
      setAnalysisData(data);
      setCurrentView(ViewState.DATA_ANALYSIS);
  };

  const handleOpenPdfChat = (file: File) => {
      setPdfChatFile(file);
      setCurrentView(ViewState.PDF_CHAT);
  };

  if (keyCheckLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
      );
  }

  // Landing Page if no API Key
  if (!hasKey) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 font-sans">
              <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  
                  {/* Left Column: Welcome Message */}
                  <div className="space-y-8 animate-fadeIn">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                              <BookOpen size={24} className="text-white" />
                          </div>
                          <span className="text-2xl font-serif font-bold text-slate-800 dark:text-white tracking-tight">Research Assistant</span>
                      </div>
                      
                      <div>
                          <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Open Source</span> <br/>
                              Academic Copilot.
                          </h1>
                          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                              Accelerate your research with AI-powered literature review, data analysis, and writing tools. Completely free and open for the community.
                          </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                              onClick={handleSelectKey}
                              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group cursor-pointer"
                          >
                              <Zap size={20} className="fill-white" />
                              Get Started
                              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                          
                          <a 
                              href="https://github.com" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                          >
                              <Github size={20} />
                              Star on GitHub
                          </a>
                      </div>

                      <div className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-500" /> Secure & Private</span>
                          <span className="flex items-center gap-1.5"><Heart size={16} className="text-red-500" /> Free Forever</span>
                          <span className="flex items-center gap-1.5"><Github size={16} /> Open Source</span>
                      </div>
                  </div>

                  {/* Right Column: Visual Feature Grid */}
                  <div className="hidden lg:grid grid-cols-2 gap-4 animate-slideInRight">
                      <div className="space-y-4 mt-8">
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 mb-3"><BookOpen size={20} /></div>
                              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Literature Review</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Smart search & summarization.</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 mb-3"><Sparkles size={20} /></div>
                              <h3 className="font-bold text-slate-800 dark:text-white mb-1">AI Polishing</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Native-level academic writing.</p>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 mb-3"><Zap size={20} /></div>
                              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Idea Generator</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Brainstorm research directions.</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 mb-3"><ShieldCheck size={20} /></div>
                              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Grant Assistant</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Proposal checks & feedback.</p>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      {/* 2-Level Horizontal Navigation */}
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        language={language} 
        setLanguage={setLanguage}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="h-full">
            {currentView === ViewState.SEARCH && (
            <SearchPanel 
                onReviewRequest={handleReviewRequest} 
                language={language} 
                onChatRequest={handleOpenPdfChat}
            />
            )}
            {currentView === ViewState.IDEA_GUIDE && (
            <IdeaGuide 
                language={language} 
                initialTopic={ideaTopic} 
                onClearInitialTopic={() => setIdeaTopic('')}
            />
            )}
            {currentView === ViewState.RESEARCH_DISCUSSION && (
            <ResearchDiscussion language={language} />
            )}
            {currentView === ViewState.PDF_CHAT && (
            <PDFChat 
                language={language} 
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                initialFile={pdfChatFile}
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
            {currentView === ViewState.TITLE_PRISM && (
            <TitlePrism language={language} />
            )}
            {currentView === ViewState.FIGURE_GEN && (
            <FigureGenerator language={language} />
            )}
            {currentView === ViewState.FLOWCHART && (
            <FlowchartGenerator language={language} />
            )}
            {currentView === ViewState.CHART_EXTRACTION && (
            <ChartExtraction 
                language={language} 
                onSendDataToAnalysis={handleSendDataToAnalysis}
            />
            )}
            {currentView === ViewState.PPT_GENERATION && (
            <PPTGenerator language={language} />
            )}
            {currentView === ViewState.OPENING_REVIEW && (
            <OpeningReview language={language} />
            )}
            {currentView === ViewState.DATA_ANALYSIS && (
            <DataAnalysis language={language} initialData={analysisData} />
            )}
            {currentView === ViewState.CODE_ASSISTANT && (
            <CodeAssistant language={language} />
            )}
            {currentView === ViewState.EXPERIMENT_DESIGN && (
            <ExperimentDesign language={language} />
            )}
            {currentView === ViewState.GRANT_APPLICATION && (
            <GrantApplication language={language} />
            )}
            {currentView === ViewState.CONFERENCE_FINDER && (
            <ConferenceFinder language={language} />
            )}
            {currentView === ViewState.AI_DETECTOR && (
            <AIDetector language={language} />
            )}
        </div>
      </main>

      {/* Virtual Assistant Overlay */}
      <VirtualAssistant language={language} currentView={currentView} />

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
