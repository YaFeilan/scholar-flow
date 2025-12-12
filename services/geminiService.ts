
// ... existing imports
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Language, 
  Paper, 
  TrendTimeRange, 
  TrendPersona, 
  TrendAnalysisResult,
  PeerReviewResponse,
  TargetType,
  PolishResult,
  PolishConfig,
  AdvisorReport,
  IdeaGuideResult,
  IdeaFollowUpResult,
  DataAnalysisResult,
  ExperimentDesignResult,
  GraphNode,
  GraphLink,
  GraphSuggestionsResult,
  ChartExtractionResult,
  GrantCheckResult,
  GrantReviewResult,
  LogicNode,
  GrantPolishVersion,
  ConferenceFinderResult,
  AIDetectionResult,
  AIHumanizeResult,
  ModelProvider,
  GapAnalysisResult,
  TrackedReference,
  CodeMessage,
  DiscussionAnalysisResult,
  TitleRefinementResult,
  ReviewPersona,
  OpeningReviewResponse,
  FlowchartResult
} from '../types';

let currentModelProvider: ModelProvider = 'Gemini';

export const setModelProvider = (provider: ModelProvider) => {
  currentModelProvider = provider;
};

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// ... existing helper functions (fileToGenerativePart, cleanJson, normalizeValue, normalizeString) ...
// Helper for file conversion
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper to clean JSON string from Markdown code blocks
function cleanJson(text: string | undefined): string {
  if (!text) return '{}';
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean;
}

function normalizeValue(value: any, fallback: any = 0): any {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
        return value.score ?? value.value ?? value.level ?? value.rating ?? value.status ?? fallback;
    }
    return value;
}

function normalizeString(value: any, fallback: string = ''): string {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        return value.text ?? value.content ?? value.description ?? value.reason ?? value.feedback ?? value.summary ?? value.analysis ?? value.result ?? JSON.stringify(value);
    }
    return String(value);
}

// ... existing services ...

// Flowchart Service
export async function generateFlowchartData(
    input: string, 
    chartType: string, 
    language: Language,
    file?: File
): Promise<FlowchartResult | null> {
    const ai = getAiClient();
    const prompt = `Generate a ${chartType} using Mermaid.js syntax based on the following input. 
    Input: "${input}". 
    Return JSON with:
    1. mermaidCode: The valid Mermaid.js code string (do not wrap in markdown code blocks inside the JSON string).
    2. explanation: A brief explanation of the process flow in ${language}.
    
    If an image is provided, extract the process/flow logic from it and represent it as a ${chartType}.`;

    try {
        let contents: any[] = [];
        if (file) {
            const filePart = await fileToGenerativePart(file);
            contents = [filePart, { text: prompt }];
        } else {
            contents = [{ text: prompt }];
        }

        const response = await ai.models.generateContent({
            model: file ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
            contents: contents.length > 1 ? { parts: contents } : contents[0].text,
            config: { responseMimeType: 'application/json' }
        });
        
        return JSON.parse(cleanJson(response.text));
    } catch (e) {
        console.error("Flowchart Generation Error", e);
        return null;
    }
}

// ... rest of the existing functions ...
// Search
export async function searchAcademicPapers(query: string, language: Language, limit: number = 10): Promise<Paper[]> {
  const ai = getAiClient();
  const prompt = `Search for academic papers related to "${query}". Return ${limit} results in JSON format.
  For each paper, include: id (string), title, authors (array), journal, year (number), citations (number), abstract, badges (array of objects with type, partition, if), addedDate (YYYY-MM-DD).
  Language: ${language}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJson(response.text) || '[]');
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function generatePaperInterpretation(paper: Paper, language: Language): Promise<string> {
  const ai = getAiClient();
  const prompt = `Interpret this paper: Title: "${paper.title}", Abstract: "${paper.abstract}".
  Explain the key contributions, methodology, and significance in ${language === 'ZH' ? 'Chinese' : 'English'}.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return response.text || '';
}

