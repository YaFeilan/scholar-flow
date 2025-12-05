
import { GoogleGenAI, Type } from "@google/genai";
import { TrackedReference, PolishResult, Language, Paper, IdeaGuideResult, IdeaFollowUpResult, PeerReviewResponse, TargetType, OpeningReviewResponse, ReviewPersona, PolishConfig, AdvisorReport, GapAnalysisResult } from "../types";
// @ts-ignore
import mammoth from "mammoth";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLangInstruction = (lang: Language) => {
  return lang === 'ZH' ? 'Respond in Simplified Chinese.' : 'Respond in English.';
};

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const searchAcademicPapers = async (query: string, lang: Language = 'EN', limit: number = 20): Promise<Paper[]> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a high-performance academic search engine. 
      Your task is to find ${limit} DISTINCT, high-quality academic papers related to: "${query}".
      
      SEARCH STRATEGY:
      - USE THE GOOGLE SEARCH TOOL.
      - Prioritize results from major databases (Google Scholar, PubMed, arXiv, IEEE, ScienceDirect).
      - **Use information indexed by sci-hub.org.cn or pubmed.ncbi.nlm.nih.gov to verify paper existence and metadata where possible.**
      - ${lang === 'ZH' ? 'Include a mix of high-impact Chinese (CNKI) and English papers.' : 'Focus on high-impact international papers.'}

      CRITICAL OUTPUT INSTRUCTIONS:
      - Output ONLY a valid JSON array. No markdown formatting, no conversational text.
      - Start directly with '[' and end with ']'.
      - Ensure 'year' is a number and 'citations' is a number (estimate if necessary).
      - Infer 'badges' (SCI, SSCI, EI, PubMed, CJR, Q1-Q4) based on the journal's reputation or source.
      - **IMPORTANT:** For 'badges', specifically look for JCR Partition (Q1-Q4) or CJR (Chinese Journal Reports/CAS). Label distinctively.
      - Be concise in abstracts to save tokens and speed up generation.
      - Add a 'addedDate' field (YYYY-MM-DD) representing today's date to simulate database addition.

      JSON Structure:
      [
        {
          "title": "Paper Title",
          "authors": ["Author A", "Author B"],
          "journal": "Journal Name",
          "year": 2024,
          "citations": 15,
          "abstract": "Brief summary...",
          "badges": [{"type": "SCI", "partition": "Q1"}, {"type": "CJR"}]
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
      }
    });

    let jsonStr = response.text || '[]';
    
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
    } else {
      if (jsonStr.trim().startsWith('{')) {
          jsonStr = `[${jsonStr}]`;
      } else {
          return [];
      }
    }

    jsonStr = jsonStr.replace(/,\s*\]/g, ']');

    const papers = JSON.parse(jsonStr);
    
    if (Array.isArray(papers)) {
      return papers.map((p: any, i: number) => {
        if (!p) return null;
        return {
        ...p,
        id: p.id || `search-gen-${i}-${Date.now()}`,
        badges: Array.isArray(p.badges) ? p.badges : [], // GUARANTEE ARRAY
        authors: Array.isArray(p.authors) ? p.authors : [p.authors || 'Unknown'],
        addedDate: p.addedDate || new Date().toISOString().split('T')[0]
      }}).filter((p: any) => p !== null);
    }
    
    return [];
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};

