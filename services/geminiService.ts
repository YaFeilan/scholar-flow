
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
  Quiz
} from '../types';
import { MOCK_PAPERS } from '../constants';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJson = (text: string) => {
  if (!text) return "{}";
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
      return text.substring(firstBrace, lastBrace + 1);
  }
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

// Helper: Convert File to Base64 Part
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

// 1. Image to Full Paper (OCR & Extraction)
export async function parsePaperFromImage(file: File, language: Language): Promise<Paper | null> {
  const ai = getAiClient();
  const imagePart = await fileToGenerativePart(file);
  
  const prompt = `Analyze this image of a research paper. Extract the following details into a JSON object:
  - title (string)
  - authors (array of strings)
  - journal (string, if visible, otherwise "Unknown")
  - year (number, if visible, else current year)
  - abstract (string)
  - fullText (string): The FULL readable text content extracted from the image, formatted in Markdown with proper headers.
  
  Also, strictly infer the likely academic database and partition (e.g. SCI Q1, EI) based on the journal name or visual cues.
  Return format: JSON.
  Language: ${language === 'ZH' ? 'Chinese' : 'English'}`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [imagePart, { text: prompt }]
        },
        config: { responseMimeType: 'application/json' }
    });
    
    const data = JSON.parse(cleanJson(response.text || "{}"));
    
    return {
        id: `img-${Date.now()}`,
        title: data.title || "Untitled Extracted Paper",
        authors: data.authors || ["Unknown Author"],
        journal: data.journal || "Imported Image",
        year: data.year || new Date().getFullYear(),
        citations: 0,
        badges: [{ type: 'SCI', partition: 'Q1' }, { type: 'LOCAL' }], // Inferred defaults
        abstract: data.abstract || "No abstract extracted.",
        fullText: data.fullText || "No text content could be extracted.",
        source: 'local',
        file: file,
        addedDate: new Date().toISOString().split('T')[0]
    };
  } catch (e) {
      console.error("Parse Image Error", e);
      return null;
  }
}

// 2. PDF Chat with Streaming
export async function performPDFChat(message: string, language: Language, file: File, history: any[], onStream?: (s: string) => void, signal?: AbortSignal): Promise<string> {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    
    // Construct history for context
    const historyText = history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n\n');
    
    const prompt = `You are an expert research assistant.
    Language: ${language}.
    
    CONTEXT (Conversation History):
    ${historyText}
    
    USER QUERY: ${message}
    
    Please answer the user query based strictly on the provided document. If the document is an image, analyze its visual content.`;

    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    filePart,
                    { text: prompt }
                ]
            }
        });

        let fullText = "";
        for await (const chunk of response) {
            if (signal?.aborted) break;
            const text = chunk.text;
            if (text) {
                fullText += text;
                if (onStream) onStream(fullText);
            }
        }
        return fullText;
    } catch (e) {
        console.error("PDF Chat Error", e);
        return language === 'ZH' ? "无法分析文档，请重试。" : "Error analyzing document. Please try again.";
    }
}

// 3. Search & Simulation
export async function searchAcademicPapers(query: string, language: Language, limit: number): Promise<Paper[]> {
    // Return mock data filtered by query for demonstration
    // In a real app, this would call Semantic Scholar or Google Scholar API
    const q = query.toLowerCase();
    return MOCK_PAPERS.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.journal.toLowerCase().includes(q)
    );
}

