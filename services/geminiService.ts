import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
  Language,
  Paper,
  TrendAnalysisResult,
  TrendTimeRange,
  TrendPersona,
  PeerReviewResponse,
  TargetType,
  TrackedReference,
  GapAnalysisResult,
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
  GraphSuggestionsResult,
  ChartExtractionResult,
  CodeMessage,
  GrantCheckResult,
  LogicNode
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helpers ---

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
}

async function getJson(prompt: string, schema?: Schema, model: string = 'gemini-2.5-flash'): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const text = response.text || "{}";
    // Handle markdown code blocks if present
    const jsonStr = text.replace(/```json\n|\n```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API JSON Error:", error);
    return null;
  }
}

// --- Search & Review ---

export const searchAcademicPapers = async (query: string, language: Language, limit: number = 10): Promise<Paper[]> => {
  const prompt = `Search for academic papers related to "${query}".
  Language: ${language}.
  Limit: ${limit} results.
  Return a list of realistic mock papers if real search is not available, but try to be accurate to the topic.
  Format as JSON array with fields: id, title, authors (array), journal, year (number), citations (number), abstract, badges (array of objects with type, partition, if).`;
  
  // Define Schema for stricter output if needed, or rely on prompt
  const result = await getJson(prompt, undefined, 'gemini-2.5-flash');
  return Array.isArray(result) ? result : [];
};

export const generatePaperInterpretation = async (paper: Paper, language: Language): Promise<string> => {
  const prompt = `Interpret the following academic paper for a researcher.
  Title: ${paper.title}
  Abstract: ${paper.abstract}
  
  Provide a concise summary including:
  1. Core Contribution
  2. Methodology
  3. Key Findings
  
  Language: ${language}. Format: Markdown.`;
  return getText(prompt);
};

export const generateLiteratureReview = async (paperDescriptions: string[], language: Language): Promise<string> => {
  const prompt = `Generate a comprehensive literature review based on the following papers:
  ${paperDescriptions.join('\n\n')}
  
  Synthesize the themes, methodologies, and findings.
  Language: ${language}. Format: Markdown.`;
  return getText(prompt, 'gemini-3-pro-preview');
};

export const generateStructuredReview = async (topic: string, papers: string[], wordCount: number, language: Language): Promise<string> => {
  const prompt = `Write a structured literature review on "${topic}".
  Papers to include:
  ${papers.join('\n')}
  
  Target Word Count: ${wordCount}.
  Language: ${language === 'ZH' ? 'Simplified Chinese' : 'English'}.
  Structure: Introduction, Methodology Review, Main Themes, Gaps, Conclusion.
  Format: Markdown.`;
  return getText(prompt, 'gemini-3-pro-preview');
};

// --- Trends ---