export const generateLiteratureReview = async (papers: string[], lang: Language = 'EN'): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const paperList = papers.map((p, i) => `${i + 1}. ${p}`).join('\n');
    
    const prompt = `You are an academic research assistant.
    Please generate a concise, structured literature review summary for the following list of papers. 
    Focus on common themes, methodologies, and findings.
    ${getLangInstruction(lang)}
    
    Papers:
    ${paperList}
    
    Format the output with Markdown headings.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Failed to generate review.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating review. Please check your API key.";
  }
};

export const performPeerReview = async (
  content: string, 
  filename: string, 
  targetType: TargetType, 
  journalName: string, 
  lang: Language = 'EN'
): Promise<PeerReviewResponse | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const instruction = lang === 'ZH' ? 'Respond in Simplified Chinese.' : 'Respond in English.';
    
    let specificFocus = "";
    if (targetType === 'SCI' || targetType === 'EI') {
      specificFocus = "Focus on Gap Check (did they miss references?), Baselines (are comparisons SOTA?), and Ablation Studies (module validity).";
    } else if (targetType === 'SSCI') {
      specificFocus = "Focus on Theoretical Framework (is the hypothesis grounded?) and Endogeneity (IV/Robustness checks).";
    } else {
      specificFocus = "Focus on rubric requirements, clarity, and basic academic standards.";
    }

    const prompt = `
    Role: Senior Review Board for ${journalName || targetType}.
    Task: Conduct a rigorous 3-dimensional peer review of the manuscript "${filename}".
    Target: ${targetType} Journal.
    ${instruction}
    
    You must simulate THREE distinct personas:

    1. **The Reviewer #2 (Domain Expert)**: Ruthless. ${specificFocus}
       - MUST Quote evidence from text.
       - Identify the "Research Gap".
    
    2. **The Native Academic Editor**: Focus on "Chinglish" vs Academic English, Flow, Signposting, and Tense Consistency.
       - Point out specific phrases to nominalize or make precise.
    
    3. **The Editor-in-Chief**: Focus on "Scope Match" (Does it fit ${journalName}?), Impact Statement ("So What?"), and Reference Health (recency/self-citation).
       - Give a desk rejection probability.

    Also generate a "Pre-submission Checklist".
    
    Output strictly in JSON format.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: [
        { text: `${prompt}\n\nManuscript Content (Snippet):\n${content.substring(0, 30000)}` }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            checklist: {
              type: Type.OBJECT,
              properties: {
                originality: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                soundness: { type: Type.STRING, enum: ['Yes', 'No', 'Partial'] },
                clarity: { type: Type.STRING, enum: ['Excellent', 'Good', 'Needs Improvement'] },
                recommendation: { type: Type.STRING, enum: ['Accept', 'Minor Revision', 'Major Revision', 'Reject'] },
              }
            },
            summary: { type: Type.STRING, description: "Executive summary of the decision." },
            reviewers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  roleName: { type: Type.STRING },
                  icon: { type: Type.STRING, enum: ['Expert', 'Language', 'Editor'] },
                  focusArea: { type: Type.STRING },
                  critiques: {
                    type: Type.ARRAY,
                    items: {
                       type: Type.OBJECT,
                       properties: {
                          point: { type: Type.STRING },
                          quote: { type: Type.STRING },
                          suggestion: { type: Type.STRING }
                       }
                    }
                  },
                  score: { type: Type.NUMBER, description: "Score out of 10" }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateRebuttalLetter = async (
  critiques: string, 
  lang: Language = 'EN'
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    You are an expert academic author. Write a polite, professional, and convincing "Response to Reviewers" (Rebuttal Letter) based on the critiques provided below.
    ${getLangInstruction(lang)}
    
    Tone: Humble, confident, grateful. Use standard phrases like "We thank the reviewer for this insightful comment..."
    
    Critiques to address:
    ${critiques}
    
    Format as a formal letter.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Failed to generate rebuttal.";
  } catch (error) {
    return "Error generating rebuttal.";
  }
};

export const generateCoverLetter = async (
  paperSummary: string, 
  journalName: string, 
  lang: Language = 'EN'
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Write a compelling Cover Letter for submission to "${journalName}".
    ${getLangInstruction(lang)}
    
    Highlight the "Why this journal?" and "Research Gap" based on this summary:
    ${paperSummary}
    
    Format as a formal letter to the Editor-in-Chief.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Failed to generate cover letter.";
  } catch (error) {
    return "Error generating cover letter.";
  }
};

