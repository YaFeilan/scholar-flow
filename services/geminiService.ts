import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
  Language,
  Paper,
  TrendAnalysisResult,
  PeerReviewResponse,
  AdvisorReport,
  PolishConfig,
  PolishResult,
  IdeaGuideResult,
  IdeaFollowUpResult,
  OpeningReviewResponse,
  DataAnalysisResult,
  TrackedReference,
  GapAnalysisResult,
  TrendTimeRange,
  TrendPersona,
  TargetType,
  ReviewPersona,
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const getJson = async (prompt: string, schema?: Schema, modelName = "gemini-2.5-flash") => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini JSON Error:", error);
    return null;
  }
};

const getText = async (prompt: string, modelName = "gemini-2.5-flash") => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return "Error generating content.";
  }
};

// --- Search & Interpretation ---

export const searchAcademicPapers = async (query: string, language: Language, limit: number): Promise<Paper[]> => {
  const prompt = `Search for academic papers related to "${query}". Return ${limit} results.
  For each paper, provide title, authors, journal, year, citations (approx), and abstract.
  Also assign badges based on prestige (SCI, Q1, etc) if known.`;
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        authors: { type: Type.ARRAY, items: { type: Type.STRING } },
        journal: { type: Type.STRING },
        year: { type: Type.INTEGER },
        citations: { type: Type.INTEGER },
        badges: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: {
                    type: { type: Type.STRING },
                    partition: { type: Type.STRING },
                    if: { type: Type.NUMBER }
                }
            } 
        },
        abstract: { type: Type.STRING },
      },
      required: ["id", "title", "authors", "journal", "year", "citations", "badges", "abstract"]
    }
  };

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: schema
        }
      });
      
      const papers = response.text ? JSON.parse(response.text) : [];
      return papers.map((p: any) => ({ ...p, source: 'online', addedDate: new Date().toISOString().split('T')[0] }));

  } catch (e) {
      console.error(e);
      return [];
  }
};

export const generatePaperInterpretation = async (paper: Paper, language: Language): Promise<string> => {
    const prompt = `Interpret the following paper for a researcher. Language: ${language}.
    Title: ${paper.title}
    Abstract: ${paper.abstract}
    
    Provide a concise summary, key contributions, and methodological strengths/weaknesses.`;
    return getText(prompt);
};

export const getPaperTLDR = async (title: string, language: Language): Promise<string> => {
    const prompt = `Provide a one-sentence TL;DR (Too Long; Didn't Read) summary for the paper titled "${title}". Language: ${language}.`;
    return getText(prompt);
};

// --- Trends ---