export const analyzeResearchTrends = async (topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> => {
  const prompt = `Analyze research trends for "${topic}" over the ${timeRange}.
  Persona: ${persona}.
  Language: ${language}.
  Return JSON with:
  - emergingTech: array of {name, growth (number), predictedGrowth (number), type}
  - hotspots: array of {text, value (number), category, relatedTo (array of strings)}
  - methodologies: array of {name, value (number), growth (number), relatedHotspots (array strings), codeStats: {github: string, huggingface: string}}
  - researchGaps: array of {problem, potential, difficulty (High/Medium/Low), type (Blue Ocean/Hard Problem)}`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const getPaperTLDR = async (title: string, language: Language): Promise<string> => {
  const prompt = `Provide a one-sentence TL;DR for the paper titled "${title}". Language: ${language}.`;
  return getText(prompt);
};

// --- Peer Review ---

export const performPeerReview = async (content: string, filename: string, target: TargetType, journal: string, language: Language): Promise<PeerReviewResponse | null> => {
  const prompt = `Act as a senior reviewer for ${target} ${journal ? `(Target: ${journal})` : ''}.
  Review the following manuscript content/abstract:
  "${content.substring(0, 5000)}..."
  
  Language: ${language}.
  Return JSON with:
  - checklist: {originality, soundness, clarity, recommendation}
  - reviewers: array of 3 reviewers (roles: "Domain Expert", "Methodologist", "Editor"), each with {roleName, icon (Expert/Language/Editor), focusArea, score (1-10), critiques: array of {point, quote, suggestion}}
  - summary: string`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const generateRebuttalLetter = async (critiques: string, language: Language): Promise<string> => {
  const prompt = `Draft a polite and professional rebuttal letter addressing these critiques:
  ${critiques}
  Language: ${language}. Format: Markdown.`;
  return getText(prompt);
};

export const generateCoverLetter = async (summary: string, journal: string, language: Language): Promise<string> => {
  const prompt = `Draft a cover letter for submission to ${journal}.
  Paper Summary: ${summary}
  Language: ${language}. Format: Markdown.`;
  return getText(prompt);
};

// --- Tracking ---

export const trackCitationNetwork = async (query: string, isFile: boolean, language: Language): Promise<TrackedReference[] | null> => {
  const prompt = `Analyze the citation network for ${isFile ? 'the uploaded file' : `the paper "${query}"`}.
  Classify references into categories like "Methodology", "Backbone", "Dataset", "Comparison".
  Language: ${language}.
  Return JSON array of categories, each with 'category' name and 'papers' array.
  Each paper in 'papers': {title, author, year, description, citations, sentiment (Support/Dispute/Mention), snippet, isStrong (bool)}.`;
  return getJson(prompt);
};

export const analyzeNetworkGaps = async (papers: any[], language: Language): Promise<GapAnalysisResult | null> => {
  const prompt = `Analyze these papers to find research gaps:
  ${JSON.stringify(papers.slice(0, 20))}
  Language: ${language}.
  Return JSON: {missingThemes: string[], underrepresentedMethods: string[], suggestion: string}`;
  return getJson(prompt);
};

export const chatWithCitationNetwork = async (query: string, papers: any[], language: Language): Promise<string> => {
  const prompt = `Answer this question based on the provided papers: "${query}"
  Papers: ${JSON.stringify(papers.slice(0, 10).map(p => p.title))}
  Language: ${language}.`;
  return getText(prompt);
};

// --- Polish ---

export const polishContent = async (content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> => {
  let text = "";
  if (content instanceof File) {
      // Simulate file reading or use real if implemented
      text = "Content from file..."; 
  } else {
      text = content;
  }

  const prompt = `Polish the following text.
  Mode: ${config.mode}
  Tone: ${config.tone}
  Field: ${config.field}
  Glossary: ${config.glossary}
  Original Text: "${text}"
  
  Language: ${language}.
  Return JSON: {
    polishedText: string,
    overallComment: string,
    changes: array of {id, original, revised, reason, category (Grammar/Vocabulary/Tone/Structure), status: 'pending'}
  }`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const refinePolish = async (currentText: string, instruction: string, language: Language): Promise<PolishResult | null> => {
  const prompt = `Refine this text based on instruction: "${instruction}".
  Text: "${currentText}"
  Language: ${language}.
  Return JSON similar to polishContent.`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

// --- Advisor ---

export const generateAdvisorReport = async (title: string, journal: string, abstract: string, language: Language): Promise<AdvisorReport | null> => {
  const prompt = `Evaluate manuscript for journal "${journal}".
  Title: "${title}"
  Abstract: "${abstract}"
  Language: ${language}.
  Return JSON: AdvisorReport structure (matchScore, matchLevel, radar, analysis, titleSuggestions, keywords, riskAssessment, alternatives, references, improvementSuggestions).`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

// --- PPT ---

export const generatePPTStyleSuggestions = async (file: File, language: Language): Promise<any[]> => {
  // Simulate style suggestions based on file content analysis
  const prompt = `Suggest 3 PPT styles suitable for a research paper presentation.
  Language: ${language}.
  Return JSON array of {id, name, description, colorPalette (array of hex colors)}.`;
  return getJson(prompt);
};

export const generatePPTContent = async (file: File, config: any, language: Language): Promise<any> => {
  const prompt = `Generate PPT content for a research paper.
  Config: ${JSON.stringify(config)}
  Language: ${language}.
  Return JSON: {title, slides: array of {title, content (array of strings), speakerNotes, visualSuggestion, layout}}`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const generateSlideImage = async (visualDescription: string, style: string): Promise<string> => {
  const prompt = `Create a presentation slide image.
  Visual Description: ${visualDescription}
  Style: ${style}.
  Type: Scientific Illustration/Diagram.`;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Using flash-image for generation
      contents: prompt,
      config: {
          // Note: responseMimeType is not technically supported for image output in generateContentconfig,
          // but we follow instructions to call generateContent for nano banana series models.
          // The output response may contain both image and text parts.
      }
  });
  
  if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
      }
  }
  return ""; // Fallback
};

// --- Idea ---

export const generateResearchIdeas = async (topic: string, language: Language, focus: string): Promise<IdeaGuideResult | null> => {
  const prompt = `Generate research ideas for "${topic}". Focus: ${focus}.
  Language: ${language}.
  Return JSON: IdeaGuideResult structure (directions array, journals array).`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const generateIdeaFollowUp = async (topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> => {
  const prompt = `Deep dive into research angle "${angle}" for topic "${topic}". User query: "${query}".
  Language: ${language}.
  Return JSON: IdeaFollowUpResult structure.`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

// --- Opening ---

export const generateOpeningReview = async (file: File, target: string, language: Language, persona: ReviewPersona): Promise<OpeningReviewResponse | null> => {
  const prompt = `Review this opening proposal (PDF content). Target: ${target}. Persona: ${persona}.
  Language: ${language}.
  Return JSON: OpeningReviewResponse structure.`;
  
  const base64 = await fileToBase64(file);
  const parts = [
      { text: prompt },
      { inlineData: { mimeType: file.type, data: base64 } }
  ];
  
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: { parts },
          config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
  } catch (e) {
      console.error(e);
      return null;
  }
};

export const optimizeOpeningSection = async (section: string, context: string, language: Language): Promise<string> => {
  const prompt = `Optimize this section of an opening report: "${section}".
  Context: "${context}"
  Language: ${language}. Return only the optimized text.`;
  return getText(prompt);
};

// --- Data ---

export const performDataAnalysis = async (stats: any, language: Language, targetVar?: string): Promise<DataAnalysisResult | null> => {
  const prompt = `Analyze this dataset statistics. Target Variable: ${targetVar || 'None'}.
  Stats: ${JSON.stringify(stats)}
  Language: ${language}.
  Return JSON: DataAnalysisResult structure (summary, columns, correlations, featureImportance, recommendedModels).`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const chatWithDataAnalysis = async (query: string, stats: any, language: Language): Promise<string> => {
  const prompt = `Answer user query about data. Query: "${query}".
  Data Stats: ${JSON.stringify(stats)}
  Language: ${language}.`;
  return getText(prompt);
};

// --- Code ---

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
    
    const parts: any[] = [{ text: `Task: ${mode} code in ${lang}. User Input: ${input}. Language: ${language}.` }];
    if (file) {
        const base64 = await fileToBase64(file);
        parts.push({ inlineData: { mimeType: file.type, data: base64 } });
    }

    let fullHistoryText = "";
    history.forEach(h => {
        fullHistoryText += `${h.role}: ${h.text}\n`;
    });
    parts[0].text = `${fullHistoryText}\nUser: ${parts[0].text}`;

    const streamResult = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview', // Good for code
        contents: { parts }
    });

    let fullText = "";
    for await (const chunk of streamResult) {
        // Check signal manually or handle via loop break
        if (signal?.aborted) break;
        const text = chunk.text;
        if (text) {
            fullText += text;
            if (onStream) onStream(fullText);
        }
    }
    return fullText;
};

// --- Experiment ---

export const generateExperimentDesign = async (hypothesis: string, field: string, method: string, language: Language, iv: string, dv: string, statsParams: any, structure: string): Promise<ExperimentDesignResult | null> => {
  const prompt = `Design an experiment.
  Hypothesis: ${hypothesis}
  Field: ${field}
  Method: ${method}
  Structure: ${structure}
  IV: ${iv}, DV: ${dv}
  Stats Params: ${JSON.stringify(statsParams)}
  Language: ${language}.
  Return JSON: ExperimentDesignResult structure.`;
  return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const optimizeHypothesis = async (hypothesis: string, language: Language): Promise<string> => {
  const prompt = `Optimize this research hypothesis for clarity and testability.
  Hypothesis: "${hypothesis}"
  Language: ${language}. Return only the optimized hypothesis text.`;
  return getText(prompt);
};

// --- PDF Chat ---

export const performPDFChat = async (query: string, language: Language, file: File, history: any[], onStream: (text: string) => void, signal?: AbortSignal): Promise<string> => {
    const base64 = await fileToBase64(file);
    const parts = [
        { inlineData: { mimeType: file.type, data: base64 } },
        { text: `Answer this query based on the document: "${query}". Language: ${language}.` }
    ];
    
    let historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');
    parts[1].text = `History:\n${historyText}\n\nUser: ${query}\nLanguage: ${language}`;

    const streamResult = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash', // Faster for chat
        contents: { parts }
    });

    let fullText = "";
    for await (const chunk of streamResult) {
        if (signal?.aborted) break;
        const text = chunk.text;
        if (text) {
            fullText += text;
            onStream(fullText);
        }
    }
    return fullText;
};

// --- Knowledge Graph ---

export const generateKnowledgeGraph = async (nodes: GraphNode[], language: Language): Promise<GraphLink[]> => {
  const prompt = `Analyze these nodes and suggest connections (links).
  Nodes: ${JSON.stringify(nodes.map(n => ({id: n.id, label: n.label, content: n.content?.substring(0, 100)})))}
  Language: ${language}.
  Return JSON array of GraphLink objects {source, target, label}.`;
  
  const res = await getJson(prompt);
  return Array.isArray(res) ? res : [];
};

export const analyzeImageNote = async (file: File, language: Language): Promise<string> => {
  const base64 = await fileToBase64(file);
  const prompt = `Analyze this image (handwritten note or diagram) and convert it to markdown text. Language: ${language}.`;
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: file.type, data: base64 } }] }
  });
  return response.text || "";
};

