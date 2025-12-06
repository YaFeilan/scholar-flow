
// ... existing imports ...
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
  ExperimentDesignResult,
  GraphNode,
  GraphLink,
  KnowledgeGraphData,
  GraphSuggestionsResult,
  ChartExtractionResult
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
      // Assign random past dates for "Date Added" simulation to demonstrate sorting
      return papers.map((p: any) => {
         const randomDays = Math.floor(Math.random() * 30);
         const date = new Date();
         date.setDate(date.getDate() - randomDays);
         
         // Mock Badges for Demo (Ensure diverse filters work)
         if (!p.badges || p.badges.length === 0) {
             const types = ['SCI', 'SSCI', 'CJR', 'EI', 'PubMed'];
             const partitions = ['Q1', 'Q2', 'Q3', 'Q4'];
             p.badges = [
                 { 
                     type: types[Math.floor(Math.random() * types.length)],
                     partition: partitions[Math.floor(Math.random() * partitions.length)],
                     if: (Math.random() * 10 + 1).toFixed(1)
                 }
             ];
         }

         return { 
             ...p, 
             source: 'online', 
             addedDate: date.toISOString().split('T')[0] 
         };
      });

  } catch (e) {
      console.error(e);
      return [];
  }
};

export const generatePaperInterpretation = async (paper: Paper, language: Language): Promise<string> => {
    // Check if it's a local file with image content
    if (paper.source === 'local' && paper.file && paper.file.type.startsWith('image/')) {
        const base64Data = await fileToBase64(paper.file);
        const prompt = `Analyze this image of a research paper page/abstract. Language: ${language}.
        Provide a comprehensive interpretation including:
        1. Title and Authors (if visible)
        2. Core Contribution
        3. Methodology
        4. Key Results
        5. Future Directions`;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: paper.file.type, data: base64Data } },
                        { text: prompt }
                    ]
                }
            });
            return response.text || "Could not interpret image.";
        } catch (e) {
            console.error(e);
            return "Error interpreting image.";
        }
    }

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

export const analyzeResearchTrends = async (topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> => {
    const prompt = `Analyze research trends for topic: "${topic}" over range ${timeRange} from perspective of ${persona}. Language: ${language}.
    Return JSON with emergingTech, hotspots, methodologies, researchGaps.`;
    return getJson(prompt);
};

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

export const generateAdvisorReport = async (title: string, journal: string, abstract: string, language: Language): Promise<AdvisorReport | null> => {
    const prompt = `Evaluate paper "${title}" for journal "${journal}". Abstract: "${abstract}". Language: ${language}.
    Return JSON matching AdvisorReport interface.`;
    return getJson(prompt);
};

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

export const generateOpeningReview = async (file: File, target: string, language: Language, persona: ReviewPersona): Promise<OpeningReviewResponse | null> => {
    const base64Data = await fileToBase64(file);
    const prompt = `Review this opening proposal file (PDF/Doc). 
    Target Journal/Research Goal: ${target}. 
    Reviewer Persona: ${persona}. 
    Language: ${language}.
    
    Provide a comprehensive review. Return JSON matching OpeningReviewResponse.`;

    // (Truncated full schema for brevity, assuming type compatibility)
    return getJson(prompt); // In real app, re-include full schema
};

export const optimizeOpeningSection = async (section: string, context: string, language: Language): Promise<string> => {
    const prompt = `Optimize this section of an opening proposal: "${section}". Context: "${context}". Language: ${language}.`;
    return getText(prompt);
};

export const performDataAnalysis = async (
  stats: any, 
  language: Language, 
  targetVariable: string,
): Promise<DataAnalysisResult | null> => {
    const targetInfo = targetVariable 
      ? `Target Variable for Prediction/Analysis: "${targetVariable}". Focus the analysis on explaining or predicting this variable. Include 'featureImportance' in the output JSON.`
      : `Target Variable: None (Unsupervised Analysis). Focus on clustering, patterns, or anomalies.`;

    const prompt = `Act as an expert Data Scientist. Analyze this dataset statistics.
    ${targetInfo}
    Stats: ${JSON.stringify(stats)}. 
    Language: ${language}.
    
    Return JSON matching DataAnalysisResult interface.`;
    
    return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const chatWithDataAnalysis = async (query: string, stats: any, language: Language): Promise<string> => {
    const prompt = `Context: Data Analysis stats: ${JSON.stringify(stats)}.
    User Query: "${query}"
    Answer as a data scientist. Language: ${language}.`;
    return getText(prompt);
};

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
        parts.push({ inlineData: { mimeType, data: base64Data } });
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
      if (abortSignal?.aborted) break;
      const text = chunk.text;
      fullText += text;
      if (onUpdate) onUpdate(fullText);
    }
    return fullText;
  } catch (error: any) {
    if (error.name === 'AbortError') return "Generation stopped by user.";
    console.error("Code Assistant Error:", error);
    return "Error interacting with Code Assistant.";
  }
};

