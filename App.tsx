

import React, { useState } from 'react';
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
import { ViewState, Paper, Language } from './types';
import { generateLiteratureReview } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SEARCH);
  const [language, setLanguage] = useState<Language>('EN');
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ideaTopic, setIdeaTopic] = useState<string>('');

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
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar currentView={currentView} setView={setCurrentView} language={language} setLanguage={setLanguage} />
      
      <main className="pt-4">
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
        {currentView === ViewState.PPT_GENERATION && (
          <PPTGenerator language={language} />
        )}
        {currentView === ViewState.OPENING_REVIEW && (
          <OpeningReview language={language} />
        )}
      </main>

      {/* Modal for Generated Literature Review (From Search Panel) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold font-serif text-slate-800">Generated Review</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto prose prose-slate max-w-none flex-grow">
               <ReactMarkdown>{generatedReview || ''}</ReactMarkdown>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Close</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Export PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
