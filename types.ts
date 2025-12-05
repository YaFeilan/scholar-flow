
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
}

export interface TrendItem {
  name: string;
  growth: number;
  type: string;
}

export interface HotspotItem {
  text: string;
  value: number; // size
  category: string;
}

export interface TrackedReference {
  category: string; // e.g., "Methodology", "Backbone", "Dataset"
  papers: {
    title: string;
    author: string;
    year: number;
    description: string; // How it was used in the main paper
  }[];
}

export interface PolishResult {
  polishedText: string;
  overallComment: string;
  changes: {
    original: string;
    revised: string;
    reason: string;
    category: 'Grammar' | 'Vocabulary' | 'Tone' | 'Structure';
  }[];
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