export const chatWithKnowledgeGraph = async (query: string, nodes: GraphNode[], language: Language, onStream?: (text: string) => void): Promise<string> => {
  const prompt = `Answer query based on these knowledge graph nodes:
  Nodes: ${JSON.stringify(nodes.map(n => ({label: n.label, content: n.content})))}
  Query: "${query}"
  Language: ${language}.`;
  return getText(prompt);
};

export const generateGraphSuggestions = async (nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> => {
  const prompt = `Suggest new related nodes (papers/concepts) and links for this graph.
  Current Nodes: ${JSON.stringify(nodes.map(n => n.label))}
  Language: ${language}.
  Return JSON: {suggestedLinks: [], recommendedNodes: []}`;
  return getJson(prompt);
};

export const deepParsePDF = async (file: File, language: Language): Promise<{summary: string, elements: any[]} | null> => {
  const base64 = await fileToBase64(file);
  const prompt = `Deep parse this PDF research paper. Extract summary and key elements (formulas, algorithms, charts).
  Language: ${language}.
  Return JSON: {summary: string, elements: array of {type, label, content}}.`;
  
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }, { inlineData: { mimeType: file.type, data: base64 } }] },
          config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "null");
  } catch (e) {
      console.error(e);
      return null;
  }
};

export const runCodeSimulation = async (code: string, language: Language): Promise<string> => {
  const prompt = `Simulate the output of this code (do not execute it, just predict output based on logic):
  ${code}
  Language: ${language}.`;
  return getText(prompt);
};

