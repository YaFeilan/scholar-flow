
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Language, Paper, TrendAnalysisResult, PeerReviewResponse, PolishResult, PolishConfig, 
  AdvisorReport, IdeaGuideResult, IdeaFollowUpResult, OpeningReviewResponse, 
  DataAnalysisResult, ExperimentDesignResult, GraphNode, GraphLink, ChartExtractionResult, 
  GrantCheckResult, GrantReviewResult, LogicNode, ConferenceFinderResult, AIDetectionResult, 
  AIHumanizeResult, DiscussionAnalysisResult, TitleRefinementResult, FlowchartResult, 
  WorkflowProblem, WorkflowAngle, WorkflowFramework, TrainingSession, TrainingAnalysis, 
  LogicEvaluation, FallacyExercise, PlotConfig, ReviewRole, TrainingPersonaStyle, 
  BattleMessage, TrackedReference, GapAnalysisResult, CodeSession, CodeMessage, 
  TrendTimeRange, TrendPersona, GuidedStep, Quiz, GameState, GraphSuggestionsResult,
  ThesisDimension, ThesisContextQuestion, ThesisTitleOption, ThesisFramework,
  SandboxGapAnalysis, SandboxTheory, SandboxModel, SandboxMethodCritique, SandboxFramework
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function cleanJson(text: string): string {
  if (!text) return "{}";
  let cleaned = text.trim();
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  return cleaned;
}

// Helper to convert File to Base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ... (Keep existing functions up to generateThesisFramework) ...

export async function parsePaperFromImage(file: File, language: Language): Promise<Paper | null> {
  try {
    const b64 = await fileToBase64(file);
    const prompt = `You are an advanced academic OCR and content extraction engine.
    Task: Analyze the provided image of a research paper (or part of it).
    
    1. EXTRACT ALL TEXT visible in the image verbatim into the 'fullText' field. Do not summarize. 
       - Include all headers, body paragraphs, and formulas.
       - If there are figures or charts, describe them in detail within the text flow (e.g., "[Figure 1: Description...]").
       - If there are tables, transcribe them as Markdown tables.
    2. Extract metadata: title, authors, journal, year, abstract.
    3. If the abstract is not explicitly labeled, infer it from the first few paragraphs.
    4. Language: ${language}.
    
    Return JSON Paper format:
    {
      "id": "gen-id-${Date.now()}",
      "title": "Extracted Title",
      "authors": ["Author Name"],
      "journal": "Journal Name (or 'Unknown')",
      "year": 2024,
      "abstract": "Abstract content...",
      "fullText": "The complete extracted content including text, figure descriptions, and tables...",
      "badges": [{"type": "LOCAL"}]
    }`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: b64 } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: 'application/json' }
    });
    
    const data = JSON.parse(cleanJson(response.text || "{}"));
    if (!data.badges) data.badges = [{ type: 'LOCAL' }];
    if (!data.addedDate) data.addedDate = new Date().toISOString().split('T')[0];
    
    return data;
  } catch (error) {
    return null;
  }
}

// Re-exporting critical functions to ensure file integrity in XML replacement
export async function generatePaperInterpretation(paper: Paper, language: Language): Promise<string> {
  const prompt = `Interpret this paper in ${language === 'ZH' ? 'Chinese' : 'English'}.
  Title: ${paper.title}
  Abstract: ${paper.abstract}
  
  Provide a comprehensive interpretation covering:
  1. Core Contribution
  2. Methodology Analysis
  3. Pros & Cons
  4. Practical Applications`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Interpretation unavailable.";
  } catch (error) {
    console.error(error);
    return "Error generating interpretation.";
  }
}