export const analyzeResearchTrends = async (topic: string, lang: Language = 'EN') => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Analyze the academic research trends for the field: "${topic}".
    ${getLangInstruction(lang)}
    Provide data for:
    1. 3 Emerging Technologies/Concepts with estimated YoY growth (e.g., +150.5).
    2. 8-10 Research Hotspots (keywords) with an importance value (1-100).
    3. Top 5 Research Methodologies used in this field, with approximate paper counts and growth percentages.
    
    For each methodology, list 2-3 related hotspots from your hotspots list (exact text match if possible) to allow linking the visualization.
    
    Ensure the data is realistic for the current year.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emergingTech: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  growth: { type: Type.NUMBER },
                  type: { type: Type.STRING },
                },
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
                },
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
                  relatedHotspots: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      },
    });

    const res = JSON.parse(response.text || '{}');
    // Ensure all required arrays exist
    return {
        emergingTech: Array.isArray(res.emergingTech) ? res.emergingTech : [],
        hotspots: Array.isArray(res.hotspots) ? res.hotspots : [],
        methodologies: Array.isArray(res.methodologies) ? res.methodologies : []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateStructuredReview = async (
  topic: string, 
  papers: string[], 
  wordCount: number, 
  language: string 
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const langInstruction = language === 'ZH' ? 'Write the review in Simplified Chinese.' : 'Write the review in Academic English.';
    
    const paperContext = papers.length > 0 
      ? `Base the review primarily on these selected papers:\n${papers.map((p, i) => `${i+1}. ${p}`).join('\n')}` 
      : 'Select representative high-impact papers from the field.';

    const prompt = `You are a professional academic research assistant specializing in literature reviews.

    TASK:
    Generate a high-quality, structured academic literature review on the topic: "${topic}".
    
    CONTEXT:
    ${paperContext}
    
    REQUIREMENTS:
    1. Word Count Target: Approximately ${wordCount} words.
    2. Language: ${langInstruction}
    3. Tone: Academic, objective, critical, and formal.
    
    STRUCTURE:
    1. Title: Create a professional academic title.
    2. Introduction (引言): Background, significance, and review objectives.
    3. Research Progress (研究进展): Organize by sub-themes or methodologies based on the selected papers.
    4. Controversies & Challenges (争议与挑战): Discuss conflicting views or limitations.
    5. Future Directions (未来方向): Propose research gaps.
    6. References (参考文献): List the selected papers in APA format.

    IMPORTANT:
    - Ensure the content is logically organized.
    - Use Markdown formatting (## for sections, - for lists, **bold** for emphasis).
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Failed to generate review.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Error generating review. Please try again later.`;
  }
};

export const trackCitationNetwork = async (query: string, isFile: boolean = false, lang: Language = 'EN'): Promise<TrackedReference[]> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `You are a sophisticated citation analysis engine.
    Analyze the bibliography and reference network of the following paper: "${query}" ${isFile ? '(Simulated Analysis of Uploaded Document)' : ''}.
    ${getLangInstruction(lang)}

    TASK:
    Identify 5-6 distinct Technical Categories of references (e.g., "Theoretical Foundation", "Dataset", "Baselines", "Optimization Methods").
    For each category, list 2-3 likely or actual papers that would be cited.
    
    ENHANCED METADATA REQUIREMENT:
    For EACH paper, you must provide:
    - 'sentiment': Does the main paper 'Support', 'Dispute', or just 'Mention' this reference?
    - 'snippet': Generate a realistic 1-sentence context snippet showing how it is cited in the text (e.g., "While [Author] proposed X, we find...").
    - 'isStrong': true if it is a major basis of the work, false if minor.
    - 'citations': Estimate citation count (integer).

    Return a JSON structure.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              papers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    year: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    citations: { type: Type.NUMBER },
                    sentiment: { type: Type.STRING, enum: ['Support', 'Dispute', 'Mention'] },
                    snippet: { type: Type.STRING },
                    isStrong: { type: Type.BOOLEAN },
                    doi: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      },
    });

    const res = JSON.parse(response.text || '[]');
    if (!Array.isArray(res)) return [];
    
    // Post-process to ensure IDs exist
    return res.map((item: any, cIdx: number) => ({
        ...item,
        papers: Array.isArray(item.papers) ? item.papers.map((p: any, pIdx: number) => ({
            ...p,
            id: `ref-${cIdx}-${pIdx}-${Date.now()}`,
            userNote: ''
        })) : []
    }));
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const analyzeNetworkGaps = async (references: any[], lang: Language = 'EN'): Promise<GapAnalysisResult | null> => {
    try {
        const model = 'gemini-2.5-flash';
        const refsText = JSON.stringify(references.slice(0, 30)); // Limit payload
        const prompt = `Analyze this list of academic references.
        Identify research gaps or missing themes that are conspicuously absent given the context of these papers.
        ${getLangInstruction(lang)}
        
        Return JSON with:
        - missingThemes: string[] (e.g. "Ethics", "Real-time performance")
        - underrepresentedMethods: string[]
        - suggestion: string (A concise insight paragraph)`;

        const response = await ai.models.generateContent({
            model,
            contents: `References: ${refsText}\n\n${prompt}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        missingThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        underrepresentedMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestion: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || 'null');
    } catch (error) {
        return null;
    }
}