export const findRelevantNodes = async (search: string, nodes: GraphNode[], language: Language): Promise<string[]> => {
  const prompt = `Find node IDs relevant to "${search}".
  Nodes: ${JSON.stringify(nodes.map(n => ({id: n.id, label: n.label, content: n.content?.substring(0, 50)})))}
  Return JSON array of IDs.`;
  const res = await getJson(prompt);
  return Array.isArray(res) ? res : [];
};

// --- Figure ---

export const generateScientificFigure = async (prompt: string, style: string, mode: 'generate' | 'polish', imageFile?: File, backgroundOnly?: boolean, maskFile?: File, imageSize: '1K'|'2K'|'4K' = '1K'): Promise<string> => {
  // Use gemini-3-pro-image-preview for high quality
  const model = 'gemini-3-pro-image-preview';
  
  const parts: any[] = [{ text: `${mode === 'generate' ? 'Generate' : 'Polish'} a scientific figure. Prompt: ${prompt}. Style: ${style}. ${backgroundOnly ? 'Background structure only, no text.' : ''}` }];
  
  if (imageFile) {
      const base64 = await fileToBase64(imageFile);
      parts.push({ inlineData: { mimeType: imageFile.type, data: base64 } });
  }
  
  if (maskFile) {
      const maskBase64 = await fileToBase64(maskFile);
      parts.push({ inlineData: { mimeType: maskFile.type, data: maskBase64 } });
      parts[0].text += " Use the second image as a mask for editing.";
  }

  try {
      const response = await ai.models.generateContent({
          model: model,
          contents: { parts },
          config: {
              imageConfig: {
                  imageSize: imageSize,
                  aspectRatio: "4:3"
              }
          }
      });
      
      if (response.candidates && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
          }
      }
  } catch (e) {
      console.error(e);
  }
  return "";
};

