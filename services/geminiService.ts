
import { GoogleGenAI } from "@google/genai";

import {
  Language,
  Paper,
  TrendTimeRange,
  TrendPersona,
  TrendAnalysisResult,
  PeerReviewResponse,
  TargetType,
  PolishConfig,
  PolishResult,
  AdvisorReport,
  IdeaGuideResult,
  IdeaFollowUpResult,
  OpeningReviewResponse,
  ReviewPersona,
  DataAnalysisResult,
  ExperimentDesignResult,
  GraphNode,
  GraphLink,
  ChartExtractionResult,
  GrantCheckResult,
  LogicNode,
  ConferenceFinderResult,
  GrantPolishVersion,
  GraphSuggestionsResult,
  AIDetectionResult,
  AIHumanizeResult,
  ModelProvider
} from "../types";

// --- Configuration ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let currentProvider: ModelProvider = 'Gemini';

// Helper to set provider dynamically
export const setModelProvider = (provider: ModelProvider) => {
  currentProvider = provider;
};

// DeepSeek/OpenAI Compatible API Logic
const callDeepSeek = async (messages: any[], jsonMode: boolean = false): Promise<string> => {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.API_KEY; // Fallback for demo
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" },
        stream: false
      })
    });

    if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    return "";
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const getText = async (prompt: string, image?: File, modelName: string = 'gemini-2.5-flash'): Promise<string> => {
  // If provider is DeepSeek and NO image is present (DeepSeek V3 is text-only usually)
  if (currentProvider === 'DeepSeek' && !image) {
      return callDeepSeek([{ role: "user", content: prompt }]);
  }

  try {
    let contents: any = prompt;
    if (image) {
      const base64 = await fileToBase64(image);
      contents = {
        parts: [
          { inlineData: { mimeType: image.type, data: base64 } },
          { text: prompt }
        ]
      };
    } else {
        contents = { parts: [{ text: prompt }] };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
    });
    return response.text || '';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating response.";
  }
};

