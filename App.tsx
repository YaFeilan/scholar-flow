
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import SearchPanel from './components/SearchPanel';
import TrendDashboard from './components/TrendDashboard';
import ReferenceTracker from './components/ReferenceTracker';
import PeerReview from './components/PeerReview';
import ReviewGenerator from './components/ReviewGenerator';
import PolishAssistant from './components/PolishAssistant';
import Advisor from './components/Advisor';
import PPTGenerator from './components/PPTGenerator';
import OpeningReview from './components/OpeningReview';
import DataAnalysis from './components/DataAnalysis';
import CodeAssistant from './components/CodeAssistant';
import ExperimentDesign from './components/ExperimentDesign';
import KnowledgeGraph from './components/KnowledgeGraph';
import ChartExtraction from './components/ChartExtraction';
import GrantApplication from './components/GrantApplication';
import ConferenceFinder from './components/ConferenceFinder';
import AIDetector from './components/AIDetector';
import ResearchDiscussion from './components/ResearchDiscussion';
import TitlePrism from './components/TitlePrism';
import FlowchartGenerator from './components/FlowchartGenerator';
import AIWorkflow from './components/AIWorkflow';
import ResearchTraining from './components/ResearchTraining';
import PDFChat from './components/PDFChat';
import ScientificPlotting from './components/ScientificPlotting';
import IdeaGuide from './components/IdeaGuide';
import WelcomeModal from './components/WelcomeModal';
import { ViewState, Paper, Language } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.AI_WORKFLOW);
  const [language, setLanguage] = useState<Language>('EN');
  const [reviewPapers, setReviewPapers] = useState<Paper[]>([]);
  const [extractedData, setExtractedData] = useState<any[][] | null>(null);

  const handleReviewRequest = (papers: Paper[]) => {
    setReviewPapers(papers);
    setCurrentView(ViewState.REVIEW_GENERATION);
  };

  const handleExtractedData = (data: any[][]) => {
    setExtractedData(data);
    setCurrentView(ViewState.DATA_ANALYSIS);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans transition-colors duration-200">
      <WelcomeModal language={language} />
      <Navbar 
        language={language} 
        setLanguage={setLanguage} 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <main className="flex-grow overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          {currentView === ViewState.SEARCH && (
            <SearchPanel 
              onReviewRequest={handleReviewRequest} 
              language={language}
            />
          )}
          {currentView === ViewState.TRENDS && (
            <TrendDashboard language={language} />
          )}
          {currentView === ViewState.PEER_REVIEW && (
            <PeerReview language={language} />
          )}
          {currentView === ViewState.REVIEW_GENERATION && (
            <ReviewGenerator language={language} />
          )}
          {currentView === ViewState.TRACK && (
            <ReferenceTracker language={language} />
          )}
          {currentView === ViewState.POLISH && (
            <PolishAssistant language={language} />
          )}
          {currentView === ViewState.ADVISOR && (
            <Advisor language={language} />
          )}
          {currentView === ViewState.PPT_GENERATION && (
            <PPTGenerator language={language} />
          )}
          {currentView === ViewState.OPENING_REVIEW && (
            <OpeningReview language={language} />
          )}
          {currentView === ViewState.DATA_ANALYSIS && (
            <DataAnalysis language={language} initialData={extractedData} />
          )}
          {currentView === ViewState.CODE_ASSISTANT && (
            <CodeAssistant language={language} />
          )}
          {currentView === ViewState.EXPERIMENT_DESIGN && (
            <ExperimentDesign language={language} />
          )}
          {currentView === ViewState.KNOWLEDGE_GRAPH && (
            <KnowledgeGraph language={language} />
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
          {currentView === ViewState.RESEARCH_DISCUSSION && (
            <ResearchDiscussion language={language} />
          )}
          {currentView === ViewState.TITLE_PRISM && (
            <TitlePrism language={language} />
          )}
          {currentView === ViewState.FLOWCHART && (
            <FlowchartGenerator language={language} />
          )}
          {currentView === ViewState.AI_WORKFLOW && (
            <AIWorkflow language={language} />
          )}
          {currentView === ViewState.RESEARCH_TRAINING && (
            <ResearchTraining language={language} />
          )}
          {currentView === ViewState.PDF_CHAT && (
            <PDFChat language={language} />
          )}
          {currentView === ViewState.CHART_EXTRACTION && (
            <ChartExtraction 
              language={language} 
              onSendDataToAnalysis={handleExtractedData}
            />
          )}
          {currentView === ViewState.SCIENTIFIC_PLOTTING && (
            <ScientificPlotting language={language} />
          )}
          {currentView === ViewState.IDEA_GUIDE && (
            <IdeaGuide language={language} />
          )}
        </div>
      </main>
    </div>
  );
}