export const chatWithCitationNetwork = async (query: string, contextRefs: any[], lang: Language = 'EN'): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const context = contextRefs.map((r: any) => `${r.title} (${r.year}) by ${r.author}: ${r.description}`).join('\n');
        
        const prompt = `You are an expert on this specific citation network.
        Context Papers:
        ${context.substring(0, 20000)}
        
        User Question: "${query}"
        
        Answer based on the themes and connections in these papers.
        ${getLangInstruction(lang)}
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        return response.text || "No answer generated.";
    } catch (error) {
        return "Error interacting with network.";
    }
}

export const polishContent = async (
  content: string | File, 
  lang: Language = 'EN',
  config?: PolishConfig
): Promise<PolishResult | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const instruction = getLangInstruction(lang);
    
    // Construct System Instruction based on Config
    let modeInstruction = "";
    if (config) {
        if (config.mode === 'CnToEn') modeInstruction = "Translate Chinese to Academic English.";
        else if (config.mode === 'EnToCn') modeInstruction = "Translate English to Academic Chinese.";
        else modeInstruction = "Polish English to be more academic.";

        modeInstruction += `\nTone: ${config.tone} (e.g., Formal, Native, Concise).`;
        modeInstruction += `\nField: ${config.field} (Use appropriate terminology).`;
        if (config.glossary) {
            modeInstruction += `\nGlossary (Do not translate/change these terms): ${config.glossary}`;
        }
    } else {
        modeInstruction = "Polish the content to improve academic tone, clarity, and flow.";
    }

    const promptText = `Act as a professional academic editor. 
    ${modeInstruction}
    ${instruction}
    
    CRITICAL RULES:
    1. **PROTECT CITATIONS:** Do NOT modify, reorder, or remove citation markers like [1], (Smith et al., 2020), or \\cite{...}.
    2. **PROTECT LATEX:** Do NOT modify any content inside $...$, $$...$$, or LaTeX commands.
    
    Return a JSON with:
    1. 'polishedText': The full polished version.
    2. 'changes': A list of significant changes. For each change, provide the 'original' substring and the 'revised' substring so we can locate it.
    
    If the content is very long, process the first 25000 characters.
    `;

    const parts: any[] = [];
    
    if (content instanceof File) {
        const base64Data = await fileToBase64(content);
        let mimeType = content.type;
        if (!mimeType || mimeType === '') {
            if (content.name.endsWith('.pdf')) mimeType = 'application/pdf';
            else if (content.name.endsWith('.png')) mimeType = 'image/png';
            else if (content.name.endsWith('.jpg') || content.name.endsWith('.jpeg')) mimeType = 'image/jpeg';
        }

        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
        parts.push({ text: promptText });
    } else {
        parts.push({ text: `${promptText}\n\nOriginal Text:\n"${typeof content === 'string' ? content.substring(0, 25000) : ''}"` });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            polishedText: { type: Type.STRING },
            overallComment: { type: Type.STRING },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  original: { type: Type.STRING },
                  revised: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Grammar', 'Vocabulary', 'Tone', 'Structure'] },
                },
              },
            },
          },
        },
      },
    });

    const res = JSON.parse(response.text || 'null');
    // Sanitize response
    if (res && !Array.isArray(res.changes)) {
        res.changes = [];
    }
    // Add IDs if missing
    if (res && res.changes) {
        res.changes = res.changes.map((c: any, i: number) => ({
            ...c,
            id: c.id || `change-${Date.now()}-${i}`,
            status: 'pending' // Default status
        }));
    }
    
    return { ...res, versionId: Date.now() };
  } catch (error) {
    console.error("Gemini Polish Error:", error);
    return null;
  }
};

export const refinePolish = async (
    currentText: string,
    instruction: string,
    lang: Language
): Promise<PolishResult | null> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `
        You are an academic editor refining a previous polish.
        Current Text: "${currentText.substring(0, 20000)}"
        
        User Instruction: "${instruction}"
        
        Task: Apply the user's specific instruction to the text.
        ${getLangInstruction(lang)}
        
        Return JSON with the NEW full text and the NEW changes list (only relating to this refinement).
        `;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        polishedText: { type: Type.STRING },
                        overallComment: { type: Type.STRING },
                        changes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    original: { type: Type.STRING },
                                    revised: { type: Type.STRING },
                                    reason: { type: Type.STRING },
                                    category: { type: Type.STRING, enum: ['Grammar', 'Vocabulary', 'Tone', 'Structure'] },
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const res = JSON.parse(response.text || 'null');
         if (res && res.changes) {
            res.changes = res.changes.map((c: any, i: number) => ({
                ...c,
                id: c.id || `refine-${Date.now()}-${i}`,
                status: 'pending'
            }));
        }
        return { ...res, versionId: Date.now() };
    } catch (error) {
        console.error("Refine Polish Error:", error);
        return null;
    }
}

export const generateAdvisorReport = async (title: string, journal: string, abstract: string, lang: Language = 'EN'): Promise<AdvisorReport | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `You are an academic publishing advisor helping a researcher evaluate if their paper title and abstract fits their target journal.
    ${getLangInstruction(lang)}

    Paper Title: "${title}"
    Abstract: "${abstract}"
    Target Journal: "${journal}"

    TASK:
    Perform a structured analysis.
    1. Match Assessment (Score 1-100) based on scope, relevance, and innovation.
    2. Radar Chart Dimensions (0-100): Topic Relevance, Methodological Fit, Novelty Requirement, Journal Scope Match, Language Style.
    3. Title Optimization: Identify problems and suggest 3 revised options.
    4. Keyword Trends: Analyze key terms in the title/abstract and predict if they are Rising/Stable/Falling in the last 3 years (simulated based on knowledge).
    5. Risk Assessment: Identify potential rejection risks.
    6. Alternatives: Recommend 2-3 alternative journals if the match isn't perfect.
    7. Detailed Suggestions: Provide specific improvements with "Before vs After" examples (e.g. for Methodology description).

    OUTPUT JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            matchLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
            radar: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.NUMBER },
                    method: { type: Type.NUMBER },
                    novelty: { type: Type.NUMBER },
                    scope: { type: Type.NUMBER },
                    style: { type: Type.NUMBER },
                }
            },
            analysis: { type: Type.STRING },
            titleSuggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        issue: { type: Type.STRING },
                        revised: { type: Type.STRING },
                    }
                }
            },
            keywords: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        term: { type: Type.STRING },
                        trend: { type: Type.STRING, enum: ['Rising', 'Stable', 'Falling'] },
                    }
                }
            },
            riskAssessment: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        risk: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    }
                }
            },
            alternatives: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        impactFactor: { type: Type.STRING },
                        reason: { type: Type.STRING },
                    }
                }
            },
            references: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        author: { type: Type.STRING },
                        year: { type: Type.STRING },
                    }
                }
            },
            improvementSuggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        content: { type: Type.STRING },
                        example: { type: Type.STRING },
                    }
                }
            }
          }
        }
      }
    });

    const report = JSON.parse(response.text || '{}');
    return { ...report, timestamp: Date.now() };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generatePaperInterpretation = async (paper: Paper, lang: Language = 'EN'): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    let userContentPart: any = null;
    let textContent = "";

    // Handle Local File Reading (Multimodal or Text extraction)
    if (paper.source === 'local' && paper.file) {
      const mimeType = paper.file.type;
      
      // 1. Image Handling (New)
      if (mimeType.startsWith('image/')) {
        const base64Data = await fileToBase64(paper.file);
        userContentPart = {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        };
        textContent = "[Image uploaded by user. The user requested: 'Generate a detailed description including ALL content in the picture'. You must EXTRACT EVERYTHING visible in the image: All Text, All Data Points, All Chart Titles, Legends, and Diagram details.]";
      }
      // 2. PDF Handling (Native Gemini Support)
      else if (mimeType === 'application/pdf') {
        const base64Data = await fileToBase64(paper.file);
        userContentPart = {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        };
      } 
      // 3. DOCX Handling (Text Extraction via Mammoth)
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || paper.file.name.endsWith('.docx')) {
        try {
           const arrayBuffer = await paper.file.arrayBuffer();
           const result = await mammoth.extractRawText({ arrayBuffer });
           textContent = `[Full Paper Content from ${paper.file.name}]:\n${result.value}`;
        } catch (err) {
           console.error("Mammoth extraction error:", err);
           textContent = `[Error extracting DOCX content. Please verify file integrity.]\nFilename: ${paper.file.name}`;
        }
      }
      // 4. Plain Text / Markdown Handling
      else if (mimeType.startsWith('text/') || paper.file.name.endsWith('.md') || paper.file.name.endsWith('.txt')) {
        const text = await paper.file.text();
        textContent = `[Full Paper Content from ${paper.file.name}]:\n${text}`;
      }
    }

    // Prepare Prompt
    const systemInstruction = `
    You are an AI research assistant. Please provide a concise, professional interpretation of the paper or content in Chinese (under 300 words).
    
    CRITICAL INSTRUCTION FOR IMAGES:
    If the input is an image, you must perform FULL CONTENT EXTRACTION as requested by "including all in the picture". 
    Do not summarize vaguely. List specific numbers, labels, and text found in the image.

    REQUIRED OUTPUT FORMAT (Markdown):
    
    ## 论文/图片 基本信息
    • 标题/主题: "${paper.title}"
    • 作者: ${paper.authors.join(', ')} (or infer from content)
    • 发表: ${paper.journal} ${paper.year}

    ## 核心内容解析
    • 研究问题: [1-2 sentences]
    • 关键细节 (Image Extraction):
      - [Extracted Text 1]
      - [Extracted Data 1]
    • 主要发现:
      - [Finding/Visual Detail 1]
      - [Finding/Visual Detail 2]

    ## 创新价值
    • 理论: [Theoretical contribution]
    • 实践: [Practical significance]

    ## 局限与展望
    • 不足: [Limitation]
    • 方向: [Future direction]
    `;

    const parts = [];
    // If we have a file part (PDF/Image), add it
    if (userContentPart) {
      parts.push(userContentPart);
    }
    // Add text prompt (and text content if extracted from docx/txt)
    parts.push({
      text: `${systemInstruction}\n\n${textContent}`
    });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
    });

    return response.text || "无法生成解读。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "解读服务暂时不可用，请检查网络设置或文件格式。";
  }
};

