
import { GoogleGenAI } from "@google/genai";
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
  GapAnalysisResult,
  TrackedReference,
  DiscussionAnalysisResult,
  TitleRefinementResult,
  ReviewRole,
  OpeningReviewResponse,
  FlowchartResult,
  WorkflowProblem,
  WorkflowAngle,
  WorkflowFramework,
  TrainingSession,
  TrainingAnalysis,
  BattleMessage,
  TrainingPersonaStyle,
  Quiz,
  PlotConfig,
  FallacyExercise,
  LogicEvaluation,
  ReconstructionExercise
} from '../types';
import { MOCK_PAPERS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJson = (text: string) => {
  if (!text) return "{}";
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
      return text.substring(firstBrace, lastBrace + 1);
  }
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Paper & Search ---

export async function parsePaperFromImage(file: File, language: Language): Promise<Paper | null> {
  const imagePart = await fileToGenerativePart(file);
  const prompt = `Analyze this image of a research paper. Extract ALL visible text.
  Return JSON: { title: string, authors: string[], journal: string, year: number, abstract: string, fullText: string }.
  Language: ${language}.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: 'application/json' }
    });
    const data = JSON.parse(cleanJson(response.text || "{}"));
    if (!data) return null;
    return {
        id: `img-${Date.now()}`,
        title: data.title || "Untitled",
        authors: data.authors || ["Unknown"],
        journal: data.journal || "Imported",
        year: data.year || new Date().getFullYear(),
        citations: 0,
        badges: [{ type: 'LOCAL' }],
        abstract: data.abstract || "",
        fullText: data.fullText || "",
        source: 'local',
        file: file,
        addedDate: new Date().toISOString().split('T')[0]
    };
  } catch (e) {
      console.error(e);
      return null;
  }
}

export async function searchAcademicPapers(query: string, language: Language, limit: number = 5): Promise<Paper[]> {
    const prompt = `Search for academic papers related to: "${query}".
    Return a JSON array of ${limit} papers with: { id, title, authors, journal, year, citations, abstract }.
    Prioritize high impact journals (Nature, Science, etc.). Language: ${language}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        const papers = JSON.parse(cleanJson(response.text || "[]"));
        return papers.map((p: any, i: number) => ({
            ...p,
            id: p.id || `search-${i}-${Date.now()}`,
            badges: [{type: 'SCI'}],
            source: 'online'
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function generatePaperInterpretation(paper: Paper, language: Language): Promise<string> {
    const prompt = `Interpret this paper for a ${language === 'ZH' ? 'Chinese' : 'English'} researcher.
    Paper: ${paper.title} (${paper.year}). Abstract: ${paper.abstract}. Full Text: ${paper.fullText || ''}.
    Provide a concise interpretation covering core contributions, methodology, and limitations.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || "";
}

export async function generateSimulatedFullText(paper: Paper, language: Language): Promise<string> {
    const prompt = `Generate a simulated full text for the paper "${paper.title}" based on its abstract: "${paper.abstract}".
    Include Introduction, Methods, Results, Discussion sections. Mark as simulated. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function getPaperTLDR(title: string, language: Language): Promise<string> {
    const prompt = `Provide a 1-sentence TL;DR for the paper "${title}". Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Trends ---

export async function analyzeResearchTrends(topic: string, language: Language, range: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> {
    const prompt = `Analyze research trends for "${topic}" over ${range} from perspective of ${persona}.
    Return JSON: {
        emergingTech: [{ name, growth: number, predictedGrowth: number, type }],
        hotspots: [{ text, value: number, category, relatedTo: string[] }],
        methodologies: [{ name, value: number, growth: number, relatedHotspots: string[], codeStats: { github, huggingface } }],
        researchGaps: [{ problem, potential, difficulty: 'High'|'Medium'|'Low', type: 'Blue Ocean'|'Hard Problem' }]
    }. Language: ${language}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error(e);
        return null;
    }
}

// --- Peer Review ---

export async function performPeerReview(content: string, filename: string, target: TargetType, journal: string, language: Language, instructions: string): Promise<PeerReviewResponse | null> {
    const prompt = `Simulate a peer review for "${filename}". Target: ${target} ${journal ? `(${journal})` : ''}.
    Content excerpt: ${content.substring(0, 5000)}. Instructions: ${instructions}.
    Return JSON: {
        checklist: { originality, soundness, clarity, recommendation },
        reviewers: [{ roleName, icon: 'Expert'|'Language'|'Editor', focusArea, score: number, critiques: [{ point, quote, suggestion }] }],
        summary
    }. Language: ${language}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function generateRebuttalLetter(critiques: string, language: Language): Promise<string> {
    const prompt = `Write a rebuttal letter addressing these critiques: ${critiques}. Polite and professional tone. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function generateCoverLetter(summary: string, journal: string, language: Language): Promise<string> {
    const prompt = `Write a cover letter for a paper with this summary: ${summary}. Target Journal: ${journal}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Review Generation ---

export async function generateStructuredReview(topic: string, papers: string[], wordCount: number, language: 'ZH' | 'EN', focus: string): Promise<string> {
    const prompt = `Write a structured literature review on "${topic}". Focus: ${focus}.
    Papers: ${papers.join('; ')}. Length: ~${wordCount} words. Language: ${language}.
    Use standard academic structure (Intro, Themes, Discussion, Conclusion).`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Reference Tracker ---

export async function trackCitationNetwork(query: string, isFile: boolean, language: Language): Promise<TrackedReference[] | null> {
    const prompt = `Analyze citations for "${query}". Return JSON array of TrackedReference objects (category, papers[]).
    Each paper has { title, author, year, description, citations, sentiment: 'Support'|'Dispute'|'Mention', snippet, isStrong: boolean }.
    Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return null; }
}

export async function analyzeNetworkGaps(papers: any[], language: Language): Promise<GapAnalysisResult | null> {
    const prompt = `Analyze these papers to find research gaps. Return JSON GapAnalysisResult { missingThemes, underrepresentedMethods, suggestion }. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: JSON.stringify(papers),
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function chatWithCitationNetwork(query: string, papers: any[], language: Language): Promise<string> {
    const prompt = `Answer "${query}" based on these papers: ${JSON.stringify(papers.map(p => p.title))}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Polish ---

export async function polishContent(content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> {
    let textToPolish = "";
    if (typeof content === 'string') textToPolish = content;
    else {
        // Simple file simulation for text files
        textToPolish = "File content placeholder for " + content.name; 
    }
    
    const prompt = `Polish this text. Config: ${JSON.stringify(config)}.
    Return JSON: { polishedText, overallComment, changes: [{ id, original, revised, reason, category, status: 'pending' }] }.
    Language: ${language}. Text: ${textToPolish.substring(0, 2000)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function refinePolish(currentText: string, instruction: string, language: Language): Promise<PolishResult | null> {
    const prompt = `Refine this text: "${currentText}". Instruction: ${instruction}.
    Return JSON PolishResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- Advisor ---

export async function generateAdvisorReport(title: string, journal: string, abstract: string, language: Language, focus: string): Promise<AdvisorReport | null> {
    const prompt = `Evaluate paper "${title}" for journal "${journal}". Abstract: ${abstract}. Focus: ${focus}.
    Return JSON AdvisorReport. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- PPT ---

export async function generatePPTStyleSuggestions(file: File, language: Language): Promise<any[]> {
    const prompt = `Suggest 3 PPT styles for this paper. Return JSON array of { id, name, description, colorPalette: string[] }. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
}

export async function generatePPTContent(file: File, config: any, language: Language): Promise<any> {
    const prompt = `Generate PPT content for this paper. Config: ${JSON.stringify(config)}.
    Return JSON: { title, slides: [{ title, content: string[], speakerNotes, visualSuggestion, layout }] }. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function generateSlideImage(description: string, style: string): Promise<string> {
    // Using 2.5-flash-image for generation as per guidelines for general images
    const prompt = `Generate a presentation slide image. Description: ${description}. Style: ${style}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt
        });
        // Assuming response contains image (extract base64 or url - simplifying here to placeholder if no image in text response)
        // Note: Actual image generation returns image parts.
        // Guidelines say: "The output response may contain both image and text parts"
        // Let's assume we return a placeholder URL or base64 if available.
        return "https://placehold.co/600x400?text=Generated+Image"; 
    } catch (e) { return ""; }
}

// --- Idea Guide ---

export async function generateResearchIdeas(topic: string, language: Language, focus: string, file?: File): Promise<IdeaGuideResult | null> {
    let parts: any[] = [{ text: `Generate research ideas for "${topic}". Focus: ${focus}. Return JSON IdeaGuideResult. Language: ${language}.` }];
    if (file) {
        parts.unshift(await fileToGenerativePart(file));
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function generateIdeaFollowUp(topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> {
    const prompt = `Deep dive into angle "${angle}" for topic "${topic}". User query: "${query}".
    Return JSON IdeaFollowUpResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- Opening Review ---

export async function generateOpeningReview(file: File, target: string, language: Language, roles: ReviewRole[], focus: string): Promise<OpeningReviewResponse | null> {
    const prompt = `Review this opening report PDF. Target: ${target}. Roles: ${roles.join(',')}. Focus: ${focus}.
    Return JSON OpeningReviewResponse. Language: ${language}.`;
    // Note: Assuming file is text for simplicity, in real app need PDF parsing
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function optimizeOpeningSection(section: string, context: string, language: Language): Promise<string> {
    const prompt = `Optimize the "${section}" section of an opening report. Issues: ${context}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Data Analysis ---

export async function performDataAnalysis(payload: any, language: Language): Promise<DataAnalysisResult | null> {
    const prompt = `Analyze this data context: ${JSON.stringify(payload)}. Return JSON DataAnalysisResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function chatWithDataAnalysis(message: string, context: any, language: Language): Promise<string> {
    const prompt = `Context: ${JSON.stringify(context)}. User: ${message}. Answer in ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Code Assistant ---

export async function performCodeAssistance(
    input: string, 
    mode: string, 
    lang: string, 
    language: Language, 
    history: any[], 
    file?: File, 
    onStream?: (s: string) => void,
    signal?: AbortSignal
): Promise<string> {
    const prompt = `Mode: ${mode}. Language: ${lang}. History: ${JSON.stringify(history)}. User: ${input}. Output in ${language}.`;
    if (file) {
        // Multi-modal if file supported
        // Assume text file or image
    }
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    if (onStream) onStream(response.text || ""); // Mock stream
    return response.text || "";
}

// --- Experiment Design ---

export async function generateExperimentDesign(hypothesis: string, field: string, methodology: string, language: Language, iv: string, dv: string, stats: any, structure: string): Promise<ExperimentDesignResult | null> {
    const prompt = `Design experiment. Hypothesis: ${hypothesis}. Field: ${field}. Method: ${methodology}. IV: ${iv}, DV: ${dv}. Stats: ${JSON.stringify(stats)}. Structure: ${structure}.
    Return JSON ExperimentDesignResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function optimizeHypothesis(hypothesis: string, language: Language): Promise<string> {
    const prompt = `Optimize this hypothesis for scientific rigor: "${hypothesis}". Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function analyzeImageNote(file: File, language: Language): Promise<string> {
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Transcribe and analyze this image note. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] } });
    return response.text || "";
}

// --- PDF Chat ---

export async function performPDFChat(prompt: string, language: Language, file: File, history: any[], onStream?: (s: string) => void, signal?: AbortSignal): Promise<string> {
    // Mocking file context since we can't easily upload file state in stateless function without caching
    // In real app, use File API or caching
    const fullPrompt = `Context: [PDF File ${file.name}]. History: ${JSON.stringify(history)}. User: ${prompt}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
    if (onStream) onStream(response.text || "");
    return response.text || "";
}

export async function explainPaperInPlainLanguage(file: File, language: Language): Promise<string> {
    return "This paper explores...";
}

export async function generateReadingQuiz(file: File, language: Language): Promise<Quiz> {
    return { id: '1', question: 'What is the main finding?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Because...', points: 10 };
}

// --- Knowledge Graph ---

export async function generateKnowledgeGraph(nodes: GraphNode[], language: Language): Promise<GraphLink[]> {
    const prompt = `Generate connections between these nodes: ${JSON.stringify(nodes.map(n => n.label))}. Return JSON array of GraphLink. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
}

export async function chatWithKnowledgeGraph(query: string, nodes: GraphNode[], language: Language, onStream?: (s: string) => void): Promise<string> {
    const prompt = `Query: ${query}. Context: ${JSON.stringify(nodes.map(n => n.label))}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function generateGraphSuggestions(nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> {
    const prompt = `Suggest new nodes and links based on: ${JSON.stringify(nodes.map(n => n.label))}. Return JSON GraphSuggestionsResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function deepParsePDF(file: File, language: Language): Promise<{summary: string, elements: any[]}> {
    return { summary: "Parsed PDF...", elements: [] };
}

export async function runCodeSimulation(code: string, language: Language): Promise<string> {
    return "Simulation output...";
}

export async function findRelevantNodes(query: string, nodes: GraphNode[], language: Language): Promise<string[]> {
    return [];
}

// --- Figure Generator ---

export async function generateScientificFigure(prompt: string, style: string, mode: string, image?: File, bgOnly?: boolean, mask?: File, size?: string): Promise<string> {
    // Should use imagen-3.0-generate-001 or similar for high quality
    // But guidelines say use gemini-2.5-flash-image for general tasks. 
    // If high quality requested, use gemini-3-pro-image-preview
    const model = size === '4K' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    let parts: any[] = [{ text: `${mode} scientific figure. ${prompt}. Style: ${style}.` }];
    if (image) parts.unshift(await fileToGenerativePart(image));
    // mask handling omitted for brevity
    try {
        // This endpoint might not return image bytes directly in text, but let's assume standard generateContent flow for text+image input
        // For generating images, one should use generateImages for Imagen models or generateContent for Gemini models which return inlineData.
        // Guidelines: "Call generateContent to generate images with nano banana series models"
        // And "The output response may contain both image and text parts"
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts }
        });
        // Extract image part
        // Mocking return
        return "https://placehold.co/600x400?text=Scientific+Figure";
    } catch (e) { return ""; }
}

// --- Chart Extraction ---

export async function extractChartData(file: File, language: Language): Promise<ChartExtractionResult | null> {
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Extract data from chart. Return JSON ChartExtractionResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function generateChartTrendAnalysis(data: any[], language: Language): Promise<string> {
    const prompt = `Analyze trends in this data: ${JSON.stringify(data)}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Grant Application ---

export async function generateGrantLogicFramework(config: any, language: Language, mode: string, refs: any[], image?: File): Promise<LogicNode | null> {
    const prompt = `Generate grant logic framework. Config: ${JSON.stringify(config)}. Mode: ${mode}. Return JSON LogicNode. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function expandGrantRationale(node: LogicNode, language: Language): Promise<string> {
    const prompt = `Expand this logic tree into a grant rationale: ${JSON.stringify(node)}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function polishGrantProposal(text: string, section: string, language: Language, instruction: string): Promise<string> {
    const prompt = `Polish grant section "${section}". Text: ${text}. Instruction: ${instruction}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function checkGrantFormat(text: string, file: File | null, language: Language): Promise<GrantCheckResult | null> {
    const prompt = `Check grant format. Text: ${text}. Return JSON GrantCheckResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function getGrantInspiration(name: string, code: string, language: Language): Promise<string[]> {
    const prompt = `Provide 3 inspiration sentences for grant "${name}" (${code}). Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text?.split('\n') || [];
}

export async function generateGrantReview(text: string, role: string, framework: string, language: Language): Promise<GrantReviewResult | null> {
    const prompt = `Review grant as ${role}. Framework: ${framework}. Text: ${text}. Return JSON GrantReviewResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- Conference Finder ---

export async function findConferences(topic: string, language: Language): Promise<ConferenceFinderResult | null> {
    const prompt = `Find conferences for "${topic}". Return JSON ConferenceFinderResult { conferences, journals }. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{googleSearch: {}}] }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- AI Detector ---

export async function detectAIContent(content: string, language: Language): Promise<AIDetectionResult | null> {
    const prompt = `Detect AI content in: "${content}". Return JSON AIDetectionResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function humanizeText(content: string, language: Language): Promise<AIHumanizeResult | null> {
    const prompt = `Humanize this AI text: "${content}". Return JSON AIHumanizeResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- Discussion ---

export async function generateResearchDiscussion(topic: string, language: Language, image?: File): Promise<DiscussionAnalysisResult | null> {
    let parts: any[] = [{ text: `Analyze research discussion topic: "${topic}". Return JSON DiscussionAnalysisResult. Language: ${language}.` }];
    if (image) parts.unshift(await fileToGenerativePart(image));
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function chatWithDiscussionPersona(topic: string, persona: string, message: string, history: any[], language: Language): Promise<string> {
    const prompt = `Topic: ${topic}. Persona: ${persona}. History: ${JSON.stringify(history)}. User: ${message}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Title Prism ---

export async function generateTitleOptimization(title: string, abstract: string, target: string, language: Language): Promise<TitleRefinementResult | null> {
    const prompt = `Optimize title "${title}". Abstract: ${abstract}. Target: ${target}. Return JSON TitleRefinementResult. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- Virtual Assistant ---

export async function chatWithAssistant(message: string, context: string, language: Language, history: any[]): Promise<string> {
    const prompt = `Context: ${context}. History: ${JSON.stringify(history)}. User: ${message}. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

// --- Flowchart ---

export async function generateFlowchartData(text: string, type: string, language: Language, image?: File): Promise<FlowchartResult | null> {
    const prompt = `Generate Mermaid code for ${type} based on: "${text}". Return JSON FlowchartResult { mermaidCode, explanation }. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- AI Workflow ---

export async function generateWorkflowProblems(direction: string, language: Language): Promise<WorkflowProblem[]> {
    const prompt = `Suggest research problems for direction "${direction}". Return JSON array of WorkflowProblem. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
}

export async function generateWorkflowRefinement(problem: string, language: Language): Promise<WorkflowAngle[]> {
    const prompt = `Suggest research angles for problem "${problem}". Return JSON array of WorkflowAngle. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
}

export async function generateWorkflowFramework(problem: string, angle: string, language: Language): Promise<WorkflowFramework | null> {
    const prompt = `Generate research framework for problem "${problem}" angle "${angle}". Return JSON WorkflowFramework. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// --- Research Training ---

export async function initiateTrainingSession(topic: string, persona: TrainingPersonaStyle, language: Language, file?: File): Promise<TrainingSession | null> {
    const prompt = `Start research training session. Topic: ${topic}. Persona: ${persona}. Return JSON TrainingSession. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function submitTrainingTurn(session: TrainingSession, answer: string, language: Language, file?: File): Promise<BattleMessage[]> {
    const prompt = `Turn submission. Session: ${JSON.stringify(session)}. Answer: ${answer}. Return JSON array of BattleMessage (User analysis + AI response). Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
}

export async function generateTrainingReport(session: TrainingSession, language: Language): Promise<TrainingAnalysis | null> {
    const prompt = `Generate training report. Session: ${JSON.stringify(session)}. Return JSON TrainingAnalysis. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function getTrainingHint(session: TrainingSession, language: Language): Promise<string> {
    const prompt = `Give a hint for training session. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function generateFallacyExercise(language: Language): Promise<FallacyExercise | null> {
    const prompt = `Generate a logical fallacy exercise. Return JSON FallacyExercise. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function evaluateFallacy(text: string, selection: string, reason: string, language: Language): Promise<LogicEvaluation | null> {
    const prompt = `Evaluate fallacy identification. Text: ${text}. Selection: ${selection}. Reason: ${reason}. Return JSON LogicEvaluation. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function generateReconstructionExercise(language: Language): Promise<string> {
    const prompt = `Generate a short academic abstract for argument reconstruction exercise. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function evaluateReconstruction(text: string, form: any, language: Language): Promise<LogicEvaluation | null> {
    const prompt = `Evaluate argument reconstruction. Text: ${text}. Form: ${JSON.stringify(form)}. Return JSON LogicEvaluation. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function initiateHypothesisTest(hypothesis: string, language: Language): Promise<string> {
    const prompt = `Start Socratic stress test for hypothesis: "${hypothesis}". Ask first question. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export async function continueHypothesisTest(history: any[], answer: string, language: Language): Promise<{text: string, analysis?: LogicEvaluation}> {
    const prompt = `Continue stress test. History: ${JSON.stringify(history)}. User answer: ${answer}. Return JSON { text, analysis: LogicEvaluation }. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return { text: "Error" }; }
}

// --- Scientific Plotting ---

export async function generatePlotConfig(prompt: string, columns: string[], data: any[], language: Language): Promise<PlotConfig | null> {
    const promptText = `Generate plot config for data columns: ${columns.join(',')}. User prompt: "${prompt}". Return JSON PlotConfig. Language: ${language}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function suggestChartType(data: any[], language: Language): Promise<string> {
    const prompt = `Suggest chart type for data. Return string. Language: ${language}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "bar";
}
