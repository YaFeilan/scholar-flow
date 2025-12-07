
import { GoogleGenAI } from "@google/genai";
import { 
  Language, 
  ReviewPersona, 
  OpeningReviewResponse, 
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
  DiscussionPersonaType
} from '../types';

// Helper to get a fresh client instance with the latest key
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to convert file to base64 for Gemini
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
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

// Generic Helper for JSON response
async function getJson<T>(prompt: string, file?: File): Promise<T | null> {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    let parts: any[] = [{ text: prompt }];
    if (file) {
      const part = await fileToGenerativePart(file);
      parts.push(part);
    }
    
    const response = await ai.models.generateContent({
      model: model,
      contents: { role: 'user', parts: parts },
      config: { responseMimeType: 'application/json' }
    });
    
    if (response.text) {
      return JSON.parse(response.text) as T;
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

// Generic Helper for Text response
async function getText(prompt: string, file?: File): Promise<string> {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    let parts: any[] = [{ text: prompt }];
    if (file) {
      const part = await fileToGenerativePart(file);
      parts.push(part);
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { role: 'user', parts: parts }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
}

export const setModelProvider = (provider: ModelProvider) => {
    // Placeholder for provider switching logic
    console.log(`Switched to ${provider}`);
};

export const generateOpeningReview = async (file: File, target: string, language: Language, persona: ReviewPersona, focus?: string): Promise<OpeningReviewResponse | null> => {
    const prompt = `Review this opening section (Introduction/Abstract). Target: ${target}. Persona: ${persona}. 
    ${focus ? `**Review Focus/Instructions:** ${focus}` : ''}
    Language: ${language}.
    
    Return JSON matching OpeningReviewResponse interface.`;
    return getJson<OpeningReviewResponse>(prompt, file);
};

export const generatePaperInterpretation = async (paper: Paper, language: Language): Promise<string> => {
    const prompt = `Interpret this paper titled "${paper.title}". Abstract: ${paper.abstract}. Language: ${language}. Explain the key contributions and methodology simply.`;
    return getText(prompt);
};

export const searchAcademicPapers = async (query: string, language: Language, limit: number): Promise<Paper[]> => {
    // Using Google Search grounding to find papers
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find ${limit} academic papers about "${query}". Return a JSON array of papers with title, authors, journal, year, citations (approx), abstract, and badges (SCI/Q1 etc inferred). Language: ${language}.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });
        
        if (response.text) {
             try {
                 const papers = JSON.parse(response.text);
                 if (Array.isArray(papers)) return papers;
             } catch (e) {
                 // Fallback to empty or parsing logic
             }
        }
    } catch (e) {
        console.error(e);
    }
    return [];
};

export const generateSimulatedFullText = async (paper: Paper, language: Language): Promise<string> => {
    const prompt = `Generate a simulated full academic paper text based on this metadata:
    Title: ${paper.title}
    Abstract: ${paper.abstract}
    Language: ${language}
    Structure: Introduction, Related Work, Methodology, Experiments, Conclusion.
    Length: Detailed.`;
    return getText(prompt);
};

export const extractChartData = async (file: File, language: Language, mode: string = 'auto'): Promise<ChartExtractionResult> => {
    const prompt = `Extract data from this chart/image. Mode: ${mode}. Language: ${language}.
    Return JSON with title, type, summary, and data (array of objects). If formula, put in ocrText.`;
    const res = await getJson<ChartExtractionResult>(prompt, file);
    return res || { title: '', type: 'Unknown', summary: '', data: [] };
};