// New Service: Generate PPT Style Suggestions
export const generatePPTStyleSuggestions = async (file: File, lang: Language): Promise<any[]> => {
  try {
    const model = 'gemini-2.5-flash';
    const base64Data = await fileToBase64(file);
    let mimeType = file.type;
    
    if (mimeType.startsWith('image/')) {
        // keep image mimetype
    } else {
        mimeType = 'application/pdf'; // fallback default for docs passed to this specific endpoint usually
    }

    const prompt = `Analyze this academic content (Paper PDF or Image). 
    Suggest 3 distinct visual presentation styles suitable for presenting this specific content.
    ${getLangInstruction(lang)}
    
    Return a JSON array of objects with:
    - id: string (unique)
    - name: string (Style Name)
    - description: string (Why it fits this paper)
    - colorPalette: string[] (Array of 3 hex codes)
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("PPT Style Gen Error:", error);
    // Fallback mocks
    return [
      { id: 'academic', name: 'Academic Clean', description: 'Standard, professional layout focusing on clarity.', colorPalette: ['#1e3a8a', '#ffffff', '#f1f5f9'] },
      { id: 'modern', name: 'Modern Minimal', description: 'Sleek typography and whitespace for high impact.', colorPalette: ['#18181b', '#f4f4f5', '#a1a1aa'] },
      { id: 'tech', name: 'Tech & Innovation', description: 'Bold colors suitable for engineering or CS topics.', colorPalette: ['#0f172a', '#3b82f6', '#10b981'] }
    ];
  }
};

// New Service: Generate PPT Content Slides
export const generatePPTContent = async (
  file: File, 
  config: { name: string; school: string; density: string; pages: number; style: string },
  lang: Language
): Promise<any> => {
  try {
    const model = 'gemini-2.5-flash';
    const base64Data = await fileToBase64(file);
    let mimeType = file.type;
     if (!mimeType.startsWith('image/')) {
        mimeType = 'application/pdf'; 
    }

    const prompt = `Create a presentation outline for this uploaded content (PDF or Image).
    
    User Settings:
    - Presenter: ${config.name} (${config.school})
    - Density: ${config.density}
    - Target Slide Count: ~${config.pages} pages
    - Style Theme: ${config.style}
    
    CRITICAL INSTRUCTIONS:
    1. If the input is an IMAGE, you MUST extract ALL text, data points, and describe any diagrams/charts in the generated slides. The user wants "Generate a comprehensive presentation including ALL details in the picture".
    2. **VISUAL FOCUS:** The user wants "Pictures not just text". 
       - Propose layouts that are visual (e.g., "ImageWithText", "SplitScreen", "DiagramFocused").
       - In 'content', keep text as concise bullet points.
       - Add a 'visualSuggestion' field to each slide describing what image/diagram should go there (referencing the uploaded image if applicable).
    
    ${getLangInstruction(lang)}

    Output strictly in JSON format:
    {
      "title": "Main Presentation Title",
      "slides": [
        {
          "title": "Slide Title",
          "layout": "TitleOnly" | "BulletPoints" | "TwoColumn" | "ImageWithText" | "DiagramFocused",
          "content": ["Point 1", "Point 2"],
          "visualSuggestion": "Description of visual to include (e.g. 'Show the main architecture diagram from the source image')",
          "speakerNotes": "Notes for the presenter..."
        }
      ]
    }
    
    IMPORTANT: 'content' must be an Array of STRINGS.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("PPT Content Gen Error:", error);
    return { title: "Error Generating PPT", slides: [] };
  }
};

