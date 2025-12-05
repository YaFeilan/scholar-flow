
import { GoogleGenAI, Type } from "@google/genai";
import { TrackedReference, PolishResult, Language, Paper, IdeaGuideResult, IdeaFollowUpResult, PeerReviewResponse, TargetType } from "../types";
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

    const res = JSON.parse(response.text || '[]');
    if (!Array.isArray(res)) return [];
    // Ensure inner papers are also arrays
    return res.map((item: any) => ({
        ...item,
        papers: Array.isArray(item.papers) ? item.papers : []
    }));
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const polishContent = async (content: string | File, lang: Language = 'EN'): Promise<PolishResult | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const instruction = getLangInstruction(lang);
    
    const promptText = `Act as a professional academic editor. 
    Polish the provided content to improve its academic tone, clarity, and flow. 
    ${instruction}
    Identify specific areas for improvement (Grammar, Vocabulary, Tone, or Structure) and explain why.
    
    If the content is a full paper or long document, focus on improving the Abstract, Introduction, and Conclusion, or provide a representative polish of the key sections.
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
        parts.push({ text: `${promptText}\n\nOriginal Text:\n"${content.substring(0, 25000)}"` });
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
    return res;
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
      
      // 1. Image Handling (New)
      if (mimeType.startsWith('image/')) {
        const base64Data = await fileToBase64(paper.file);
        userContentPart = {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        };
        textContent = "[Image uploaded by user. The user requested: 'Generate a including all in the picture'. You must EXTRACT EVERYTHING visible in the image: All Text, All Data Points, All Chart Titles, Legends, and Diagram details.]";
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
    1. If the input is an IMAGE, you MUST extract ALL text, data points, and describe any diagrams/charts in the generated slides. The user wants "Generate a including all in the picture".
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

export const generateResearchIdeas = async (topic: string, lang: Language = 'EN'): Promise<IdeaGuideResult | null> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Role: Senior Academic Research Mentor.
    Task: The user is interested in "${topic}". Help them brainstorm research directions.
    ${getLangInstruction(lang)}
    
    Please provide:
    1. 3 distinct, innovative research directions/angles based on this topic. For each, suggest 2 potential paper titles.
    2. 3 suitable academic journals for this field. Provide an estimated impact factor and a brief reason why it fits.

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
                  recommendedTitles: { type: Type.ARRAY, items: { type: Type.STRING } }
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
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const res = JSON.parse(response.text || 'null');
    // Sanitize response
    if (res) {
        if (!Array.isArray(res.directions)) res.directions = [];
        if (!Array.isArray(res.journals)) res.journals = [];
    }
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
    2. Suggestions (3 specific sub-angles or methodological approaches).
    3. RecommendedTerms (5 search keywords for databases like Scopus/Web of Science).
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
              items: { type: Type.STRING }
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

export const generateOpeningReview = async (file: File, target: string, lang: Language): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const base64Data = await fileToBase64(file);
    let mimeType = file.type;
    
    // Default to PDF if generic or unknown, as this feature targets PDF proposals
    if (!mimeType || mimeType === '') {
      mimeType = 'application/pdf';
    }

    const prompt = `
    Role: Senior Thesis Committee Member / Academic Advisor.
    Task: Review the uploaded "Opening Report/Research Proposal".
    Context: The user is aiming for: "${target}" (Target Journal or Graduation Requirement).

    ${getLangInstruction(lang)}

    CRITICAL ANALYSIS POINTS:
    1. **Title Analysis**: Is it specific, concise, and academic? Does it reflect the content?
    2. **Methodology Check**: Are the proposed methods feasible? Are they state-of-the-art? Is the technical path clear?
    3. **Logic & Flow (思路)**: Is there a clear problem definition? Does the solution logically follow the problem? Is there a hypothesis?
    4. **Target Alignment**: Does this proposal meet the standards of "${target}"?
    5. **Literature Check**: Based on the content, suggest relevant classic or state-of-the-art papers they might have missed or should reference.

    OUTPUT FORMAT (Strict Markdown for Report Generation):

    # Opening Proposal Review Report
    **Target Goal**: ${target}
    **Date**: ${new Date().toLocaleDateString()}

    ## 1. Executive Summary
    [Brief assessment of the proposal's readiness (Pass/Major Revisions/Minor Revisions)]

    ## 2. Title Evaluation
    - **Current Status**: [Critique]
    - **Suggestion**: [Optimization advice]

    ## 3. Methodology & Logic Review
    - **Feasibility**: [Analysis]
    - **Logic Gaps**: [Identify any logical disconnects in the research plan]
    - **Innovation**: [Assess the novelty]

    ## 4. Alignment with Target (${target})
    - **Fit Score**: [1-10]
    - **Gap Analysis**: [What is missing to reach this target?]

    ## 5. Specific Recommendations
    1. [Actionable item 1]
    2. [Actionable item 2]
    3. [Actionable item 3]

    ## 6. Recommended Literature
    [Suggest 3-5 specific papers formatted as follows]
    - **[Title]** (Year), Author
      > *Relevance*: [Why they should read this]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    return response.text || "Failed to generate opening review.";
  } catch (error) {
    console.error("Opening Review Error:", error);
    return "Error generating review. Please ensure the file is a valid PDF.";
  }
};