export async function generateSimulatedFullText(paper: Paper, language: Language): Promise<string> {
    const ai = getAiClient();
    const prompt = `Generate a realistic, full-text academic paper simulation for:
    Title: "${paper.title}"
    Abstract: "${paper.abstract}"
    
    Structure it with standard academic sections (Introduction, Related Work, Methodology, Experiments, Conclusion).
    Use Markdown. Make it sound highly professional and scientific.
    Language: ${language}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "";
    } catch (e) {
        return "Failed to generate simulation.";
    }
}

export async function generatePaperInterpretation(paper: Paper, language: Language): Promise<string> {
    const ai = getAiClient();
    const prompt = `Interpret this paper for a PhD student. Explain the core contribution, methodology, and flaws.
    Title: ${paper.title}
    Abstract: ${paper.abstract}
    Language: ${language}`;
    
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return res.text || "";
    } catch (e) { return ""; }
}

// 4. Research Training Services (BATTLE MODE UPGRADE)

// Init Session
export async function initiateTrainingSession(
    topic: string, 
    persona: TrainingPersonaStyle, 
    language: Language,
    file?: File
): Promise<TrainingSession | null> {
    const ai = getAiClient();
    const parts: any[] = [];
    
    if (file) {
        parts.push(await fileToGenerativePart(file));
        parts.push({ text: `Document Context Provided. The topic is derived from this document.` });
    }

    const personaPrompt = persona === 'Methodology' 
        ? "You are a methodology expert. Focus strictly on data sources, model architecture, baselines, and statistical validity. Be skeptical."
        : persona === 'Innovation' 
        ? "You are an innovation hunter. Focus on novelty, contribution, and difference from SOTA. Dismiss incremental work."
        : "You are a practical reviewer. Focus on feasibility, implementation costs, and real-world application.";

    const prompt = `
    Start a Research Defense Battle.
    Role: ${personaPrompt}
    Topic/Direction: "${topic}"
    Language: ${language}
    
    Task: 
    1. Analyze the topic/document.
    2. Generate the FIRST challenging question to start the defense.
    
    Return JSON: { 
        sessionId: string (generate random), 
        firstQuestion: string 
    }
    `;
    
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { responseMimeType: 'application/json' }
        });
        const data = JSON.parse(cleanJson(response.text || "{}"));
        
        return {
            id: data.sessionId || Date.now().toString(),
            topic: topic,
            persona: persona,
            history: [{
                id: Date.now().toString(),
                role: 'ai',
                content: data.firstQuestion,
                timestamp: Date.now()
            }],
            currentTurn: 1,
            maxTurns: 5,
            startTime: Date.now()
        };
    } catch (e) { 
        console.error("Init Training Error", e);
        return null; 
    }
}

// Submit Answer & Get Critique + Next Question
export async function submitTrainingTurn(
    session: TrainingSession,
    userAnswer: string,
    language: Language,
    file?: File
): Promise<BattleMessage[]> {
    const ai = getAiClient();
    const parts: any[] = [];
    
    if (file) {
        parts.push(await fileToGenerativePart(file));
    }

    // Context from history (last 3 turns to save tokens)
    const context = session.history.slice(-3).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const prompt = `
    Continue Research Defense Battle.
    Topic: ${session.topic}
    Persona: ${session.persona}
    Language: ${language}
    
    Context:
    ${context}
    
    User Answer: "${userAnswer}"
    
    Task:
    1. Evaluate the user's answer rigorously.
    2. Provide a 'polished' better version of the answer.
    3. Analyze logic (Claim + Evidence).
    4. Generate the NEXT follow-up question (harder).
    
    Return JSON: {
        score: number (0-100),
        strengths: string[],
        weaknesses: string[],
        optimizedVersion: string,
        logicAnalysis: string,
        nextQuestion: string
    }
    `;
    
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { responseMimeType: 'application/json' }
        });
        
        const data = JSON.parse(cleanJson(response.text || "{}"));
        
        const userMessage: BattleMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userAnswer,
            timestamp: Date.now(),
            analysis: {
                score: data.score,
                strengths: data.strengths,
                weaknesses: data.weaknesses,
                optimizedVersion: data.optimizedVersion,
                logicAnalysis: data.logicAnalysis
            }
        };

        const aiMessage: BattleMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: data.nextQuestion,
            timestamp: Date.now() + 100,
            isFollowUp: true
        };

        return [userMessage, aiMessage];

    } catch (e) {
        console.error("Training Turn Error", e);
        return [];
    }
}

// Generate Final Report
export async function generateTrainingReport(session: TrainingSession, language: Language): Promise<TrainingAnalysis | null> {
    const ai = getAiClient();
    // Summarize history
    const historyText = session.history.map(m => `${m.role}: ${m.content} ${m.role === 'user' ? `(Score: ${m.analysis?.score})` : ''}`).join('\n');
    
    const prompt = `
    Generate Final Research Training Report.
    Topic: ${session.topic}
    History: ${historyText}
    Language: ${language}
    
    Return JSON: {
        overallScore: number,
        radar: { theory, logic, innovation, expression, response },
        summary: string,
        actionPlan: string[]
    }
    `;

    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch(e) { return null; }
}

export async function getTrainingHint(question: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a structural hint/framework for answering this research question: "${question}". Do not give the full answer, just the logic points. Lang: ${language}`
    });
    return res.text || "";
}