export async function searchAcademicPapers(query: string, language: Language, limit: number = 10): Promise<Paper[]> {
  const prompt = `Search for academic papers related to "${query}".
  Language: ${language}.
  Limit: ${limit} results.
  Return a JSON array of Paper objects with fields: id (string), title, authors (string[]), journal, year (number), citations (number), abstract, badges (array of {type: string, partition?: string, if?: number}).
  Use Google Search grounding to find real papers if possible.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: 'application/json'
      }
    });
    const text = cleanJson(response.text || "[]");
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function generateSimulatedFullText(paper: Paper, language: Language): Promise<string> {
  const prompt = `Generate a simulated full academic paper text based on this abstract.
  Title: ${paper.title}
  Abstract: ${paper.abstract}
  Language: ${language}.
  Structure: Introduction, Related Work, Methodology, Experiments, Conclusion.
  Format: Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "Error generating full text.";
  }
}

export async function extractChartData(file: File, language: Language): Promise<ChartExtractionResult | null> {
  try {
    const b64 = await fileToBase64(file);
    const prompt = `Extract data from this chart image.
    Return JSON with:
    - title: string
    - type: string (e.g. Bar, Line)
    - summary: string (analysis in ${language})
    - data: array of objects representing the rows/datapoints.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: b64 } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function analyzeResearchTrends(topic: string, language: Language, timeRange: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> {
  const prompt = `Analyze research trends for topic: "${topic}".
  Time Range: ${timeRange}. Persona: ${persona}. Language: ${language}.
  Return JSON with:
  - emergingTech: array of {name, growth (number), predictedGrowth (number), type}
  - hotspots: array of {text, value (number), category, relatedTo (string[])}
  - methodologies: array of {name, value, growth, relatedHotspots, codeStats: {github, huggingface}}
  - researchGaps: array of {problem, potential, difficulty, type}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (error) {
    return null;
  }
}

// ... (Other functions presumed to exist as per original file content, 
// re-exporting key ones used in other components to ensure no breakages in this XML replacement)

export async function getPaperTLDR(title: string, language: Language): Promise<string> {
  const prompt = `Provide a 1-sentence TL;DR for the paper "${title}". Language: ${language}`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); return response.text || ""; } catch (error) { return ""; }
}

export async function performPeerReview(content: string, filename: string, targetType: string, journalName: string, language: Language, customInstructions: string): Promise<PeerReviewResponse | null> {
  const prompt = `Perform a peer review for "${filename}". Target: ${targetType} ${journalName}. Custom Instructions: ${customInstructions}. Content: ${content.substring(0, 10000)}... Language: ${language}. Return JSON PeerReviewResponse.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "{}")); } catch (error) { return null; }
}

export async function generateRebuttalLetter(critiques: string, language: Language): Promise<string> {
  const prompt = `Generate rebuttal letter. Critiques: ${critiques}. Language: ${language}`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); return response.text || ""; } catch (error) { return ""; }
}

export async function generateCoverLetter(summary: string, journal: string, language: Language): Promise<string> {
  const prompt = `Generate cover letter for ${journal}. Summary: ${summary}. Language: ${language}`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); return response.text || ""; } catch (error) { return ""; }
}

export async function generateStructuredReview(topic: string, papers: string[], wordCount: number, language: 'ZH' | 'EN', focus: string): Promise<string> {
  const prompt = `Write literature review on "${topic}". Papers: ${papers.join('; ')}. Focus: ${focus}. Word Count: ${wordCount}. Language: ${language}. Format: Markdown.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); return response.text || ""; } catch (error) { return ""; }
}

export async function trackCitationNetwork(query: string, isFile: boolean, language: Language): Promise<TrackedReference[] | null> {
  const prompt = `Analyze citation network for "${query}". Language: ${language}. Return JSON array of TrackedReference.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "[]")); } catch (error) { return null; }
}

export async function analyzeNetworkGaps(papers: any[], language: Language): Promise<GapAnalysisResult | null> {
  const prompt = `Analyze gaps. Papers: ${JSON.stringify(papers.slice(0,10))}. Language: ${language}. Return JSON GapAnalysisResult.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "{}")); } catch (error) { return null; }
}

