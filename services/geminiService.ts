
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
  ModelProvider,
  GrantReviewResult
} from "../types";

// --- Configuration ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let currentProvider: ModelProvider = 'Gemini';

// Helper to set provider dynamically
export const setModelProvider = (provider: ModelProvider) => {
  currentProvider = provider;
};

// DeepSeek Compatible API Logic
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

// Doubao / Ark Compatible API Logic
const callDoubao = async (messages: any[], jsonMode: boolean = false): Promise<string> => {
  try {
    const apiKey = process.env.DOUBAO_API_KEY || process.env.API_KEY; 
    // Ark Base URL
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.DOUBAO_MODEL || "doubao-pro-32k", // Needs Endpoint ID in real usage, utilizing generic mapping for demo
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
        throw new Error(`Doubao API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Doubao API Call Failed:", error);
    return "";
  }
};

// OpenAI / ChatGPT Compatible API Logic
const callOpenAI = async (messages: any[], jsonMode: boolean = false, model: string = "gpt-4o"): Promise<string> => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY; 
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" },
      })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Call Failed:", error);
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

  // If provider is Doubao (Ark)
  if (currentProvider === 'Doubao') {
      // Doubao currently supports text primarily via standard chat endpoints in this implementation
      if (image) console.warn("Doubao provider in this demo supports Text-only input. Image ignored.");
      return callDoubao([{ role: "user", content: prompt }]);
  }

  // If provider is ChatGPT (OpenAI)
  if (currentProvider === 'ChatGPT') {
      const model = 'gpt-4o'; // Good default for vision
      if (image) {
           const base64 = await fileToBase64(image);
           const messages = [
               {
                   role: "user",
                   content: [
                       { type: "text", text: prompt },
                       { type: "image_url", image_url: { url: `data:${image.type};base64,${base64}` } }
                   ]
               }
           ];
           return callOpenAI(messages, false, model);
      }
      return callOpenAI([{ role: "user", content: prompt }], false, model);
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

  // Doubao JSON Mode (Simulated via System Prompt)
  if (currentProvider === 'Doubao' && !image) {
      const systemMsg = { role: "system", content: "You are a helpful assistant. You MUST output valid JSON only. Do not wrap in markdown." };
      const userMsg = { role: "user", content: prompt };
      const resultText = await callDoubao([systemMsg, userMsg], true); // jsonMode param passed but strictly prompt enforced for Doubao/Ark
      try {
          const cleanText = resultText.replace(/```json\n?|```/g, '');
          return JSON.parse(cleanText) as T;
      } catch (e) {
          console.error("Doubao JSON Parse Error", e);
          return null;
      }
  }

  // ChatGPT JSON Mode
  if (currentProvider === 'ChatGPT') {
      const systemMsg = { role: "system", content: "You are a helpful assistant. Output must be valid JSON." };
      let userMsg: any;
      if (image) {
          const base64 = await fileToBase64(image);
          userMsg = {
              role: "user",
              content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:${image.type};base64,${base64}` } }
              ]
          };
      } else {
          userMsg = { role: "user", content: prompt };
      }
      
      const resultText = await callOpenAI([systemMsg, userMsg], true, 'gpt-4o');
      try {
          const cleanText = resultText.replace(/```json\n?|```/g, '');
          return JSON.parse(cleanText) as T;
      } catch (e) {
          console.error("OpenAI JSON Parse Error", e);
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

export const searchAcademicPapers = async (query: string, language: Language, limit: number = 10): Promise<Paper[]> => {
  const prompt = `Act as an academic search engine. Generate ${limit} realistic academic papers related to the query: "${query}".
  Include a mix of high-impact (SCI Q1/Q2) and specialized papers.
  Output Language: ${language}.
  
  For each paper, provide:
  - id (unique string)
  - title
  - authors (array of strings)
  - journal
  - year (between 2018-2024)
  - citations (realistic number)
  - abstract (2-3 sentences)
  - badges: Array of objects { type: 'SCI'|'SSCI'|'EI'|'CJR', partition: 'Q1'|'Q2'|'Q3'|'Q4', if: number }
  - addedDate: Random date in YYYY-MM-DD format within the last 2 years.

  Return ONLY valid JSON array.`;

  const result = await getJson<Paper[]>(prompt);
  return result || [];
};

export const generatePaperInterpretation = async (paper: Paper, language: Language): Promise<string> => {
  const prompt = `Interpret this academic paper for a researcher.
  Title: ${paper.title}
  Abstract: ${paper.abstract}
  
  Provide a concise structured summary in ${language === 'ZH' ? 'Chinese' : 'English'}:
  1. **Core Problem**: What are they solving?
  2. **Methodology**: What technique did they use?
  3. **Key Finding**: What is the main result?
  4. **Implication**: Why does it matter?`;

  return getText(prompt);
};

export const generateSimulatedFullText = async (paper: Paper, language: Language): Promise<string> => {
  const disclaimer = language === 'ZH' 
    ? '> **⚠️ AI 生成内容声明：** 本文由人工智能根据论文标题与摘要生成，旨在提供结构化阅读模拟，**并非原始文献**。请通过正规渠道获取官方全文。\n\n'
    : '> **⚠️ AI GENERATED CONTENT:** This document was generated by AI based on metadata to simulate the reading experience. It is **NOT** the original academic paper. Please verify with the official source.\n\n';

  const prompt = `Act as the author of the academic paper titled "${paper.title}".
  
  Context:
  Authors: ${paper.authors.join(', ')}
  Journal: ${paper.journal}
  Year: ${paper.year}
  Abstract: ${paper.abstract}

  Task: Generate a COMPREHENSIVE simulated full-text version of this paper in ${language === 'ZH' ? 'Chinese' : 'English'}.
  It must look like a real academic paper structure.
  
  IMPORTANT: Start the response with this EXACT disclaimer:
  ${disclaimer}
  
  Structure required:
  # ${paper.title}
  ## Abstract
  (Use the provided abstract)
  ## 1. Introduction
  (Background, gap in research, and objectives. approx 200 words)
  ## 2. Methodology
  (Describe the theoretical framework, data sources, and algorithms used. Use specific terminology related to the topic. approx 250 words)
  ## 3. Results
  (Simulate quantitative or qualitative results. Mention Tables/Figures effectively. approx 250 words)
  ## 4. Discussion
  (Interpret the results, compare with existing literature, mention limitations. approx 200 words)
  ## 5. Conclusion
  (Summarize findings and future work)
  ## References
  (List 5 realistic looking citations in APA format)

  Make the content sound highly academic, professional, and plausible based on the title and abstract.`;

  return getText(prompt);
};

export const extractChartData = async (file: File, language: Language, mode: 'chart' | 'formula' | 'text' | 'auto'): Promise<ChartExtractionResult> => {
  const prompt = `Analyze this image thoroughly to extract ALL content. Mode: ${mode}.
  Language: ${language}.
  
  Goal: Extract all meaningful information from the image.
  
  1. If Mode is 'chart' or 'auto': Extract data into a structured JSON array.
  2. If Mode is 'formula' or 'auto': Identify math formulas and convert to LaTeX.
  3. If Mode is 'text' or 'auto': Perform comprehensive OCR on all visible text.
  4. ALWAYS provide a 'fullDescription' encompassing all visual elements, relationships, and key insights.
  
  Return a JSON object:
  {
    "title": "Main Title or Topic",
    "type": "Chart / Formula / Text / etc.",
    "summary": "Concise summary",
    "fullDescription": "Detailed visual description of the image contents including text analysis.",
    "data": [
       // If chart/table: Array of objects representing rows. Keys should be column headers.
       // Example: [{"Year": "2020", "Value": 10}, ...]
       // If no chart data, return empty array [].
    ],
    "ocrText": "Full raw text or LaTeX code extracted from the image. If it's a document, transcribe everything."
  }`;

  const result = await getJson<ChartExtractionResult>(prompt, file, 'gemini-2.5-flash');
  return result || { title: 'Extraction Failed', type: 'Unknown', summary: 'Could not parse', data: [] };
};

export const analyzeResearchTrends = async (topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> => {
    const prompt = `Analyze research trends for "${topic}".
    Time Range: ${timeRange}. Persona: ${persona}.
    Language: ${language}.
    
    Return JSON:
    {
      "emergingTech": [{ "name": "string", "growth": number (percentage), "predictedGrowth": number, "type": "string" }],
      "hotspots": [{ "text": "string", "value": number (1-100), "category": "string", "relatedTo": ["string"] }],
      "methodologies": [{ "name": "string", "value": number, "growth": number, "relatedHotspots": ["string"], "codeStats": { "github": "string", "huggingface": "string" } }],
      "researchGaps": [{ "problem": "string", "potential": "string", "difficulty": "High"|"Medium"|"Low", "type": "Blue Ocean"|"Hard Problem" }]
    }`;
    
    return getJson<TrendAnalysisResult>(prompt);
};

export const getPaperTLDR = async (title: string, language: Language): Promise<string> => {
    return getText(`Provide a one-sentence TL;DR for the paper "${title}" in ${language}. Keep it under 30 words.`);
};

export const generateLiteratureReview = async (papers: string[], language: Language): Promise<string> => {
    return getText(`Generate a literature review based on these paper summaries:\n${papers.join('\n')}\n\nLanguage: ${language}. Structure: Thematic.`);
};

export const generateStructuredReview = async (topic: string, papers: string[], wordCount: number, outputLang: 'ZH' | 'EN'): Promise<string> => {
    return getText(`Write a structured literature review on "${topic}". 
    Target Word Count: ${wordCount}. 
    Language: ${outputLang === 'ZH' ? 'Chinese' : 'English'}.
    Papers to include:\n${papers.join('\n')}`);
};

export const trackCitationNetwork = async (query: string, isFile: boolean, language: Language): Promise<any> => {
    const prompt = `Simulate a citation network for "${query}". 
    Return a list of categorized references in JSON format:
    [{ "category": "Methodology", "papers": [{ "title": "...", "author": "...", "year": 2023, "description": "...", "citations": 150, "sentiment": "Support"|"Dispute"|"Mention", "snippet": "...", "isStrong": true }] }]`;
    return getJson(prompt);
};

export const analyzeNetworkGaps = async (papers: any[], language: Language): Promise<any> => {
    const prompt = `Analyze these papers to find research gaps. Return JSON: { "missingThemes": [], "underrepresentedMethods": [], "suggestion": "..." }`;
    return getJson(prompt);
};

export const chatWithCitationNetwork = async (query: string, context: any[], language: Language): Promise<string> => {
    return getText(`Context: ${JSON.stringify(context)}. User Question: ${query}. Answer in ${language}.`);
};

export const polishContent = async (content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> => {
    let textToPolish = "";
    if (content instanceof File) {
        // Mock file reading or assume text passed
        textToPolish = "File content placeholder";
    } else {
        textToPolish = content;
    }
    
    const prompt = `Polish this text.
    Mode: ${config.mode}. Tone: ${config.tone}. Field: ${config.field}. Glossary: ${config.glossary || 'None'}.
    Input Text: "${textToPolish.substring(0, 2000)}"
    
    Return JSON:
    {
        "polishedText": "Full polished text string...",
        "overallComment": "Summary of changes...",
        "changes": [
            { "id": "1", "original": "text", "revised": "text", "reason": "...", "category": "Grammar"|"Vocabulary"|"Tone"|"Structure", "status": "pending" }
        ],
        "versionId": 1
    }`;
    
    return getJson<PolishResult>(prompt);
};

export const refinePolish = async (currentText: string, instruction: string, language: Language): Promise<PolishResult | null> => {
    const prompt = `Refine this text based on instruction: "${instruction}".
    Current Text: "${currentText.substring(0, 2000)}"
    
    Return JSON in same format as PolishResult.`;
    return getJson<PolishResult>(prompt);
};

export const generateAdvisorReport = async (title: string, journal: string, abstract: string, language: Language): Promise<AdvisorReport | null> => {
    const prompt = `Evaluate paper fit for journal.
    Title: ${title}
    Target: ${journal}
    Abstract: ${abstract}
    Language: ${language}
    
    Return JSON matching AdvisorReport interface.`;
    return getJson<AdvisorReport>(prompt);
};

export const generatePPTStyleSuggestions = async (file: File, language: Language): Promise<any[]> => {
    const prompt = `Suggest 3 PPT styles for this paper. Return JSON array: [{ "id": "1", "name": "Minimalist", "description": "...", "colorPalette": ["#hex", "#hex"] }]`;
    return getJson<any[]>(prompt);
};

export const generatePPTContent = async (file: File, config: any, language: Language): Promise<any> => {
    const prompt = `Generate PPT content for this paper. Config: ${JSON.stringify(config)}.
    Return JSON: { "title": "...", "slides": [{ "title": "...", "content": ["point 1", "point 2"], "speakerNotes": "...", "layout": "BulletPoints"|"ImageWithText", "visualSuggestion": "Description of image to generate" }] }`;
    return getJson(prompt);
};

export const generateSlideImage = async (prompt: string, style: string): Promise<string> => {
    // Mock image generation for now
    return "https://via.placeholder.com/800x450.png?text=AI+Generated+Visual";
};

export const generateResearchIdeas = async (topic: string, language: Language, focus: string): Promise<IdeaGuideResult | null> => {
    const prompt = `Generate research ideas for topic: "${topic}". Focus: ${focus}. Language: ${language}.
    Return JSON matching IdeaGuideResult interface.`;
    return getJson<IdeaGuideResult>(prompt);
};

export const generateIdeaFollowUp = async (topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> => {
    const prompt = `Deep dive into research angle "${angle}" for topic "${topic}". User Question: "${query}".
    Return JSON matching IdeaFollowUpResult interface.`;
    return getJson<IdeaFollowUpResult>(prompt);
};

export const generateOpeningReview = async (file: File, target: string, language: Language, persona: ReviewPersona): Promise<OpeningReviewResponse | null> => {
    const prompt = `Review this opening section (Introduction/Abstract). Target: ${target}. Persona: ${persona}. Language: ${language}.
    Return JSON matching OpeningReviewResponse interface.`;
    return getJson<OpeningReviewResponse>(prompt);
};

export const optimizeOpeningSection = async (section: string, context: string, language: Language): Promise<string> => {
    return getText(`Optimize this section: "${section}". Issues to fix: "${context}". Language: ${language}. Return only the rewritten text.`);
};

export const performDataAnalysis = async (stats: any, language: Language, targetVar?: string): Promise<DataAnalysisResult | null> => {
    const prompt = `Analyze this dataset stats. Target Variable: ${targetVar || 'None'}. Language: ${language}.
    Stats: ${JSON.stringify(stats).substring(0, 3000)}
    
    Return JSON matching DataAnalysisResult interface.`;
    return getJson<DataAnalysisResult>(prompt);
};

export const chatWithDataAnalysis = async (query: string, stats: any, language: Language): Promise<string> => {
    return getText(`Context: Dataset Stats. User Question: "${query}". Answer in ${language}. Stats: ${JSON.stringify(stats).substring(0, 2000)}`);
};

export const performCodeAssistance = async (input: string, mode: string, lang: string, language: Language, history: any[], file?: File, onStream?: (text: string) => void, signal?: AbortSignal): Promise<string> => {
    const prompt = `Act as a senior developer. Mode: ${mode}. Language: ${lang}. Output Language: ${language}.
    History: ${JSON.stringify(history).substring(0, 2000)}
    Input: ${input}
    ${file ? `File context provided.` : ''}`;
    
    const text = await getText(prompt);
    if (onStream) onStream(text); // Simulate stream end
    return text;
};

export const generateExperimentDesign = async (hypothesis: string, field: string, methodology: string, language: Language, iv: string, dv: string, statsParams: any, structure: string): Promise<ExperimentDesignResult | null> => {
    const prompt = `Design an experiment.
    Hypothesis: ${hypothesis}
    Field: ${field}
    Methodology: ${methodology}
    Structure: ${structure}
    IV: ${iv}, DV: ${dv}
    Stats Params: ${JSON.stringify(statsParams)}
    Language: ${language}
    
    Return JSON matching ExperimentDesignResult interface.`;
    return getJson<ExperimentDesignResult>(prompt);
};

export const optimizeHypothesis = async (current: string, language: Language): Promise<string> => {
    return getText(`Refine this research hypothesis to be more specific and falsifiable. Language: ${language}. Input: "${current}"`);
};

export const performPDFChat = async (query: string, language: Language, file: File, history: any[], onStream: (text: string) => void, signal?: AbortSignal): Promise<string> => {
    const prompt = `Context: PDF Document. History: ${JSON.stringify(history)}. Question: "${query}". Answer in ${language}.`;
    const text = await getText(prompt);
    if (onStream) onStream(text);
    return text;
};

export const explainVisualContent = async (file: File, query: string, language: Language): Promise<string> => {
    return getText(`Explain this visual. Question: ${query}. Language: ${language}.`, file);
};

export const generateKnowledgeGraph = async (nodes: GraphNode[], language: Language): Promise<GraphLink[]> => {
    const prompt = `Given these nodes: ${JSON.stringify(nodes.map(n => ({id: n.id, label: n.label})))}.
    Generate connections (links). Return JSON array of { source: string, target: string, label: string }.`;
    return getJson<GraphLink[]>(prompt) || [];
};

export const analyzeImageNote = async (file: File, language: Language): Promise<string> => {
    return getText(`Analyze this image note. Transcribe text and summarize key concepts. Language: ${language}.`, file);
};

export const chatWithKnowledgeGraph = async (query: string, nodes: GraphNode[], language: Language, onStream: (text: string) => void): Promise<string> => {
    const prompt = `Context: Knowledge Graph Nodes: ${JSON.stringify(nodes.map(n => n.label))}. Question: "${query}". Answer in ${language}.`;
    return getText(prompt);
};

export const generateGraphSuggestions = async (currentNodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> => {
    const prompt = `Based on these nodes: ${JSON.stringify(currentNodes.map(n => n.label))}, suggest 3 new related concepts/papers (ghost nodes) and how they link.
    Return JSON: { "recommendedNodes": [GraphNode], "suggestedLinks": [GraphLink] }`;
    return getJson<GraphSuggestionsResult>(prompt);
};

export const deepParsePDF = async (file: File, language: Language): Promise<{ summary: string, elements: { type: string, content: string, label: string }[] } | null> => {
    // Simulating deep parsing
    return {
        summary: "Simulated deep parse summary...",
        elements: [
            { type: 'Formula', content: 'E=mc^2', label: 'Mass-Energy' },
            { type: 'Algorithm', content: 'Transformers architecture...', label: 'Transformer' }
        ]
    };
};

export const runCodeSimulation = async (code: string, language: Language): Promise<string> => {
    // Mock execution
    return `[Output] Simulation completed for code length ${code.length}.\nResult: Success (Mock)`;
};

export const findRelevantNodes = async (query: string, nodes: GraphNode[], language: Language): Promise<string[]> => {
    // Mock semantic search
    return nodes.filter(n => n.label.toLowerCase().includes(query.toLowerCase())).map(n => n.id);
};

export const generateScientificFigure = async (prompt: string, style: string, mode: string, file?: File, bgOnly?: boolean, mask?: File, size?: '1K'|'2K'|'4K'): Promise<string> => {
    // Mock generation
    return "https://via.placeholder.com/800x600.png?text=Scientific+Figure+(Mock)";
};

export const generateChartTrendAnalysis = async (data: any[], language: Language): Promise<string> => {
    const prompt = `Analyze this chart data trend. Data: ${JSON.stringify(data).substring(0, 1000)}. Language: ${language}.
    Provide a professional academic description of the trend.`;
    return getText(prompt);
};

export const generateGrantLogicFramework = async (config: any, language: Language, mode: string, references: any[]): Promise<LogicNode | null> => {
    // Simplified reference passing using names if they are files, to avoid circular JSON error or huge payload
    const refContext = references.map(r => {
        if (r.content instanceof File) return `Paper: ${r.content.name}`;
        return `Reference: ${r.content}`;
    }).join('; ');

    const prompt = `Generate a logic framework tree for grant "${config.name}" (Keywords: ${config.keywords}, Code: ${config.domainCode}).
    Mode: ${mode}.
    Language: ${language}.
    
    References Context: ${refContext}.
    
    Return a valid JSON object matching this structure exactly:
    {
      "id": "root",
      "label": "Project Title",
      "children": [
        {
          "id": "unique_id_1",
          "label": "Main Point 1",
          "children": [
             { "id": "unique_id_1_1", "label": "Sub Point 1", "children": [] }
          ]
        }
      ]
    }
    Ensure the tree is at least 3 levels deep to provide a comprehensive framework.`;
    return getJson<LogicNode>(prompt);
};

export const expandGrantRationale = async (node: LogicNode, language: Language): Promise<string> => {
    return getText(`Expand this logic tree into a full grant rationale text. Tree: ${JSON.stringify(node)}. Language: ${language}.`);
};

export const polishGrantProposal = async (text: string, section: string, language: Language, context: string): Promise<any> => {
    const prompt = `Polish the following grant proposal section.
    Section Type: "${section}".
    Context: ${context}.
    Input Text: "${text.substring(0, 2000)}..."
    Language: ${language}.
    
    Return a valid JSON object with this structure:
    {
        "versions": [
            {
                "type": "Conservative",
                "clean": "Full polished text...",
                "revisions": "Text with **markdown** highlights of changes...",
                "comment": "Brief explanation of changes"
            },
            {
                "type": "Aggressive",
                "clean": "Full polished text...",
                "revisions": "Text with **markdown** highlights...",
                "comment": "Brief explanation"
            },
            {
                "type": "Professional",
                "clean": "Full polished text...",
                "revisions": "Text with **markdown** highlights...",
                "comment": "Brief explanation"
            }
        ]
    }`;
    return getJson(prompt);
};

export const checkGrantFormat = async (content: string | File, language: Language): Promise<GrantCheckResult | null> => {
    const contentStr = content instanceof File ? `File: ${content.name}` : content;
    const prompt = `Act as a strict grant reviewer. Check the following grant proposal content for format compliance, logic consistency, and anonymity (if blinded review required).
    Content Snippet: "${contentStr.substring(0, 2000)}..."
    Language: ${language}.
    
    Return a valid JSON object with this structure:
    {
      "score": number (0-100),
      "summary": "Brief executive summary of findings",
      "hardErrors": {
        "status": "Pass" | "Fail",
        "issues": ["List of critical formatting or eligibility errors"]
      },
      "logicCheck": {
        "status": "Pass" | "Warning",
        "issues": ["List of logical gaps or flow issues"]
      },
      "formatCheck": {
        "status": "Pass" | "Fail",
        "issues": ["Font size, margins, section numbering issues"]
      },
      "anonymityCheck": {
        "status": "Pass" | "Fail",
        "issues": ["Any names or identifiers found if applicable"]
      }
    }`;
    return getJson<GrantCheckResult>(prompt);
};

export const generateGrantReview = async (content: string | File, language: Language, role: string, framework: string): Promise<GrantReviewResult | null> => {
    const contentStr = content instanceof File ? `File: ${content.name}` : content;
    const prompt = `Act as a ${role} reviewing a grant proposal.
    Review Framework/Focus: ${framework}.
    Proposal Content Snippet: "${contentStr.substring(0, 3000)}...".
    Language: ${language}.
    
    Evaluate thoroughly based on the framework.
    Return a valid JSON object matching this structure:
    {
      "overallScore": number (0-100),
      "verdict": "Strongly Recommended" | "Recommended" | "Consider" | "Not Recommended",
      "summary": "Executive summary of the review",
      "dimensions": [
        { "name": "Dimension Name (e.g. Innovation)", "score": number (0-10), "comment": "Specific feedback" }
      ],
      "strengths": ["List of key strengths"],
      "weaknesses": ["List of key weaknesses"],
      "improvementSuggestions": ["Actionable advice"]
    }`;
    
    return getJson<GrantReviewResult>(prompt);
};

export const getGrantInspiration = async (title: string, code: string, language: Language): Promise<string[]> => {
    const prompt = `Provide 3 "golden sentences" for a grant proposal titled "${title}" (Code: ${code}). Language: ${language}. Return JSON string array.`;
    return getJson<string[]>(prompt) || [];
};

export const findConferences = async (query: string, language: Language): Promise<ConferenceFinderResult | null> => {
    const prompt = `Find upcoming academic conferences and special issues for "${query}". Language: ${language}.
    Return JSON matching ConferenceFinderResult interface with realistic data (CCF ranks, deadlines).`;
    return getJson<ConferenceFinderResult>(prompt);
};

export const detectAIContent = async (content: string | File, language: Language): Promise<AIDetectionResult | null> => {
    const prompt = `Detect AI content probability. Content: "${typeof content === 'string' ? content.substring(0, 500) : 'File'}". Language: ${language}.
    Return JSON matching AIDetectionResult.`;
    return getJson<AIDetectionResult>(prompt);
};

export const humanizeText = async (content: string, language: Language): Promise<AIHumanizeResult | null> => {
    const prompt = `Rewrite this text to be more human-like and bypass AI detectors. Content: "${content.substring(0, 500)}". Language: ${language}.
    Return JSON matching AIHumanizeResult.`;
    return getJson<AIHumanizeResult>(prompt);
};

export const performPeerReview = async (content: string, filename: string, target: TargetType, journal: string, language: Language): Promise<PeerReviewResponse | null> => {
    const prompt = `Act as a peer reviewer for "${target}" (Journal: ${journal}).
    Review file "${filename}" with content snippet: "${content.substring(0, 1000)}...".
    Language: ${language}.
    
    Return JSON matching PeerReviewResponse interface.`;
    return getJson<PeerReviewResponse>(prompt);
};

export const generateRebuttalLetter = async (critiques: string, language: Language): Promise<string> => {
    return getText(`Generate a polite and professional rebuttal letter addressing these critiques: ${critiques}. Language: ${language}.`);
};

export const generateCoverLetter = async (summary: string, journal: string, language: Language): Promise<string> => {
    return getText(`Generate a submission cover letter for journal "${journal}" based on this summary: ${summary}. Language: ${language}.`);
};