// --- Chart ---

export const extractChartData = async (file: File, language: Language): Promise<ChartExtractionResult | undefined> => {
  const base64 = await fileToBase64(file);
  const prompt = `Extract data from this chart image.
  Language: ${language}.
  Return JSON: {
    title: string,
    type: string,
    summary: string,
    data: array of objects (representing rows, keys are labels),
    ocrText: string,
    fullDescription: string
  }`;
  
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }, { inlineData: { mimeType: file.type, data: base64 } }] },
          config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
  } catch (e) {
      console.error(e);
      return undefined;
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

// --- Grant ---

export const generateGrantJustification = async (
  projectInfo: { name: string, keywords: string[], domainCode: string },
  language: Language,
  references: { type: 'pdf' | 'doi', content: string | File }[] = [],
  mode: 'full' | 'status' | 'significance' = 'full'
): Promise<string> => {
    // Legacy support wrapper - if this is called directly, assume text output
    // But we are moving to logic framework first. This function might be deprecated or used for legacy.
    // For now, keep it as is or redirect? The UI component has been refactored to use `generateGrantLogicFramework`.
    // Let's implement it for backward compatibility or simple text gen.
    
    // ... Existing logic ...
    const parts: any[] = [];
    
    // Process References
    let refContext = "";
    if (references.length > 0) {
        refContext = "You must base your 'Current Status' and 'Gaps' analysis specifically on the following provided reference materials. Cite them in the text as [1], [2], etc., corresponding to their order here.\n\n";
        
        // Handle DOIs (Text)
        const dois = references.filter(r => r.type === 'doi').map(r => r.content as string);
        if (dois.length > 0) {
            refContext += "Reference DOIs:\n" + dois.map((d, i) => `[DOI-${i+1}] ${d}`).join('\n') + "\n\n";
        }
    }

    let specificInstruction = "";
    if (mode === 'full') {
        specificInstruction = `Structure the response as follows:
        1. **Research Significance**: Scientific value and application potential.
        2. **Current Status (Domestic & International)**: State of the art analysis based on the provided references.
        3. **Existing Problems/Gaps**: What needs to be solved.
        4. **References**: List the cited references at the end.`;
    } else if (mode === 'status') {
        specificInstruction = `Focus ONLY on the **Current Research Status (Domestic & International)**.
        Provide a comprehensive literature review and state of the art analysis based strictly on the provided references.
        Identify gaps in the current research landscape.
        End with a list of References.`;
    } else if (mode === 'significance') {
        specificInstruction = `Focus ONLY on the **Research Significance**.
        Elaborate on the scientific value, innovation, and application potential of the proposed project.
        Do not include a full literature review.`;
    }

    const prompt = `Write a specific section for a "Basis of the Project" (立项依据) in a major research grant application (e.g., NSFC).
    Project Name: "${projectInfo.name}"
    Domain Code: "${projectInfo.domainCode}"
    Keywords: ${projectInfo.keywords.join(', ')}.
    Language: ${language}.
    
    ${refContext}
    
    ${specificInstruction}
    
    Tone: Authoritative, Logical, Persuasive.`;

    parts.push({ text: prompt });

    // Attach PDFs
    for (const ref of references) {
        if (ref.type === 'pdf' && ref.content instanceof File) {
             const base64 = await fileToBase64(ref.content);
             parts.push({ inlineData: { mimeType: 'application/pdf', data: base64 } });
        }
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Stronger model for synthesis
            contents: { parts }
        });
        return response.text || "";
    } catch (e) {
        console.error(e);
        return "Error generating rationale with references.";
    }
};

