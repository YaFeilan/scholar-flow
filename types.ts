
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
    angle: string;
    description: string;
    recommendedTitles: string[];
  }[];
  journals: {
    name: string;
    impactFactor: string;
    reason: string;
  }[];
}

export interface IdeaFollowUpResult {
  analysis: string;
  suggestions: {
    title: string;
    detail: string;
  }[];
  recommendedTerms: string[];
}