export async function generateSimulatedFullText(paper: Paper, language: Language): Promise<string> {
  const ai = getAiClient();
  const prompt = `Generate a simulated full text structure for the paper titled "${paper.title}". 
  Include Introduction, Related Work, Methodology, Experiments, and Conclusion. 
  Language: ${language === 'ZH' ? 'Chinese' : 'English'}.
  Note: This is a simulation based on metadata.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return response.text || '';
}

export async function extractChartData(file: File, language: Language): Promise<ChartExtractionResult> {
  const ai = getAiClient();
  const imagePart = await fileToGenerativePart(file);
  const prompt = `Extract data from this chart. Return JSON with title, type, summary, and data (array of objects). Language: ${language}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJson(response.text));
  } catch (e) {
    console.error(e);
    return { title: '', type: '', summary: '', data: [] };
  }
}

export async function parsePaperFromImage(file: File, language: Language): Promise<Paper | null> {
  const ai = getAiClient();
  const imagePart = await fileToGenerativePart(file);
  const prompt = `Parse this image of a paper first page. Extract detailed metadata in JSON.
  Fields: title, authors (array), journal, year (number), abstract (full text if available), fullText (if the image contains body text, extract it all).
  Language: ${language}.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: 'application/json' }
    });
    const data = JSON.parse(cleanJson(response.text));
    return {
        id: Date.now().toString(),
        citations: 0,
        badges: [],
        source: 'local',
        file: file,
        addedDate: new Date().toISOString().split('T')[0],
        ...data
    };
  } catch (e) { return null; }
}

// Trends
export async function analyzeResearchTrends(topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> {
    const ai = getAiClient();
    const prompt = `Analyze research trends for "${topic}" over ${timeRange} from a ${persona} perspective. Language: ${language}.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        emergingTech: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              growth: { type: Type.NUMBER },
              predictedGrowth: { type: Type.NUMBER },
              type: { type: Type.STRING },
            },
            required: ["name", "growth", "type"],
          },
        },
        hotspots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              value: { type: Type.NUMBER },
              category: { type: Type.STRING },
              relatedTo: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["text", "value", "category"],
          },
        },
        methodologies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.NUMBER },
              growth: { type: Type.NUMBER },
              relatedHotspots: { type: Type.ARRAY, items: { type: Type.STRING } },
              codeStats: {
                type: Type.OBJECT,
                properties: {
                  github: { type: Type.STRING },
                  huggingface: { type: Type.STRING },
                },
              },
            },
            required: ["name", "value", "growth"],
          },
        },
        researchGaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              problem: { type: Type.STRING },
              potential: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              type: { type: Type.STRING, enum: ["Blue Ocean", "Hard Problem"] },
            },
            required: ["problem", "potential", "difficulty", "type"],
          },
        },
      },
      required: ["emergingTech", "hotspots", "methodologies", "researchGaps"],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { 
        console.error("Trend Analysis Error:", e);
        return null; 
    }
}

export async function getPaperTLDR(title: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a TL;DR for the paper "${title}" in ${language}. Max 30 words.`
    });
    return response.text || '';
}

// Peer Review
export async function performPeerReview(content: string, filename: string, targetType: TargetType, journalName: string, language: Language, customInstructions?: string): Promise<PeerReviewResponse | null> {
    const ai = getAiClient();
    const prompt = `Simulate a peer review for "${filename}". Target: ${targetType} ${journalName}.
    Instructions: ${customInstructions || 'Standard academic review'}.
    Return JSON: checklist (originality, soundness, clarity, recommendation), reviewers (array of objects with roleName, icon, focusArea, critiques, score), summary.
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }, { text: content.substring(0, 30000) }] }], // Truncate if too long
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text));
        
        // Normalize nested object scores to fix React Error #31
        if (res.reviewers) {
            res.reviewers.forEach((r: any) => {
                r.score = normalizeValue(r.score, 0);
            });
        }
        if (res.checklist) {
            for (const key in res.checklist) {
                // If it's an object, try to extract a string value, otherwise use fallback
                if (typeof res.checklist[key] === 'object') {
                    res.checklist[key] = normalizeString(res.checklist[key], "N/A");
                }
            }
        }
        res.summary = normalizeString(res.summary);
        
        return res;
    } catch (e) { return null; }
}

