import { GoogleGenAI, Type } from "@google/genai";
import { TrackedReference, PolishResult, Language, Paper } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLangInstruction = (lang: Language) => {
  return lang === 'ZH' ? 'Respond in Simplified Chinese.' : 'Respond in English.';
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

export const performPeerReview = async (content: string, filename: string, lang: Language = 'EN'): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Role: Senior Domain Expert & Peer Reviewer.
    Task: Review the provided academic paper content ("${filename}") and generate a structured review report.
    ${getLangInstruction(lang)}
    
    Evaluation Criteria:
    1. Innovation (Originality of views/methods)
    2. Methodology Feasibility (Logic and data reliability)
    3. Reference Authenticity (Reality of citations)
    
    Output Format (Strict Markdown):
    
    ## Summary
    [Summarize core value and main issues in under 50 words]

    ## Ratings
    - Academic Rigor: [1-5 stars, e.g. ★★★★☆]
    - Practical Application: [1-5 stars]
    - Readability: [1-5 stars]

    ## Recommendations
    [List 3-5 specific issues using the format below]
    1. **[Problem Description]**
       → Suggestion: [Specific revision advice]
    2. **[Problem Description]**
       → Suggestion: [Specific revision advice]
    
    Content to Review:
    "${content.substring(0, 15000)}" 
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Failed to generate peer review.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating peer review.";
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
                },
              },
            },
          },
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateStructuredReview = async (
  topic: string, 
  papers: string[], 
  wordCount: number, 
  language: string // This tracks the user setting in the review generator specifically (ZH/EN)
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
    Identify 5-8 distinct Technical Categories of references used in this paper (e.g., "Theoretical Foundation", "Dataset", "Baselines", "Optimization Methods").
    For each category, list 2-3 likely or actual papers that would be cited, including a brief description of their technical role in the context of the main paper.
    
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
                  },
                },
              },
            },
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const polishContent = async (content: string, lang: Language = 'EN'): Promise<PolishResult | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Act as a professional academic editor. 
    Polish the following text to improve its academic tone, clarity, and flow. 
    ${getLangInstruction(lang)}
    Identify specific areas for improvement (Grammar, Vocabulary, Tone, or Structure) and explain why.
    
    Original Text:
    "${content.substring(0, 10000)}"
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

    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateAdvisorReport = async (title: string, journal: string, lang: Language = 'EN'): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `You are an academic publishing advisor helping a researcher evaluate if their paper title fits their target journal.
    ${getLangInstruction(lang)}

    Paper Title: "${title}"
    Target Journal: "${journal}"

    TASK:
    Perform a structured analysis and output the report in strict Markdown format as defined below.

    1. Match Assessment (1-5 Stars) based on scope, relevance, and innovation. Explain reasoning.
    2. Title Optimization: Identify 3 problems with the current title and suggest 3 better alternatives.
    3. Supplementary Advice: List 3 recent relevant papers from this journal (make up realistic titles if needed based on the journal's field) and suggest any necessary methodological additions.

    OUTPUT FORMAT:
    ### Periodical Match Report: 《${journal}》
    **Match Score**: ⭐️⭐️⭐️⭐️ (Rating/5)
    **Basis**: [Explanation under 200 words]

    **Title Improvement Suggestions**:
    - **Issue 1**: [Description]
    - **Revised Option 1**: [Title]
    - **Issue 2**: [Description]
    - **Revised Option 2**: [Title]
    - **Issue 3**: [Description]
    - **Revised Option 3**: [Title]

    **Reference Papers (Recent Issue)**:
    1. [Paper Title 1]
    2. [Paper Title 2]
    3. [Paper Title 3]

    **Additional Suggestions**: [Advice on content/methods]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Failed to generate advisor report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating advisor report. Please try again.";
  }
};

export const generatePaperInterpretation = async (paper: Paper, lang: Language = 'EN'): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    // Instructions are always in Chinese as requested by user ("请用简洁、专业的中文")
    const prompt = `
    You are an AI research assistant. Please provide a concise, professional interpretation of the following paper in Chinese (under 300 words).

    PAPER INFORMATION:
    Title: ${paper.title}
    Authors: ${paper.authors.join(', ')}
    Journal: ${paper.journal}
    Year: ${paper.year}
    Abstract: ${paper.abstract || 'Not provided'}

    REQUIRED OUTPUT FORMAT (Markdown):
    
    ## 论文基本信息
    • 标题: "${paper.title}"
    • 作者: ${paper.authors[0]} 等
    • 发表: ${paper.journal} ${paper.year}

    ## 核心内容
    • 研究问题: [1-2 sentences]
    • 研究方法:
      - [Method Point 1]
      - [Method Point 2]
    • 主要发现:
      - [Finding 1]
      - [Finding 2]
      - [Finding 3]

    ## 创新价值
    • 理论: [Theoretical contribution]
    • 实践: [Practical significance]

    ## 局限与展望
    • 不足: [Limitation]
    • 方向: [Future direction]

    Keep English terms for key technical concepts but provide Chinese annotations.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "无法生成解读。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "解读服务暂时不可用，请检查网络设置。";
  }
};