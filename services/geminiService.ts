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
  ModelProvider,
  GapAnalysisResult,
  TrackedReference,
  CodeMessage,
  DiscussionAnalysisResult,
  TitleRefinementResult,
  ReviewPersona,
  OpeningReviewResponse,
  FlowchartResult,
  WorkflowProblem,
  WorkflowAngle,
  WorkflowFramework,
  ReviewerFeedback
} from '../types';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJson = (text: string) => {
  if (!text) return "{}";
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

// AI Workflow Services
export async function generateWorkflowProblems(direction: string, language: Language): Promise<WorkflowProblem[]> {
    const ai = getAiClient();
    const prompt = `Act as a senior research supervisor. Suggest 4 distinct, significant, and viable research problems/topics for the field: "${direction}".
    
    Return JSON array under key "problems", where each problem has:
    - id: string
    - title: string (The core research problem)
    - description: string (Brief context and why it matters)
    - difficulty: string (Easy/Medium/Hard)
    
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text || "{}"));
        return res.problems || [];
    } catch (e) {
        console.error("Workflow Problems Error", e);
        return [];
    }
}

export async function generateWorkflowRefinement(problem: string, language: Language): Promise<WorkflowAngle[]> {
    const ai = getAiClient();
    const prompt = `For the research problem: "${problem}", suggest 3 specific, distinct research angles or questions to narrow down the scope for a paper/thesis.
    
    Return JSON array under key "angles", where each angle has:
    - id: string
    - title: string (The specific angle/question)
    - rationale: string (Why this is a good angle)
    
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const res = JSON.parse(cleanJson(response.text || "{}"));
        return res.angles || [];
    } catch (e) {
        console.error("Workflow Refinement Error", e);
        return [];
    }
}