export const parsePaperFromImage = async (file: File, language: Language): Promise<Paper | null> => {
    const ai = getAiClient();
    const prompt = `Analyze this image of a research paper page. 
    Task: Extract metadata and FULL textual content visible in the image.
    If the image contains the full paper text, transcribe as much as possible.
    If it is a snippet, extract the context.
    Language: ${language}.
    
    Return a JSON object with this specific structure:
    {
      "title": "Paper Title (if visible, else infer)",
      "authors": ["Author 1", "Author 2"],
      "journal": "Journal Name (if visible)",
      "year": 2024,
      "abstract": "The full extracted text content from the image (not just abstract, include body text if available).",
      "badges": [{"type": "SCI"}] (Infer potential journal tier if possible)
    }`;

    try {
        const filePart = await fileToGenerativePart(file);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [{ text: prompt }, filePart]
            },
            config: {
                responseMimeType: "application/json"
            }
        });
        
        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                id: `img-parsed-${Date.now()}`,
                title: data.title || "Untitled From Image",
                authors: data.authors || ["Unknown"],
                journal: data.journal || "Image Import",
                year: data.year || new Date().getFullYear(),
                citations: 0,
                badges: data.badges || [{ type: 'LOCAL' }],
                abstract: data.abstract || "",
                source: 'local',
                file: file,
                addedDate: new Date().toISOString().split('T')[0]
            };
        }
    } catch (e) {
        console.error("Parse Paper Image Error", e);
    }
    return null;
};