export const generateSlideImage = async (prompt: string, style: string): Promise<string | null> => {
  try {
    // Nano banana model
    const model = 'gemini-2.5-flash-image';
    const finalPrompt = `Create a professional presentation slide illustration. 
    Subject: ${prompt}. 
    Style: ${style}. 
    Do not include text in the image if possible.`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: finalPrompt }]
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
  } catch (error) {
    console.error("Slide Image Gen Error:", error);
    return null;
  }
}

export const generateResearchIdeas = async (topic: string, lang: Language = 'EN', focus: string = 'General'): Promise<IdeaGuideResult | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Role: Senior Academic Research Mentor.
    Task: The user is interested in "${topic}". Help them brainstorm research directions.
    Context Focus: The user wants a "${focus}" approach (e.g., if 'Data-Driven', emphasize datasets; if 'Policy', emphasize implications).
    ${getLangInstruction(lang)}
    
    Please provide:
    1. 3 distinct, innovative research directions/angles based on this topic. 
       - For each, provide specific **Methodologies** (e.g., DID, Transformer, Grounded Theory).
       - Provide specific **Data Sources** (e.g., CFPS, ImageNet, Interviews).
       - Suggest 2 potential paper titles.
       - List 3 "Core Papers" (Seminal or recent high-impact works) that they MUST read to start this direction.
    2. 3 suitable academic journals for this field. 
       - Provide **Review Cycle** (e.g., "3 months") and **Acceptance Rate** (e.g., "15%") estimates.
       - Provide impact factor estimate.

    Output as JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  angle: { type: Type.STRING },
                  description: { type: Type.STRING },
                  methodology: { type: Type.STRING, description: "Specific models or qualitative methods" },
                  dataSources: { type: Type.STRING, description: "Specific datasets or collection methods" },
                  recommendedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                  corePapers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        author: { type: Type.STRING },
                        year: { type: Type.STRING },
                      }
                    }
                  }
                }
              }
            },
            journals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  impactFactor: { type: Type.STRING },
                  reviewCycle: { type: Type.STRING },
                  acceptanceRate: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const res = JSON.parse(response.text || 'null');
    return res;
  } catch (error) {
    console.error("Idea Guide Error:", error);
    return null;
  }
};