export async function generateRebuttalLetter(critiques: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a polite rebuttal letter addressing these critiques: ${critiques}. Language: ${language}.`
    });
    return response.text || '';
}

export async function generateCoverLetter(summary: string, journal: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a submission cover letter for journal "${journal}" based on this summary: ${summary}. Language: ${language}.`
    });
    return response.text || '';
}

// Literature Review
export async function generateLiteratureReview(paperDescriptions: string[], language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a literature review based on these papers:\n${paperDescriptions.join('\n')}\nLanguage: ${language}.`
    });
    return response.text || '';
}

export async function generateStructuredReview(topic: string, papers: string[], wordCount: number, language: 'ZH' | 'EN', focus: string): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a ${wordCount}-word structured literature review on "${topic}". 
        Focus: ${focus}.
        Papers: ${papers.join('; ')}.
        Language: ${language === 'ZH' ? 'Chinese' : 'English'}.`
    });
    return response.text || '';
}

// Reference Tracker
export async function trackCitationNetwork(query: string, isFile: boolean, language: Language): Promise<TrackedReference[] | null> {
    const ai = getAiClient();
    const prompt = `Analyze citation network for "${query}". Return JSON array of categories (methodology, etc.) with papers. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function analyzeNetworkGaps(papers: any[], language: Language): Promise<GapAnalysisResult | null> {
    const ai = getAiClient();
    const prompt = `Analyze these papers for research gaps. Return JSON with missingThemes, underrepresentedMethods, suggestion. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: JSON.stringify(papers),
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function chatWithCitationNetwork(query: string, papers: any[], language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context: ${JSON.stringify(papers.map(p=>p.title))}. User Question: ${query}. Answer in ${language}.`
    });
    return response.text || '';
}

// Polish
export async function polishContent(content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> {
    const ai = getAiClient();
    let textInput = "";
    if (typeof content === 'string') {
        textInput = content;
    } else {
        // Mock file reading for now
        textInput = "File content placeholder";
    }

    const prompt = `Polish the following text. Mode: ${config.mode}, Tone: ${config.tone}, Field: ${config.field}.
    Return JSON with polishedText, overallComment, changes (array of original, revised, reason, category, status='pending', id).
    Text: ${textInput.substring(0, 10000)}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function refinePolish(currentText: string, instruction: string, language: Language): Promise<PolishResult | null> {
    const ai = getAiClient();
    const prompt = `Refine this text based on instruction: "${instruction}".
    Return JSON with polishedText, overallComment, changes.
    Text: ${currentText.substring(0, 10000)}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

// Advisor
export async function generateAdvisorReport(title: string, journal: string, abstract: string, language: Language, focus: string): Promise<AdvisorReport | null> {
    const ai = getAiClient();
    const prompt = `Analyze fit for paper "${title}" in journal "${journal}". Abstract: "${abstract}". Focus: "${focus}".
    Return JSON with matchScore, matchLevel, radar, analysis, titleSuggestions, keywords, riskAssessment, alternatives, improvementSuggestions.
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text));
        
        // Normalize primitive values to fix React Error #31
        res.matchScore = normalizeValue(res.matchScore, 0);
        res.matchLevel = normalizeString(res.matchLevel, 'Low'); // Ensure string
        if (res.radar) {
            for (const key in res.radar) {
                res.radar[key] = normalizeValue(res.radar[key], 0);
            }
        }
        res.analysis = normalizeString(res.analysis);

        res.timestamp = Date.now();
        return res;
    } catch (e) { return null; }
}