export async function generateWorkflowFramework(problem: string, angle: string, language: Language): Promise<WorkflowFramework | null> {
    const ai = getAiClient();
    const prompt = `Design a comprehensive research framework for the specific angle: "${angle}" within the context of "${problem}".
    
    Return JSON with:
    - framework: string (Step-by-step logic flow/steps of the study)
    - methodology: string (Specific methods, models, or algorithms to use)
    - dataSources: string (Specific datasets, data types, or collection methods)
    - innovation: string (Key innovation points)
    
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error("Workflow Framework Error", e);
        return null;
    }
}

// Stubs for missing functions to satisfy imports in other files
export async function searchAcademicPapers(query: string, language: Language, limit: number): Promise<Paper[]> { return []; }
export async function generatePaperInterpretation(paper: Paper, language: Language): Promise<string> { return ""; }
export async function generateSimulatedFullText(paper: Paper, language: Language): Promise<string> { return ""; }
export async function extractChartData(file: File, language: Language): Promise<ChartExtractionResult> { return { title: "", type: "", summary: "", data: [] }; }
export async function parsePaperFromImage(file: File, language: Language): Promise<Paper | null> { return null; }
export async function analyzeResearchTrends(topic: string, language: Language, range: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> { return null; }
export async function getPaperTLDR(title: string, language: Language): Promise<string> { return ""; }
export async function performPeerReview(content: string, filename: string, type: TargetType, journal: string, language: Language, instructions?: string): Promise<PeerReviewResponse | null> { return null; }
export async function generateRebuttalLetter(critiques: string, language: Language): Promise<string> { return ""; }
export async function generateCoverLetter(summary: string, journal: string, language: Language): Promise<string> { return ""; }
export async function generateLiteratureReview(): Promise<any> { return null; }
export async function setModelProvider(): Promise<void> {}
export async function generateStructuredReview(topic: string, papers: string[], count: number, language: Language, focus: string): Promise<string> { return ""; }
export async function trackCitationNetwork(query: string, isFile: boolean, language: Language): Promise<TrackedReference[]> { return []; }
export async function analyzeNetworkGaps(papers: Paper[], language: Language): Promise<GapAnalysisResult> { return { missingThemes: [], underrepresentedMethods: [], suggestion: "" }; }
export async function chatWithCitationNetwork(query: string, papers: Paper[], language: Language): Promise<string> { return ""; }
export async function polishContent(content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> { return null; }
export async function refinePolish(text: string, instruction: string, language: Language): Promise<PolishResult | null> { return null; }
export async function generateAdvisorReport(title: string, journal: string, abstract: string, language: Language, focus?: string): Promise<AdvisorReport | null> { return null; }
export async function generatePPTStyleSuggestions(file: File, language: Language): Promise<any[]> { return []; }
export async function generatePPTContent(file: File, config: any, language: Language): Promise<any> { return null; }
export async function generateSlideImage(desc: string, style: string): Promise<string> { return ""; }
export async function generateResearchIdeas(topic: string, language: Language, focus: string, file?: File): Promise<IdeaGuideResult | null> { return null; }
export async function generateIdeaFollowUp(topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> { return null; }
export async function generateOpeningReview(file: File, target: string, language: Language, persona: ReviewPersona, focus?: string): Promise<OpeningReviewResponse | null> { return null; }
export async function optimizeOpeningSection(section: string, context: string, language: Language): Promise<string> { return ""; }
export async function performDataAnalysis(data: any, language: Language): Promise<DataAnalysisResult | null> { return null; }
export async function chatWithDataAnalysis(query: string, context: any, language: Language): Promise<string> { return ""; }
export async function performCodeAssistance(input: string, mode: string, lang: string, language: Language, history: any[], file?: File, onStream?: (s: string) => void, signal?: AbortSignal): Promise<string> { return ""; }
export async function generateExperimentDesign(hypothesis: string, field: string, method: string, language: Language, iv?: string, dv?: string, stats?: any, structure?: string): Promise<ExperimentDesignResult | null> { return null; }
export async function optimizeHypothesis(hypothesis: string, language: Language): Promise<string> { return ""; }
export async function analyzeImageNote(file: File, language: Language): Promise<string> { return ""; }
export async function performPDFChat(message: string, language: Language, file: File, history: any[], onStream?: (s: string) => void, signal?: AbortSignal): Promise<string> { return ""; }
export async function explainVisualContent(file: File, language: Language): Promise<string> { return ""; }
export async function explainPaperInPlainLanguage(file: File, language: Language): Promise<string> { return ""; }
export async function generateKnowledgeGraph(nodes: GraphNode[], language: Language): Promise<GraphLink[]> { return []; }
export async function chatWithKnowledgeGraph(query: string, nodes: GraphNode[], language: Language, onStream?: (s: string) => void): Promise<string> { return ""; }
export async function generateGraphSuggestions(nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> { return null; }
export async function deepParsePDF(file: File, language: Language): Promise<any> { return null; }
export async function runCodeSimulation(code: string, language: Language): Promise<string> { return ""; }
export async function findRelevantNodes(query: string, nodes: GraphNode[], language: Language): Promise<string[]> { return []; }
export async function generateScientificFigure(prompt: string, style: string, mode: string, file?: File, bgOnly?: boolean, mask?: File, size?: string): Promise<string> { return ""; }
export async function generateChartTrendAnalysis(data: any[], language: Language): Promise<string> { return ""; }
export async function generateGrantLogicFramework(config: any, language: Language, mode: string, refs: any[], img?: File): Promise<LogicNode | null> { return null; }
export async function expandGrantRationale(tree: LogicNode, language: Language): Promise<string> { return ""; }
export async function polishGrantProposal(text: string, section: string, language: Language, instruction: string): Promise<any> { return null; }
export async function checkGrantFormat(content: string | File, language: Language): Promise<GrantCheckResult | null> { return null; }
export async function getGrantInspiration(name: string, code: string, language: Language): Promise<string[]> { return []; }
export async function generateGrantReview(content: string | File, language: Language, role: string, framework: string): Promise<GrantReviewResult | null> { return null; }
export async function findConferences(topic: string, language: Language): Promise<ConferenceFinderResult | null> { return null; }
export async function detectAIContent(content: string | File, language: Language): Promise<AIDetectionResult | null> { return null; }
export async function humanizeText(content: string | File, language: Language): Promise<AIHumanizeResult | null> { return null; }
export async function generateResearchDiscussion(topic: string, language: Language, file?: File): Promise<DiscussionAnalysisResult | null> { return null; }
export async function chatWithDiscussionPersona(topic: string, persona: string, msg: string, history: any[], language: Language): Promise<string> { return ""; }
export async function generateTitleOptimization(title: string, abstract: string, target: string, language: Language): Promise<TitleRefinementResult | null> { return null; }
export async function chatWithAssistant(msg: string, context: string, language: Language, history: any[]): Promise<string> { return ""; }
export async function generateFlowchartData(input: string, type: string, language: Language, file?: File): Promise<FlowchartResult | null> { return null; }