export const generateGrantLogicFramework = async (
  projectInfo: { name: string, keywords: string[], domainCode: string },
  language: Language,
  mode: 'full' | 'status' | 'significance',
  references: { type: 'pdf' | 'doi', content: string | File }[] = []
): Promise<LogicNode | null> => {
    const parts: any[] = [];
    
    // ... Process references similar to above ...
    let refContext = "";
    if (references.length > 0) {
        refContext = "Base your analysis on these references where possible.";
        const dois = references.filter(r => r.type === 'doi').map(r => r.content as string);
        if (dois.length > 0) refContext += " DOIs: " + dois.join(', ');
    }

    const prompt = `Generate a hierarchical logic framework (mind map) for the "${mode}" section of a grant application (e.g., NSFC).
    Project: "${projectInfo.name}"
    Keywords: ${projectInfo.keywords.join(', ')}.
    Language: ${language}.
    ${refContext}
    
    Structure the response strictly as a JSON object matching the 'LogicNode' interface: { id: string, label: string, children: LogicNode[] }.
    
    The root node should be the Project Name.
    Level 1 children should be the main sections (e.g., Significance, Status, Gaps, Hypothesis).
    Level 2 children should be key arguments or bullet points.
    
    Do not return markdown code blocks, just raw JSON.`;

    parts.push({ text: prompt });
    
    // Attach PDFs
    for (const ref of references) {
        if (ref.type === 'pdf' && ref.content instanceof File) {
             const base64 = await fileToBase64(ref.content);
             parts.push({ inlineData: { mimeType: 'application/pdf', data: base64 } });
        }
    }

    return getJson(prompt, undefined, 'gemini-3-pro-preview'); // Ensure using getJson wrapper or similar logic
};

export const expandGrantRationale = async (
  tree: LogicNode,
  language: Language
): Promise<string> => {
    const prompt = `Write the full text for a grant proposal rationale based on this logic framework tree.
    Logic Tree: ${JSON.stringify(tree)}
    
    Language: ${language}.
    Tone: Academic, Persuasive, Authoritative.
    Format: Markdown. Use proper headings matching the tree structure.
    Expand each leaf node into detailed paragraphs.`;
    
    return getText(prompt, 'gemini-3-pro-preview');
};