export const analyzeResearchTrends = async (topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> => {
    const prompt = `Analyze research trends for "${topic}". Time Range: ${timeRange}. Persona: ${persona}. Language: ${language}. Return JSON matching TrendAnalysisResult.`;
    return getJson<TrendAnalysisResult>(prompt);
};

export const getPaperTLDR = async (title: string, language: Language): Promise<string> => {
    return getText(`Provide a 1-sentence TL;DR for the paper "${title}". Language: ${language}.`);
};

export const performPeerReview = async (content: string, filename: string, target: TargetType, journal: string, language: Language, instructions?: string): Promise<PeerReviewResponse | null> => {
    const prompt = `Perform peer review for "${filename}". Target: ${target} (${journal}). 
    Instructions: ${instructions || 'Standard academic review'}.
    Language: ${language}.
    Return JSON matching PeerReviewResponse.`;
    return getJson<PeerReviewResponse>(prompt);
};

export const generateRebuttalLetter = async (critiques: string, language: Language): Promise<string> => {
    return getText(`Generate a polite and professional rebuttal letter addressing these critiques: ${critiques}. Language: ${language}.`);
};

export const generateCoverLetter = async (summary: string, journal: string, language: Language): Promise<string> => {
    return getText(`Generate a submission cover letter for journal "${journal}". Summary of paper: ${summary}. Language: ${language}.`);
};

export const generateLiteratureReview = async (paperDescriptions: string[], language: Language): Promise<string> => {
    const prompt = `Generate a comprehensive literature review based on these papers:\n${paperDescriptions.join('\n\n')}\nLanguage: ${language}.`;
    return getText(prompt);
};

export const generateStructuredReview = async (topic: string, papers: string[], wordCount: number, language: 'ZH' | 'EN', focus?: string): Promise<string> => {
    const prompt = `Write a structured literature review on "${topic}".
    ${focus ? `**Focus/Instructions:** ${focus}` : ''}
    Papers: ${papers.join('; ')}. Length: approx ${wordCount} words. Language: ${language}.`;
    return getText(prompt);
};

export const trackCitationNetwork = async (query: string, isFile: boolean, language: Language): Promise<TrackedReference[] | null> => {
    const prompt = `Generate a citation network analysis for "${query}". Is File: ${isFile}. Language: ${language}. Return JSON array of TrackedReference (category, papers array).`;
    return getJson<TrackedReference[]>(prompt);
};

export const analyzeNetworkGaps = async (papers: any[], language: Language): Promise<GapAnalysisResult | null> => {
    const prompt = `Analyze research gaps based on these papers: ${JSON.stringify(papers.map(p => p.title))}. Language: ${language}. Return JSON matching GapAnalysisResult.`;
    return getJson<GapAnalysisResult>(prompt);
};

export const chatWithCitationNetwork = async (query: string, papers: any[], language: Language): Promise<string> => {
    const prompt = `Answer this question: "${query}" based on these papers: ${JSON.stringify(papers.map(p => ({title: p.title, desc: p.description})))}. Language: ${language}.`;
    return getText(prompt);
};

export const polishContent = async (content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> => {
    const prompt = `Polish this content. Config: ${JSON.stringify(config)}. Language: ${language}. Return JSON matching PolishResult.`;
    return getJson<PolishResult>(prompt, content instanceof File ? content : undefined);
};

export const refinePolish = async (originalText: string, instruction: string, language: Language): Promise<PolishResult | null> => {
    const prompt = `Refine this polished text: "${originalText}". Instruction: ${instruction}. Language: ${language}. Return JSON matching PolishResult.`;
    return getJson<PolishResult>(prompt);
};

export const generateAdvisorReport = async (title: string, journal: string, abstract: string, language: Language, focus?: string): Promise<AdvisorReport | null> => {
    const prompt = `Evaluate paper fit. Title: ${title}. Journal: ${journal}. Abstract: ${abstract}. 
    ${focus ? `**Review Focus/Instructions:** ${focus}` : ''}
    Language: ${language}. 
    
    Return a JSON object strictly matching this schema:
    {
      "matchScore": 85,
      "matchLevel": "High",
      "radar": { "topic": 80, "method": 70, "novelty": 90, "scope": 85, "style": 75 },
      "analysis": "Detailed analysis string",
      "titleSuggestions": [{ "issue": "Issue description", "revised": "Revised Title" }],
      "keywords": [{ "term": "Keyword", "trend": "Rising" }],
      "riskAssessment": [{ "risk": "Risk description", "severity": "Medium" }],
      "alternatives": [{ "name": "Journal Name", "impactFactor": "IF", "reason": "Reason" }],
      "references": [{ "title": "Title", "author": "Author", "year": "2023" }],
      "improvementSuggestions": [{ "content": "Suggestion", "example": "Example" }]
    }`;
    return getJson<AdvisorReport>(prompt);
};

export const generatePPTStyleSuggestions = async (file: File, language: Language): Promise<any[]> => {
    const prompt = `Suggest 3 PPT styles for this paper. Language: ${language}. Return JSON array with name, description, colorPalette.`;
    return getJson<any[]>(prompt, file) || [];
};

export const generatePPTContent = async (file: File, config: any, language: Language): Promise<any> => {
    const prompt = `Generate PPT content for this paper. Config: ${JSON.stringify(config)}. Language: ${language}. Return JSON with title, slides array (title, content array, speakerNotes, visualSuggestion).`;
    return getJson<any>(prompt, file);
};

export const generateSlideImage = async (visualSuggestion: string, style: string): Promise<string | null> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: {
                parts: [{ text: `Create a presentation slide image. Style: ${style}. Content: ${visualSuggestion}` }]
            },
            config: {
                imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
            }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return null;
};

export const generateResearchIdeas = async (topic: string, language: Language, focus: string, file?: File): Promise<IdeaGuideResult | null> => {
    const prompt = `Generate research ideas ${topic ? `for topic "${topic}"` : 'based on the provided image content'}. 
    ${file ? 'If an image is provided, perform a comprehensive analysis of ALL visual elements, text, and data within the picture to inform the research ideas.' : ''}
    Focus: ${focus}. Language: ${language}.
    
    Return a JSON object strictly matching this schema:
    {
      "directions": [
        {
          "angle": "Research Angle Title",
          "description": "Detailed description of the research direction",
          "methodology": "Recommended methodology (e.g., DID, Transformer)",
          "dataSources": "Potential data sources",
          "recommendedTitles": ["Title 1", "Title 2"],
          "corePapers": [
            { "title": "Paper Title", "author": "Author Name", "year": "Year" }
          ]
        }
      ],
      "journals": [
        {
          "name": "Journal Name",
          "impactFactor": "IF Value",
          "reviewCycle": "Time",
          "acceptanceRate": "Rate",
          "reason": "Why it fits"
        }
      ]
    }`;
    return getJson<IdeaGuideResult>(prompt, file);
};

export const generateIdeaFollowUp = async (topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> => {
    const prompt = `Deep dive into research angle "${angle}" for topic "${topic}". Question: ${query}. Language: ${language}.
    
    Return a JSON object strictly matching this schema:
    {
      "analysis": "Detailed analysis text",
      "logicPath": ["Step 1", "Step 2", "Step 3"],
      "suggestions": [{ "title": "Suggestion Title", "detail": "Detail" }],
      "recommendedTerms": ["Term 1", "Term 2"]
    }`;
    return getJson<IdeaFollowUpResult>(prompt);
};

export const optimizeOpeningSection = async (section: string, context: string, language: Language): Promise<string> => {
    return getText(`Optimize this opening section: "${section}". Context/Issues: ${context}. Language: ${language}.`);
};

export const performDataAnalysis = async (payload: any, language: Language): Promise<DataAnalysisResult | null> => {
    const prompt = `Analyze this data sample/stats. Payload: ${JSON.stringify(payload)}. Language: ${language}. Return JSON matching DataAnalysisResult.`;
    return getJson<DataAnalysisResult>(prompt);
};

export const chatWithDataAnalysis = async (query: string, stats: any, language: Language): Promise<string> => {
    return getText(`Answer data question: "${query}". Data Stats: ${JSON.stringify(stats)}. Language: ${language}.`);
};

export const performCodeAssistance = async (
    input: string, 
    mode: string, 
    lang: string, 
    language: Language, 
    history: {role: string, text: string}[], 
    file: File | undefined,
    onStream: (text: string) => void,
    signal: AbortSignal
): Promise<string> => {
    const ai = getAiClient();
    let parts: any[] = [{ text: `Mode: ${mode}. Language: ${lang}. Output Language: ${language}. User Input: ${input}` }];
    if (file) {
        const fPart = await fileToGenerativePart(file);
        parts.push(fPart);
    }
    
    const chatHistory = history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
    }));

    try {
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            history: chatHistory as any
        });
        
        const result = await chat.sendMessageStream({ parts } as any);
        let fullText = "";
        for await (const chunk of result) {
            if (signal.aborted) break;
            const text = chunk.text;
            if (text) {
                fullText += text;
                onStream(fullText);
            }
        }
        return fullText;
    } catch (e) {
        console.error(e);
        return "";
    }
};