const getJson = async <T>(prompt: string, image?: File, modelName: string = 'gemini-2.5-flash'): Promise<T | null> => {
  // DeepSeek JSON Mode
  if (currentProvider === 'DeepSeek' && !image) {
      const systemMsg = { role: "system", content: "You are a helpful assistant. Output must be valid JSON." };
      const userMsg = { role: "user", content: prompt };
      const resultText = await callDeepSeek([systemMsg, userMsg], true);
      try {
          // Clean markdown code blocks if present
          const cleanText = resultText.replace(/```json\n?|```/g, '');
          return JSON.parse(cleanText) as T;
      } catch (e) {
          console.error("DeepSeek JSON Parse Error", e);
          return null;
      }
  }

  try {
    let contents: any = prompt;
    if (image) {
      const base64 = await fileToBase64(image);
      contents = {
        parts: [
          { inlineData: { mimeType: image.type, data: base64 } },
          { text: prompt }
        ]
      };
    } else {
        contents = { parts: [{ text: prompt }] };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "{}";
    const cleanText = text.replace(/```json\n?|```/g, '');
    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error("Gemini API JSON Error:", error);
    return null;
  }
};

// ... existing exported functions ...

export const generateOpeningReview = async (file: File, target: string, language: Language, persona: ReviewPersona): Promise<OpeningReviewResponse | null> => {
  const prompt = `Act as an academic reviewer for an Opening Proposal / Review for "${target}". Persona: ${persona}.
  Analyze the uploaded document critically.
  Language: ${language}.
  
  IMPORTANT: 
  1. For every "weakness", you MUST provide an exact "quote" from the text that corresponds to the issue. This quote will be used to highlight the text in the PDF viewer. If no exact quote exists (e.g. missing section), use "N/A".
  2. Evaluate based on these 5 dimensions: Innovation, Logic, Feasibility, Literature, Format.
  
  You MUST return a valid JSON object matching the following structure exactly:
  {
    "overallScore": 85,
    "radarMap": {
      "innovation": 80,
      "logic": 75,
      "feasibility": 85,
      "literature": 70,
      "format": 90
    },
    "executiveSummary": "A concise summary...",
    "titleAnalysis": {
      "strengths": ["Clear", "Concise"],
      "weaknesses": [
         { "point": "Too broad", "quote": "The study of everything in the world", "suggestion": "Narrow down to specific X" }
      ],
      "score": 8
    },
    "methodologyAnalysis": {
      "strengths": ["Robust design"],
      "weaknesses": [
         { "point": "Sample size unclear", "quote": "We will interview some people", "suggestion": "Specify N=..." }
      ],
      "score": 7
    },
    "logicAnalysis": {
        "strengths": [],
        "weaknesses": [],
        "score": 8
    },
    "literatureAnalysis": {
        "strengths": [],
        "weaknesses": [],
        "score": 6
    },
    "journalFit": {
      "score": 8,
      "analysis": "Fit analysis...",
      "alternativeJournals": [
        { "name": "Journal A", "reason": "Why...", "if": "5.5" }
      ]
    }
  }`;
  return getJson(prompt, file);
};

export const optimizeOpeningSection = async (section: string, context: string, language: Language): Promise<string> => {
  const prompt = `Optimize this section of an opening report: "${section}".
  Context/Critique: ${context}
  Language: ${language}.
  Return the rewritten text only.`;
  return getText(prompt);
};

export const generatePaperInterpretation = async (paper: Paper, language: Language): Promise<string> => {
  const prompt = `Interpret the following academic paper for a researcher.
  Title: ${paper.title}
  Abstract: ${paper.abstract || 'N/A'}
  
  Provide a structured summary including:
  1. Core Problem
  2. Methodology
  3. Key Findings
  4. Implications
  
  Language: ${language === 'ZH' ? 'Simplified Chinese' : 'English'}`;
  
  return getText(prompt);
};

export const searchAcademicPapers = async (query: string, language: Language, limit: number = 5): Promise<Paper[]> => {
  const prompt = `Search for academic papers related to: "${query}".
  Provide ${limit} results. 
  For each paper, provide: title, authors (list), journal, year, citations (approx), abstract (brief).
  Simulate a real search result.
  Language: ${language}.
  Return as a JSON array of objects matching the Paper interface.
  Include badges for SCI/Q1 if applicable.`;

  let results = await getJson<any[]>(prompt);
  if (!results) return [];
  if (!Array.isArray(results)) {
      if ((results as any).papers && Array.isArray((results as any).papers)) {
          results = (results as any).papers;
      } else {
          return [];
      }
  }
  return results.map((p: any, i: number) => ({
      id: `gen-${i}-${Date.now()}`,
      title: p.title || "Untitled",
      authors: Array.isArray(p.authors) ? p.authors : [],
      journal: p.journal || "Unknown Journal",
      year: p.year || new Date().getFullYear(),
      citations: p.citations || 0,
      abstract: p.abstract || "",
      badges: Array.isArray(p.badges) ? p.badges : [],
      source: 'online',
      addedDate: new Date().toISOString().split('T')[0]
  }));
};

export const analyzeResearchTrends = async (topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> => {
  const prompt = `Analyze research trends for "${topic}" over the past ${timeRange}.
  Persona: ${persona}.
  Language: ${language}.
  Return JSON with:
  - emergingTech: array of {name, growth (number), type}
  - hotspots: array of {text, value, category}
  - methodologies: array of {name, value, growth}
  - researchGaps: array of {problem, potential, difficulty, type}`;
  
  return getJson<TrendAnalysisResult>(prompt);
};

export const getPaperTLDR = async (title: string, language: Language): Promise<string> => {
  const prompt = `Provide a 1-sentence TL;DR for the paper titled "${title}". Language: ${language}.`;
  return getText(prompt);
};

export const performPeerReview = async (content: string, filename: string, type: TargetType, journal: string, language: Language): Promise<PeerReviewResponse | null> => {
  const prompt = `Perform a simulated peer review for the file "${filename}" targeting ${journal || type}.
  Content/Summary: ${content.substring(0, 5000)}...
  
  Provide:
  1. Checklist (originality, soundness, clarity, recommendation)
  2. Reviewers (3 personas: Expert, Language, Editor) with specific critiques.
  3. Executive Summary.
  
  Language: ${language}.
  Return JSON matching PeerReviewResponse interface.`;
  
  return getJson<PeerReviewResponse>(prompt);
};

export const generateRebuttalLetter = async (critiques: string, language: Language): Promise<string> => {
  const prompt = `Draft a polite and professional rebuttal letter addressing the following critiques:
  ${critiques}
  
  Language: ${language}.`;
  return getText(prompt);
};

export const generateCoverLetter = async (summary: string, journal: string, language: Language): Promise<string> => {
  const prompt = `Write a cover letter for a submission to ${journal}.
  Paper Summary: ${summary}
  
  Language: ${language}.`;
  return getText(prompt);
};

export const generateLiteratureReview = async (paperDescriptions: string[], language: Language): Promise<string> => {
  const prompt = `Generate a comprehensive literature review based on these papers:
  ${paperDescriptions.join('\n\n')}
  
  Synthesize the findings, identify common themes, and highlight gaps.
  Language: ${language}.`;
  return getText(prompt);
};

export const generateStructuredReview = async (topic: string, papers: string[], wordCount: number, language: 'ZH' | 'EN'): Promise<string> => {
  const prompt = `Write a structured literature review on "${topic}".
  Papers: ${papers.join('\n')}
  Target Word Count: ${wordCount}.
  Language: ${language === 'ZH' ? 'Simplified Chinese' : 'English'}.
  Structure: Introduction, Methodological Trends, Key Findings, Gaps, Conclusion.`;
  return getText(prompt);
};

export const trackCitationNetwork = async (query: string, isFile: boolean, language: Language): Promise<any> => {
  const prompt = `Generate a simulated citation network for the paper/topic: "${query}".
  Include 3 categories (e.g. Foundational, Supporting, Conflicting).
  For each category, list 3-5 relevant papers with title, author, year, citation count, sentiment.
  Language: ${language}.
  Return JSON array of { category, papers: [] }.`;
  
  const result = await getJson<any[]>(prompt);
  return Array.isArray(result) ? result : [];
};

export const analyzeNetworkGaps = async (papers: any[], language: Language): Promise<any> => {
  const prompt = `Analyze the following papers to find research gaps:
  ${JSON.stringify(papers.map((p:any) => p.title))}
  
  Language: ${language}.
  Return JSON: { missingThemes: string[], underrepresentedMethods: string[], suggestion: string }`;
  return getJson(prompt);
};

export const chatWithCitationNetwork = async (query: string, contextPapers: any[], language: Language): Promise<string> => {
  const prompt = `Context: ${JSON.stringify(contextPapers.map((p:any) => ({title: p.title, desc: p.description})))}
  User Query: ${query}
  Answer based on the context. Language: ${language}.`;
  return getText(prompt);
};

export const polishContent = async (content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> => {
  const prompt = `Polish the following text.
  Mode: ${config.mode}. Tone: ${config.tone}. Field: ${config.field}. Glossary: ${config.glossary}.
  
  Input: ${typeof content === 'string' ? content : 'Attached File Content'}
  
  Return JSON:
  {
    "polishedText": "Full text...",
    "overallComment": "...",
    "changes": [ { "id": "1", "original": "...", "revised": "...", "reason": "...", "category": "Grammar", "status": "pending" } ]
  }`;
  
  if (content instanceof File) {
      return getJson(prompt, content);
  }
  return getJson(prompt);
};

export const refinePolish = async (currentText: string, instruction: string, language: Language): Promise<PolishResult | null> => {
  const prompt = `Refine the text based on instruction: "${instruction}".
  Current Text: ${currentText}
  Language: ${language}.
  Return JSON with polishedText and changes.`;
  return getJson(prompt);
};

export const generateAdvisorReport = async (title: string, journal: string, abstract: string, language: Language): Promise<AdvisorReport | null> => {
  const prompt = `Evaluate the fit of paper "${title}" for journal "${journal}".
  Abstract: ${abstract}
  
  Language: ${language}.
  Return JSON matching AdvisorReport interface.
  Structure:
  - matchScore: number
  - matchLevel: High/Medium/Low
  - radar: { topic, method, novelty, scope, style } (0-100)
  - analysis: string
  - titleSuggestions: array of { issue, revised }
  - keywords: array of { term, trend }
  - riskAssessment: array of { risk, severity }
  - alternatives: array of { name, impactFactor, reason }
  - references: array of { title, author, year }
  - improvementSuggestions: array of { content, example }`;
  return getJson(prompt);
};

export const generatePPTStyleSuggestions = async (file: File, language: Language): Promise<any[]> => {
  const prompt = `Analyze this paper and suggest 3 PPT visual styles (themes).
  For each style: name, description, colorPalette (array of hex codes).
  Language: ${language}. Return JSON array.`;
  const result = await getJson<any[]>(prompt, file);
  return Array.isArray(result) ? result : [];
};

export const generatePPTContent = async (file: File, config: any, language: Language): Promise<any> => {
  const prompt = `Generate a PPT outline for this paper.
  Config: ${JSON.stringify(config)}.
  Language: ${language}.
  Return JSON: { title, slides: [ { title, content: [], speakerNotes, visualSuggestion, layout } ] }`;
  return getJson(prompt, file);
};

export const generateSlideImage = async (description: string, style: string): Promise<string> => {
  // If using DeepSeek, we fallback to no image or mock, as it's text only. 
  // However, for strict adherence to user request "Use Gemini for Image", we force Gemini here.
  // The global 'getText' and 'getJson' handle the switch, but direct calls to ai.models.generateImages
  // are inherently Google GenAI calls. So this remains safe.
  const prompt = `Create a presentation slide background/visual.
  Description: ${description}.
  Style: ${style}.
  Type: Scientific Illustration.`;
  
  try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, aspectRatio: '16:9' }
      });
      if (response.generatedImages && response.generatedImages.length > 0) {
          return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
      }
  } catch (e) {
      console.error("Image Gen Error", e);
  }
  return ""; 
};