// 5. Workflow Services
export async function generateWorkflowProblems(direction: string, language: Language): Promise<WorkflowProblem[]> {
    const ai = getAiClient();
    const prompt = `Suggest 4 research problems for "${direction}". JSON: { problems: [{id, title, description, difficulty}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}")).problems || [];
    } catch (e) { return []; }
}

export async function generateWorkflowRefinement(problem: string, language: Language): Promise<WorkflowAngle[]> {
    const ai = getAiClient();
    const prompt = `Suggest 3 research angles for "${problem}". JSON: { angles: [{id, title, rationale}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}")).angles || [];
    } catch (e) { return []; }
}

export async function generateWorkflowFramework(problem: string, angle: string, language: Language): Promise<WorkflowFramework | null> {
    const ai = getAiClient();
    const prompt = `Create research framework for "${problem}" via "${angle}". JSON: { framework, methodology, dataSources, innovation }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

// 6. Game Mode Service
export async function generateReadingQuiz(file: File, language: Language): Promise<Quiz | null> {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    const prompt = `Generate a quiz question based on this research paper. Focus on key contributions or methodology.
    Return JSON: { id: string, question: string, options: string[], correctIndex: number, explanation: string, points: number }. 
    Language: ${language}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [filePart, { text: prompt }]
            },
            config: { responseMimeType: 'application/json' }
        });
        const quiz = JSON.parse(cleanJson(response.text || "{}"));
        return { ...quiz, id: Date.now().toString() };
    } catch (e) { return null; }
}

// 7. Other Feature Implementations (Restored from Stubs)
export async function extractChartData(file: File, language: Language): Promise<ChartExtractionResult> {
    const ai = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const prompt = `Extract data from this chart. Return JSON: { title, type, summary, data: [{column1, column2...}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return { title: "Error", type: "Unknown", summary: "Failed to extract", data: [] }; }
}

export async function analyzeResearchTrends(topic: string, language: Language, range: TrendTimeRange, persona: TrendPersona): Promise<TrendAnalysisResult | null> {
    const ai = getAiClient();
    const prompt = `Analyze research trends for "${topic}" (${range}). Persona: ${persona}.
    Return JSON: { 
      emergingTech: [{name, growth: number, predictedGrowth: number, type}], 
      hotspots: [{text, value: number, category, relatedTo: string[]}], 
      methodologies: [{name, value: number, growth: number, codeStats: {github, huggingface}}],
      researchGaps: [{problem, potential, difficulty, type}]
    }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function getPaperTLDR(title: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `TL;DR for paper "${title}" in 1 sentence. Lang: ${language}`});
    return res.text || "";
}

export async function performPeerReview(content: string, filename: string, type: TargetType, journal: string, language: Language, instructions?: string): Promise<PeerReviewResponse | null> {
    const ai = getAiClient();
    const prompt = `Simulate peer review for "${filename}". Target: ${type} ${journal}. Instructions: ${instructions || 'None'}.
    Return JSON: { checklist: {originality, soundness, clarity, recommendation}, reviewers: [{roleName, icon: 'Expert'|'Language'|'Editor', focusArea, score, critiques: [{point, quote, suggestion}]}], summary }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function generateRebuttalLetter(critiques: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Write a polite rebuttal letter addressing these critiques: ${critiques}. Lang: ${language}`});
    return res.text || "";
}