export const generateExperimentDesign = async (hypothesis: string, field: string, methodology: string, language: Language, iv: string, dv: string, stats: any, structure: string): Promise<ExperimentDesignResult | null> => {
    const schema = {
      title: "Title",
      flow: [{ step: 1, name: "Step", description: "Desc" }],
      sampleSize: { recommended: 100, explanation: "Exp", parameters: [{ label: "Param", value: "Val" }] },
      variables: { independent: ["IV"], dependent: ["DV"], control: ["Ctrl"], confounders: ["Conf"] },
      analysis: { method: "Method", description: "Desc" }
    };

    const prompt = `Act as a senior research scientist. Design a rigorous experiment based on the parameters below.
    
    Hypothesis: "${hypothesis}"
    Field: ${field}
    Methodology Preference: ${methodology}
    Experimental Structure: ${structure}
    Independent Variable (IV): ${iv || 'Auto-detect'}
    Dependent Variable (DV): ${dv || 'Auto-detect'}
    Statistical Parameters: ${JSON.stringify(stats)}
    
    Output Language: ${language === 'ZH' ? 'Simplified Chinese' : 'English'}
    
    Return a strictly valid JSON object adhering to this structure:
    ${JSON.stringify(schema)}
    `;
    
    return getJson<ExperimentDesignResult>(prompt);
};

export const optimizeHypothesis = async (hypothesis: string, language: Language): Promise<string> => {
    return getText(`Optimize this scientific hypothesis for clarity and testability: "${hypothesis}". Language: ${language}.`);
};

export const performPDFChat = async (query: string, language: Language, file: File, history: {role: string, text: string}[], onStream: (text: string) => void, signal: AbortSignal): Promise<string> => {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    
    const context = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const fullPrompt = `Context:\n${context}\n\nUser Question: ${query}\nLanguage: ${language}`;
    
    try {
        const result = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: fullPrompt }, filePart] }
        });
        
        let text = "";
        for await (const chunk of result) {
            if (signal?.aborted) break;
            if (chunk.text) {
                text += chunk.text;
                onStream(text);
            }
        }
        return text;
    } catch (e) {
        console.error(e);
        return "";
    }
};