export const getGrantInspiration = async (topic: string, domainCode: string, language: Language): Promise<string[]> => {
  const prompt = `Based on the research topic "${topic}" (Domain: ${domainCode}), provide 3-5 "Golden Sentences" or high-quality academic phrases suitable for a grant proposal's significance or innovation section.
  Language: ${language}.
  Return as a JSON array of strings.`;
  const result = await getJson(prompt);
  return Array.isArray(result) ? result : [];
};

export const polishGrantProposal = async (content: string, sectionType: string, language: Language, instruction?: string): Promise<{ versions: { type: string, clean: string, revisions: string, comment: string }[] } | null> => {
    const specificInstruction = instruction ? `Additional Instruction: ${instruction}` : '';
    
    const prompt = `Polish the following text for a Grant Proposal. Section: "${sectionType}".
    Text: "${content}"
    
    ${specificInstruction}
    
    Generate 3 distinct versions:
    1. **Conservative (稳健/保守)**: Focus on reliability, standard academic tone, solid evidence, minimal risk.
    2. **Aggressive (激进/强调创新)**: Highlight novelty, breakthrough potential, stronger claims, high risk/high reward tone.
    3. **Professional (专业/平衡)**: The standard, balanced, highly polished academic tone suitable for most reviewers.
    
    Language: ${language}.
    
    Return a JSON object with a "versions" array containing 3 objects.
    Each object in "versions" must have:
    - "type": "Conservative" | "Aggressive" | "Professional"
    - "clean": "The fully polished text."
    - "revisions": "The text with revisions marked using Markdown: wrap deleted text with ~~strikethrough~~ and new added text with **bold**."
    - "comment": "A brief explanation of the changes made for this style."
    `;
    
    return getJson(prompt, undefined, 'gemini-3-pro-preview');
};

export const checkGrantFormat = async (content: string | File, language: Language): Promise<GrantCheckResult | null> => {
    
    const prompt = `Perform a rigorous "Format & Logic Review" on this grant proposal text/file.
    
    Language: ${language}.
    
    You must return a JSON object with the following specific categories:
    
    1. "hardErrors": Check for:
       - Estimated Word count issues (is it too short/long for typical sections?).
       - Presence of First Person pronouns like "I", "We", "My" (if inappropriate).
       - Typos and grammatical errors.
    2. "logicCheck": Check for:
       - Does the research content support the scientific goals?
       - Is the technical route closed-loop (self-consistent)?
       - Are the aims specific and measurable?
    3. "formatCheck": Check for:
       - Citation/Reference format consistency.
       - Heading hierarchy clarity.
    4. "anonymityCheck": Check for Double-Blind violations:
       - Mention of specific names (Author names).
       - Mention of specific unit/university names.
       - Acknowledgements that reveal identity.
    
    Return JSON format:
    {
      "score": number (0-100),
      "summary": "Brief executive summary of findings",
      "hardErrors": { "status": "Pass" | "Fail", "issues": ["issue 1", "issue 2"] },
      "logicCheck": { "status": "Pass" | "Warning", "issues": ["issue 1"] },
      "formatCheck": { "status": "Pass" | "Fail", "issues": ["issue 1"] },
      "anonymityCheck": { "status": "Pass" | "Fail", "issues": ["issue 1"] }
    }
    `;
    
    const parts: any[] = [{ text: prompt }];
    
    if (content instanceof File) {
        const base64 = await fileToBase64(content);
        // Supports PDF or Docx (if handled by caller, here assuming PDF/Text for simplicity in prompt)
        parts.push({ inlineData: { mimeType: content.type === 'application/pdf' ? 'application/pdf' : 'text/plain', data: base64 } });
    } else {
        parts[0].text += `\n\nContent to review:\n"${content.substring(0, 30000)}..."`; // Limit length if text
    }

    return getJson(prompt, undefined, 'gemini-3-pro-preview'); // Using stronger model for logic checks
};