export const generateIdeaFollowUp = async (
  topic: string, 
  direction: string, 
  followUp: string, 
  lang: Language = 'EN'
): Promise<IdeaFollowUpResult | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Role: Expert Research Mentor.
    Context: 
    - Main Topic: "${topic}"
    - Selected Direction: "${direction}"
    - User's Specific Question/Focus: "${followUp}"
    
    Task: Provide a deep-dive analysis and actionable advice.
    ${getLangInstruction(lang)}
    
    Output JSON with:
    1. Analysis (A paragraph analyzing this specific intersection).
    2. Logic Path (An array of strings representing the causal chain or framework steps, e.g., ["IV: Policy", "Mechanism: Cost", "DV: Adoption"]).
    3. Suggestions (3 specific sub-angles or methodological approaches).
    4. RecommendedTerms (5 search keywords).
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            logicPath: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                }
              }
            },
            recommendedTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Idea Follow Up Error:", error);
    return null;
  }
}

export const generateOpeningReview = async (
  file: File, 
  target: string, 
  lang: Language,
  persona: ReviewPersona = 'Gentle'
): Promise<OpeningReviewResponse | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const base64Data = await fileToBase64(file);
    let mimeType = file.type;
    
    if (!mimeType || mimeType === '') {
      mimeType = 'application/pdf';
    }

    const personaInstruction = persona === 'Critical' 
      ? 'Adopt a "Reviewer #2" persona: Be strict, challenge assumptions, look for fatal flaws, and be ruthless about methodology and theoretical contribution.' 
      : 'Adopt a "Mentor" persona: Be encouraging, constructive, focus on potential, and guide gently.';

    const prompt = `
    Role: Senior Thesis Committee Member / Academic Advisor.
    Task: Review the uploaded "Opening Report/Research Proposal".
    Context: The user is aiming for: "${target}" (Target Journal or Graduation Requirement).
    Persona: ${personaInstruction}

    ${getLangInstruction(lang)}

    CRITICAL OUTPUT INSTRUCTION: Return a JSON object with the following structure.
    
    Radar Map Scoring (0-100):
    - topic: Heat/Relevance of the topic.
    - method: Rigor and difficulty of methodology.
    - data: Quality and uniqueness of data source.
    - theory: Depth of theoretical contribution.
    - language: Academic writing standard.

    Analysis:
    - titleAnalysis: Critique the title and provide 3 concrete suggestions.
    - methodologyAnalysis: Critique feasibility and provide 3 concrete improvements (suggest specific variables, models, or formulas).
    - logicAnalysis: Identify logical gaps.
    - journalFit: Score (1-10) and analyze fit. If score < 6, suggest 3 alternative journals.
    - formatCheck: Check for basic compliance (Abstract structure, Reference style consistency).
    - literature: Recommend 3-5 specific papers.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            radarMap: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.NUMBER },
                method: { type: Type.NUMBER },
                data: { type: Type.NUMBER },
                theory: { type: Type.NUMBER },
                language: { type: Type.NUMBER },
              }
            },
            executiveSummary: { type: Type.STRING },
            titleAnalysis: {
              type: Type.OBJECT,
              properties: {
                critique: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            methodologyAnalysis: {
              type: Type.OBJECT,
              properties: {
                critique: { type: Type.STRING },
                suggestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      better: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    }
                  }
                }
              }
            },
            logicAnalysis: {
              type: Type.OBJECT,
              properties: {
                critique: { type: Type.STRING },
                gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            journalFit: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                analysis: { type: Type.STRING },
                alternativeJournals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      if: { type: Type.STRING },
                    }
                  }
                }
              }
            },
            formatCheck: {
               type: Type.OBJECT,
               properties: {
                 status: { type: Type.STRING, enum: ['Pass', 'Warning', 'Fail'] },
                 issues: { type: Type.ARRAY, items: { type: Type.STRING } }
               }
            },
            literature: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  author: { type: Type.STRING },
                  year: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  link: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Opening Review Error:", error);
    return null;
  }
};

export const optimizeOpeningSection = async (
  sectionContext: string,
  contentToOptimize: string,
  lang: Language = 'EN'
): Promise<string> => {
   try {
     const model = 'gemini-2.5-flash';
     const prompt = `
     You are an academic writing coach.
     Context: The user needs to improve the "${sectionContext}" section of their research proposal.
     Critique to address: "${contentToOptimize}"
     
     Task: Rewrite the relevant paragraph/sentence to be more academic, logical, and rigorous.
     ${getLangInstruction(lang)}
     
     Output ONLY the rewritten text.
     `;

     const response = await ai.models.generateContent({
       model,
       contents: prompt,
     });

     return response.text || "Failed to optimize.";
   } catch (error) {
      return "Optimization failed.";
   }
}