export async function generateCoverLetter(summary: string, journal: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Write a cover letter for journal "${journal}" based on this summary: ${summary}. Lang: ${language}`});
    return res.text || "";
}

export async function generateStructuredReview(topic: string, papers: string[], count: number, language: Language, focus: string): Promise<string> {
    const ai = getAiClient();
    const prompt = `Write a literature review on "${topic}". Focus: ${focus}. Word count: ${count}. Papers: ${papers.join('; ')}. Use Markdown. Lang: ${language}`;
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return res.text || "";
}

export async function trackCitationNetwork(query: string, isFile: boolean, language: Language): Promise<TrackedReference[]> {
    // Mock response for tracker as it requires live citation API
    return [
        { category: "Methodology", papers: [{ title: "Foundational Paper A", author: "Smith", year: 2020, description: "Base method", citations: 500, sentiment: "Support", snippet: "We build upon...", isStrong: true }] },
        { category: "Applications", papers: [{ title: "Applied Study B", author: "Jones", year: 2022, description: "Application in Med", citations: 50, sentiment: "Mention", snippet: "Used in...", isStrong: false }] }
    ];
}

export async function analyzeNetworkGaps(papers: Paper[], language: Language): Promise<GapAnalysisResult> {
    const ai = getAiClient();
    const prompt = `Analyze these papers and find research gaps: ${papers.map(p=>p.title).join(', ')}. JSON: {missingThemes:[], underrepresentedMethods:[], suggestion}. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return { missingThemes: [], underrepresentedMethods: [], suggestion: "" }; }
}

export async function chatWithCitationNetwork(query: string, papers: Paper[], language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Context: ${papers.map(p=>p.title).join('; ')}. Question: ${query}. Lang: ${language}`});
    return res.text || "";
}

export async function polishContent(content: string | File, language: Language, config: PolishConfig): Promise<PolishResult | null> {
    const ai = getAiClient();
    let text = typeof content === 'string' ? content : "File content placeholder"; 
    // If file, normally we'd read it, but assuming text input for simple polish or prompt handling
    if (typeof content !== 'string') {
        // Simplified: Assume file text extraction happened in UI or handled via filePart if we implemented file reading here
        text = "[File content processing would happen here]";
    }
    
    const prompt = `Polish this text. Mode: ${config.mode}. Tone: ${config.tone}. Field: ${config.field}. Glossary: ${config.glossary}.
    Text: "${text}"
    Return JSON: { polishedText, overallComment, changes: [{id, original, revised, reason, category, status: 'pending'}] }. Lang: ${language}`;
    
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        const data = JSON.parse(cleanJson(res.text || "{}"));
        return { ...data, versionId: Date.now() };
    } catch (e) { return null; }
}

export async function refinePolish(text: string, instruction: string, language: Language): Promise<PolishResult | null> {
    const ai = getAiClient();
    const prompt = `Refine this text based on instruction: "${instruction}". Text: "${text}". Return JSON (same format as polish). Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return { ...JSON.parse(cleanJson(res.text || "{}")), versionId: Date.now() };
    } catch (e) { return null; }
}