export const explainVisualContent = async (text: string): Promise<string> => {
    return getText(`Explain this content in detail: "${text}".`);
};

export const generateKnowledgeGraph = async (nodes: GraphNode[], language: Language): Promise<GraphLink[]> => {
    const prompt = `Generate connections/links between these nodes: ${JSON.stringify(nodes.map(n => ({id: n.id, label: n.label, content: n.content?.substring(0, 100)})))}. Language: ${language}. Return JSON array of GraphLink.`;
    return getJson<GraphLink[]>(prompt) || [];
};

export const analyzeImageNote = async (file: File, language: Language): Promise<string> => {
    const prompt = `Analyze this image note. Extract text and key concepts. Language: ${language}.`;
    return getText(prompt, file);
};

export const chatWithKnowledgeGraph = async (query: string, nodes: GraphNode[], language: Language, onStream: (text: string) => void): Promise<string> => {
    const prompt = `Answer based on knowledge graph nodes: ${JSON.stringify(nodes.map(n => n.label))}. Question: ${query}. Language: ${language}.`;
    return getText(prompt);
};

export const generateGraphSuggestions = async (nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> => {
    const prompt = `Suggest new related nodes and links for this graph. Existing nodes: ${JSON.stringify(nodes.map(n => n.label))}. Language: ${language}. Return JSON matching GraphSuggestionsResult.`;
    return getJson<GraphSuggestionsResult>(prompt);
};

export const deepParsePDF = async (file: File, language: Language): Promise<{summary: string, elements: {type: string, label: string, content: string}[]} | null> => {
    const prompt = `Deep parse this PDF. Extract summary, and list of key elements (Formulas, Algorithms, Charts). Language: ${language}. Return JSON with summary and elements array.`;
    return getJson(prompt, file);
};

export const runCodeSimulation = async (code: string, language: string): Promise<string> => {
    return `[Simulation Output for ${language} code]\nResult: Success\n(Note: Real execution requires backend sandbox)`;
};

export const findRelevantNodes = async (query: string, nodes: GraphNode[], language: Language): Promise<string[]> => {
    const prompt = `Find nodes relevant to "${query}" from this list: ${JSON.stringify(nodes.map(n => ({id: n.id, label: n.label})))}. Return JSON array of node IDs.`;
    return getJson<string[]>(prompt) || [];
};

export const generateScientificFigure = async (prompt: string, style: string, mode: string, file?: File, bgOnly?: boolean, mask?: File, size?: '1K'|'2K'|'4K'): Promise<string | null> => {
    const model = size === '1K' ? 'gemini-3-pro-image-preview' : 'gemini-3-pro-image-preview'; 
    const contentParts: any[] = [{ text: `${mode === 'generate' ? 'Generate' : 'Edit'} scientific figure. Prompt: ${prompt}. Style: ${style}.` }];
    if (file) contentParts.push(await fileToGenerativePart(file));
    
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: contentParts },
            config: {
                imageConfig: {
                    imageSize: size || '1K',
                    aspectRatio: "4:3"
                }
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    } catch(e) {
        console.error(e);
    }
    return null;
};

export const generateChartTrendAnalysis = async (data: any[], language: Language): Promise<string> => {
    return getText(`Analyze trends in this data: ${JSON.stringify(data.slice(0, 20))}. Language: ${language}.`);
};

export const generateGrantLogicFramework = async (project: any, language: Language, mode: string, references: any[], imageFile?: File): Promise<LogicNode | null> => {
    const prompt = `Generate grant logic framework. Project: ${JSON.stringify(project)}. Mode: ${mode}. Language: ${language}. If image provided, analyze it for context/structure. Return JSON LogicNode tree.`;
    return getJson<LogicNode>(prompt, imageFile);
};

export const expandGrantRationale = async (node: LogicNode, language: Language): Promise<string> => {
    return getText(`Expand this logic tree into a full grant rationale text. Tree: ${JSON.stringify(node)}. Language: ${language}.`);
};

