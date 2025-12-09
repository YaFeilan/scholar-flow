
import { Paper, TrendItem, HotspotItem } from './types';

export const MOCK_PAPERS: Paper[] = [
  {
    id: '1',
    title: 'A Layered Ensemble Approach for Complex Classification Tasks',
    authors: ['J. Smith', 'A. Brown', 'C. Davis'],
    journal: 'Pattern Recognition',
    year: 2010,
    citations: 3500,
    badges: [{ type: 'SCI', partition: 'Q1' }, { type: 'Q1', if: 7.8, partition: 'Q1' }],
    abstract: 'This paper proposes a novel layered ensemble framework...',
    addedDate: '2023-11-15'
  },
  {
    id: '2',
    title: 'Adaptive Hierarchical Ensemble Learning for Time Series Forecasting in Dynamic Environments',
    authors: ['M. Chen', 'L. Wang', 'S. Kumar'],
    journal: 'IEEE Transactions on Neural Networks and Learning Systems',
    year: 2023,
    citations: 95,
    badges: [{ type: 'SCI', partition: 'Q1' }, { type: 'Q1', if: 14.3, partition: 'Q1' }],
    abstract: 'We introduce an adaptive mechanism for hierarchical ensembles...',
    addedDate: '2024-01-20'
  },
  {
    id: '3',
    title: 'Hierarchical Stacking Ensemble for Biomedical Image Classification',
    authors: ['D. Garcia', 'E. Rodriguez'],
    journal: 'Journal of Biomedical Informatics',
    year: 2018,
    citations: 420,
    badges: [{ type: 'SCI', partition: 'Q2' }, { type: 'Q2', if: 5.1, partition: 'Q2' }],
    abstract: 'Medical imaging requires high precision. This study applies stacking...',
    addedDate: '2023-09-10'
  },
  {
    id: '4',
    title: 'Explainable AI with Hierarchical Ensembles: A Post-Hoc Analysis Framework',
    authors: ['H. Kim', 'Y. Lee', 'J. Park'],
    journal: 'Expert Systems with Applications',
    year: 2024,
    citations: 12,
    badges: [{ type: 'SCI', partition: 'Q2' }, { type: 'Q2', if: 8.5, partition: 'Q2' }],
    abstract: 'Interpreting ensemble models is challenging. We present a framework...',
    addedDate: '2024-02-05'
  },
  {
    id: '5',
    title: 'Gradient Boosting in Hierarchical Structures: A Comparative Study',
    authors: ['A. Ivanov', 'S. Petrov'],
    journal: 'Machine Learning',
    year: 2021,
    citations: 150,
    badges: [{ type: 'SCI', partition: 'Q1' }, { type: 'Q1', if: 6.2, partition: 'Q1' }],
    abstract: 'Comparing XGBoost and LightGBM within hierarchical contexts...',
    addedDate: '2023-12-01'
  },
  {
    id: '6',
    title: 'Quantum Machine Learning: A Review and New Perspectives',
    authors: ['S. Hawking', 'A. Einstein (Simulated)', 'R. Penrose'],
    journal: 'Nature Physics',
    year: 2024,
    citations: 89,
    badges: [{ type: 'SCI', partition: 'Q1' }, { type: 'Q1', if: 19.6, partition: 'Q1' }],
    abstract: 'We review the current state of Quantum Machine Learning algorithms, focusing on variational quantum circuits...',
    addedDate: '2024-02-28'
  },
  // CNKI (Chinese) Mock Papers
  {
    id: 'cnki-1',
    title: '基于深度强化学习的智能电网调度策略研究', // Research on Smart Grid Scheduling Strategy Based on DRL
    authors: ['张伟', '李强', '王芳'],
    journal: '中国电机工程学报',
    year: 2023,
    citations: 28,
    badges: [{ type: 'CNKI' }, { type: 'EI' }],
    abstract: '为解决高比例新能源接入下的电网调度难题，本文提出了一种基于改进DQN的实时调度策略...',
    addedDate: '2024-01-10'
  },
  {
    id: 'cnki-2',
    title: '大语言模型在医学自然语言处理中的应用综述', // Survey of LLMs in Medical NLP
    authors: ['刘洋', '陈静'],
    journal: '计算机学报',
    year: 2024,
    citations: 15,
    badges: [{ type: 'CNKI' }, { type: 'CJR', partition: 'Q1' }],
    abstract: '大语言模型展现出强大的文本理解与生成能力。本文综述了其在电子病历分析、辅助诊断等领域的最新进展...',
    addedDate: '2024-03-01'
  },
  {
    id: 'cnki-3',
    title: '面向自动驾驶的多传感器融合感知技术', // Multi-sensor Fusion Perception for Autonomous Driving
    authors: ['赵铁柱', '孙悟空'],
    journal: '自动化学报',
    year: 2022,
    citations: 56,
    badges: [{ type: 'CNKI' }, { type: 'EI' }, { type: 'CJR', partition: 'Q2' }],
    abstract: '针对复杂交通场景，提出了一种基于Transformer的激光雷达与摄像头特征级融合算法...',
    addedDate: '2023-10-05'
  }
];

export const EMERGING_TECH: TrendItem[] = [
  { name: 'Multimodal AI (多模态AI)', growth: 320.5, predictedGrowth: 410.2, type: 'Emerging Tech' },
  { name: 'Foundation Models (基础模型)', growth: 285.2, predictedGrowth: 300.5, type: 'Emerging Tech' },
  { name: 'Quantum Machine Learning (量子机器学习)', growth: 230.7, predictedGrowth: 280.0, type: 'Emerging Tech' },
];

export const HOTSPOTS: HotspotItem[] = [
  { text: 'Large Language Models (大规模语言模型)', value: 100, category: 'AI', relatedTo: ['Generative AI', 'NLP'] },
  { text: 'Deep Learning (深度学习)', value: 85, category: 'AI', relatedTo: ['Computer Vision', 'NLP'] },
  { text: 'Computer Vision (计算机视觉)', value: 80, category: 'AI', relatedTo: ['Deep Learning'] },
  { text: 'Natural Language Processing (自然语言处理)', value: 75, category: 'AI', relatedTo: ['Large Language Models'] },
  { text: 'Reinforcement Learning (强化学习)', value: 70, category: 'AI', relatedTo: ['Robotics'] },
  { text: 'Generative AI', value: 65, category: 'AI', relatedTo: ['Large Language Models'] },
  { text: 'Graph Neural Networks', value: 60, category: 'AI', relatedTo: ['Deep Learning'] },
];