export async function generateAdvisorReport(title: string, journal: string, abstract: string, language: Language, focus?: string): Promise<AdvisorReport | null> {
    const ai = getAiClient();
    const prompt = `Evaluate paper for journal "${journal}". Title: "${title}". Abstract: "${abstract}". Focus: ${focus}.
    Return JSON: { matchScore, matchLevel, radar: {topic, method, novelty, scope, style}, analysis, titleSuggestions: [{issue, revised}], keywords: [{term, trend}], riskAssessment: [{risk, severity}], alternatives: [{name, impactFactor, reason}], references: [{title, author, year}], improvementSuggestions: [{content, example}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function generatePPTStyleSuggestions(file: File, language: Language): Promise<any[]> {
    const ai = getAiClient();
    // Simplified suggestions
    return [
        { id: 1, name: "Academic Minimal", description: "Clean, white background, serif fonts.", colorPalette: ["#ffffff", "#000000", "#2563eb"] },
        { id: 2, name: "Tech Dark", description: "Dark mode, neon accents, sans-serif.", colorPalette: ["#1e293b", "#ffffff", "#8b5cf6"] },
        { id: 3, name: "Nature/Science", description: "Earth tones, professional, structured.", colorPalette: ["#f0fdf4", "#14532d", "#166534"] }
    ];
}

export async function generatePPTContent(file: File, config: any, language: Language): Promise<any> {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    const prompt = `Create a PPT outline for this paper. Config: ${JSON.stringify(config)}. 
    Return JSON: { title, slides: [{title, content: string[], speakerNotes, layout, visualSuggestion}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [filePart, { text: prompt }] }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function generateSlideImage(desc: string, style: string): Promise<string> {
    const ai = getAiClient();
    // Using flash-image for generation/editing simulation (actually requires Imagen for generation usually, but flash-2.5 can do text-to-image in some contexts or we simulate via text description return)
    // For this demo, we will use a placeholder or check if model supports image gen. 
    // Since 'gemini-2.5-flash' is text/multimodal-in, NOT image-out, we will return a placeholder service URL based on keywords.
    return `https://placehold.co/600x400?text=${encodeURIComponent(desc.substring(0, 20))}`;
}

export async function generateResearchIdeas(topic: string, language: Language, focus: string, file?: File): Promise<IdeaGuideResult | null> {
    const ai = getAiClient();
    const parts: any[] = [{ text: `Generate research ideas for topic "${topic}". Focus: ${focus}. Return JSON: { directions: [{angle, description, methodology, dataSources, recommendedTitles: [], corePapers: [{title, author, year}]}], journals: [{name, impactFactor, reviewCycle, acceptanceRate, reason}] }. Lang: ${language}` }];
    if (file) parts.unshift(await fileToGenerativePart(file));
    
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function generateIdeaFollowUp(topic: string, angle: string, query: string, language: Language): Promise<IdeaFollowUpResult | null> {
    const ai = getAiClient();
    const prompt = `Deep dive into angle "${angle}" for topic "${topic}". User Query: "${query}".
    Return JSON: { analysis, logicPath: string[], suggestions: [{title, detail}], recommendedTerms: [] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function generateOpeningReview(
  file: File, 
  target: string, 
  language: Language, 
  roles: ReviewRole[], // Updated to accept array of roles
  focus?: string
): Promise<OpeningReviewResponse | null> {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    
    const roleDescriptions = {
        Mentor: language === 'ZH' ? '学生导师 (侧重补充与辩护)' : 'Student Mentor (Supportive)',
        Expert: language === 'ZH' ? '外审专家 (严肃认真，指出不足)' : 'External Reviewer (Critical)',
        Peer: language === 'ZH' ? '同行评审 (关注创新)' : 'Peer Reviewer (Innovation)',
        Committee: language === 'ZH' ? '学术委员 (严格审查规范)' : 'Academic Committee (Rigor)'
    };

    const rolesPrompt = roles.map(r => roleDescriptions[r]).join(', ');

    const prompt = `Review opening proposal. Target: ${target}. 
    Active Review Roles: ${rolesPrompt}.
    Focus: ${focus}.
    
    1. Synthesize feedback from all selected roles for the main section analysis (Title, Methodology, Logic, Literature).
    2. Provide an array 'roleInsights' where each selected role gives their specific, independent feedback summary.
    
    Return JSON: { 
      overallScore, 
      radarMap: {innovation, logic, feasibility, literature, format}, 
      executiveSummary, 
      roleInsights: [{role, key: '${roles.join("'|'")}', summary}], 
      titleAnalysis: {strengths, weaknesses: [{point, quote, suggestion}], score}, 
      methodologyAnalysis: {strengths, weaknesses: [{point, quote, suggestion}], score}, 
      logicAnalysis: {strengths, weaknesses: [{point, quote, suggestion}], score}, 
      literatureAnalysis: {strengths, weaknesses: [{point, quote, suggestion}], score}, 
      journalFit: {score, analysis, alternativeJournals: [{name, reason, if}]} 
    }. 
    Lang: ${language}`;

    try {
        const res = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: { parts: [filePart, { text: prompt }] }, 
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function optimizeOpeningSection(section: string, context: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Optimize this section "${section}" based on issues: ${context}. Return refined text. Lang: ${language}`});
    return res.text || "";
}

export async function performDataAnalysis(data: any, language: Language): Promise<DataAnalysisResult | null> {
    const ai = getAiClient();
    const prompt = `Analyze this dataset metadata/sample. Return JSON: { summary, columns: [{name, type, stats}], correlations: [{pair, value, insight}], recommendedModels: [{name, reason, codeSnippet}] }. Lang: ${language}. Data Context: ${JSON.stringify(data).substring(0, 10000)}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function chatWithDataAnalysis(query: string, context: any, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Data Context: ${JSON.stringify(context)}. User Question: ${query}. Lang: ${language}`});
    return res.text || "";
}