// PPT
export async function generatePPTStyleSuggestions(file: File, language: Language): Promise<any[]> {
    const ai = getAiClient();
    const prompt = `Suggest 3 PPT styles for this paper. Return JSON array with name, description, colorPalette. Language: ${language}.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJson(response.text) || '[]');
}

export async function generatePPTContent(file: File, config: any, language: Language): Promise<any> {
    const ai = getAiClient();
    const prompt = `Generate PPT content for this paper. 
    Config: ${JSON.stringify(config)}.
    Return JSON with title, slides (array of title, content (array), speakerNotes, visualSuggestion, layout).
    Language: ${language}.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJson(response.text));
}

export async function generateSlideImage(description: string, style: string): Promise<string> {
    const ai = getAiClient();
    const prompt = `Create a presentation slide image. Style: ${style}. Description: ${description}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt
        });
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (e) { console.error(e); }
    return '';
}

// Idea Guide
export async function generateResearchIdeas(topic: string, language: Language, focus: string, image?: File): Promise<IdeaGuideResult | null> {
    const ai = getAiClient();
    
    const promptText = `Generate research ideas for topic "${topic}". Focus: ${focus}.
    
    You MUST return a JSON object with the following structure:
    {
      "directions": [
        {
          "angle": "Research Direction/Angle Name",
          "description": "Detailed description...",
          "methodology": "Specific methodology...",
          "dataSources": "Specific datasets...",
          "recommendedTitles": ["Title 1", "Title 2", "Title 3"],
          "corePapers": [
             { "title": "Seminal Paper Title 1", "author": "Author", "year": "2023" },
             { "title": "Seminal Paper Title 2", "author": "Author", "year": "2022" }
          ]
        }
      ],
      "journals": [
        {
          "name": "Journal Name",
          "impactFactor": "IF Value",
          "reviewCycle": "e.g. 3 months",
          "acceptanceRate": "e.g. 15%",
          "reason": "Why this journal fits"
        }
      ]
    }
    
    Ensure 'corePapers' and 'journals' are populated with real or realistic data.
    Language: ${language === 'ZH' ? 'Chinese' : 'English'}.`;

    let contents: any[] = [{ text: promptText }];
    
    if (image) {
        contents.unshift(await fileToGenerativePart(image));
    }

    try {
        const response = await ai.models.generateContent({
            model: image ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
            contents: contents.length > 1 ? { parts: contents } : contents[0].text,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function generateIdeaFollowUp(topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> {
    const ai = getAiClient();
    const prompt = `Deep dive into research angle "${angle}" for topic "${topic}". User Question: "${query}".
    Return JSON with analysis, logicPath (array of steps), suggestions (title, detail), recommendedTerms.
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

// Opening Review
export async function generateOpeningReview(file: File, target: string, language: Language, persona: ReviewPersona, focus: string): Promise<OpeningReviewResponse | null> {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    
    const prompt = `Review this opening section/proposal. Target: ${target}. Persona: ${persona}. Focus: ${focus}.
    Return JSON with overallScore, radarMap, executiveSummary, titleAnalysis, methodologyAnalysis, logicAnalysis, literatureAnalysis, journalFit.
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [filePart, { text: prompt }]
            },
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text));
        
        // Normalize nested object scores
        res.overallScore = normalizeValue(res.overallScore, 0);
        
        const sections = ['titleAnalysis', 'methodologyAnalysis', 'logicAnalysis', 'literatureAnalysis'];
        sections.forEach(sec => {
            if (res[sec]) res[sec].score = normalizeValue(res[sec].score, 0);
        });
        
        if (res.journalFit) res.journalFit.score = normalizeValue(res.journalFit.score, 0);
        
        if (res.radarMap) {
            for (const key in res.radarMap) {
                res.radarMap[key] = normalizeValue(res.radarMap[key], 0);
            }
        }
        res.executiveSummary = normalizeString(res.executiveSummary);

        return res;
    } catch (e) { return null; }
}

export async function optimizeOpeningSection(section: string, context: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Optimize this section "${section}". Context/Issues: "${context}". Language: ${language}.`
    });
    return response.text || '';
}

