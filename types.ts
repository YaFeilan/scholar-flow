
export type Language = 'ZH' | 'EN';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citations: number;
  badges: {
    type: 'SCI' | 'SSCI' | 'EI' | 'CNKI' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'LOCAL';
    partition?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    if?: number;
  }[];
  abstract?: string;
  source?: 'online' | 'local';
  file?: File;
}

export interface SearchFilters {
  databases: string[]; // SCI, SSCI, EI
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