export async function performCodeAssistance(input: string, mode: string, lang: string, language: Language, history: any[], file?: File, onStream?: (s: string) => void, signal?: AbortSignal): Promise<string> {
    const ai = getAiClient();
    const parts: any[] = [];
    if (file) parts.push(await fileToGenerativePart(file));
    
    // Build context from history
    const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const prompt = `Mode: ${mode}. Language: ${lang}. History: ${historyText}. Input: ${input}. Output code or explanation. Lang: ${language}`;
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });
        
        let fullText = "";
        for await (const chunk of response) {
            if (signal?.aborted) break;
            const text = chunk.text;
            if (text) {
                fullText += text;
                if (onStream) onStream(fullText);
            }
        }
        return fullText;
    } catch (e) { return "Error"; }
}

export async function generateExperimentDesign(hypothesis: string, field: string, method: string, language: Language, iv?: string, dv?: string, stats?: any, structure?: string): Promise<ExperimentDesignResult | null> {
    const ai = getAiClient();
    const prompt = `Design experiment. Hypothesis: ${hypothesis}. Field: ${field}. Method: ${method}. IV: ${iv}. DV: ${dv}. Structure: ${structure}. Stats: ${JSON.stringify(stats)}.
    Return JSON: { title, flow: [{step, name, description}], sampleSize: {recommended, explanation, parameters: [{label, value}]}, variables: {independent, dependent, control, confounders}, analysis: {method, description} }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function optimizeHypothesis(hypothesis: string, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Optimize hypothesis for scientific rigor: "${hypothesis}". Return only the optimized sentence. Lang: ${language}`});
    return res.text || "";
}

export async function analyzeImageNote(file: File, language: Language): Promise<string> {
    const ai = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: `Analyze this image and describe it for research notes. Lang: ${language}` }] }});
    return res.text || "";
}

export async function explainPaperInPlainLanguage(file: File, language: Language): Promise<string> {
    const ai = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: `Explain this paper in simple plain language for a student. Lang: ${language}` }] }});
    return res.text || "";
}

export async function generateKnowledgeGraph(nodes: GraphNode[], language: Language): Promise<GraphLink[]> {
    const ai = getAiClient();
    const prompt = `Given nodes: ${nodes.map(n=>n.label).join(', ')}. Generate relationships (links). Return JSON array of {source, target, label}. IDs matching input. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "[]"));
    } catch (e) { return []; }
}

export async function chatWithKnowledgeGraph(query: string, nodes: GraphNode[], language: Language, onStream?: (s: string) => void): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Nodes: ${nodes.map(n=>n.label).join(', ')}. Question: ${query}. Lang: ${language}`});
    return res.text || "";
}