// Data Analysis
export async function performDataAnalysis(payload: any, language: Language): Promise<DataAnalysisResult | null> {
    const ai = getAiClient();
    const prompt = `Analyze this dataset sample and stats. 
    Return JSON with summary, correlations, recommendedModels.
    Payload: ${JSON.stringify(payload)}.
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function chatWithDataAnalysis(message: string, context: any, language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context: ${JSON.stringify(context)}. User: ${message}. Answer in ${language}.`
    });
    return response.text || '';
}

// Code Assistant
export async function performCodeAssistance(
    input: string, 
    mode: string, 
    lang: string, 
    language: Language, 
    history: {role: string, text: string}[], 
    file?: File, 
    onStream?: (text: string) => void,
    signal?: AbortSignal
): Promise<string> {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    
    let systemInstruction = `You are an expert ${lang} programmer. Mode: ${mode}. Language: ${language}.`;
    
    const sdkHistory = history.map(h => ({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.text }]
    })) as any;

    const chat = ai.chats.create({
        model: model,
        config: { systemInstruction },
        history: sdkHistory
    });

    let resultText = '';
    
    let messageParts: any[] = [{ text: input }];
    if (file) {
        const filePart = await fileToGenerativePart(file);
        messageParts = [filePart, { text: input }];
    }

    const result = await chat.sendMessageStream({ message: messageParts });
    
    for await (const chunk of result) {
        if (signal?.aborted) break;
        const text = chunk.text;
        if (text) {
            resultText += text;
            if (onStream) onStream(resultText);
        }
    }
    
    return resultText;
}

// Experiment Design
export async function generateExperimentDesign(hypothesis: string, field: string, methodology: string, language: Language, iv: string, dv: string, stats: any, structure: string): Promise<ExperimentDesignResult | null> {
    const ai = getAiClient();
    const prompt = `Design an experiment. Hypothesis: ${hypothesis}. Field: ${field}. Methodology: ${methodology}. IV: ${iv}, DV: ${dv}. Structure: ${structure}. Stats: ${JSON.stringify(stats)}.
    Return JSON with title, flow, sampleSize, variables, analysis.
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function optimizeHypothesis(hypothesis: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Optimize this research hypothesis for clarity and scientific rigor: "${hypothesis}". Return only the revised hypothesis. Language: ${language}.`
    });
    return response.text || '';
}

export async function analyzeImageNote(file: File, language: Language): Promise<string> {
    const ai = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: `Transcribe and summarize this image note in ${language}.` }] }
    });
    return response.text || '';
}

// PDF Chat
export async function performPDFChat(query: string, language: Language, file: File, history: {role: string, text: string}[], onStream: (text: string) => void, signal?: AbortSignal): Promise<string> {
    const ai = getAiClient();
    
    const sdkHistory = history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
    })) as any;

    let parts: any[] = [{ text: query }];
    if (history.length === 0) {
        const filePart = await fileToGenerativePart(file);
        parts = [filePart, { text: query }];
    }

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: sdkHistory
    });

    let resultText = '';
    const result = await chat.sendMessageStream({ message: parts });

    for await (const chunk of result) {
        if (signal?.aborted) break;
        const text = chunk.text;
        if (text) {
            resultText += text;
            if (onStream) onStream(resultText);
        }
    }
    return resultText;
}

export async function explainVisualContent(file: File, language: Language): Promise<string> {
    const ai = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: `Explain this visual content in ${language}.` }] }
    });
    return response.text || '';
}

