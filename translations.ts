
export const TRANSLATIONS = {
  EN: {
    appName: 'Research Assistant',
    groups: {
      planning: '1. Selection & Planning',
      experiment: '2. Experiment & Data',
      writing: '3. Writing & Polish',
      publish: '4. Publication'
    },
    nav: { 
      search: 'Search', 
      review: 'Review Gen', 
      track: 'Tracking', 
      trends: 'Trends', 
      advisor: 'Advisor', 
      peer: 'Peer Review', 
      polish: 'Polish', 
      ppt: 'PPT Gen', 
      idea: 'Idea Guide', 
      opening: 'Opening Review',
      data: 'Data Analyst',
      code: 'Code Assistant',
      experimentDesign: 'Exp. Design',
      pdfChat: 'AI Paper Guide',
      knowledge: 'Knowledge Graph',
      figure: 'Sci-Figure Gen',
      chart: 'Chart Extractor',
      grant: 'Grant Helper' // New
    },
    search: { 
      title: 'Research Assistant', 
      subtitle: 'Search and select papers to generate a structured academic review.', 
      placeholder: 'Search academic literature...', 
      btn: 'Search', 
      filters: { db: 'Databases', time: 'Time Range', partition: 'JCR/CAS Partition', custom: 'Custom', allTime: 'All Time', resultCount: 'Result Count' }, 
      sort: { label: 'Sort By', relevance: 'Relevance', date: 'Date', if: 'Impact Factor' },
      results: 'Relevant Results',
      smartReview: 'Smart Review',
      smartReviewDesc: 'Generate structured academic reviews instantly based on selected literature.',
      generateBtn: 'Generate Review →',
      topicAnalysis: 'Topic Analysis',
      topJournals: 'Top Journals',
      paperDetails: 'Paper Details',
      download: 'Download PDF',
      interpret: 'AI Interpret',
      interpreting: 'Interpreting...',
      interpretationResult: 'AI Interpretation Result',
      source: { online: 'Online Search', local: 'Local Library' },
      upload: { btn: 'Upload Folder / Files / Images', tip: 'Support PDF, Word (.docx), Images (.jpg/.png), TXT, MD', drag: 'Click to select folder or drag files here' },
      batchInterpret: 'Batch Interpret',
      localBadge: 'LOCAL FILE'
    },
    trends: {
      title: 'Trend Analyzer',
      subtitle: 'Enter a research field to analyze emerging methodologies and hotspots.',
      placeholder: 'e.g. Quantum Computing...',
      analyze: 'Analyze',
      emerging: 'Emerging Tech',
      hotspots: 'Research Hotspots',
      methodologies: 'Methodology Rankings',
      yoy: 'YoY Growth',
      keywordStats: 'Keyword Frequency Stats',
      frequency: 'Frequency',
      extracting: 'Extracting Keywords...',
      relatedPapers: 'Related Recent Papers',
      noPapers: 'No recent papers found for this topic.',
      generateIdeas: 'Generate Research Ideas'
    },
    peer: {
      title: 'AI Peer Reviewer',
      subtitle: 'Simulate a senior expert review process. Check for innovation, methodology feasibility, and reference authenticity.',
      uploadTitle: 'Upload Manuscript',
      uploadDesc: 'PDF, Word, or Text files supported',
      contentLabel: 'Paper Content / Abstract',
      startBtn: 'Start 3-Way Review',
      pending: 'Review Pending',
      pendingDesc: 'Upload a document to receive a comprehensive evaluation from our AI expert panel.',
      targetLabel: 'Target / Level',
      journalLabel: 'Target Journal (Optional)',
      rebuttalBtn: 'Draft Rebuttal Letter',
      coverLetterBtn: 'Draft Cover Letter',
      checklist: 'Pre-submission Checklist',
      targets: {
        SCI: 'SCI/EI (Science & Eng)',
        SSCI: 'SSCI (Social Science)',
        Coursework: 'Coursework / Assignment'
      }
    },
    review: {
      steps: { 1: 'Search Strategy', 2: 'Select Papers', 3: 'Configuration', 4: 'Result' },
      scopeTitle: 'Define Review Scope',
      topicLabel: 'Research Direction / Keywords',
      dbLabel: 'Databases',
      timeLabel: 'Time Range',
      searchBtn: 'Search Literature',
      selectTitle: 'Select Literature',
      configTitle: 'Output Configuration',
      wordCount: 'Word Count Target',
      langLabel: 'Output Language',
      genBtn: 'Generate Review',
      complete: 'Generation Complete'
    },
    track: {
      title: 'Citation Network Tracker',
      subtitle: 'Analyze and classify the reference landscape. Identify methodologies, datasets, and baselines.',
      tabSearch: 'Title Search',
      tabUpload: 'File Upload',
      placeholder: 'Enter paper title...',
      btn: 'Track',
      dragDrop: 'Click to upload or drag and drop',
      resultsTitle: 'Citation Classification'
    },
    polish: {
      title: 'Academic English Polish',
      subtitle: 'Enhance the clarity, tone, and grammar of your academic writing.',
      tabText: 'Text Input',
      tabFile: 'File Upload',
      placeholder: 'Paste your abstract or paragraph here...',
      btn: 'Start Polish',
      revisionNotes: 'Changes',
      outputTitle: 'Polished Output',
      feedback: 'Overall Feedback',
      config: {
        mode: 'Task Mode',
        tone: 'Style / Tone',
        field: 'Discipline',
        glossary: 'Locked Terms (Glossary)',
        modes: { EnToEn: 'English Polish', CnToEn: 'Chinese -> English', EnToCn: 'English -> Chinese' },
        tones: { Academic: 'Academic Formal', Native: 'Native Speaker', Concise: 'Concise', Paraphrase: 'Paraphrase' },
        fields: { General: 'General', Medicine: 'Medicine', CS: 'Computer Science', SocialSciences: 'Social Sciences', Engineering: 'Engineering', Economics: 'Economics' }
      },
      control: {
        diffView: 'Diff View',
        cleanView: 'Clean',
        accept: 'Accept',
        reject: 'Reject',
        chatPlaceholder: 'e.g. "Make the second sentence more concise"',
        export: 'Export w/ Revisions',
        version: 'Ver'
      }
    },
    advisor: {
      title: 'Publication Advisor',
      subtitle: 'Evaluate your manuscript\'s fit for target journals and get title optimization suggestions.',
      paperTitle: 'Paper Title',
      journalTitle: 'Target Journal',
      paperAbstract: 'Abstract',
      abstractPlaceholder: 'Paste abstract here for better context analysis...',
      btn: 'Evaluate Match',
      reportTitle: 'Evaluation Report',
      history: 'History',
      apply: 'Apply',
      radar: {
         topic: 'Topic',
         method: 'Method',
         novelty: 'Novelty',
         scope: 'Scope',
         style: 'Style'
      },
      risks: 'Submission Risks',
      alternatives: 'Alternative Journals'
    },
    ppt: {
      title: 'AI PPT Generator',
      subtitle: 'Turn your PDF research paper into a presentation in 4 steps.',
      steps: { 1: 'Upload & Info', 2: 'Configuration', 3: 'Style Selection', 4: 'Generation' },
      uploadLabel: 'Upload PDF Paper',
      nameLabel: 'Your Name',
      schoolLabel: 'School / Affiliation',
      densityLabel: 'Information Density',
      densityLow: 'Simple (Key Points)',
      densityHigh: 'Rich (Detailed)',
      pagesLabel: 'Number of Slides',
      styleBtn: 'Analyze Content & Suggest Styles',
      genBtn: 'Generate Presentation',
      downloadBtn: 'Download Slides (Markdown)',
      generating: 'Generating Slides...',
      analyzing: 'Analyzing PDF style...'
    },
    idea: {
      title: 'Research Idea Guide',
      subtitle: 'Brainstorm research directions, specific data sources, core papers, and suitable journals.',
      inputLabel: 'What are you interested in?',
      placeholder: 'e.g., The application of Large Language Models in medical diagnosis...',
      btn: 'Generate Ideas',
      directions: 'Research Directions',
      journals: 'Recommended Journals',
      generating: 'Brainstorming Ideas...',
      titles: 'Suggested Titles',
      selectDirection: 'Select & Dig Deeper',
      followUpPlaceholder: 'e.g., I want to focus on consumer behavior aspects...',
      followUpBtn: 'Get Specific Advice',
      deepDive: 'Deep Dive Analysis',
      keywords: 'Search Keywords',
      methodology: 'Methodology',
      dataSources: 'Data Sources',
      corePapers: 'Core References',
      exportProposal: 'Export Proposal Draft',
      logicFlow: 'Logic Framework',
      focus: {
        label: 'Focus:',
        general: 'General',
        data: 'Data-Driven',
        policy: 'Policy/Impact',
        theory: 'Theory-Heavy'
      }
    },
    opening: {
      title: 'Opening Proposal Review',
      subtitle: 'Evaluate your research proposal logic, methodology, and journal alignment.',
      uploadTitle: 'Upload Proposal',
      uploadDesc: 'Upload your opening report (PDF) for analysis.',
      targetLabel: 'Target Journal / Research Goal',
      targetPlaceholder: 'e.g. IEEE TPAMI, or Ph.D. graduation requirement',
      btn: 'Start Review',
      analyzing: 'Analyzing Proposal...',
      reportTitle: 'Review Report',
      download: 'Download PDF Report',
      sections: {
        titleCheck: 'Title Analysis',
        methodCheck: 'Methodology Review',
        logicCheck: 'Logic & Flow',
        journalMatch: 'Journal Alignment',
        literatureRec: 'Literature Recommendation'
      }
    },
    data: {
      title: 'Intelligent Data Analyst',
      subtitle: 'Upload CSV/Excel data for automated statistical analysis and model recommendations.',
      upload: 'Upload Data File',
      analyzing: 'Analyzing Data Structure...',
      summary: 'Descriptive Summary',
      correlations: 'Correlations',
      models: 'Recommended Models',
      code: 'Implementation Code',
      columns: 'Variables',
      limitNotice: 'Note: Only the first 50 rows are extracted as a sample for analysis.',
      limitBanner: '⚠️ For rapid processing, the system will only analyze the first 50 rows of data. Results are for reference or data structure validation only.',
      downloadTemplate: 'Download Sample Template',
      previewTitle: 'Data Preview',
      setupTitle: 'Analysis Setup',
      useHeader: 'First row contains column headers',
      targetVar: 'Target Variable (Y)',
      noTarget: 'None (Unsupervised)',
      colName: 'Column Name',
      colType: 'Data Type',
      confirmBtn: 'Confirm & Analyze',
      quickAnalysisBtn: 'Generate Quick Preview (Sample 50)',
      reupload: 'Re-upload',
      cleaning: 'Data Pre-processing',
      cleaningStrategies: {
        auto: 'Auto (AI)',
        drop: 'Drop Rows',
        mean: 'Fill Mean/Mode',
        zero: 'Fill 0/Unknown'
      },
      progress: {
        loading: 'Loading Data...',
        cleaning: 'Handling Missing Values...',
        stats: 'Calculating Statistics...',
        ai: 'AI Modeling & Reasoning...'
      },
      featureImportance: 'Feature Importance',
      exportReport: 'Export Report',
      chatData: 'Chat with Data',
      resultDisclaimer: 'Note: This analysis is generated based on the top 50 sample rows.',
    },
    code: {
      title: 'Code Assistant',
      subtitle: 'Generate, debug, and explain code for Python, R, and MATLAB.',
      mode: 'Task',
      language: 'Language',
      modes: { generate: 'Generate Code', debug: 'Debug/Fix', explain: 'Explain Code' },
      inputPlaceholder: {
        generate: 'Describe what you want the code to do (e.g., "Plot a heatmap of correlations from data.csv")',
        debug: 'Paste your code here for debugging.',
        explain: 'Paste the code you want to understand.'
      },
      btn: 'Run Assistant',
      stopBtn: 'Stop',
      output: 'Assistant Chat',
      history: 'History',
      followUpPlaceholder: 'Ask a follow-up question...',
      upload: 'Upload Code/Data',
      shortcut: 'Ctrl + Enter to Run',
      newSession: 'New Session'
    },
    experimentDesign: {
      title: 'Experiment Design',
      subtitle: 'Design experimental flow and calculate sample size based on research hypotheses.',
      hypothesisLabel: 'Research Hypothesis',
      hypothesisPlaceholder: 'e.g., Using spaced repetition significantly improves long-term memory retention compared to massed practice.',
      optimizeBtn: 'AI 优化',
      optimizing: 'Optimizing...',
      ivLabel: 'Independent Variable (IV)',
      dvLabel: 'Dependent Variable (DV)',
      fieldLabel: 'Research Field',
      methodologyLabel: 'Methodology',
      structureLabel: 'Design Structure',
      btn: 'Generate Protocol',
      generating: 'Designing Experiment...',
      flow: 'Experimental Flow',
      sampleSize: 'Sample Size Calculation',
      variables: 'Key Variables',
      analysis: 'Statistical Analysis Plan',
      advancedSettings: 'Advanced Statistical Settings',
      alpha: 'Significance Level (α)',
      power: 'Statistical Power (1-β)',
      effectSize: 'Expected Effect Size',
      effectSizes: { small: 'Small', medium: 'Medium', large: 'Large', custom: 'Custom' },
      fields: {
        Psychology: 'Psychology',
        Medicine: 'Clinical Medicine',
        Biology: 'Biology',
        CS: 'Computer Science',
        Marketing: 'Marketing/Business',
        Education: 'Education',
        UX: 'User Experience'
      },
      methodologies: {
        Auto: 'Auto-Recommend (AI)',
        RCT: 'Randomized Controlled Trial (RCT)',
        Quasi: 'Quasi-Experiment',
        Survey: 'Survey/Questionnaire',
        CaseStudy: 'Case Study',
        Observational: 'Observational Study'
      },
      structures: {
        Between: 'Between-Subjects',
        Within: 'Within-Subjects',
        Mixed: 'Mixed Design',
        Factorial: 'Factorial Design',
        Longitudinal: 'Longitudinal'
      },
      templates: {
          title: 'Start with a Template',
          subtitle: 'Select a common experimental paradigm to get started quickly.',
          rct: 'Clinical RCT',
          rctDesc: 'Medicine • Between-Subjects',
          ab: 'A/B Testing',
          abDesc: 'UX/Marketing • Between-Subjects',
          memory: 'Cognitive Task',
          memoryDesc: 'Psychology • Within-Subjects'
      }
    },
    pdfChat: {
      title: 'AI Paper Guide',
      subtitle: 'Upload PDF to generate structured reading guides, formula breakdowns, and deep insights.',
      upload: 'Upload PDF',
      dragDrop: 'Drag & Drop PDF here',
      placeholder: 'Ask about this paper (e.g. "What is the main contribution?", "Explain Eq. 3")...',
      analyzing: 'Processing PDF...',
      welcome: 'Document ready. I have generated a structured guide. Ask me anything about details, methodologies, or data.',
      clear: 'Clear Chat',
      themes: { light: 'Light', dark: 'Dark', sepia: 'Eye Care' },
      toggleSidebar: 'Toggle Sidebar',
      chatPanel: 'Chat Panel'
    },
    knowledge: {
      title: 'Personal Knowledge Graph',
      subtitle: 'Visualize your academic library. AI connects dots between papers and your notes.',
      addNote: 'Add Note / Image',
      connect: 'AI Synthesis',
      suggestions: 'AI Insights',
      chatTitle: 'Chat with Library',
      chatPlaceholder: 'Ask based on your library (e.g. Compare Method A & B)...',
      chatWelcome: 'I have context from your library. Ask me to compare papers, summarize themes, or find gaps.',
      gettingSuggestions: 'Thinking...',
      acceptLink: 'Confirm Link',
      acceptNode: 'Add to Library',
      filter: {
        time: 'Time Joined',
        partition: 'Partition (SCI/CJR)'
      },
      stats: 'Knowledge Stats',
      empty: 'Library is empty. Add papers or notes to start building your graph.',
      imageNote: 'Generate Note from Image',
      connecting: 'Discovering relationships...',
      analyzingImage: 'Analyzing Image...'
    },
    figure: {
      title: 'Scientific Figure Gen/Polish',
      subtitle: 'Generate high-quality mechanism diagrams or polish rough sketches into publication-standard figures.',
      mode: {
        generate: 'Text-to-Figure',
        polish: 'Image-to-Figure'
      },
      polishTasks: {
        general: 'General Polish',
        sketchTo3D: 'Sketch to 3D',
        chartBeautify: 'Chart Beautification'
      },
      polishTaskDesc: {
        general: 'Refine details and style',
        sketchTo3D: 'Render line art into 3D',
        chartBeautify: 'Professional redesign'
      },
      input: {
        promptLabel: 'Describe your figure',
        promptPlaceholder: 'e.g. A mechanism diagram showing how drug X inhibits protein Y in the mitochondria...',
        uploadLabel: 'Upload Image',
        referenceLabel: 'Reference (Composition)',
        sourceLabel: 'Source Image (Required)',
        chartTypeLabel: 'Chart Type',
        styleLabel: 'Target Journal Style',
        colorPaletteLabel: 'Color Palette',
        backgroundOnly: 'Generate Structure Only (No Text)',
        backgroundOnlyTip: 'AI often generates garbled text. Check this to generate a clean base map, then use the "Add Labels" tool.',
        dpiLabel: 'Resolution (DPI)',
        sizeLabel: 'Layout Size (Width)',
        sizes: {
            single: 'Single Column (8.5 cm)',
            double: 'Double Column (17 cm)'
        }
      },
      template: {
        title: 'Structured Prompt Template',
        subject: 'Subject',
        subjectPh: 'e.g. Mouse, Nanoparticle',
        action: 'Action/Relation',
        actionPh: 'e.g. Engulfing, Inhibiting',
        environment: 'Environment',
        environmentPh: 'e.g. Tumor Microenvironment',
        perspective: 'Perspective',
        perspectivePh: 'e.g. Cross-section, 3D',
        apply: 'Apply to Prompt'
      },
      chartTypes: {
        Mechanism: 'Mechanism Pathway',
        Anatomical: 'Anatomical Diagram',
        Chart: 'Data Chart Beautification',
        Flowchart: 'Protocol Flowchart',
        NeuralNetwork: 'Neural Network Arch.'
      },
      colorPalettes: {
        Default: 'Default',
        NatureClassic: 'Nature Red/Blue',
        Morandi: 'Morandi (Muted)',
        ColorblindSafe: 'Colorblind Safe',
        Cool: 'Cool Tones',
        Warm: 'Warm Tones'
      },
      styles: {
        Nature: 'Nature (Clean, Serif)',
        Science: 'Science (Bold, Modern)',
        Cell: 'Cell (Graphical, Colorful)',
        IEEE: 'IEEE (Technical, B&W)',
        Flat: 'Flat Vector'
      },
      tools: {
          addLabel: 'Add Label',
          clearLabels: 'Clear Labels',
          saveWithLabels: 'Download with Labels'
      },
      btn: 'Generate Figure',
      generating: 'Rendering...',
      download: 'Download Image',
      refine: 'Refine (Chat)',
      result: 'Figure Result',
      refinePlaceholder: 'e.g. Make the arrows thicker, change background to white...',
      history: 'History / Versions'
    },
    chart: {
      title: 'Chart Data Extraction',
      subtitle: 'Upload chart images from literature to extract underlying data into editable tables.',
      upload: 'Upload Chart Image',
      extractBtn: 'Extract Data',
      extracting: 'Extracting Data...',
      resultTitle: 'Extracted Data',
      downloadCsv: 'Download CSV',
      copyTable: 'Copy Table',
      chartType: 'Detected Chart Type',
      columns: 'Columns',
      rows: 'Rows'
    },
    grant: { // New
      title: 'Grant Application Assistant',
      subtitle: 'Specialized tools for grant writing (NSFC, etc.): Rationale Generation, Proposal Polishing, and Format Review.',
      tabs: {
        rationale: 'Rationale Gen',
        polish: 'Proposal Polish',
        check: 'Format Check'
      },
      rationale: {
        title: 'Project Rationale Generator',
        topic: 'Project Topic',
        keywords: 'Key Keywords',
        btn: 'Generate Rationale',
        placeholder: 'e.g. Mechanisms of drug resistance in lung cancer...',
        references: 'References / Library',
        refUpload: 'Upload Core References (PDF)',
        refDoi: 'Enter DOIs (One per line)',
        refHint: 'AI will generate the rationale based on these specific documents and cite them as [1], [2].',
        fileLimit: 'Max 10 PDFs',
        modeLabel: 'Generation Mode', // New
        modes: { // New
          full: 'Full Outline',
          status: 'Research Status',
          significance: 'Scientific Significance'
        }
      },
      polish: {
        title: 'Grant Proposal Polishing',
        section: 'Section Type',
        content: 'Content',
        btn: 'Polish Tone',
        sections: {
          abstract: 'Abstract',
          significance: 'Scientific Significance',
          innovation: 'Innovation Points',
          plan: 'Research Plan',
          feasibility: 'Feasibility Analysis'
        },
        placeholder: 'Paste your draft text here...'
      },
      check: {
        title: 'Format & Logic Review',
        upload: 'Upload Proposal (PDF/Text)',
        btn: 'Start Review',
        issues: 'Detected Issues',
        suggestions: 'Suggestions',
        score: 'Compliance Score',
        dash: {
            hard: 'Hard Errors',
            logic: 'Logic Check',
            format: 'Format Check',
            anon: 'Anonymity Check'
        }
      }
    }
  }
  ,
  ZH: {
    appName: '科研助手',
    groups: {
      planning: '1. 选题与策划阶段',
      experiment: '2. 实验与数据阶段',
      writing: '3. 写作与润色阶段',
      publish: '4. 投稿与发表阶段'
    },
    nav: { 
      search: '文献检索', 
      review: '综述生成', 
      track: '引用追踪', 
      trends: '趋势分析', 
      advisor: '投稿顾问', 
      peer: '智能审稿', 
      polish: '论文润色', 
      ppt: 'PPT制作', 
      idea: '思路引导', 
      opening: '开题审查',
      data: '数据分析',
      code: '代码助手',
      experimentDesign: '实验设计',
      pdfChat: 'AI论文导读',
      knowledge: '个人知识库',
      figure: '科研绘图',
      chart: '图表提取',
      grant: '基金申报' // New
    },
    search: { 
      title: '科研助手', 
      subtitle: '检索并选择文献以生成结构化综述', 
      placeholder: '搜索学术文献...', 
      btn: '搜索', 
      filters: { db: '数据库', time: '时间范围', partition: '中科院/JCR分区', custom: '自定义', allTime: '全部时间', resultCount: '检索数量' }, 
      sort: { label: '排序方式', relevance: '相关度', date: '时间 (最新)', if: '影响因子 (IF)' },
      results: '相关结果',
      smartReview: '智能综述',
      smartReviewDesc: '基于所选文献即时生成结构化综述。',
      generateBtn: '生成综述 →',
      topicAnalysis: '主题分析',
      topJournals: '顶级期刊',
      paperDetails: '论文详情',
      download: '下载 PDF',
      interpret: 'AI 一键解读',
      interpreting: '解读中...',
      interpretationResult: 'AI 解读报告',
      source: { online: '联网检索', local: '本地文献库' },
      upload: { btn: '上传文献 / 图片', tip: '支持 PDF, Word, JPG, PNG, TXT (支持文件夹)', drag: '点击选择文件夹或拖拽文件至此' },
      batchInterpret: '批量解读',
      localBadge: '本地文件'
    },
    trends: {
      title: '趋势分析',
      subtitle: '输入研究领域以分析新兴方法论和研究热点。',
      placeholder: '例如：量子计算...',
      analyze: '分析',
      emerging: '新兴技术',
      hotspots: '研究热点',
      methodologies: '方法论排名',
      yoy: '同比增长',
      keywordStats: '关键词词频统计',
      frequency: '词频/热度',
      extracting: '正在提取关键词...',
      relatedPapers: '相关最新论文',
      noPapers: '未找到相关最新论文。',
      generateIdeas: '生成研究思路'
    },
    peer: {
      title: '智能审稿人',
      subtitle: '模拟三维专家审稿流程。检查Gap、方法论、语言及期刊匹配度。',
      uploadTitle: '上传稿件',
      uploadDesc: '支持 PDF, Word 或文本文件',
      contentLabel: '论文内容 / 摘要',
      startBtn: '开始审稿流程',
      pending: '等待审稿',
      pendingDesc: '上传文档以获取 AI 专家组的全面评估。',
      targetLabel: '目标类型',
      journalLabel: '目标期刊 (选填)',
      rebuttalBtn: '生成回复信 (Rebuttal)',
      coverLetterBtn: '生成投稿信 (Cover Letter)',
      checklist: '预审检查清单',
      targets: {
        SCI: 'SCI/EI (理工科)',
        SSCI: 'SSCI (社科)',
        Coursework: '课程作业/大作业'
      }
    },
    review: {
      steps: { 1: '检索策略', 2: '选择文献', 3: '配置参数', 4: '生成结果' },
      scopeTitle: '定义综述范围',
      topicLabel: '研究方向 / 关键词',
      dbLabel: '数据库',
      timeLabel: '时间范围',
      searchBtn: '检索文献',
      selectTitle: '选择文献',
      configTitle: '输出配置',
      wordCount: '目标字数',
      langLabel: '输出语言',
      genBtn: '生成综述',
      complete: '生成完成'
    },
    track: {
      title: '引用网络追踪',
      subtitle: '分析并分类参考文献全景。快速识别方法论基础、数据集和研究模型。',
      tabSearch: '标题搜索',
      tabUpload: '文件上传',
      placeholder: '输入论文标题...',
      btn: '开始追踪',
      dragDrop: '点击上传或拖拽文件至此',
      resultsTitle: '引用分类'
    },
    polish: {
      title: '学术润色',
      subtitle: '提升学术写作的清晰度、语气和语法。',
      tabText: '文本输入',
      tabFile: '文件上传',
      placeholder: '在此粘贴摘要或段落...',
      btn: '开始润色',
      revisionNotes: '修改说明',
      outputTitle: '润色结果',
      feedback: '整体反馈',
      config: {
        mode: '任务模式',
        tone: '风格 / 语气',
        field: '学科领域',
        glossary: '术语锁定 (术语表)',
        modes: { EnToEn: '英文润色', CnToEn: '中译英', EnToCn: '英译中' },
        tones: { Academic: '学术严谨', Native: '地道母语', Concise: '简洁专业', Paraphrase: '重写降重' },
        fields: { General: '通用', Medicine: '医学', CS: '计算机', SocialSciences: '人文社科', Engineering: '工程', Economics: '经济金融' }
      },
      control: {
        diffView: '修订模式',
        cleanView: '预览模式',
        accept: '采纳',
        reject: '拒绝',
        chatPlaceholder: '例如：“把第二段改得更委婉一点”',
        export: '导出 (含修订)',
        version: '版本'
      }
    },
    advisor: {
      title: '投稿顾问',
      subtitle: '评估稿件与目标期刊的匹配度，并获取标题优化建议。',
      paperTitle: '论文标题',
      journalTitle: '目标期刊',
      paperAbstract: '摘要',
      abstractPlaceholder: '在此粘贴摘要，以获得更准确的上下文分析...',
      btn: '评估匹配度',
      reportTitle: '评估报告',
      history: '历史记录',
      apply: '应用',
      radar: {
         topic: '主题相关',
         method: '方法论',
         novelty: '创新性',
         scope: '期刊范围',
         style: '语言风格'
      },
      risks: '投稿风险预警',
      alternatives: '替代期刊推荐'
    },
    ppt: {
      title: 'AI PPT 制作',
      subtitle: '只需 4 步，即可将 PDF 论文转化为专业演示文稿。',
      steps: { 1: '上传与信息', 2: '参数配置', 3: '风格选择', 4: '生成 PPT' },
      uploadLabel: '上传 PDF 论文',
      nameLabel: '汇报人姓名',
      schoolLabel: '学校 / 单位',
      densityLabel: '信息密度',
      densityLow: '简洁 (大纲要点)',
      densityHigh: '丰富 (详细内容)',
      pagesLabel: '生成页数',
      styleBtn: '分析内容并推荐风格',
      genBtn: '生成 PPT',
      downloadBtn: '下载演示大纲',
      generating: '正在生成 PPT 内容...',
      analyzing: '正在分析论文风格...'
    },
    idea: {
      title: '科研思路引导',
      subtitle: '输入您的研究兴趣，AI 为您推荐落地性强的方法论、数据源、核心文献及投稿期刊。',
      inputLabel: '您对什么感兴趣？',
      placeholder: '例如：大语言模型在医疗诊断中的应用...',
      btn: '生成研究思路',
      directions: '推荐研究方向',
      journals: '推荐投稿期刊',
      generating: '正在头脑风暴...',
      titles: '建议题目',
      selectDirection: '选择并深入',
      followUpPlaceholder: '例如：我想具体了解消费者行为方面的研究...',
      followUpBtn: '获取具体建议',
      deepDive: '深入分析',
      keywords: '推荐关键词',
      methodology: '建议方法论',
      dataSources: '数据来源建议',
      corePapers: '核心必读文献',
      exportProposal: '导出开题报告草稿',
      logicFlow: '逻辑框架',
      focus: {
        label: '侧重维度:',
        general: '综合',
        data: '数据驱动',
        policy: '政策/应用',
        theory: '理论/机制'
      }
    },
    opening: {
      title: '开题审查',
      subtitle: '评估您的开题报告逻辑、研究方法及与目标期刊的契合度。',
      uploadTitle: '上传开题报告',
      uploadDesc: '上传 PDF 格式的开题报告进行深度分析。',
      targetLabel: '目标期刊 / 研究目标',
      targetPlaceholder: '例如：IEEE TPAMI，或 博士毕业要求',
      btn: '开始审查',
      analyzing: '正在审查报告...',
      reportTitle: '审查报告',
      download: '下载 PDF 报告',
      sections: {
        titleCheck: '题目解析',
        methodCheck: '方法论审查',
        logicCheck: '逻辑思路检查',
        journalMatch: '期刊/目标匹配度',
        literatureRec: '相关文献推荐'
      }
    },
    data: {
      title: '智能数据分析',
      subtitle: '上传 CSV/Excel 数据，自动进行描述性统计、相关性分析与模型推荐。',
      upload: '上传数据文件',
      analyzing: '正在分析数据结构...',
      summary: '描述性统计',
      correlations: '相关性分析',
      models: '推荐统计模型',
      code: '实现代码 (Python/R)',
      columns: '变量列表',
      limitNotice: '注意：系统仅截取前 50 行数据作为样本进行分析，不发送完整数据。',
      limitBanner: '⚠️ 为了快速处理，系统将仅分析数据的前 50 行。结果仅供参考或作为数据结构验证。',
      downloadTemplate: '下载样本模板',
      previewTitle: '数据预览',
      setupTitle: '分析设置',
      useHeader: '第一行作为列名 (变量名)',
      targetVar: '目标变量 (Y值)',
      noTarget: '无 (无监督学习)',
      colName: '列名',
      colType: '数据类型',
      confirmBtn: '确认并分析',
      quickAnalysisBtn: '生成快速预览 (基于样本)',
      reupload: '重新上传',
      cleaning: '数据预处理 (缺失值)',
      cleaningStrategies: {
        auto: '智能处理 (AI)',
        drop: '删除缺失行',
        mean: '填充均值/众数',
        zero: '填充 0 / Unknown'
      },
      progress: {
        loading: '加载数据源...',
        cleaning: '处理缺失值与异常...',
        stats: '统计特征计算...',
        ai: 'AI 建模与推理...'
      },
      featureImportance: '特征重要性',
      exportReport: '导出分析报告',
      chatData: '与数据对话',
      resultDisclaimer: '注意：此分析基于 Top 50 样本数据生成。',
    },
    code: {
      title: '代码助手',
      subtitle: '针对 Python、R 和 MATLAB 提供代码生成、纠错和解释功能。',
      mode: '任务模式',
      language: '编程语言',
      modes: { generate: '生成代码', debug: '纠错/调试', explain: '解释代码' },
      inputPlaceholder: {
        generate: '描述你希望代码完成什么功能 (例如：“绘制 data.csv 相关性的热力图”)',
        debug: '在此粘贴你的代码以进行调试...',
        explain: '在此粘贴代码以获取详细解释...'
      },
      btn: '运行助手',
      stopBtn: '停止生成',
      output: '助手对话',
      history: '历史记录',
      followUpPlaceholder: '追问或修改需求...',
      upload: '上传代码/数据',
      shortcut: 'Ctrl + Enter 运行',
      newSession: '新会话'
    },
    experimentDesign: {
      title: '实验设计优化',
      subtitle: '基于研究假设，辅助设计实验流程，计算所需的样本量。',
      hypothesisLabel: '研究假设',
      hypothesisPlaceholder: '例如：使用间隔重复法相比集中练习能显著提高长期记忆保留率。',
      optimizeBtn: 'AI 优化',
      optimizing: '优化中...',
      ivLabel: '自变量 (IV)',
      dvLabel: '因变量 (DV)',
      fieldLabel: '研究领域',
      methodologyLabel: '研究方法论',
      structureLabel: '设计架构',
      btn: '生成实验方案',
      generating: '正在设计实验...',
      flow: '实验流程',
      sampleSize: '样本量计算',
      variables: '关键变量',
      analysis: '统计分析方案',
      advancedSettings: '高级统计设置',
      alpha: '显著性水平 (α)',
      power: '统计功效 (1-β)',
      effectSize: '预期效应量 (Effect Size)',
      effectSizes: { small: '小 (Small)', medium: '中 (Medium)', large: '大 (Large)', custom: '自定义' },
      fields: {
        Psychology: '心理学',
        Medicine: '临床医学',
        Biology: '生物学',
        CS: '计算机科学',
        Marketing: '市场营销/商科',
        Education: '教育学',
        UX: '用户体验'
      },
      methodologies: {
        Auto: '智能推荐 (AI 决策)',
        RCT: '随机对照试验 (RCT)',
        Quasi: '准实验设计',
        Survey: '问卷调查',
        CaseStudy: '案例研究',
        Observational: '观察性研究'
      },
      structures: {
        Between: '组间设计 (Between-Subjects)',
        Within: '组内设计 (Within-Subjects)',
        Mixed: '混合设计 (Mixed Design)',
        Factorial: '因子设计 (Factorial)',
        Longitudinal: '纵向设计 (Longitudinal)'
      },
      templates: {
          title: '使用模板开始',
          subtitle: '选择一个常见的实验范式快速开始。',
          rct: '临床随机对照 (RCT)',
          rctDesc: '医学 • 组间设计',
          ab: 'A/B 测试',
          abDesc: '用户体验/营销 • 组间设计',
          memory: '认知记忆实验',
          memoryDesc: '心理学 • 组内设计'
      }
    },
    pdfChat: {
      title: 'AI论文导读',
      subtitle: '上传 PDF，AI 助你深度解读论文细节、公式含义及数据来源。',
      upload: '上传 PDF 论文',
      dragDrop: '拖拽文件至此',
      placeholder: '询问论文细节 (例如: "本文的主要贡献是什么?", "解释公式3")...',
      analyzing: '正在解析文档...',
      welcome: '文档已就绪。已为您生成结构化导读。您可以询问关于论文细节、方法论或数据的任何问题。',
      clear: '清空对话',
      themes: { light: '明亮 (Light)', dark: '深色 (Dark)', sepia: '护眼 (Eye Care)' },
      toggleSidebar: '侧边栏',
      chatPanel: '对话栏'
    },
    knowledge: {
      title: '个人学术知识库',
      subtitle: '可视化您的学术文献库。AI 自动关联论文间的相似观点与笔记。',
      addNote: '添加笔记 / 图片',
      connect: 'AI 知识关联',
      suggestions: 'AI 知识挖掘',
      chatTitle: '知识库对话 (RAG)',
      chatPlaceholder: '基于知识库提问 (例: 比较A与B方法)...',
      chatWelcome: '已读取知识库上下文。您可以要求我比较论文、总结主题或发现研究Gap。',
      gettingSuggestions: '思考中...',
      acceptLink: '确认关联',
      acceptNode: '加入知识库',
      filter: {
        time: '加入时间',
        partition: '分区 (SCI/CJR)'
      },
      stats: '知识库统计',
      empty: '知识库为空。添加论文或笔记以开始构建图谱。',
      imageNote: '图片转笔记',
      connecting: '正在发现关联...',
      analyzingImage: '正在分析图片...'
    },
    figure: {
      title: '科研绘图/美化',
      subtitle: '生成高质量机制图或将粗糙手绘/图表美化为期刊标准配图。',
      mode: {
        generate: '文生图',
        polish: '图生图 (美化)'
      },
      polishTasks: {
        general: '常规美化',
        sketchTo3D: '草图转3D',
        chartBeautify: '图表美化'
      },
      polishTaskDesc: {
        general: '优化细节和风格',
        sketchTo3D: '将线条渲染为3D模型',
        chartBeautify: '数据图表专业重绘'
      },
      input: {
        promptLabel: '描述图片内容',
        promptPlaceholder: '例如：一张展示药物X在线粒体中抑制蛋白Y的机制图...',
        uploadLabel: '上传手绘/图表',
        referenceLabel: '构图参考图 (可选)',
        sourceLabel: '原图上传 (必填)',
        chartTypeLabel: '图表类型',
        styleLabel: '目标期刊风格',
        colorPaletteLabel: '配色方案',
        backgroundOnly: '仅生成底图 (无文字)',
        backgroundOnlyTip: 'AI 生成文字易乱码。建议勾选此项生成结构图，再使用“添加标签”工具。',
        dpiLabel: '分辨率 (DPI)',
        sizeLabel: '版面尺寸 (宽度)',
        sizes: {
            single: '单栏图 (8.5 cm)',
            double: '双栏图 (17 cm)'
        }
      },
      template: {
        title: '结构化提示词模版',
        subject: '主体对象',
        subjectPh: '如：小鼠、纳米颗粒',
        action: '动作/关系',
        actionPh: '如：吞噬、抑制、催化',
        environment: '环境背景',
        environmentPh: '如：肿瘤微环境、血管内',
        perspective: '视角构图',
        perspectivePh: '如：截面图、3D透视',
        apply: '生成提示词'
      },
      chartTypes: {
        Mechanism: '机理图 (Mechanism)',
        Anatomical: '解剖示意图 (Anatomical)',
        Chart: '数据可视化美化 (Chart)',
        Flowchart: '实验流程图 (Flowchart)',
        NeuralNetwork: '机器学习架构图 (Neural Net)'
      },
      colorPalettes: {
        Default: '默认 (Default)',
        NatureClassic: 'Nature 红蓝经典',
        Morandi: '莫兰迪色系',
        ColorblindSafe: '色盲友好 (Safe)',
        Cool: '冷色调 (Cool)',
        Warm: '暖色调 (Warm)'
      },
      styles: {
        Nature: 'Nature (衬线体/简洁)',
        Science: 'Science (黑体/现代)',
        Cell: 'Cell (图形化/多彩)',
        IEEE: 'IEEE (技术/黑白)',
        Flat: '扁平矢量风'
      },
      tools: {
          addLabel: '添加文本标签',
          clearLabels: '清空标签',
          saveWithLabels: '下载 (含标签)'
      },
      btn: '生成配图',
      generating: '绘图中...',
      download: '下载原图',
      refine: '调整 (对话)',
      result: '生成结果',
      refinePlaceholder: '例如：把箭头变粗一点，背景换成白色...',
      history: '历史版本'
    },
    chart: {
      title: '图表数据提取',
      subtitle: '上传文献中的图表图片，一键提取底层数据并还原为可编辑表格。',
      upload: '上传图表图片',
      extractBtn: '提取数据',
      extracting: '正在提取数据...',
      resultTitle: '提取结果',
      downloadCsv: '下载 CSV',
      copyTable: '复制表格',
      chartType: '检测图表类型',
      columns: '列数',
      rows: '行数'
    },
    grant: { // New
      title: '基金项目申报助手',
      subtitle: '专为 NSFC 等基金申请打造：立项依据生成、标书润色与形式审查。',
      tabs: {
        rationale: '立项依据生成',
        polish: '标书润色',
        check: '形式审查'
      },
      rationale: {
        title: '立项依据生成器',
        topic: '项目主题',
        keywords: '核心关键词',
        btn: '生成立项依据',
        placeholder: '例如：肺癌靶向药物耐药的分子机制...',
        references: '参考文献/文献库',
        refUpload: '上传核心文献 (PDF)',
        refDoi: '输入 DOI (每行一个)',
        refHint: 'AI 将基于这些文献生成综述并自动标注引用 [1]。',
        fileLimit: '最多 10 篇 PDF',
        modeLabel: '生成模式', // New
        modes: { // New
          full: '全篇大纲',
          status: '研究现状综述',
          significance: '科学意义'
        }
      },
      polish: {
        title: '标书语言润色',
        section: '所属部分',
        content: '文本内容',
        btn: '优化语气与逻辑',
        sections: {
          abstract: '摘要',
          significance: '科学意义',
          innovation: '创新点',
          plan: '研究方案',
          feasibility: '可行性分析'
        },
        placeholder: '在此粘贴您的草稿文本...'
      },
      check: {
        title: '形式与逻辑审查',
        upload: '上传标书 (PDF/文本)',
        btn: '开始审查',
        issues: '检测到的问题',
        suggestions: '修改建议',
        score: '合规评分',
        dash: {
            hard: '硬伤检查',
            logic: '逻辑检查',
            format: '格式检查',
            anon: '匿名检查'
        }
      }
    }
  }
};