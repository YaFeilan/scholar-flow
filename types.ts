
export type Language = 'ZH' | 'EN';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citations: number;
  badges: {
    type: 'SCI' | 'SSCI' | 'EI' | 'CNKI' | 'PubMed' | 'CJR' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'LOCAL';
    partition?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    if?: number;
  }[];
  abstract?: string;
  source?: 'online' | 'local';
  file?: File;
  addedDate?: string; // New field for "Date Added"
}

export interface SearchFilters {
  databases: string[]; // SCI, SSCI, EI, PubMed, CJR
  timeRange: string; // 'Last 3 Years', etc.
  partition: string[]; // Q1, Q2, etc.
}

export enum ViewState {
  SEARCH = 'SEARCH',
  TRENDS = 'TRENDS',
  PEER_REVIEW = 'PEER_REVIEW',
  REVIEW_GENERATION = 'REVIEW_GENERATION',
  TRACK = 'TRACK',
  POLISH = 'POLISH',
  ADVISOR = 'ADVISOR',
  PPT_GENERATION = 'PPT_GENERATION',
  IDEA_GUIDE = 'IDEA_GUIDE',
  OPENING_REVIEW = 'OPENING_REVIEW',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  CODE_ASSISTANT = 'CODE_ASSISTANT', // New ViewState
}

// Trend Types
export type TrendTimeRange = '1Y' | '3Y' | '5Y';
export type TrendPersona = 'Researcher' | 'Institution';

export interface TrendItem {
  name: string;
  growth: number;
  predictedGrowth?: number; // New: Future prediction
  type: string;
}

export interface HotspotItem {
  text: string;
  value: number; // size
  category: string;
  relatedTo?: string[]; // New: For graph connections
}

export interface MethodologyItem {
  name: string;
  value: number;
  growth: number;
  relatedHotspots: string[];
  codeStats?: { // New: Implementation stats
    github: string;
    huggingface: string;
  };
}

export interface ResearchGap {
  problem: string;
  potential: string;
  difficulty: 'High' | 'Medium' | 'Low';
  type: 'Blue Ocean' | 'Hard Problem';
}

export interface TrendAnalysisResult {
  emergingTech: TrendItem[];
  hotspots: HotspotItem[];
  methodologies: MethodologyItem[];
  researchGaps: ResearchGap[];
}

export interface TrackedPaperDetails {
  id?: string;
  title: string;
  author: string;
  year: number;
  description: string; // Role
  citations: number;
  sentiment: 'Support' | 'Dispute' | 'Mention';
  snippet: string;
  isStrong: boolean;
  doi?: string;
  userNote?: string;
}

export interface TrackedReference {
  category: string; // e.g., "Methodology", "Backbone", "Dataset"
  papers: TrackedPaperDetails[];
}

export interface GapAnalysisResult {
  missingThemes: string[];
  underrepresentedMethods: string[];
  suggestion: string;
}

// Polish Types
export type PolishMode = 'EnToEn' | 'CnToEn' | 'EnToCn';
export type PolishTone = 'Academic' | 'Native' | 'Concise' | 'Paraphrase';
export type PolishField = 'General' | 'Medicine' | 'CS' | 'SocialSciences' | 'Engineering' | 'Economics';

export interface PolishConfig {
  mode: PolishMode;
  tone: PolishTone;
  field: PolishField;
  glossary?: string;
}

export interface PolishChange {
  id: string; // unique id for linkage
  original: string;
  revised: string;
  reason: string;
  category: 'Grammar' | 'Vocabulary' | 'Tone' | 'Structure';
  status: 'accepted' | 'rejected' | 'pending';
}

export interface PolishResult {
  polishedText: string; // The full text (current state)
  overallComment: string;
  changes: PolishChange[];
  versionId: number;
}