export async function explainPaperInPlainLanguage(file: File, language: Language): Promise<string> {
  const ai = getAiClient();
  const filePart = await fileToGenerativePart(file);
  const prompt = `You are a friendly Research Mentor AI (科研导师AI).
  Your goal is to explain this paper to a student in the simplest, most accessible language possible (大白话).
  Translate complex jargon into everyday analogies.
  Structure your response:
  1. 🌟 One-sentence Essence (What is this actually about?)
  2. 🧐 Why should you care? (Background & Motivation)
  3. 🛠 How did they do it? (Methodology in plain English)
  4. 💡 Key Findings (The "Aha!" moment)
  5. ⚠️ Tutor's Note (Critical limitations or thoughts)
  
  Tone: Encouraging, clear, using analogies. 
  Language: ${language === 'ZH' ? 'Chinese' : 'English'}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [filePart, { text: prompt }]
    }
  });
  return response.text || '';
}

// Knowledge Graph
export async function generateKnowledgeGraph(nodes: GraphNode[], language: Language): Promise<GraphLink[]> {
    const ai = getAiClient();
    const prompt = `Generate connections between these nodes: ${JSON.stringify(nodes.map(n => ({ id: n.id, label: n.label, content: n.content })))}.
    Return JSON array of links (source, target, label). Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text) || '[]');
    } catch (e) { return []; }
}

export async function chatWithKnowledgeGraph(query: string, nodes: GraphNode[], language: Language, onStream: (text: string) => void): Promise<string> {
    const ai = getAiClient();
    const context = nodes.map(n => `${n.label}: ${n.content}`).join('\n');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context:\n${context}\nQuestion: ${query}\nAnswer in ${language}.`
    });
    return response.text || '';
}

export async function generateGraphSuggestions(nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> {
    const ai = getAiClient();
    const prompt = `Suggest new related research nodes and links based on: ${JSON.stringify(nodes.map(n=>n.label))}.
    Return JSON with recommendedNodes (id, label, type, reason), suggestedLinks (source, target, label). Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function deepParsePDF(file: File, language: Language): Promise<{summary: string, elements: any[]} | null> {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    const prompt = `Deep parse this PDF. Extract summary and key elements (formulas, algorithms, charts). 
    Return JSON with summary, elements (array of label, type, content). Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, { text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function runCodeSimulation(code: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const prompt = `Simulate the execution of this code and explain the output. Code:\n${code}\nLanguage: ${language}.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text || '';
}

export async function findRelevantNodes(query: string, nodes: GraphNode[], language: Language): Promise<string[]> {
    const ai = getAiClient();
    const prompt = `Find nodes relevant to "${query}" from this list: ${JSON.stringify(nodes.map(n=>({id:n.id, label:n.label})))}.
    Return JSON array of node IDs.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text) || '[]');
    } catch (e) { return []; }
}

// Figure Generator
export async function generateScientificFigure(prompt: string, style: string, mode: string, image?: File, backgroundOnly?: boolean, mask?: File, size?: string): Promise<string> {
    const ai = getAiClient();
    const model = 'gemini-3-pro-image-preview'; 
    
    const config: any = {
        imageConfig: {
            imageSize: size || '1K'
        }
    };

    const parts: any[] = [{ text: `Generate a scientific figure. Prompt: ${prompt}. Style: ${style}. Mode: ${mode}.` }];
    if (image) parts.push(await fileToGenerativePart(image));

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config
        });
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (e) { console.error(e); }
    return '';
}

export async function generateChartTrendAnalysis(data: any[], language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze trends in this data: ${JSON.stringify(data)}. Language: ${language}.`
    });
    return response.text || '';
}