export const analyzeResearchTrends = async (topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> => {
    const prompt = `Analyze research trends for topic: "${topic}" over range ${timeRange} from perspective of ${persona}. Language: ${language}.
    Return JSON with emergingTech, hotspots, methodologies, researchGaps.`;
    return getJson(prompt);
};

// --- Peer Review ---

export const performPeerReview = async (content: string, filename: string, targetType: TargetType, journalName: string, language: Language): Promise<PeerReviewResponse | null> => {
    const prompt = `Act as a reviewer for ${targetType} journal ${journalName}. Review this content:
    "${content.substring(0, 10000)}..." (truncated)
    Filename: ${filename}.
    Language: ${language}.
    Return JSON matching PeerReviewResponse interface.`;
    
    return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const generateRebuttalLetter = async (critiques: string, language: Language): Promise<string> => {
    const prompt = `Write a polite and professional rebuttal letter addressing these critiques: ${critiques}. Language: ${language}.`;
    return getText(prompt);
};

export const generateCoverLetter = async (summary: string, journal: string, language: Language): Promise<string> => {
    const prompt = `Write a submission cover letter for journal ${journal} based on this summary: ${summary}. Language: ${language}.`;
    return getText(prompt);
};

// --- Review Gen ---

export const generateLiteratureReview = async (paperDescriptions: string[], language: Language): Promise<string> => {
    const prompt = `Generate a literature review based on these papers:
    ${paperDescriptions.join('\n\n')}
    Language: ${language}. Format as Markdown.`;
    return getText(prompt);
};

export const generateStructuredReview = async (topic: string, paperDescriptions: string[], wordCount: number, language: Language): Promise<string> => {
    const prompt = `Write a structured literature review on "${topic}". Target word count: ${wordCount}. Language: ${language}.
    Use these papers:
    ${paperDescriptions.join('\n\n')}`;
    return getText(prompt);
};

// --- Citation Tracking ---

export const trackCitationNetwork = async (query: string, isFile: boolean, language: Language): Promise<TrackedReference[] | null> => {
    const prompt = `Analyze citation network for "${query}". isFile: ${isFile}. Language: ${language}.
    Return JSON array of categories (TrackedReference).`;
    return getJson(prompt);
};

export const analyzeNetworkGaps = async (papers: any[], language: Language): Promise<GapAnalysisResult | null> => {
     const prompt = `Analyze these papers for research gaps: ${JSON.stringify(papers.map(p => p.title).slice(0, 20))}. Language: ${language}.
     Return JSON with missingThemes, underrepresentedMethods, suggestion.`;
     return getJson(prompt);
};

export const chatWithCitationNetwork = async (query: string, papers: any[], language: Language): Promise<string> => {
    const prompt = `Context: ${JSON.stringify(papers.map(p => p.title).slice(0, 20))}.
    User Query: ${query}. 
    Answer based on the context papers. Language: ${language}.`;
    return getText(prompt);
};

// --- Polish ---

export const polishContent = async (content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> => {
    let text = "";
    if (typeof content === 'string') text = content;
    else text = "File content placeholder (mock read)";

    const prompt = `Polish this text: "${text}". 
    Config: ${JSON.stringify(config)}. 
    Language: ${language}.
    Return JSON with polishedText, overallComment, changes (array of {id, original, revised, reason, category, status:'pending'}).`;
    
    return getJson(prompt);
};

export const refinePolish = async (currentText: string, instruction: string, language: Language): Promise<PolishResult | null> => {
    const prompt = `Refine this text: "${currentText}". Instruction: "${instruction}". Language: ${language}.
    Return JSON matching PolishResult.`;
    return getJson(prompt);
};

// --- Advisor ---

export const generateAdvisorReport = async (title: string, journal: string, abstract: string, language: Language): Promise<AdvisorReport | null> => {
    const prompt = `Evaluate paper "${title}" for journal "${journal}". Abstract: "${abstract}". Language: ${language}.
    Return JSON matching AdvisorReport interface.`;
    return getJson(prompt);
};

// --- PPT ---

export const generatePPTStyleSuggestions = async (file: File, language: Language): Promise<any[]> => {
    return [
        { id: '1', name: 'Academic Clean', description: 'Minimalist and professional.', colorPalette: ['#ffffff', '#2563eb'] },
        { id: '2', name: 'Modern Tech', description: 'Dark mode with vibrant accents.', colorPalette: ['#1e293b', '#38bdf8'] },
        { id: '3', name: 'Nature', description: 'Organic tones.', colorPalette: ['#f0fdf4', '#16a34a'] }
    ];
};

export const generatePPTContent = async (file: File, meta: any, language: Language): Promise<any> => {
    const prompt = `Create a PPT structure for a paper. Meta: ${JSON.stringify(meta)}. Language: ${language}.
    Return JSON with title, slides (array of {title, content (array of strings), speakerNotes, visualSuggestion, layout}).`;
    return getJson(prompt);
};

export const generateSlideImage = async (visualSuggestion: string, styleDescription: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Generate a presentation slide background/visual. Style: ${styleDescription}. Content: ${visualSuggestion}` }]
            }
        });
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

// --- Idea Guide ---

export const generateResearchIdeas = async (topic: string, language: Language, focus: string): Promise<IdeaGuideResult | null> => {
    const prompt = `Brainstorm research ideas for "${topic}" with focus on "${focus}". Language: ${language}.
    Return JSON matching IdeaGuideResult.`;
    return getJson(prompt);
};

export const generateIdeaFollowUp = async (topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> => {
     const prompt = `Follow up on research angle "${angle}" for topic "${topic}". User Query: "${query}". Language: ${language}.
     Return JSON matching IdeaFollowUpResult.`;
     return getJson(prompt);
};

// --- Opening Review ---

export const generateOpeningReview = async (file: File, target: string, language: Language, persona: ReviewPersona): Promise<OpeningReviewResponse | null> => {
    const prompt = `Review opening proposal. Target: ${target}. Persona: ${persona}. Language: ${language}.
    Return JSON matching OpeningReviewResponse.`;
    return getJson(prompt);
};

export const optimizeOpeningSection = async (section: string, context: string, language: Language): Promise<string> => {
    const prompt = `Optimize this section of an opening proposal: "${section}". Context: "${context}". Language: ${language}.`;
    return getText(prompt);
};

// --- Data Analysis ---

export const performDataAnalysis = async (stats: any, language: Language, onUpdate?: (status: string, partial: string) => void): Promise<DataAnalysisResult | null> => {
    const prompt = `Analyze this dataset stats: ${JSON.stringify(stats)}. Language: ${language}.
    Return JSON matching DataAnalysisResult.`;
    return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

// --- Code Assistant ---

export const performCodeAssistance = async (
  input: string,
  mode: 'generate' | 'debug' | 'explain',
  langName: string,
  language: Language = 'EN',
  history: { role: string; text: string }[] = [],
  file?: File,
  onUpdate?: (partialText: string) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  try {
    const model = 'gemini-3-pro-preview';
    const instruction = language === 'ZH' ? 'Respond in Simplified Chinese.' : 'Respond in English.';
    
    let taskPrompt = "";
    if (mode === 'generate') {
      taskPrompt = `Task: Write professional, commented ${langName} code to achieve the following: "${input}". 
      Explain the logic briefly after the code block.`;
    } else if (mode === 'debug') {
      taskPrompt = `Task: Debug and fix the following ${langName} code. 
      Input Code/Error: "${input}".
      Provide the corrected code block and explain what caused the error.`;
    } else {
      taskPrompt = `Task: Explain the following ${langName} code line-by-line or by logical blocks.
      Code: "${input}".`;
    }

    const systemPrompt = `You are an expert Academic Programmer and Data Scientist proficient in Python, R, and MATLAB.
    ${instruction}
    Format the output with Markdown. Use proper syntax highlighting.
    If the user uploads a file, analyze its structure to write the code.`;

    const parts: any[] = [];
    
    if (file) {
        const base64Data = await fileToBase64(file);
        let mimeType = file.type;
        if (!mimeType) {
             if (file.name.endsWith('.csv')) mimeType = 'text/csv';
             else if (file.name.endsWith('.py')) mimeType = 'text/x-python';
             else mimeType = 'text/plain';
        }
        
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
        parts.push({ text: `[Attached File: ${file.name}]` });
    }
    
    let historyContext = "";
    if (history.length > 0) {
        historyContext = "Chat History:\n" + history.map(h => `${h.role === 'user' ? 'User' : 'Model'}: ${h.text}`).join('\n\n') + "\n\n";
    }

    parts.push({ text: `${systemPrompt}\n\n${historyContext}${taskPrompt}` });

    const responseStream = await ai.models.generateContentStream({
      model,
      contents: { parts },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      if (abortSignal?.aborted) {
          break;
      }
      const text = chunk.text;
      fullText += text;
      if (onUpdate) onUpdate(fullText);
    }

    return fullText;
  } catch (error: any) {
    if (error.name === 'AbortError') {
        return "Generation stopped by user.";
    }
    console.error("Code Assistant Error:", error);
    return "Error interacting with Code Assistant.";
  }
};