export interface IdeaGuideResult {
  directions: {
    angle: string; // Research Angle
    description: string;
    methodology: string; // Practical models (DID, RDD, Transformer)
    dataSources: string; // Specific datasets (CFPS, CHNS)
    recommendedTitles: string[];
    corePapers: { // Key references to start with
      title: string;
      author: string;
      year: string;
    }[];
  }[];
  journals: {
    name: string;
    impactFactor: string;
    reviewCycle: string; // e.g., "3 months"
    acceptanceRate: string; // e.g., "15%"
    reason: string;
  }[];
}

export interface IdeaFollowUpResult {
  analysis: string;
  logicPath: string[]; // Visualization steps: IV -> Mechanism -> DV
  suggestions: {
    title: string;
    detail: string;
  }[];
  recommendedTerms: string[];
}

// Updated Peer Review Types
export type TargetType = 'SCI' | 'SSCI' | 'EI' | 'Coursework';

export interface ReviewerFeedback {
  roleName: string; // e.g., "The Domain Expert (Reviewer #2)"
  icon: 'Expert' | 'Language' | 'Editor';
  focusArea: string;
  critiques: {
    point: string;
    quote: string; // Evidence
    suggestion: string; // Actionable advice
  }[];
  score: number; // 1-10
}

export interface PeerReviewResponse {
  checklist: {
    originality: 'High' | 'Medium' | 'Low';
    soundness: 'Yes' | 'No' | 'Partial';
    clarity: 'Excellent' | 'Good' | 'Needs Improvement';
    recommendation: 'Accept' | 'Minor Revision' | 'Major Revision' | 'Reject';
  };
  reviewers: ReviewerFeedback[];
  summary: string;
}

// Opening Review Types
export type ReviewPersona = 'Gentle' | 'Critical';

export interface OpeningReviewResponse {
  overallScore: number;
  radarMap: {
    topic: number; // Topic Heat
    method: number; // Method Difficulty
    data: number; // Data Quality
    theory: number; // Theoretical Contribution
    language: number; // Language Style
  };
  executiveSummary: string;
  titleAnalysis: {
    critique: string;
    suggestions: string[];
  };
  methodologyAnalysis: {
    critique: string;
    suggestions: { original: string; better: string; reason: string }[];
  };
  logicAnalysis: {
    critique: string;
    gaps: string[];
  };
  journalFit: {
    score: number;
    analysis: string;
    alternativeJournals: { name: string; reason: string; if: string }[];
  };
  formatCheck: {
    status: 'Pass' | 'Warning' | 'Fail';
    issues: string[];
  };
  literature: {
    title: string;
    author: string;
    year: string;
    reason: string;
    link?: string;
  }[];
}

// Advisor Types
export interface AdvisorReport {
  matchScore: number; // 1-100
  matchLevel: 'High' | 'Medium' | 'Low';
  radar: {
    topic: number;
    method: number;
    novelty: number;
    scope: number;
    style: number;
  };
  analysis: string;
  titleSuggestions: {
    issue: string;
    revised: string;
  }[];
  keywords: {
    term: string;
    trend: 'Rising' | 'Stable' | 'Falling';
  }[];
  riskAssessment: {
    risk: string;
    severity: 'High' | 'Medium' | 'Low';
  }[];
  alternatives: {
    name: string;
    impactFactor: string;
    reason: string;
  }[];
  references: {
    title: string;
    author: string;
    year: string;
  }[];
  improvementSuggestions: {
    content: string;
    example: string;
  }[];
  timestamp: number; // for history
}

// Data Analysis Types
export interface DataAnalysisResult {
  summary: string;
  columns: {
    name: string;
    type: string;
    stats: string; // Concise stats summary string
  }[];
  correlations: {
    pair: string;
    value: number; // -1 to 1
    insight: string;
  }[];
  recommendedModels: {
    name: string; // e.g., ANOVA, Linear Regression
    reason: string;
    codeSnippet: string; // Python/R
  }[];
}

// Code Assistant Types
export interface CodeMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: { name: string; type: string }[];
}

export interface CodeSession {
  id: string;
  title: string;
  messages: CodeMessage[];
  lastModified: number;
  language: string;
}