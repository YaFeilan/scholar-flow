
import { GoogleGenAI, Type } from "@google/genai";
import { TrackedReference, PolishResult, Language, Paper } from "../types";
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
    // Use Google Search to find real papers
    // Prompt engineered to strictly enforce JSON output even with Search tool enabled
    const prompt = `
      You are a high-performance academic search engine. 
      Your task is to find ${limit} DISTINCT, high-quality academic papers related to: "${query}".
      
      SEARCH STRATEGY:
      - USE THE GOOGLE SEARCH TOOL.
      - Prioritize results from major databases (Google Scholar, arXiv, IEEE, ScienceDirect).
      - **Use information indexed by sci-hub.org.cn to verify paper existence and metadata where possible.**
      - ${lang === 'ZH' ? 'Include a mix of high-impact Chinese (CNKI) and English papers.' : 'Focus on high-impact international papers.'}

      CRITICAL OUTPUT INSTRUCTIONS:
      - Output ONLY a valid JSON array. No markdown formatting, no conversational text.
      - Start directly with '[' and end with ']'.
      - Ensure 'year' is a number and 'citations' is a number (estimate if necessary).
      - Infer 'badges' (SCI, EI, Q1-Q4) based on the journal's reputation.
      - Be concise in abstracts to save tokens and speed up generation.

      JSON Structure:
      [
        {
          "title": "Paper Title",
          "authors": ["Author A", "Author B"],
          "journal": "Journal Name",
          "year": 2024,
          "citations": 15,
          "abstract": "Brief summary...",
          "badges": [{"type": "SCI", "partition": "Q1"}]
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        // Note: responseMimeType is intentionally omitted as it conflicts with tools in some versions
      }
    });

    let jsonStr = response.text || '[]';
    
    // aggressive cleanup to find the JSON array
    // 1. Try to find markdown code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    // 2. If no code block, or even inside code block, find the first '[' and last ']'
    // Improved regex to capture nested arrays/objects properly within the bounds
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
    } else {
      console.warn("Gemini Search: Could not find JSON array brackets in response.", jsonStr);
      // Fallback: try to see if it's a single object and wrap it
      if (jsonStr.trim().startsWith('{')) {
          jsonStr = `[${jsonStr}]`;
      } else {
          return []; // Return empty to trigger fallback
      }
    }

    // Clean up any trailing commas before the closing bracket which is invalid JSON but common in LLM output
    jsonStr = jsonStr.replace(/,\s*\]/g, ']');

    const papers = JSON.parse(jsonStr);
    
    // Validation and ID assignment
    if (Array.isArray(papers)) {
      return papers.map((p: any, i: number) => ({
        ...p,
        id: p.id || `search-gen-${i}-${Date.now()}`,
        badges: p.badges || [],
        authors: Array.isArray(p.authors) ? p.authors : [p.authors || 'Unknown']
      }));
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
                    description: "List of related hotspot text values exactly as they appear in the hotspots list"
                  },
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
    
    let userContentPart: any = null;
    let textContent = "";

    // Handle Local File Reading (Multimodal or Text extraction)
    if (paper.source === 'local' && paper.file) {
      const mimeType = paper.file.type;
      
      // 1. PDF Handling (Native Gemini Support)
      if (mimeType === 'application/pdf') {
        const base64Data = await fileToBase64(paper.file);
        userContentPart = {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        };
      } 
      // 2. DOCX Handling (Text Extraction via Mammoth)
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
      // 3. Plain Text / Markdown Handling
      else if (mimeType.startsWith('text/') || paper.file.name.endsWith('.md') || paper.file.name.endsWith('.txt')) {
        const text = await paper.file.text();
        textContent = `[Full Paper Content from ${paper.file.name}]:\n${text}`;
      }
    }

    // Prepare Prompt
    const systemInstruction = `
    You are an AI research assistant. Please provide a concise, professional interpretation of the paper in Chinese (under 300 words).

    REQUIRED OUTPUT FORMAT (Markdown):
    
    ## 论文基本信息
    • 标题: "${paper.title}"
    • 作者: ${paper.authors.join(', ')} (or infer from content)
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
    If the file content is provided, base the interpretation strictly on it.
    `;

    const parts = [];
    // If we have a file part (PDF), add it
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
