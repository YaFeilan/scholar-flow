import { Paper, TrendItem, HotspotItem } from './types';

export const MOCK_PAPERS: Paper[] = [
  {
    id: '1',
    title: 'A Layered Ensemble Approach for Complex Classification Tasks',
    authors: ['J. Smith', 'A. Brown', 'C. Davis'],
    journal: 'Pattern Recognition',
    year: 2010,
    citations: 3500,
    badges: [{ type: 'SCI' }, { type: 'Q1', if: 7.8 }],
    abstract: 'This paper proposes a novel layered ensemble framework...'
  },
  {
    id: '2',
    title: 'Adaptive Hierarchical Ensemble Learning for Time Series Forecasting in Dynamic Environments',
    authors: ['M. Chen', 'L. Wang', 'S. Kumar'],
    journal: 'IEEE Transactions on Neural Networks and Learning Systems',
    year: 2023,
    citations: 95,
    badges: [{ type: 'SCI' }, { type: 'Q1', if: 14.3 }],
    abstract: 'We introduce an adaptive mechanism for hierarchical ensembles...'
  },
  {
    id: '3',
    title: 'Hierarchical Stacking Ensemble for Biomedical Image Classification',
    authors: ['D. Garcia', 'E. Rodriguez'],
    journal: 'Journal of Biomedical Informatics',
    year: 2018,
    citations: 420,
    badges: [{ type: 'SCI' }, { type: 'Q2', if: 5.1 }],
    abstract: 'Medical imaging requires high precision. This study applies stacking...'
  },
  {
    id: '4',
    title: 'Explainable AI with Hierarchical Ensembles: A Post-Hoc Analysis Framework',
    authors: ['H. Kim', 'Y. Lee', 'J. Park'],
    journal: 'Expert Systems with Applications',
    year: 2024,
    citations: 12,
    badges: [{ type: 'SCI' }, { type: 'Q2', if: 8.5 }],
    abstract: 'Interpreting ensemble models is challenging. We present a framework...'
  },
  {
    id: '5',
    title: 'Gradient Boosting in Hierarchical Structures: A Comparative Study',
    authors: ['A. Ivanov', 'S. Petrov'],
    journal: 'Machine Learning',
    year: 2021,
    citations: 150,
    badges: [{ type: 'SCI' }, { type: 'Q1', if: 6.2 }],
    abstract: 'Comparing XGBoost and LightGBM within hierarchical contexts...'
  }
];

export const EMERGING_TECH: TrendItem[] = [
  { name: 'Multimodal AI (多模态AI)', growth: 320.5, type: 'Emerging Tech' },
  { name: 'Foundation Models (基础模型)', growth: 285.2, type: 'Emerging Tech' },
  { name: 'Quantum Machine Learning (量子机器学习)', growth: 230.7, type: 'Emerging Tech' },
];

export const HOTSPOTS: HotspotItem[] = [
  { text: 'Large Language Models (大规模语言模型)', value: 100, category: 'AI' },
  { text: 'Deep Learning (深度学习)', value: 85, category: 'AI' },
  { text: 'Computer Vision (计算机视觉)', value: 80, category: 'AI' },
  { text: 'Natural Language Processing (自然语言处理)', value: 75, category: 'AI' },
  { text: 'Reinforcement Learning (强化学习)', value: 70, category: 'AI' },
  { text: 'Generative AI', value: 65, category: 'AI' },
  { text: 'Graph Neural Networks', value: 60, category: 'AI' },
];