// Grant Application
export async function generateGrantLogicFramework(config: any, language: Language, mode: string, references: any[], image?: File): Promise<LogicNode | null> {
    const ai = getAiClient();
    const prompt = `Generate a logic framework for grant application. Config: ${JSON.stringify(config)}. Mode: ${mode}.
    Return JSON representing a LogicNode tree (label, children). Language: ${language}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function expandGrantRationale(tree: LogicNode, language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Expand this logic tree into a full grant rationale text: ${JSON.stringify(tree)}. Language: ${language}.`
    });
    return response.text || '';
}

export async function polishGrantProposal(text: string, section: string, language: Language, context: string): Promise<any> {
    const ai = getAiClient();
    const prompt = `Polish this grant proposal section: "${section}". Content: "${text}". Context: "${context}".
    Return JSON with versions (array of type, clean, revisions, comment). Types: Conservative, Aggressive, Professional. Language: ${language}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function checkGrantFormat(content: string | File, language: Language): Promise<GrantCheckResult | null> {
    const ai = getAiClient();
    const text = typeof content === 'string' ? content : "File content placeholder";
    const prompt = `Check grant proposal format. Text: "${text}".
    Return JSON with score, summary, hardErrors, logicCheck, formatCheck, anonymityCheck. Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

export async function getGrantInspiration(name: string, code: string, language: Language): Promise<string[]> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide 3 inspiration sentences for grant "${name}" (Code: ${code}). Language: ${language}. Return JSON array of strings.`,
        config: { responseMimeType: 'application/json' }
    });
    try {
        return JSON.parse(cleanJson(response.text) || '[]');
    } catch (e) { return []; }
}

export async function generateGrantReview(content: string | File, language: Language, role: string, framework: string): Promise<GrantReviewResult | null> {
    const ai = getAiClient();
    const prompt = `Review grant proposal as ${role}. Framework: ${framework}.
    Return JSON with overallScore, verdict, summary, dimensions (name, score, comment), strengths, weaknesses, improvementSuggestions. Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const res = JSON.parse(cleanJson(response.text));
        // Normalize
        res.overallScore = normalizeValue(res.overallScore, 0);
        res.summary = normalizeString(res.summary);
        if (Array.isArray(res.dimensions)) {
            res.dimensions.forEach((d: any) => {
                d.score = normalizeValue(d.score, 0);
                d.comment = normalizeString(d.comment);
            });
        }
        return res;
    } catch (e) { return null; }
}

// Conference Finder
export async function findConferences(query: string, language: Language): Promise<ConferenceFinderResult | null> {
    const ai = getAiClient();
    const prompt = `Find upcoming academic conferences and journals related to "${query}".
    Return JSON with conferences (array: name, rank, deadline, conferenceDate, location, region, h5Index, description, tags, website), journals (array: name, title, deadline, impactFactor, partition).
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

// AI Detector
export async function detectAIContent(content: string | File, language: Language): Promise<AIDetectionResult | null> {
    const ai = getAiClient();
    const text = typeof content === 'string' ? content : "File content";
    const prompt = `Detect if this text is AI generated. Text: "${text}".
    Return JSON with score (0-100), analysis, highlightedSentences (text, reason, score). Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text));
        // Normalize
        res.score = normalizeValue(res.score, 0);
        res.analysis = normalizeString(res.analysis);
        return res;
    } catch (e) { return null; }
}

