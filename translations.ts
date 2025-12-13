export const TRANSLATIONS = {
  EN: {
    appName: 'Research Assistant',
    nav: {
      search: 'Search',
      opening: 'Opening Review',
      idea: 'Idea Guide',
      review: 'Review Gen',
      ppt: 'PPT Gen',
      track: 'Tracker',
      trends: 'Trends',
      advisor: 'Advisor',
      peer: 'Peer Review',
      polish: 'Polishing',
      experimentDesign: 'Exp. Design',
      data: 'Data Analysis',
      chart: 'Chart Extractor',
      code: 'Code Assistant',
      pdfChat: 'PDF Chat',
      knowledge: 'Knowledge Graph',
      figure: 'Figure Gen',
      grant: 'Grant Application',
      conference: 'Conf. Finder',
      aiDetector: 'AI Detector',
      discussion: 'Research Discussion',
      titlePrism: 'Title Prism',
      flowchart: 'Flowchart',
      aiWorkflow: 'AI Workflow'
    },
    groups: {
      discovery: 'Discovery',
      planning: 'Planning',
      execution: 'Execution',
      writing: 'Writing & Review',
      utility: 'Utilities'
    },
    search: {
      title: 'Academic Search',
      subtitle: 'Find papers, generate reviews, and analyze trends.',
      placeholder: 'Search for papers, topics, or keywords...',
      btn: 'Search',
      results: 'Results',
      generateBtn: 'Generate Review',
      filters: {
        time: 'Time Range',
        type: 'Paper Type',
      },
      sort: {
        label: 'Sort by',
        relevance: 'Relevance',
        date: 'Date',
        if: 'Impact Factor',
        added: 'Date Added'
      },
      source: {
        online: 'Online Search',
        local: 'Local Files'
      },
      upload: {
        btn: 'Click to Upload Papers',
        tip: 'Supports PDF, DOCX, TXT'
      },
      interpret: 'AI Interpret'
    },
    trends: {
      title: 'Trend Analysis',
      subtitle: 'Analyze research trends and identify emerging topics.',
      placeholder: 'Enter a research field...',
      analyze: 'Analyze Trends',
      timeRange: 'Time Range',
      emerging: 'Emerging Tech',
      yoy: 'YoY Growth',
      hotspots: 'Research Hotspots',
      methodologies: 'Top Methodologies',
      view: {
        researcher: 'Researcher View',
        institution: 'Institution View'
      }
    },
    opening: {
      title: 'Opening Review',
      subtitle: 'Get feedback on your opening proposal.',
      uploadDesc: 'Upload your proposal PDF to start.',
      targetLabel: 'Target Journal / Conference',
      targetPlaceholder: 'e.g. CVPR, Nature',
      personaLabel: 'Reviewer Persona',
      personas: {
        gentle: 'Gentle',
        critical: 'Critical'
      },
      focusLabel: 'Review Focus',
      focusPlaceholder: 'e.g. Methodology, Innovation...',
      btn: 'Start Review'
    },
    idea: {
      title: 'Idea Guide',
      subtitle: 'Brainstorm and refine research ideas.',
      placeholder: 'Describe your research interests...',
      focus: {
        label: 'Focus',
        general: 'General',
        data: 'Data-Driven',
        policy: 'Policy-Oriented',
        theory: 'Theory-Heavy'
      },
      btn: 'Generate Ideas',
      directions: 'Research Directions',
      selectDirection: 'Select',
      methodology: 'Methodology',
      dataSources: 'Data Sources',
      titles: 'Recommended Titles',
      corePapers: 'Core References',
      followUpPlaceholder: 'Ask a follow-up question...',
      followUpBtn: 'Deep Dive',
      logicFlow: 'Logic Flow',
      deepDive: 'Deep Dive Analysis',
      keywords: 'Keywords',
      journals: 'Recommended Journals',
      exportProposal: 'Export Proposal'
    },
    review: {
      steps: {
        1: 'Scope',
        2: 'Select',
        3: 'Config',
        4: 'Result'
      },
      scopeTitle: 'Define Review Scope',
      topicLabel: 'Research Topic',
      focusLabel: 'Review Focus',
      dbLabel: 'Databases',
      timeLabel: 'Time Range',
      searchBtn: 'Search Papers',
      selectTitle: 'Select Papers',
      configTitle: 'Configuration',
      wordCount: 'Word Count',
      langLabel: 'Output Language',
      genBtn: 'Generate Review',
      complete: 'Review Generated'
    },
    ppt: {
      title: 'PPT Generator',
      subtitle: 'Generate presentation slides from your paper.',
      uploadLabel: 'Upload Paper',
      nameLabel: 'Presenter Name',
      schoolLabel: 'Affiliation',
      densityLabel: 'Content Density',
      densityLow: 'Simple',
      densityHigh: 'Rich',
      pagesLabel: 'Number of Slides',
      styleBtn: 'Analyze Style',
      analyzing: 'Analyzing Paper Style...',
      steps: {
        2: 'Configuration',
        3: 'Style Selection'
      },
      genBtn: 'Generate PPT',
      generating: 'Generating Slides...',
      download: 'Download PPT'
    },
    track: {
      title: 'Reference Tracker',
      subtitle: 'Track citations and analyze research gaps.',
      tabSearch: 'Search Topic',
      tabUpload: 'Upload PDF',
      placeholder: 'Enter topic or paper title...',
      btn: 'Track Network',
      dragDrop: 'Drag & Drop PDF Here'
    },
    advisor: {
      title: 'Submission Advisor',
      subtitle: 'Get advice on where to submit your paper.',
      paperTitle: 'Paper Title',
      paperAbstract: 'Abstract',
      abstractPlaceholder: 'Paste abstract here...',
      journalTitle: 'Target Journal',
      focusLabel: 'Review Focus',
      focusPlaceholder: 'e.g. Methodology, Innovation...',
      btn: 'Analyze Match',
      history: 'History',
      risks: 'Risk Assessment',
      alternatives: 'Alternative Journals',
      apply: 'Apply'
    },
    peer: {
      title: 'Peer Review Simulator',
      subtitle: 'Simulate a peer review for your paper.',
      uploadTitle: 'Upload Manuscript',
      uploadDesc: 'PDF, DOCX supported',
      targetLabel: 'Target Venue',
      journalLabel: 'Journal Name',
      startBtn: 'Start Simulation',
      pending: 'Waiting for File',
      pendingDesc: 'Upload a file to begin the review process.',
      rebuttalBtn: 'Draft Rebuttal',
      coverLetterBtn: 'Draft Cover Letter'
    },
    polish: {
      title: 'Polish Assistant',
      subtitle: 'Improve your academic writing.',
      tabText: 'Text Input',
      tabFile: 'File Upload',
      placeholder: 'Paste text to polish...',
      config: {
        mode: 'Mode',
        modes: { EnToEn: 'English Polish', CnToEn: 'Translate to English', EnToCn: 'Translate to Chinese' },
        tone: 'Tone',
        tones: { Academic: 'Academic', Native: 'Native', Concise: 'Concise', Paraphrase: 'Paraphrase' },
        field: 'Field',
        fields: { General: 'General', CS: 'Computer Science', Medicine: 'Medicine', Engineering: 'Engineering', SocialSciences: 'Social Sciences', Economics: 'Economics' },
        glossary: 'Glossary (Optional)'
      },
      btn: 'Polish',
      revisionNotes: 'Revision Notes',
      control: {
        cleanView: 'Clean',
        diffView: 'Diff',
        version: 'Version',
        chatPlaceholder: 'Refine this result...',
        accept: 'Accept',
        reject: 'Reject'
      }
    },
    experimentDesign: {
      title: 'Experiment Design',
      subtitle: 'Design rigorous experiments for your research.',
      hypothesisLabel: 'Research Hypothesis',
      hypothesisPlaceholder: 'e.g. Drug X reduces blood pressure...',
      ivLabel: 'Independent Variable',
      dvLabel: 'Dependent Variable',
      fieldLabel: 'Field',
      methodologyLabel: 'Methodology',
      structureLabel: 'Structure',
      fields: { Psychology: 'Psychology', Medicine: 'Medicine', Biology: 'Biology', CS: 'Computer Science' },
      methodologies: { Auto: 'Auto-Detect', RCT: 'Randomized Controlled Trial', Survey: 'Survey', Lab: 'Lab Experiment' },
      structures: { Between: 'Between-Subjects', Within: 'Within-Subjects', Mixed: 'Mixed Design' },
      advancedSettings: 'Advanced Settings',
      alpha: 'Alpha',
      power: 'Power',
      effectSize: 'Effect Size',
      effectSizes: { small: 'Small', medium: 'Medium', large: 'Large', custom: 'Custom' },
      optimizeBtn: 'Optimize',
      optimizing: 'Optimizing...',
      btn: 'Generate Design',
      generating: 'Designing Experiment...',
      sampleSize: 'Sample Size',
      variables: 'Variables',
      analysis: 'Analysis Plan',
      flow: 'Experiment Flow',
      templates: {
        title: 'Quick Templates',
        subtitle: 'Start with a standard design',
        rct: 'RCT',
        rctDesc: 'Randomized Controlled Trial',
        ab: 'A/B Test',
        abDesc: 'Simple Comparison',
        memory: 'Memory Task',
        memoryDesc: 'Cognitive Psychology'
      }
    },
    data: {
      title: 'Data Analysis',
      subtitle: 'Analyze your data with AI.',
      upload: 'Upload Data File'
    },
    chart: {
      title: 'Chart Extraction',
      subtitle: 'Extract data from chart images.',
      upload: 'Upload Image',
      extracting: 'Extracting...'
    },
    code: {
      title: 'Code Assistant',
      newSession: 'New Session',
      history: 'History',
      inputPlaceholder: {
        generate: 'Describe the code you need...',
        debug: 'Paste code to debug...',
        explain: 'Paste code to explain...'
      },
      upload: 'Upload Code File',
      stopBtn: 'Stop',
      btn: 'Run',
      shortcut: 'Ctrl + Enter to Run',
      followUpPlaceholder: 'Follow up...'
    },
    pdfChat: {
      title: 'PDF Chat',
      subtitle: 'Chat with your PDF documents.',
      uploadDesc: 'Upload a PDF to start chatting.',
      chatTitle: 'Chat',
      chatWelcome: 'Ask me anything about the document.',
      chatPlaceholder: 'Type your question...'
    },
    knowledge: {
      title: 'Knowledge Graph',
      subtitle: 'Visualize research connections.',
      connect: 'Connect',
      connecting: 'Connecting...',
      suggestions: 'Suggestions',
      gettingSuggestions: 'Thinking...',
      imageNote: 'Image Note',
      analyzingImage: 'Analyzing...',
      empty: 'Add nodes to start.',
      chatTitle: 'Chat with Graph',
      chatWelcome: 'Ask about the connections...',
      chatPlaceholder: 'Type your question...',
      acceptNode: 'Add to Graph'
    },
    figure: {
      title: 'Figure Generator',
      subtitle: 'Generate scientific figures.',
      mode: {
        generate: 'Generate',
        polish: 'Polish'
      },
      polishTasks: {
        general: 'General',
        sketchTo3D: 'Sketch to 3D',
        chartBeautify: 'Beautify Chart'
      },
      input: {
        referenceLabel: 'Reference Image (Optional)',
        sourceLabel: 'Source Image',
        promptLabel: 'Description / Prompt',
        promptPlaceholder: 'Describe the figure...',
        backgroundOnly: 'Background Only',
        backgroundOnlyTip: 'Generate background only.',
        sizeLabel: 'Size',
        sizes: { single: 'Single Column', double: 'Double Column' },
        dpiLabel: 'DPI'
      },
      template: {
        title: 'Template',
        subject: 'Subject',
        subjectPh: 'e.g. Cell',
        action: 'Action',
        actionPh: 'e.g. Dividing',
        environment: 'Environment',
        environmentPh: 'e.g. Petri Dish',
        perspective: 'Perspective',
        perspectivePh: 'e.g. Top-down',
        apply: 'Apply Template'
      },
      chartTypes: { Mechanism: 'Mechanism', Flowchart: 'Flowchart', Data: 'Data Plot' },
      colorPalettes: { Default: 'Default', Nature: 'Nature', Science: 'Science', Grayscale: 'Grayscale' },
      btn: 'Generate Figure',
      generating: 'Generating...',
      result: 'Result',
      tools: {
        addLabel: 'Add Label',
        saveWithLabels: 'Save with Labels'
      },
      download: 'Download',
      refinePlaceholder: 'Refine this figure...',
      history: 'History'
    },
    grant: {
      title: 'Grant Application',
      subtitle: 'Assistance for grant proposals.',
      tabs: {
        rationale: 'Rationale',
        polish: 'Polish',
        check: 'Format Check',
        review: 'Review'
      },
      rationale: {
        title: 'Rationale Generation',
        references: 'References',
        refUpload: 'Upload PDFs',
        fileLimit: 'files',
        imgUpload: 'Upload Image',
        refDoi: 'Enter DOIs (one per line)',
        modeLabel: 'Generation Mode',
        modes: { full: 'Full Rationale', status: 'Research Status', significance: 'Significance' }
      },
      polish: {
        title: 'Proposal Polish',
        section: 'Section',
        sections: { significance: 'Significance', innovation: 'Innovation', feasibility: 'Feasibility' },
        content: 'Content',
        placeholder: 'Paste text here...'
      },
      check: {
        title: 'Format Check',
        upload: 'Upload Proposal',
        btn: 'Check Format',
        dash: { hard: 'Hard Rules', logic: 'Logic Flow' }
      },
      review: {
        title: 'Pre-Review',
        roleLabel: 'Reviewer Role',
        frameworkLabel: 'Review Framework',
        frameworkPlaceholder: 'Enter review criteria...',
        upload: 'Upload Proposal',
        startBtn: 'Start Review',
        reportTitle: 'Review Report',
        downloadPdf: 'Download Report',
        verdict: 'Verdict'
      }
    },
    conference: {
      title: 'Conference Finder',
      subtitle: 'Find relevant conferences.',
      topicLabel: 'Topic',
      searchBtn: 'Search',
      searching: 'Searching...',
      rankLabel: 'Rank',
      filters: {
        type: 'Type',
        typeOpts: { all: 'All', conf: 'Conference', journal: 'Journal' },
        status: 'Status',
        statusOpts: { all: 'All', upcoming: 'Upcoming', passed: 'Passed', tba: 'TBA' },
        metrics: 'Metrics (H5)',
        h5Opts: { all: 'All', gt20: '> 20', gt50: '> 50', gt100: '> 100' },
        location: 'Location',
        locationOpts: { all: 'All', asia: 'Asia', europe: 'Europe', na: 'North America', online: 'Online' }
      },
      conferences: 'Conferences',
      journals: 'Journals',
      website: 'Website',
      daysLeft: 'days left',
      sort: {
        deadline: 'Deadline',
        rank: 'Rank',
        h5: 'H5 Index'
      }
    },
    aiDetector: {
      title: 'AI Detector',
      subtitle: 'Detect AI-generated content.',
      checkBtn: 'Check Text',
      humanizeBtn: 'Humanize',
      highlights: 'Highlights',
      humanized: 'Humanized Text',
      copy: 'Copy'
    },
    discussion: {
      title: 'Research Discussion',
      subtitle: 'Simulate discussions with multiple personas.',
      placeholder: 'Enter discussion topic...',
      btn: 'Start Discussion',
      participantsHeader: 'Participants',
      addRole: 'Add Role',
      scorecard: {
        title: 'Innovation Scorecard',
        theory: 'Theory',
        method: 'Method',
        app: 'Application'
      },
      feasibility: {
        title: 'Feasibility',
        data: 'Data',
        tech: 'Technology',
        ethics: 'Ethics'
      },
      personas: {
        reviewer: 'Reviewer',
        interdisciplinary: 'Interdisciplinary',
        mentor: 'Mentor'
      }
    },
    titlePrism: {
      title: 'Title Prism',
      subtitle: 'Optimize your research title with multi-perspective AI feedback.',
      inputSection: 'Input & Configuration',
      draftTitle: 'Draft Title',
      draftPlaceholder: 'Enter your draft title...',
      abstract: 'Abstract / Key Contribution (Optional)',
      abstractPlaceholder: 'Paste abstract to help AI understand context...',
      target: 'Target Journal / Field',
      targetPlaceholder: 'Select or type journal name...',
      optimizeBtn: 'Start Multi-dimensional Optimization',
      resultsSection: 'Smart Analysis & Results',
      councilTitle: 'The Council Diagnosis',
      optionsTitle: 'Refined Options',
      analyzing: 'Analyzing...',
      copy: 'Copy'
    },
    flowchart: {
      title: 'AI Flowchart',
      subtitle: 'Convert text descriptions or images into editable flowcharts.',
      inputPlaceholder: 'Describe the process, workflow, or logic...',
      uploadImage: 'Upload Image to Convert',
      generating: 'Generating Flowchart...',
      btn: 'Generate',
      resultTitle: 'Generated Flowchart',
      copyCode: 'Copy Code',
      download: 'Download',
      chartType: 'Chart Type',
      types: { flowchart: 'Flowchart', sequence: 'Sequence Diagram', gantt: 'Gantt Chart', class: 'Class Diagram' }
    },
    aiWorkflow: {
      title: 'Research Workflow',
      subtitle: 'From broad direction to concrete framework in 3 steps.',
      steps: {
        1: 'Direction',
        2: 'Problems',
        3: 'Refinement',
        4: 'Framework'
      },
      step1: {
        label: 'Research Direction',
        placeholder: 'e.g. Generative AI in Education, Sustainable Energy Storage...',
        btn: 'Explore Problems'
      },
      step2: {
        title: 'Select a Core Problem',
        subtitle: 'AI identified these potential research gaps.',
        difficulty: 'Difficulty'
      },
      step3: {
        title: 'Choose an Angle',
        subtitle: 'How do you want to approach this problem?',
        rationale: 'Why this angle?'
      },
      step4: {
        title: 'Research Framework',
        logic: 'Logical Framework',
        method: 'Methodology',
        data: 'Data Sources',
        innovation: 'Innovation Points',
        export: 'Export Framework'
      },
      back: 'Back',
      restart: 'Start Over',
      loading: {
        problems: 'Analyzing field...',
        angles: 'Brainstorming angles...',
        framework: 'Designing framework...'
      }
    }
  },
  ZH: {
    appName: '科研助手',
    nav: {
      search: '学术搜索',
      opening: '开题评审',
      idea: '选题向导',
      review: '综述生成',
      ppt: 'PPT生成',
      track: '文献追踪',
      trends: '趋势分析',
      advisor: '投稿顾问',
      peer: '同行评审',
      polish: '润色助手',
      experimentDesign: '实验设计',
      data: '数据分析',
      chart: '图表提取',
      code: '代码助手',
      pdfChat: '文献精读',
      knowledge: '知识图谱',
      figure: '科研绘图',
      grant: '基金申请',
      conference: '学术征稿',
      aiDetector: 'AI率检测',
      discussion: '科研讨论',
      titlePrism: '标题精炼',
      flowchart: 'AI 流程图',
      aiWorkflow: 'AI 工作流'
    },
    groups: {
      discovery: '发现与选题',
      planning: '规划与设计',
      execution: '实验与分析',
      writing: '写作与发表',
      utility: '实用工具'
    },
    search: {
      title: '学术搜索',
      subtitle: '搜索论文、生成综述、分析趋势。',
      placeholder: '搜索论文、主题或关键词...',
      btn: '搜索',
      results: '搜索结果',
      generateBtn: '生成综述',
      filters: {
        time: '时间范围',
        type: '论文类型',
      },
      sort: {
        label: '排序',
        relevance: '相关性',
        date: '日期',
        if: '影响因子',
        added: '添加日期'
      },
      source: {
        online: '在线搜索',
        local: '本地文件'
      },
      upload: {
        btn: '点击上传论文',
        tip: '支持 PDF, DOCX, TXT'
      },
      interpret: 'AI 解读'
    },
    trends: {
      title: '趋势分析',
      subtitle: '分析研究趋势并识别新兴主题。',
      placeholder: '输入研究领域...',
      analyze: '分析趋势',
      timeRange: '时间范围',
      emerging: '新兴技术',
      yoy: '同比增长',
      hotspots: '研究热点',
      methodologies: '热门方法',
      view: {
        researcher: '研究者视图',
        institution: '机构视图'
      }
    },
    opening: {
      title: '开题评审',
      subtitle: '获取开题报告的反馈意见。',
      uploadDesc: '上传您的开题报告 PDF 开始。',
      targetLabel: '目标期刊/会议',
      targetPlaceholder: '例如：CVPR, Nature',
      personaLabel: '评审风格',
      personas: {
        gentle: '温和',
        critical: '严厉'
      },
      focusLabel: '评审重点',
      focusPlaceholder: '例如：方法论、创新性...',
      btn: '开始评审'
    },
    idea: {
      title: '选题向导',
      subtitle: '头脑风暴并细化研究想法。',
      placeholder: '描述您的研究兴趣...',
      focus: {
        label: '侧重',
        general: '通用',
        data: '数据驱动',
        policy: '政策导向',
        theory: '理论深度'
      },
      btn: '生成想法',
      directions: '研究方向',
      selectDirection: '选择',
      methodology: '方法论',
      dataSources: '数据来源',
      titles: '推荐标题',
      corePapers: '核心文献',
      followUpPlaceholder: '追问...',
      followUpBtn: '深度分析',
      logicFlow: '逻辑流',
      deepDive: '深度分析',
      keywords: '关键词',
      journals: '推荐期刊',
      exportProposal: '导出提案'
    },
    review: {
      steps: {
        1: '范围',
        2: '选择',
        3: '配置',
        4: '结果'
      },
      scopeTitle: '定义综述范围',
      topicLabel: '研究主题',
      focusLabel: '综述重点',
      dbLabel: '数据库',
      timeLabel: '时间范围',
      searchBtn: '搜索论文',
      selectTitle: '选择论文',
      configTitle: '配置',
      wordCount: '字数',
      langLabel: '输出语言',
      genBtn: '生成综述',
      complete: '综述生成完成'
    },
    ppt: {
      title: 'PPT 生成器',
      subtitle: '从您的论文生成演示幻灯片。',
      uploadLabel: '上传论文',
      nameLabel: '演讲者姓名',
      schoolLabel: '单位/学校',
      densityLabel: '内容密度',
      densityLow: '简洁',
      densityHigh: '详细',
      pagesLabel: '幻灯片页数',
      styleBtn: '分析风格',
      analyzing: '正在分析论文风格...',
      steps: {
        2: '配置',
        3: '风格选择'
      },
      genBtn: '生成 PPT',
      generating: '正在生成幻灯片...',
      download: '下载 PPT'
    },
    track: {
      title: '文献追踪',
      subtitle: '追踪引用并分析研究空白。',
      tabSearch: '搜索主题',
      tabUpload: '上传 PDF',
      placeholder: '输入主题或论文标题...',
      btn: '追踪网络',
      dragDrop: '拖拽 PDF 到此处'
    },
    advisor: {
      title: '投稿顾问',
      subtitle: '获取关于论文投稿的建议。',
      paperTitle: '论文标题',
      paperAbstract: '摘要',
      abstractPlaceholder: '在此粘贴摘要...',
      journalTitle: '目标期刊',
      focusLabel: '评审重点',
      focusPlaceholder: '例如：方法论、创新性...',
      btn: '分析匹配度',
      history: '历史记录',
      risks: '风险评估',
      alternatives: '替代期刊',
      apply: '应用'
    },
    peer: {
      title: '同行评审模拟',
      subtitle: '模拟论文的同行评审过程。',
      uploadTitle: '上传手稿',
      uploadDesc: '支持 PDF, DOCX',
      targetLabel: '目标期刊',
      journalLabel: '期刊名称',
      startBtn: '开始模拟',
      pending: '等待文件',
      pendingDesc: '上传文件以开始评审流程。',
      rebuttalBtn: '起草反驳信',
      coverLetterBtn: '起草投稿信'
    },
    polish: {
      title: '润色助手',
      subtitle: '提升您的学术写作水平。',
      tabText: '文本输入',
      tabFile: '文件上传',
      placeholder: '粘贴要润色的文本...',
      config: {
        mode: '模式',
        modes: { EnToEn: '英文润色', CnToEn: '中译英', EnToCn: '英译中' },
        tone: '语气',
        tones: { Academic: '学术', Native: '地道', Concise: '简洁', Paraphrase: '改写' },
        field: '领域',
        fields: { General: '通用', CS: '计算机', Medicine: '医学', Engineering: '工程', SocialSciences: '社科', Economics: '经济' },
        glossary: '术语表 (可选)'
      },
      btn: '润色',
      revisionNotes: '修改说明',
      control: {
        cleanView: '纯净版',
        diffView: '对比版',
        version: '版本',
        chatPlaceholder: '微调此结果...',
        accept: '接受',
        reject: '拒绝'
      }
    },
    experimentDesign: {
      title: '实验设计',
      subtitle: '为您的研究设计严谨的实验。',
      hypothesisLabel: '研究假设',
      hypothesisPlaceholder: '例如：药物 X 降低血压...',
      ivLabel: '自变量',
      dvLabel: '因变量',
      fieldLabel: '领域',
      methodologyLabel: '方法论',
      structureLabel: '结构',
      fields: { Psychology: '心理学', Medicine: '医学', Biology: '生物学', CS: '计算机' },
      methodologies: { Auto: '自动检测', RCT: '随机对照试验', Survey: '调查', Lab: '实验室实验' },
      structures: { Between: '组间设计', Within: '组内设计', Mixed: '混合设计' },
      advancedSettings: '高级设置',
      alpha: 'Alpha',
      power: 'Power',
      effectSize: '效应量',
      effectSizes: { small: '小', medium: '中', large: '大', custom: '自定义' },
      optimizeBtn: '优化',
      optimizing: '正在优化...',
      btn: '生成设计',
      generating: '正在设计实验...',
      sampleSize: '样本量',
      variables: '变量',
      analysis: '分析计划',
      flow: '实验流程',
      templates: {
        title: '快速模板',
        subtitle: '从标准设计开始',
        rct: 'RCT',
        rctDesc: '随机对照试验',
        ab: 'A/B 测试',
        abDesc: '简单对比',
        memory: '记忆任务',
        memoryDesc: '认知心理学'
      }
    },
    data: {
      title: '数据分析',
      subtitle: '用 AI 分析您的数据。',
      upload: '上传数据文件'
    },
    chart: {
      title: '图表提取',
      subtitle: '从图表图像中提取数据。',
      upload: '上传图片',
      extracting: '正在提取...'
    },
    code: {
      title: '代码助手',
      newSession: '新会话',
      history: '历史记录',
      inputPlaceholder: {
        generate: '描述您需要的代码...',
        debug: '粘贴要调试的代码...',
        explain: '粘贴要解释的代码...'
      },
      upload: '上传代码文件',
      stopBtn: '停止',
      btn: '运行',
      shortcut: 'Ctrl + Enter 运行',
      followUpPlaceholder: '追问...'
    },
    pdfChat: {
      title: '文献精读',
      subtitle: '与您的 PDF 文档对话。',
      uploadDesc: '上传 PDF 开始对话。',
      chatTitle: '对话',
      chatWelcome: '关于文档随便问我。',
      chatPlaceholder: '输入您的问题...'
    },
    knowledge: {
      title: '知识图谱',
      subtitle: '可视化研究关联。',
      connect: '连接',
      connecting: '正在连接...',
      suggestions: '建议',
      gettingSuggestions: '思考中...',
      imageNote: '图片笔记',
      analyzingImage: '分析中...',
      empty: '添加节点开始。',
      chatTitle: '图谱对话',
      chatWelcome: '询问关于连接的问题...',
      chatPlaceholder: '输入您的问题...',
      acceptNode: '添加到图谱'
    },
    figure: {
      title: '科研绘图',
      subtitle: '生成科学配图。',
      mode: {
        generate: '生成',
        polish: '润色'
      },
      polishTasks: {
        general: '通用',
        sketchTo3D: '草图转3D',
        chartBeautify: '图表美化'
      },
      input: {
        referenceLabel: '参考图 (可选)',
        sourceLabel: '源图片',
        promptLabel: '描述 / 提示词',
        promptPlaceholder: '描述图片...',
        backgroundOnly: '仅背景',
        backgroundOnlyTip: '仅生成背景。',
        sizeLabel: '尺寸',
        sizes: { single: '单栏', double: '双栏' },
        dpiLabel: 'DPI'
      },
      template: {
        title: '模板',
        subject: '主体',
        subjectPh: '例如：细胞',
        action: '动作',
        actionPh: '例如：分裂',
        environment: '环境',
        environmentPh: '例如：培养皿',
        perspective: '视角',
        perspectivePh: '例如：俯视',
        apply: '应用模板'
      },
      chartTypes: { Mechanism: '机理图', Flowchart: '流程图', Data: '数据图' },
      colorPalettes: { Default: '默认', Nature: 'Nature 风格', Science: 'Science 风格', Grayscale: '灰度' },
      btn: '生成图片',
      generating: '正在生成...',
      result: '结果',
      tools: {
        addLabel: '添加标签',
        saveWithLabels: '保存带标签图'
      },
      download: '下载',
      refinePlaceholder: '微调此图...',
      history: '历史记录'
    },
    grant: {
      title: '基金申请',
      subtitle: '基金提案辅助。',
      tabs: {
        rationale: '立项依据',
        polish: '润色',
        check: '格式检查',
        review: '预评审'
      },
      rationale: {
        title: '立项依据生成',
        references: '参考文献',
        refUpload: '上传 PDF',
        fileLimit: '个文件',
        imgUpload: '上传图片',
        refDoi: '输入 DOI (每行一个)',
        modeLabel: '生成模式',
        modes: { full: '完整依据', status: '研究现状', significance: '科学意义' }
      },
      polish: {
        title: '提案润色',
        section: '部分',
        sections: { significance: '科学意义', innovation: '创新点', feasibility: '可行性' },
        content: '内容',
        placeholder: '在此粘贴文本...'
      },
      check: {
        title: '格式检查',
        upload: '上传提案',
        btn: '检查格式',
        dash: { hard: '硬性规定', logic: '逻辑流' }
      },
      review: {
        title: '预评审',
        roleLabel: '评审角色',
        frameworkLabel: '评审框架',
        frameworkPlaceholder: '输入评审标准...',
        upload: '上传提案',
        startBtn: '开始评审',
        reportTitle: '评审报告',
        downloadPdf: '下载报告',
        verdict: '结论'
      }
    },
    conference: {
      title: '学术征稿',
      subtitle: '查找相关会议。',
      topicLabel: '主题',
      searchBtn: '搜索',
      searching: '搜索中...',
      rankLabel: '等级',
      filters: {
        type: '类型',
        typeOpts: { all: '全部', conf: '会议', journal: '期刊' },
        status: '状态',
        statusOpts: { all: '全部', upcoming: '即将截止', passed: '已截止', tba: '待定' },
        metrics: '指标 (H5)',
        h5Opts: { all: '全部', gt20: '> 20', gt50: '> 50', gt100: '> 100' },
        location: '地点',
        locationOpts: { all: '全部', asia: '亚洲', europe: '欧洲', na: '北美', online: '线上' }
      },
      conferences: '会议',
      journals: '期刊',
      website: '网站',
      daysLeft: '天剩余',
      sort: {
        deadline: '截止日期',
        rank: '等级',
        h5: 'H5 指数'
      }
    },
    aiDetector: {
      title: 'AI 率检测',
      subtitle: '检测 AI 生成内容。',
      checkBtn: '检测文本',
      humanizeBtn: '人性化',
      highlights: '高亮',
      humanized: '人性化文本',
      copy: '复制'
    },
    discussion: {
      title: '科研讨论',
      subtitle: '与多个角色模拟讨论。',
      placeholder: '输入讨论主题...',
      btn: '开始讨论',
      participantsHeader: '参与者',
      addRole: '添加角色',
      scorecard: {
        title: '创新评分卡',
        theory: '理论',
        method: '方法',
        app: '应用'
      },
      feasibility: {
        title: '可行性',
        data: '数据',
        tech: '技术',
        ethics: '伦理'
      },
      personas: {
        reviewer: '审稿人',
        interdisciplinary: '跨学科专家',
        mentor: '导师'
      }
    },
    titlePrism: {
      title: '标题精炼',
      subtitle: '多视角 AI 反馈优化您的研究标题。',
      inputSection: '输入与配置',
      draftTitle: '标题草稿',
      draftPlaceholder: '输入您的标题草稿...',
      abstract: '摘要 / 核心贡献 (可选)',
      abstractPlaceholder: '粘贴摘要以帮助 AI 理解上下文...',
      target: '目标期刊 / 领域',
      targetPlaceholder: '选择或输入期刊名称...',
      optimizeBtn: '开始多维优化',
      resultsSection: '智能分析与结果',
      councilTitle: '专家组诊断',
      optionsTitle: '精炼选项',
      analyzing: '分析中...',
      copy: '复制'
    },
    flowchart: {
      title: 'AI 流程图',
      subtitle: '将文本描述或图片一键转换为可编辑的流程图。',
      inputPlaceholder: '描述流程、工作流或逻辑...',
      uploadImage: '上传图片转换',
      generating: '正在生成流程图...',
      btn: '生成',
      resultTitle: '生成结果',
      copyCode: '复制 Mermaid 代码',
      download: '下载',
      chartType: '图表类型',
      types: { flowchart: '流程图', sequence: '时序图', gantt: '甘特图', class: '类图' }
    },
    aiWorkflow: {
      title: 'AI 科研工作流',
      subtitle: '从宏观方向到具体实施方案的三步引导。',
      steps: {
        1: '方向输入',
        2: '问题探索',
        3: '角度细化',
        4: '框架生成'
      },
      step1: {
        label: '研究大方向',
        placeholder: '例如：生成式AI在教育中的应用、新型储能材料...',
        btn: '探索研究问题'
      },
      step2: {
        title: '选择核心问题',
        subtitle: 'AI 为您挖掘了以下潜在研究方向。',
        difficulty: '难度'
      },
      step3: {
        title: '选择切入角度',
        subtitle: '您想如何解决这个问题？',
        rationale: '推荐理由'
      },
      step4: {
        title: '研究框架方案',
        logic: '逻辑框架',
        method: '研究方法',
        data: '数据来源',
        innovation: '创新点',
        export: '导出方案'
      },
      back: '返回上一步',
      restart: '开始新流程',
      loading: {
        problems: '正在扫描研究领域...',
        angles: '正在构思切入角度...',
        framework: '正在构建研究框架...'
      }
    }
  }
};