export const generateResearchIdeas = async (topic: string, language: Language, focus: string): Promise<IdeaGuideResult | null> => {
  const prompt = `Generate research ideas for "${topic}" with focus on "${focus}".
  Language: ${language}.
  Return JSON matching IdeaGuideResult (directions, journals).`;
  return getJson(prompt);
};

export const generateIdeaFollowUp = async (topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> => {
  const prompt = `Follow up on research idea. Topic: ${topic}. Angle: ${angle}.
  User Question: ${query}
  Language: ${language}.
  Return JSON matching IdeaFollowUpResult.`;
  return getJson(prompt);
};

export const performDataAnalysis = async (stats: any, language: Language, targetVar: string): Promise<DataAnalysisResult | null> => {
  const prompt = `Analyze this dataset stats. Target Variable: ${targetVar}.
  Stats: ${JSON.stringify(stats)}
  
  Language: ${language}.
  Return JSON matching DataAnalysisResult (summary, columns, correlations, featureImportance, recommendedModels).`;
  return getJson(prompt);
};

export const chatWithDataAnalysis = async (query: string, stats: any, language: Language): Promise<string> => {
  const prompt = `Answer question about data.
  Stats: ${JSON.stringify(stats).substring(0, 5000)}...
  Question: ${query}
  Language: ${language}.`;
  return getText(prompt);
};

export const performCodeAssistance = async (
    input: string, 
    mode: 'generate'|'debug'|'explain', 
    lang: string, 
    language: Language, 
    history: any[],
    file?: File,
    onStream?: (text: string) => void,
    signal?: AbortSignal
): Promise<string> => {
    let prompt = `Act as a ${lang} coding assistant. Mode: ${mode}.
    User Input: ${input}.
    Language: ${language}.`;
    
    // Fallback logic for DeepSeek if streaming isn't fully implemented in this demo
    if (currentProvider === 'DeepSeek') {
        const fullHistory = [...history, {role: 'user', content: prompt}];
        const response = await callDeepSeek(fullHistory.map(h => ({role: h.role === 'model' ? 'assistant' : 'user', content: h.text || h.content})));
        if (onStream) onStream(response);
        return response;
    }

    return getText(prompt, file); 
};

export const generateExperimentDesign = async (hypothesis: string, field: string, method: string, language: Language, iv: string, dv: string, statsParams: any, structure: string): Promise<ExperimentDesignResult | null> => {
  const prompt = `Design a rigorous academic experiment based on the following:
  - Hypothesis: "${hypothesis}"
  - Field: ${field}
  - Method: ${method}
  - Structure: ${structure}
  - Independent Variable (IV): ${iv}
  - Dependent Variable (DV): ${dv}
  - Statistical Parameters: ${JSON.stringify(statsParams)}
  
  Language: ${language}.
  
  You MUST return a VALID JSON object with the following structure:
  {
    "title": "Experiment Title",
    "flow": [
      { "step": 1, "name": "Step Name", "description": "Details..." },
      { "step": 2, "name": "Step Name", "description": "Details..." }
    ],
    "sampleSize": {
      "recommended": 100,
      "explanation": "Brief reasoning...",
      "parameters": [
        { "label": "Alpha", "value": "0.05" },
        { "label": "Power", "value": "0.80" },
        { "label": "Effect Size", "value": "Medium" }
      ]
    },
    "variables": {
      "independent": ["IV1"],
      "dependent": ["DV1"],
      "control": ["C1"],
      "confounders": ["Potential Confounder"]
    },
    "analysis": {
      "method": "Statistical Test Name",
      "description": "Analysis description..."
    }
  }`;
  return getJson(prompt);
};

export const optimizeHypothesis = async (hypothesis: string, language: Language): Promise<string> => {
  const prompt = `Refine this research hypothesis to be more scientific and testable: "${hypothesis}". Language: ${language}. Return only the hypothesis.`;
  return getText(prompt);
};

export const performPDFChat = async (query: string, language: Language, file: File, history: any[], onStream: (text: string) => void, signal?: AbortSignal): Promise<string> => {
  const prompt = `Context: PDF Document.
  Chat History: ${JSON.stringify(history)}
  User Query: ${query}
  Language: ${language}.
  
  Answer the user comprehensively. 
  IMPORTANT: When referring to specific concepts, data points, models, or headers found in the document, create a clickable link using the format: [Keyword](source:Keyword).
  For example, if discussing "Spatial Durbin Model", write it as [Spatial Durbin Model](source:Spatial Durbin Model) or [SDM](source:SDM).
  This allows the user to click and jump to the original text.`;
  
  return getText(prompt, file);
};

export const explainVisualContent = async (imageBlob: Blob, promptText: string, language: Language): Promise<string> => {
  const file = new File([imageBlob], "visual_content.png", { type: "image/png" });
  const prompt = `Analyze this visual content (formula, chart, or figure crop) from a paper.
  User Question: ${promptText}
  Language: ${language}.
  Provide a clear, technical explanation.`;
  return getText(prompt, file);
};

export const generateKnowledgeGraph = async (nodes: GraphNode[], language: Language): Promise<GraphLink[]> => {
  const prompt = `Generate connections (links) between these nodes: ${JSON.stringify(nodes.map(n => ({id: n.id, label: n.label})))}.
  Language: ${language}.
  Return JSON array of GraphLink { source, target, label }.`;
  const result = await getJson<GraphLink[]>(prompt);
  return Array.isArray(result) ? result : [];
};

export const analyzeImageNote = async (file: File, language: Language): Promise<string> => {
  const prompt = `Transcribe and summarize this image note. Language: ${language}.`;
  return getText(prompt, file);
};

export const chatWithKnowledgeGraph = async (query: string, nodes: GraphNode[], language: Language, onStream: (text: string) => void): Promise<string> => {
  const prompt = `Context: Knowledge Graph Nodes: ${JSON.stringify(nodes.map(n => n.label))}.
  Query: ${query}
  Language: ${language}.`;
  return getText(prompt);
};

export const generateGraphSuggestions = async (nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> => {
  const prompt = `Suggest new related nodes and links for this graph context: ${JSON.stringify(nodes.map(n => n.label))}.
  Language: ${language}.
  Return JSON matching GraphSuggestionsResult.`;
  return getJson(prompt);
};

export const deepParsePDF = async (file: File, language: Language): Promise<any> => {
  const prompt = `Deep parse this PDF. Extract structure, formulas, algorithms.
  Language: ${language}.
  Return JSON: { summary: string, elements: [{ label, type, content }] }`;
  return getJson(prompt, file);
};

export const runCodeSimulation = async (code: string, language: Language): Promise<string> => {
  const prompt = `Simulate the execution of this code and return the output or result description:
  ${code}
  Language: ${language}.`;
  return getText(prompt);
};

export const findRelevantNodes = async (query: string, nodes: GraphNode[], language: Language): Promise<string[]> => {
  const prompt = `Find node IDs relevant to "${query}" from this list: ${JSON.stringify(nodes.map(n => ({id: n.id, label: n.label, content: n.content})))}.
  Return JSON array of strings (ids).`;
  const result = await getJson<string[]>(prompt);
  return Array.isArray(result) ? result : [];
};

export const generateScientificFigure = async (prompt: string, style: string, mode: string, file?: File, bgOnly?: boolean, mask?: File, size?: string): Promise<string> => {
  return generateSlideImage(prompt, style); 
};

export const extractChartData = async (file: File, language: Language, mode: 'chart' | 'formula' | 'text' | 'auto' = 'auto'): Promise<ChartExtractionResult | null> => {
  let specificInstructions = "";
  if (mode === 'formula') {
      specificInstructions = "Focus on identifying and converting mathematical formulas. Return valid LaTeX code in the 'ocrText' field. Provide a brief explanation in 'fullDescription'. Set type to 'Formula'. Data array can be empty.";
  } else if (mode === 'text') {
      specificInstructions = "Focus on transcribing handwritten or printed text including notes. Return the full text in 'ocrText'. Set type to 'Text'. Data array can be empty.";
  } else {
      specificInstructions = "If 'auto' mode: Detect type (Chart, Formula, Text). If Chart: Extract data into JSON 'data' array AND transcribe any visible text/labels/captions into 'ocrText'. If Formula: Return LaTeX in 'ocrText'.";
  }

  const prompt = `Analyze this image. Mode: ${mode}.
  Language: ${language}.
  ${specificInstructions}
  
  Requirements:
  1. Identify the content type (Chart, Formula, Text, Diagram).
  2. Provide a 'fullDescription' describing the content (or formula explanation).
  3. If Chart: Extract data into JSON 'data' array.
  4. If Formula: Output standard LaTeX string in 'ocrText'.
  5. If Text: Output transcription in 'ocrText'.
  6. If Auto: Detect type and fill corresponding fields. For Charts, include any non-data text in ocrText.
  
  Return JSON matching ChartExtractionResult (title, type, summary, data[], ocrText, fullDescription).`;
  
  return getJson(prompt, file);
};

export const generateChartTrendAnalysis = async (data: any[], language: Language): Promise<string> => {
  const prompt = `Analyze trends in this data: ${JSON.stringify(data.slice(0, 20))}.
  Language: ${language}.`;
  return getText(prompt);
};

export const generateGrantLogicFramework = async (config: any, language: Language, mode: string, refs: any[]): Promise<LogicNode | null> => {
  const prompt = `Generate a logic framework (mind map tree) for a grant proposal.
  Topic: ${config.name}.
  Mode: ${mode}.
  Language: ${language}.
  Return JSON matching LogicNode structure.`;
  return getJson(prompt);
};

export const expandGrantRationale = async (node: LogicNode, language: Language): Promise<string> => {
  const prompt = `Expand this logic tree into a full grant rationale text:
  ${JSON.stringify(node)}
  Language: ${language}.`;
  return getText(prompt);
};

export const polishGrantProposal = async (text: string, section: string, language: Language, context: string): Promise<any> => {
  const prompt = `Polish this grant proposal section: ${section}.
  Context: ${context}.
  Text: ${text}.
  Language: ${language}.
  Return JSON: { versions: [{ type, clean, revisions, comment }] }`;
  return getJson(prompt);
};

export const checkGrantFormat = async (content: string | File, language: Language): Promise<GrantCheckResult | null> => {
  const prompt = `Check this grant proposal for format, logic, and anonymity.
  Language: ${language}.
  Return JSON matching GrantCheckResult.`;
  if (content instanceof File) return getJson(prompt, content);
  return getJson(prompt + `\nContent: ${content}`);
};

export const getGrantInspiration = async (topic: string, code: string, language: Language): Promise<string[]> => {
  const prompt = `Provide 3 "golden sentences" or inspiration for a grant on "${topic}" (Code: ${code}).
  Language: ${language}.
  Return JSON array of strings.`;
  const result = await getJson<string[]>(prompt);
  return Array.isArray(result) ? result : [];
};

export const findConferences = async (topic: string, language: Language): Promise<ConferenceFinderResult | null> => {
  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = `Find upcoming academic conferences and journals for "${topic}".
  Current Date: ${currentDate}.
  Language: ${language}.
  Return JSON matching ConferenceFinderResult (conferences[], journals[]).`;
  return getJson(prompt);
};

// --- AI Detection Functions ---

export const detectAIContent = async (content: string | File, language: Language): Promise<AIDetectionResult | null> => {
  const prompt = `Analyze the following text for signs of AI generation (predictability, low perplexity, repetitive structures, lack of nuance).
  Language: ${language}.
  
  Provide:
  1. An estimated AI Probability Score (0-100).
  2. A brief analysis of why (e.g. "Sentences are too uniform").
  3. Identify specific sentences that look most AI-generated.
  
  Return JSON matching AIDetectionResult (score, analysis, highlightedSentences[{text, reason, score}]).`;
  
  if (content instanceof File) {
      return getJson(prompt, content);
  }
  return getJson(prompt + `\n\nText: ${content}`);
};

export const humanizeText = async (text: string, language: Language): Promise<AIHumanizeResult | null> => {
  const prompt = `Rewrite the following text to reduce its AI probability score.
  Goal: Increase burstiness and perplexity. Use more varied sentence structures, idiomatic expressions, and human-like flow.
  Language: ${language}.
  
  Return JSON matching AIHumanizeResult (originalScore, newScore, text, changesSummary).`;
  
  return getJson(prompt + `\n\nText: ${text}`);
};