export async function humanizeText(content: string, language: Language): Promise<AIHumanizeResult | null> {
    const ai = getAiClient();
    const prompt = `Rewrite this text to be more human-like and bypass AI detection.
    Return JSON with originalScore, newScore, text, changesSummary. Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: prompt }, { text: content }],
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text));
    } catch (e) { return null; }
}

// Research Discussion
export async function generateResearchDiscussion(topic: string, language: Language, image?: File): Promise<DiscussionAnalysisResult | null> {
    const ai = getAiClient();
    const prompt = `Analyze research topic "${topic}".
    Return a strict JSON object with:
    {
      "scorecard": {
        "theory": number (0-10),
        "method": number (0-10),
        "application": number (0-10),
        "theoryReason": string,
        "methodReason": string,
        "applicationReason": string
      },
      "feasibility": {
        "data": string,
        "tech": string,
        "ethics": string
      },
      "initialComments": {
        "reviewer": string,
        "collaborator": string,
        "mentor": string
      }
    }
    Language: ${language}.`;

    const parts: any[] = [{ text: prompt }];
    if (image) {
        parts.unshift(await fileToGenerativePart(image));
    }

    try {
        const response = await ai.models.generateContent({
            model: image ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
            contents: { parts },
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text));
        
        // Normalization
        if (res.scorecard) {
            res.scorecard.theory = normalizeValue(res.scorecard.theory, 0);
            res.scorecard.method = normalizeValue(res.scorecard.method, 0);
            res.scorecard.application = normalizeValue(res.scorecard.application, 0);
            
            res.scorecard.theoryReason = normalizeString(res.scorecard.theoryReason);
            res.scorecard.methodReason = normalizeString(res.scorecard.methodReason);
            res.scorecard.applicationReason = normalizeString(res.scorecard.applicationReason);
        }
        
        if (res.feasibility) {
            res.feasibility.data = normalizeString(res.feasibility.data);
            res.feasibility.tech = normalizeString(res.feasibility.tech);
            res.feasibility.ethics = normalizeString(res.feasibility.ethics);
        }

        if (res.initialComments) {
            res.initialComments.reviewer = normalizeString(res.initialComments.reviewer);
            res.initialComments.collaborator = normalizeString(res.initialComments.collaborator);
            res.initialComments.mentor = normalizeString(res.initialComments.mentor);
        }

        return res;
    } catch (e) { return null; }
}

export async function chatWithDiscussionPersona(topic: string, persona: string, message: string, history: any[], language: Language): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Topic: ${topic}. You are ${persona}. User: ${message}. History: ${JSON.stringify(history)}. Reply in ${language}.`
    });
    return response.text || '';
}

// Title Prism
export async function generateTitleOptimization(draft: string, abstract: string, target: string, language: Language): Promise<TitleRefinementResult | null> {
    const ai = getAiClient();
    const prompt = `Optimize research title "${draft}". Abstract: "${abstract}". Target: "${target}".
    Return JSON with council (array of role, feedback, critiqueQuote), options (array of type, title, rationale). 
    Council members MUST be exactly these 4 roles: "Reviewer" (Critical), "Editor" (Impact), "SEO" (Keywords), "Generalist" (Accessibility).
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text));
        
        // Normalize strings
        if (res.council) {
            res.council.forEach((m: any) => {
                m.feedback = normalizeString(m.feedback);
                m.critiqueQuote = normalizeString(m.critiqueQuote);
            });
        }
        if (res.options) {
            res.options.forEach((o: any) => {
                o.title = normalizeString(o.title);
                o.rationale = normalizeString(o.rationale);
            });
        }
        return res;
    } catch (e) { return null; }
}

// Virtual Assistant Chat
export async function chatWithAssistant(message: string, view: string, language: Language, history: {role: 'user'|'ai', text: string}[]): Promise<string> {
    const ai = getAiClient();
    
    const sdkHistory = history.map(h => ({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.text }]
    }));

    const systemInstruction = `You are a virtual research assistant embedded in a web app.
    Current Context/View: ${view}.
    Language: ${language}.
    Personality: Helpful, encouraging, concise, slightly witty.
    Goal: Assist the user with their research tasks in this specific view, or answer general questions.
    Keep answers relatively short (under 3 sentences) unless asked for detail.`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history: sdkHistory
    });

    try {
        const response = await chat.sendMessage({ message });
        return response.text || '';
    } catch (e) {
        console.error("Chat Assistant Error", e);
        return language === 'ZH' ? "抱歉，我现在有点累..." : "Sorry, I'm a bit tired right now...";
    }
}
