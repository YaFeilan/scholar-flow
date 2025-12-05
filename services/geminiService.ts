
import { GoogleGenAI, Type } from "@google/genai";
import { TrackedReference, PolishResult, Language, Paper, IdeaGuideResult, IdeaFollowUpResult } from "../types";
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
        authors: Array.isArray(p.authors) ? p.authors : [p.authors || 'Unknown'],
        addedDate: p.addedDate || new Date().toISOString().split('T')[0]
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
        // Basic fallback for common types if type is missing or generic
        if (!mimeType || mimeType === '') {
            if (content.name.endsWith('.pdf')) mimeType = 'application/pdf';
            else if (content.name.endsWith('.png')) mimeType = 'image/png';
            else if (content.name.endsWith('.jpg') || content.name.endsWith('.jpeg')) mimeType = 'image/jpeg';
        }

        // Only PDF and Image types are supported for inlineData in this context
        // For text files passed as File, we should ideally read them, but here we assume PDF/Image
        // if the component passed a File.
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

    return JSON.parse(response.text || 'null');
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