export async function generateGraphSuggestions(nodes: GraphNode[], language: Language): Promise<GraphSuggestionsResult | null> {
    const ai = getAiClient();
    const prompt = `Suggest new related nodes and links based on: ${nodes.map(n=>n.label).join(', ')}. Return JSON: { recommendedNodes: [{id, label, type, reason}], suggestedLinks: [{source, target, label}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function deepParsePDF(file: File, language: Language): Promise<any> {
    const ai = getAiClient();
    const filePart = await fileToGenerativePart(file);
    const prompt = `Deep parse this PDF. Extract summary and key elements (algorithms, formulas). Return JSON: { summary, elements: [{label, type, content}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [filePart, { text: prompt }] }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function runCodeSimulation(code: string, language: Language): Promise<string> {
    const ai = getAiClient();
    // Simulate code execution logic interpretation
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Simulate the output of this code:\n${code}\nLang: ${language}`});
    return res.text || "";
}

export async function findRelevantNodes(query: string, nodes: GraphNode[], language: Language): Promise<string[]> {
    const ai = getAiClient();
    const prompt = `Find nodes relevant to "${query}" from: ${nodes.map(n=>`${n.id}:${n.label}`).join(', ')}. Return JSON array of IDs. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "[]"));
    } catch (e) { return []; }
}

export async function generateScientificFigure(prompt: string, style: string, mode: string, file?: File, bgOnly?: boolean, mask?: File, size?: string): Promise<string> {
    // Return placeholder as we don't have Imagen integration in this snippet
    return `https://placehold.co/600x400?text=${encodeURIComponent(prompt.substring(0, 20))}`;
}

export async function generateChartTrendAnalysis(data: any[], language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Analyze this chart data: ${JSON.stringify(data.slice(0, 10))}. Provide trend analysis. Lang: ${language}`});
    return res.text || "";
}

export async function generateGrantLogicFramework(config: any, language: Language, mode: string, refs: any[], img?: File): Promise<LogicNode | null> {
    const ai = getAiClient();
    const parts: any[] = [{ text: `Generate Grant Logic Tree. Project: ${config.name}. Keywords: ${config.keywords}. Mode: ${mode}. Return JSON: { id, label, children: [...] }. Lang: ${language}` }];
    if (img) parts.push(await fileToGenerativePart(img));
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function expandGrantRationale(tree: LogicNode, language: Language): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Write full grant rationale based on logic tree: ${JSON.stringify(tree)}. Lang: ${language}`});
    return res.text || "";
}