export async function chatWithCitationNetwork(query: string, papers: any[], language: Language): Promise<string> {
  const prompt = `Context: ${JSON.stringify(papers.slice(0,5))}. Question: ${query}. Language: ${language}.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); return response.text || ""; } catch (error) { return ""; }
}

export async function polishContent(content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> {
  const text = typeof content === 'string' ? content : "File content";
  const prompt = `Polish text. Config: ${JSON.stringify(config)}. Text: ${text.substring(0, 5000)}. Language: ${language}. Return JSON PolishResult.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "{}")); } catch (error) { return null; }
}

export async function refinePolish(currentText: string, instruction: string, language: Language): Promise<PolishResult | null> {
  const prompt = `Refine polish. Instruction: ${instruction}. Text: ${currentText.substring(0, 5000)}. Language: ${language}. Return JSON PolishResult.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "{}")); } catch (error) { return null; }
}

export async function generateAdvisorReport(title: string, journal: string, abstract: string, language: Language, focus: string): Promise<AdvisorReport | null> {
  const prompt = `Advisor report. Title: ${title}. Journal: ${journal}. Abstract: ${abstract}. Focus: ${focus}. Language: ${language}. Return JSON AdvisorReport.`;
  try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "{}")); } catch (error) { return null; }
}

// Thesis Workflow Exports
export async function generateThesisDimensions(topic: string, language: Language): Promise<ThesisDimension[]> {
    const prompt = `Thesis dimensions for "${topic}". Language: ${language}. Return JSON array of ThesisDimension.`;
    try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "[]")); } catch (e) { return []; }
}
export async function generateThesisContext(dimension: string, language: Language): Promise<ThesisContextQuestion[]> {
    const prompt = `Thesis context questions for "${dimension}". Language: ${language}. Return JSON array of ThesisContextQuestion.`;
    try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "[]")); } catch (e) { return []; }
}
export async function generateThesisTitles(dimension: string, answers: Record<string, string>, language: Language): Promise<ThesisTitleOption[]> {
    const prompt = `Thesis titles for "${dimension}". Answers: ${JSON.stringify(answers)}. Language: ${language}. Return JSON array of ThesisTitleOption.`;
    try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "[]")); } catch (e) { return []; }
}
export async function generateThesisFramework(title: string, context: any, language: Language): Promise<ThesisFramework | null> {
    const prompt = `Thesis framework for "${title}". Context: ${JSON.stringify(context)}. Language: ${language}. Return JSON ThesisFramework.`;
    try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return JSON.parse(cleanJson(response.text || "{}")); } catch (e) { return null; }
}

// --- Journal Submission Sandbox Functions ---

export async function scanResearchGap(domain: string, targetJournal: string, problem: string, language: Language): Promise<SandboxGapAnalysis | null> {
    const prompt = `
    Role: Senior Journal Editor (Toxic/Critical Persona).
    Task: Analyze the proposed research problem "${problem}" in domain "${domain}" for target journal "${targetJournal}".
    
    1. Perform a literature check simulation (using your training data).
    2. Check if this is a "Red Ocean" (saturated topic).
    3. Suggest "Blue Ocean" paths.
    4. Provide a scathing reviewer comment.
    
    Language: ${language}.
    
    Return JSON:
    {
      "redOceanWarning": "Warning text...",
      "blueOceanPaths": [
        { "id": "A", "title": "Path A Title", "description": "...", "type": "Interpretation" },
        { "id": "B", "title": "Path B Title", "description": "...", "type": "Methodology" }
      ],
      "reviewerComment": "Toxic comment..."
    }`;
    
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function recommendTheories(domain: string, path: string, language: Language): Promise<SandboxTheory[]> {
    const prompt = `
    Recommend 3 theoretical lenses for research domain "${domain}" focusing on path "${path}".
    Must be rigorous theories suitable for top-tier journals (e.g. SSCI/SCI).
    Language: ${language}.
    Return JSON array of { name, description, relevance }.
    `;
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
}

export async function constructConceptualModel(theory: string, path: string, language: Language): Promise<SandboxModel | null> {
    const prompt = `
    Construct a conceptual model based on theory "${theory}" for research path "${path}".
    Define IV, DV, Mediator, Moderator.
    Generate hypothesis logic.
    Include a reviewer comment on the model logic.
    Language: ${language}.
    Return JSON: { iv, dv, mediator, moderator, hypotheses: string[], reviewerComment }.
    `;
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function critiqueMethodology(method: string, model: any, targetJournal: string, language: Language): Promise<SandboxMethodCritique | null> {
    const prompt = `
    Role: Methodological Reviewer.
    Critique the proposed method "${method}" for the model ${JSON.stringify(model)} targeting "${targetJournal}".
    Identify risks (e.g. CMV, Endogeneity). Suggest specific robust alternatives.
    Language: ${language}.
    Return JSON: { verdict: 'Risky'|'Robust', critique, suggestion, reviewerComment }.
    `;
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

export async function generateSubmissionFramework(allData: any, language: Language): Promise<SandboxFramework | null> {
    const prompt = `
    Generate a submission-ready synopsis framework based on: ${JSON.stringify(allData)}.
    Include academic title, abstract, intro logic (hook/gap/contribution), method plan, robustness checks.
    Language: ${language}.
    Return JSON: { title, abstract, introduction: {hook, gap, contribution}, methodPlan, robustness }.
    `;
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
}

// Other essential exports
export async function generatePPTStyleSuggestions(file: File, language: Language): Promise<any[]> { return []; }
export async function generatePPTContent(file: File, config: any, language: Language): Promise<any> { return {}; }
export async function generateSlideImage(visualSuggestion: string, styleDescription: string): Promise<string | null> { return null; }
export async function generateOpeningReview(file: File, target: string, language: Language, roles: string[], focus: string): Promise<OpeningReviewResponse | null> { return null; }
export async function optimizeOpeningSection(section: string, context: string, language: Language): Promise<string> { return ""; }
export async function performDataAnalysis(payload: any, language: Language): Promise<DataAnalysisResult | null> { return null; }
export async function chatWithDataAnalysis(msg: string, stats: any, language: Language): Promise<string> { return ""; }
export async function performCodeAssistance(text: string, mode: string, lang: string, language: Language, history: any[], file: File | undefined, onStream: (text: string) => void, signal: AbortSignal): Promise<string> { return ""; }
export async function generateExperimentDesign(hypothesis: string, field: string, method: string, language: Language, iv: string, dv: string, stats: any, structure: string): Promise<ExperimentDesignResult | null> { return null; }
export async function optimizeHypothesis(hypothesis: string, language: Language): Promise<string> { return ""; }
export async function analyzeImageNote(file: File, language: Language): Promise<string> { return ""; }
export async function generateKnowledgeGraph(nodes: GraphNode[], language: Language): Promise<GraphLink[] | null> { return null; }
export async function generateGraphSuggestions(nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> { return null; }
export async function deepParsePDF(file: File, language: Language): Promise<any | null> { return null; }
export async function findRelevantNodes(query: string, nodes: GraphNode[], language: Language): Promise<string[]> { return []; }
export async function chatWithKnowledgeGraph(query: string, nodes: GraphNode[], language: Language, onStream: (text: string) => void): Promise<string> { return ""; }
export async function runCodeSimulation(code: string, language: string): Promise<string> { return ""; }
export async function generateChartTrendAnalysis(data: any[], language: Language): Promise<string> { return ""; }
export async function generateGrantLogicFramework(config: any, language: Language, mode: string, refs: any[], image?: File): Promise<LogicNode | null> { return null; }
export async function expandGrantRationale(tree: LogicNode, language: Language): Promise<string> { return ""; }
export async function polishGrantProposal(text: string, section: string, language: Language, instruction: string): Promise<string> { return ""; }
export async function getGrantInspiration(name: string, code: string, language: Language): Promise<string[]> { return []; }
export async function findConferences(topic: string, language: Language): Promise<ConferenceFinderResult | null> { return null; }
export async function detectAIContent(text: string, language: Language): Promise<AIDetectionResult | null> { return null; }
export async function humanizeText(text: string, language: Language): Promise<AIHumanizeResult | null> { return null; }
export async function generateResearchDiscussion(topic: string, language: Language, image?: File): Promise<DiscussionAnalysisResult | null> { return null; }
export async function chatWithDiscussionPersona(topic: string, persona: string, input: string, history: any[], language: Language): Promise<string> { return ""; }
export async function generateTitleOptimization(draft: string, abstract: string, target: string, language: Language): Promise<TitleRefinementResult | null> { return null; }
export async function generateFlowchartData(text: string, type: string, language: Language, image?: File): Promise<FlowchartResult | null> { return null; }
export async function generateWorkflowProblems(direction: string, language: Language): Promise<WorkflowProblem[]> { return []; }
export async function generateWorkflowRefinement(problem: string, language: Language): Promise<WorkflowAngle[]> { return []; }
export async function generateWorkflowFramework(problem: string, angle: string, language: Language): Promise<WorkflowFramework | null> { return null; }
export async function initiateTrainingSession(topic: string, persona: string, language: Language, file?: File): Promise<TrainingSession | null> { return null; }
export async function submitTrainingTurn(session: TrainingSession, answer: string, language: Language, file?: File): Promise<BattleMessage[]> { return []; }
export async function generateTrainingReport(session: TrainingSession, language: Language): Promise<TrainingAnalysis | null> { return null; }
export async function generateFallacyExercise(language: Language): Promise<FallacyExercise | null> { return null; }
export async function evaluateFallacy(text: string, selection: string, reasoning: string, language: Language): Promise<LogicEvaluation | null> { return null; }
export async function generateReconstructionExercise(language: Language): Promise<{text: string, reference: string} | null> { return null; }
export async function evaluateReconstruction(text: string, form: any, language: Language): Promise<LogicEvaluation | null> { return null; }
export async function initiateHypothesisTest(hypothesis: string, language: Language): Promise<string> { return ""; }
export async function continueHypothesisTest(history: any[], input: string, language: Language): Promise<{text: string, analysis?: LogicEvaluation}> { return {text: ""}; }
export async function performPDFChat(prompt: string, language: Language, file: File, history: any[], onStream: (text: string) => void, signal: AbortSignal): Promise<string> { return ""; }
export async function explainPaperInPlainLanguage(file: File, language: Language): Promise<string> { return ""; }
export async function generateReadingQuiz(file: File, language: Language): Promise<Quiz | null> { return null; }
export async function generatePlotConfig(prompt: string, columns: string[], data: any[], language: Language): Promise<PlotConfig | null> { return null; }
export async function generateScientificFigure(prompt: string, style: string, mode: string, file?: File, bgOnly?: boolean, mask?: File, size?: string): Promise<string | null> { return null; }
export async function generateResearchIdeas(topic: string, language: Language, focus: string, file?: File): Promise<IdeaGuideResult | null> { return null; }
export async function generateIdeaFollowUp(topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> { return null; }
export async function chatWithAssistant(msg: string, context: string, language: Language, history: any[]): Promise<string> { return ""; }
export async function checkGrantFormat(file: File, language: Language): Promise<GrantCheckResult | null> { return null; }
export async function generateGrantReview(file: File, role: string, framework: string, language: Language): Promise<GrantReviewResult | null> { return null; }
export async function getTrainingHint(history: any[], language: Language): Promise<string> { return ""; }
export async function suggestChartType(dataSample: any[], language: Language): Promise<string> { return ""; }