export const polishGrantProposal = async (text: string, section: string, language: Language, context: string): Promise<any | null> => {
    const prompt = `Polish grant proposal section "${section}". Text: "${text}". Context: ${context}. Language: ${language}. Return JSON with versions array (type, clean, revisions, comment).`;
    return getJson<any>(prompt);
};

export const checkGrantFormat = async (content: string | File, language: Language): Promise<GrantCheckResult | null> => {
    const prompt = `Check grant proposal format and logic. Language: ${language}. Return JSON matching GrantCheckResult.`;
    return getJson<GrantCheckResult>(prompt, content instanceof File ? content : undefined);
};

export const getGrantInspiration = async (name: string, code: string, language: Language): Promise<string[]> => {
    const prompt = `Provide 3 inspiration sentences for grant "${name}" (Code: ${code}). Language: ${language}. Return JSON string array.`;
    return getJson<string[]>(prompt) || [];
};

export const generateGrantReview = async (content: string | File, language: Language, role: string, framework: string): Promise<GrantReviewResult | null> => {
    const prompt = `Review grant proposal as ${role}. Framework: ${framework}. Language: ${language}. Return JSON matching GrantReviewResult.`;
    return getJson<GrantReviewResult>(prompt, content instanceof File ? content : undefined);
};

export const findConferences = async (topic: string, language: Language): Promise<ConferenceFinderResult | null> => {
    const prompt = `Find conferences and journals for "${topic}". Language: ${language}. Return JSON matching ConferenceFinderResult.`;
    return getJson<ConferenceFinderResult>(prompt);
};

export const detectAIContent = async (content: string | File, language: Language): Promise<AIDetectionResult | null> => {
    const prompt = `Detect AI content in this text. Language: ${language}. Return JSON matching AIDetectionResult.`;
    return getJson<AIDetectionResult>(prompt, content instanceof File ? content : undefined);
};

export const humanizeText = async (text: string, language: Language): Promise<AIHumanizeResult | null> => {
    const prompt = `Humanize this AI-generated text to reduce AI detection score. Language: ${language}. Return JSON matching AIHumanizeResult.`;
    return getJson<AIHumanizeResult>(prompt);
};

export const generateResearchDiscussion = async (topic: string, language: Language): Promise<DiscussionAnalysisResult | null> => {
    const prompt = `Analyze this research topic: "${topic}".
    Language: ${language}.
    Provide a comprehensive analysis including Innovation Scores, Feasibility Checks, and Initial Comments from three distinct personas.
    
    1. Innovation Scorecard: Rate Theory, Methodology, Application (1-10) with brief reasons.
    2. Feasibility Check: Evaluate Data (availability/cost), Technical (compute/equipment), and Ethical (IRB) feasibility.
    3. Personas:
       - Reviewer: Critical, looks for logic gaps.
       - Collaborator: Interdisciplinary perspective (e.g., social impact for tech).
       - Mentor: Socratic method, asks guiding questions.
    
    Return JSON matching:
    {
      "scorecard": { "theory": number, "method": number, "application": number, "theoryReason": string, "methodReason": string, "applicationReason": string },
      "feasibility": { "data": string, "tech": string, "ethics": string },
      "initialComments": { "reviewer": string, "collaborator": string, "mentor": string }
    }`;
    return getJson<DiscussionAnalysisResult>(prompt);
};

export const chatWithDiscussionPersona = async (
    topic: string, 
    persona: DiscussionPersonaType, 
    message: string, 
    history: {role: string, text: string}[], 
    language: Language
): Promise<string> => {
    const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const prompt = `Context: Research Topic "${topic}".
    Persona: You are the "${persona}". 
    - Reviewer: Critical, finds loopholes.
    - Collaborator: Suggests interdisciplinary angles.
    - Mentor: Uses Socratic questioning, guides the user.
    
    Conversation History:
    ${historyText}
    
    User: ${message}
    
    Respond as the ${persona} in ${language}. Keep it concise and insightful.`;
    
    return getText(prompt);
};