export async function polishGrantProposal(text: string, section: string, language: Language, instruction: string): Promise<any> {
    const ai = getAiClient();
    const prompt = `Polish grant section "${section}". Instruction: ${instruction}. Text: "${text}". 
    Return JSON: { versions: [{type: 'Conservative'|'Aggressive'|'Professional', clean, revisions, comment}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function checkGrantFormat(content: string | File, language: Language): Promise<GrantCheckResult | null> {
    const ai = getAiClient();
    const parts: any[] = [];
    if (typeof content === 'string') parts.push({ text: `Check grant format. Text: ${content}. Lang: ${language}` });
    else parts.push(await fileToGenerativePart(content), { text: `Check grant format. Lang: ${language}` });
    
    const prompt = `Return JSON: { score, summary, hardErrors: {status, issues}, logicCheck: {status, issues}, formatCheck: {status, issues}, anonymityCheck: {status, issues} }.`;
    parts.push({ text: prompt });

    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function getGrantInspiration(name: string, code: string, language: Language): Promise<string[]> {
    const ai = getAiClient();
    const prompt = `Provide 3 inspiration sentences for grant "${name}" (Code: ${code}). Lang: ${language}. Return JSON string array.`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "[]"));
    } catch (e) { return []; }
}

export async function generateGrantReview(content: string | File, language: Language, role: string, framework: string): Promise<GrantReviewResult | null> {
    const ai = getAiClient();
    const parts: any[] = [];
    if (typeof content === 'string') parts.push({ text: `Review grant. Role: ${role}. Framework: ${framework}. Text: ${content}. Lang: ${language}` });
    else parts.push(await fileToGenerativePart(content), { text: `Review grant. Role: ${role}. Framework: ${framework}. Lang: ${language}` });
    
    const prompt = `Return JSON: { overallScore, verdict, summary, dimensions: [{name, score, comment}], strengths: [], weaknesses: [], improvementSuggestions: [] }.`;
    parts.push({ text: prompt });

    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function findConferences(topic: string, language: Language): Promise<ConferenceFinderResult | null> {
    const ai = getAiClient();
    const prompt = `Find conferences/journals for "${topic}". 
    Return JSON: { conferences: [{name, rank, deadline, conferenceDate, location, region, h5Index, description, tags, website}], journals: [{name, title, deadline, impactFactor, partition}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function detectAIContent(content: string | File, language: Language): Promise<AIDetectionResult | null> {
    const ai = getAiClient();
    let text = "";
    if (typeof content === 'string') text = content;
    else text = "File content analysis"; // Simplified for stub
    
    const prompt = `Detect AI content. Text: "${text.substring(0, 2000)}". 
    Return JSON: { score: number, analysis: string, highlightedSentences: [{text, reason, score}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function humanizeText(content: string | File, language: Language): Promise<AIHumanizeResult | null> {
    const ai = getAiClient();
    const prompt = `Humanize this text to bypass AI detection. Content: "${content}". 
    Return JSON: { originalScore, newScore, text, changesSummary }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function generateResearchDiscussion(topic: string, language: Language, file?: File): Promise<DiscussionAnalysisResult | null> {
    const ai = getAiClient();
    const parts: any[] = [{ text: `Analyze discussion topic: "${topic}". Return JSON: { scorecard: {theory, method, application, theoryReason, methodReason, applicationReason}, feasibility: {data, tech, ethics}, initialComments: {reviewer, collaborator, mentor} }. Lang: ${language}` }];
    if (file) parts.push(await fileToGenerativePart(file));
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function chatWithDiscussionPersona(topic: string, persona: string, msg: string, history: any[], language: Language): Promise<string> {
    const ai = getAiClient();
    const historyText = history.map((h: any) => `${h.role}: ${h.text}`).join('\n');
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Topic: ${topic}. You are ${persona}. History: ${historyText}. User: ${msg}. Reply as persona. Lang: ${language}`});
    return res.text || "";
}

export async function generateTitleOptimization(title: string, abstract: string, target: string, language: Language): Promise<TitleRefinementResult | null> {
    const ai = getAiClient();
    const prompt = `Optimize title: "${title}". Abstract: "${abstract}". Target: "${target}".
    Return JSON: { council: [{role, feedback, critiqueQuote}], options: [{type, title, rationale}] }. Lang: ${language}`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}

export async function chatWithAssistant(msg: string, context: string, language: Language, history: any[]): Promise<string> {
    const ai = getAiClient();
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `You are a research assistant. Context view: ${context}. History: ${JSON.stringify(history)}. User: ${msg}. Lang: ${language}`});
    return res.text || "";
}

export async function generateFlowchartData(input: string, type: string, language: Language, file?: File): Promise<FlowchartResult | null> {
    const ai = getAiClient();
    const parts: any[] = [{ text: `Generate Mermaid.js code for a ${type}. Description: "${input}". Return JSON: { mermaidCode, explanation }. Lang: ${language}` }];
    if (file) parts.push(await fileToGenerativePart(file));
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts }, config: { responseMimeType: 'application/json' }});
        return JSON.parse(cleanJson(res.text || "{}"));
    } catch (e) { return null; }
}