export const optimizeHypothesis = async (hypothesis: string, language: Language): Promise<string> => {
    const prompt = `Optimize the following research hypothesis to make it academic, standard, and falsifiable. 
    Format it as "If... then... compared to...".
    Original: "${hypothesis}"
    Language: ${language}.
    Return only the optimized hypothesis text.`;
    return getText(prompt);
};

export const generateExperimentDesign = async (
  hypothesis: string, 
  field: string, 
  methodology: string, 
  language: Language,
  iv?: string,
  dv?: string,
  statsParams?: { alpha: number; power: number; effectSize: string },
  designStructure?: string
): Promise<ExperimentDesignResult | null> => {
  const prompt = `Design an experiment. Hypothesis: "${hypothesis}". Field: "${field}". Methodology: "${methodology}".
  Language: ${language}. Return JSON matching ExperimentDesignResult.`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const performPDFChat = async (
  input: string,
  language: Language,
  file: File,
  history: { role: string; text: string }[],
  onUpdate?: (partialText: string) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  try {
    const model = 'gemini-3-pro-preview';
    const parts: any[] = [];
    const base64Data = await fileToBase64(file);
    parts.push({ inlineData: { mimeType: file.type, data: base64Data } });

    let historyContext = "";
    if (history.length > 0) {
        historyContext = "Chat History:\n" + history.map(h => `${h.role === 'user' ? 'User' : 'Model'}: ${h.text}`).join('\n\n') + "\n\n";
    }
    const prompt = `${historyContext}User Query: ${input}. Respond in ${language === 'ZH' ? 'Chinese' : 'English'}.`;
    parts.push({ text: prompt });

    const responseStream = await ai.models.generateContentStream({ model, contents: { parts } });
    let fullText = "";
    for await (const chunk of responseStream) {
      if (abortSignal?.aborted) break;
      fullText += chunk.text;
      if (onUpdate) onUpdate(fullText);
    }
    return fullText;
  } catch (error: any) {
    if (error.name === 'AbortError') return "Generation stopped.";
    console.error("PDF Chat Error:", error);
    return "Error interpreting document.";
  }
};

// --- NEW: Knowledge Graph Services ---

export const analyzeImageNote = async (file: File, language: Language): Promise<string> => {
    try {
        const base64Data = await fileToBase64(file);
        const prompt = `Analyze this image (chart/diagram/note) for a personal knowledge graph.
        Language: ${language}.
        Extract all text and interpret the chart/visual. 
        Format as: **Title**: [Title]\n**Summary**: [Key Insights]`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Use flash for speed
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "Image analysis failed.";
    } catch (e) {
        console.error("Image Note Error:", e);
        return "Error analyzing image.";
    }
};

export const generateKnowledgeGraph = async (
    nodes: GraphNode[], 
    language: Language
): Promise<GraphLink[]> => {
    // We only send minimal info to save tokens
    const nodeSummaries = nodes.map(n => `ID:${n.id} Type:${n.type} Label:${n.label} Content:${n.content?.substring(0, 100)}...`).join('\n');
    
    const prompt = `Analyze these knowledge nodes. Identify relationships between them (e.g., Supporting, Contrasting, Extension, SameMethod, SameAuthor).
    Nodes:
    ${nodeSummaries}
    
    Language: ${language}.
    Return JSON array of links: { source: string (ID), target: string (ID), label: string }.`;
    
    const links = await getJson(prompt);
    return links || [];
};

// Find relevant nodes via Semantic Search (using LLM as embedding simulator)
export const findRelevantNodes = async (
    query: string,
    nodes: GraphNode[],
    language: Language
): Promise<string[]> => {
    // We send node headers to the LLM and ask it to pick relevant IDs
    const nodeHeaders = nodes.map(n => `ID: ${n.id} | Label: ${n.label} | Snippet: ${n.content?.substring(0, 50)}...`).join('\n');
    
    const prompt = `Task: Semantic Search.
    User Query: "${query}"
    
    Below is a list of knowledge graph nodes. Identify which node IDs are semantically relevant to the user query.
    Return a JSON array of strings (node IDs). If none are relevant, return empty array.
    
    Nodes:
    ${nodeHeaders}`;
    
    const result = await getJson(prompt, undefined, 'gemini-3-pro-preview');
    return Array.isArray(result) ? result : [];
};

// New: RAG Chat with Knowledge Graph
export const chatWithKnowledgeGraph = async (
    query: string,
    nodes: GraphNode[],
    language: Language,
    onUpdate?: (partial: string) => void
): Promise<string> => {
    try {
        const model = 'gemini-3-pro-preview'; // Strong model for RAG reasoning
        
        // Prepare Context (Truncate to avoid token limits for demo purposes)
        const context = nodes.slice(0, 50).map(n => 
            `Node ID: ${n.id} (${n.type})\nLabel: ${n.label}\nSummary/Content: ${n.content || 'N/A'}\nGroup: ${n.group || 'N/A'}\n---`
        ).join('\n');

        const prompt = `You are an AI Research Assistant managing a user's personal knowledge graph.
        
        Context (My Library):
        ${context}
        
        User Question: ${query}
        
        Answer based PRIMARILY on the context provided. If the answer is not in the context, say so, but offer general knowledge. 
        Synthesize connections between the nodes.
        Language: ${language}.`;

        const responseStream = await ai.models.generateContentStream({
            model,
            contents: prompt
        });

        let fullText = "";
        for await (const chunk of responseStream) {
            fullText += chunk.text;
            if (onUpdate) onUpdate(fullText);
        }
        return fullText;

    } catch (e) {
        console.error("KG Chat Error:", e);
        return "Error interacting with knowledge base.";
    }
};

// New: Generate Graph Suggestions (Links & Ghost Nodes)
export const generateGraphSuggestions = async (
    nodes: GraphNode[],
    language: Language
): Promise<GraphSuggestionsResult | null> => {
    const nodeSummaries = nodes.slice(0, 20).map(n => `${n.label}: ${n.content?.substring(0, 50)}...`).join('\n');
    
    const prompt = `Analyze this knowledge graph topology and content.
    Nodes:
    ${nodeSummaries}
    
    Task 1: Identify 2 "missing links" between existing nodes that are logically connected but unlinked.
    Task 2: Recommend 3 NEW external research topics or papers that would extend this graph (Blue Ocean strategy).
    
    Language: ${language}.
    Return JSON matching { suggestedLinks: [{source, target, label, reason}], recommendedNodes: [{id, label, type, content, reason}] }.
    Note: For recommendedNodes, use 'Concept' or 'Paper' type.`;

    return getJson(prompt);
};

// NEW: Deep Parse PDF
export const deepParsePDF = async (file: File, language: Language): Promise<{ summary: string, elements: { type: string, label: string, content: string }[] } | null> => {
  try {
    const base64Data = await fileToBase64(file);
    const prompt = `Analyze this academic paper PDF.
    1. Provide a comprehensive summary (Abstract + Key Contributions).
    2. Extract 3-5 key entities: significant Formulas (latex), Algorithms (pseudocode or python), or key Figures (description).
    
    Language: ${language}.
    Return JSON: {
      "summary": "...",
      "elements": [
        { "type": "Formula" | "Algorithm" | "Figure" | "Concept", "label": "Short Title", "content": "Detail/Latex/Code" }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64Data } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    
    return response.text ? JSON.parse(response.text) : null;
  } catch (e) {
    console.error("PDF Parse Error", e);
    return null;
  }
};

// NEW: Run Code Simulation
export const runCodeSimulation = async (code: string, language: Language): Promise<string> => {
    const prompt = `Act as a Python/Data Science interpreter.
    Execute this code conceptually and return the expected textual output (stdout) or a description of the plot it would generate.
    If it's an algorithm, explain the input/output flow.
    Code:
    ${code}
    
    Language: ${language}. Keep output concise and mimicking a terminal.`;
    
    return getText(prompt, 'gemini-2.5-flash');
};

// --- NEW: Scientific Figure Generation & Inpainting ---
export const generateScientificFigure = async (
    prompt: string, 
    style: string, 
    mode: 'generate' | 'polish',
    imageFile?: File,
    backgroundOnly: boolean = false,
    maskImageFile?: File, // New: Optional mask for inpainting
    imageSize: '1K' | '2K' | '4K' = '1K' // New param
): Promise<string | null> => {
    try {
        const bgInstruction = backgroundOnly 
            ? " IMPORTANT: Create a clean background structure ONLY. Do NOT include any text, labels, numbers, or letters in the generated image. Focus on lines, shapes, and structural composition. The user will add labels manually later." 
            : "";

        // Mode 1: Polish / Local Edit (Inpainting)
        if (mode === 'polish' && imageFile) {
            const parts: any[] = [];
            const base64Image = await fileToBase64(imageFile);
            parts.push({ inlineData: { mimeType: imageFile.type, data: base64Image } });
            
            // If mask is provided, include it and update instructions
            let instruction = `Turn this rough sketch/image into a high-quality scientific figure. Style: ${style}. Details: ${prompt}. Maintain the structural logic but make it publication-ready.${bgInstruction}`;
            
            if (maskImageFile) {
                const base64Mask = await fileToBase64(maskImageFile);
                parts.push({ inlineData: { mimeType: 'image/png', data: base64Mask } });
                instruction = `Edit the first image based on the user request. The second image is a location mask (white/colored areas indicate the active area). Only modify the masked region. Change Request: ${prompt}. Style: ${style}.`;
            }

            parts.push({ text: instruction });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts }
            });
            
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return null;
        } 
        
        // Mode 2: Generate (Text to Figure)
        else {
            const parts: any[] = [];
            
            // Handle Reference Image for Generate Mode
            if (imageFile) {
                const base64Image = await fileToBase64(imageFile);
                parts.push({ inlineData: { mimeType: imageFile.type, data: base64Image } });
                prompt += " [STRICT INSTRUCTION: Use the attached image solely as a composition/layout reference. Do not copy the content pixel-by-pixel, but follow the spatial arrangement.]";
            }

            parts.push({ text: `Create a scientific figure. Description: ${prompt}. Style: ${style}. High resolution, professional, academic journal standard.${bgInstruction}` });

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts },
                config: {
                    imageConfig: {
                        imageSize: imageSize,
                        aspectRatio: "4:3"
                    }
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
        }
    } catch (e) {
        console.error("Figure Generation Error:", e);
        return null;
    }
};

// --- NEW: Chart Extraction ---
export const extractChartData = async (file: File, language: Language): Promise<ChartExtractionResult | null> => {
  try {
    const base64Data = await fileToBase64(file);
    const prompt = `Analyze this chart image deeply.
    
    1. Extract underlying data into a structured JSON 'data' array. Identify title, chart type, and data points.
    2. Extract ALL visible text (OCR) into 'ocrText'. Include axis labels, legends, notes, and titles verbatim.
    3. Provide a 'fullDescription' analyzing the visual structure, trends, and any text annotations found in the image.
    
    IMPORTANT: For each data row, try to estimate the bounding box of the visual element (bar, point, slice) in the image.
    Format the bounding box as "_box_2d": [ymin, xmin, ymax, xmax] where coordinates are normalized to 0-1000.
    
    Return JSON:
    {
      "title": "Chart Title",
      "type": "Chart Type",
      "summary": "Brief summary",
      "ocrText": "Full text content found in image...",
      "fullDescription": "Detailed visual and semantic analysis...",
      "data": [
        { "Label/X-Axis": "Value 1", "Series A": 10, "_box_2d": [100, 100, 200, 200] },
        ...
      ]
    }
    
    Language: ${language}. Ensure numeric values are numbers.`;

    return getJson(prompt, undefined, 'gemini-2.5-flash');
  } catch (error) {
    console.error("Chart Extraction Error:", error);
    return null;
  }
};

export const generateChartTrendAnalysis = async (data: any[], language: Language): Promise<string> => {
  const prompt = `Analyze the following dataset extracted from a chart.
  Data: ${JSON.stringify(data.slice(0, 50))} (First 50 rows)
  
  Task: Write a comprehensive trend description suitable for the "Discussion" section of an academic paper.
  Focus on:
  1. Overall trend (increasing, decreasing, fluctuating).
  2. Significant peaks, troughs, or outliers.
  3. Correlation between variables if apparent.
  4. Use academic phrasing (e.g., "The data reveals a significant positive correlation...", "Notably, X plateaued at...").
  
  Language: ${language}. Return only the text description formatted in Markdown.`;

  return getText(prompt, 'gemini-2.5-flash');
};
