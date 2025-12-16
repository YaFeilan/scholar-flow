
import { Language } from './types';

export const TRANSLATIONS: Record<Language, any> = {
  EN: {
    appName: 'ResearchAI',
    nav: {
      search: 'Search', track: 'Track', ideaGuide: 'Idea Guide', trends: 'Trends',
      experimentDesign: 'Experiment', data: 'Data Analysis', code: 'Code', plotting: 'Plotting',
      knowledge: 'Knowledge Graph', chart: 'Chart Extraction',
      review: 'Review', polish: 'Polish', titlePrism: 'Title Prism', peer: 'Peer Review',
      advisor: 'Advisor', aiDetector: 'AI Detector', opening: 'Opening', conference: 'Conferences',
      grant: 'Grant', discussion: 'Discussion',
      ppt: 'PPT', flowchart: 'Flowchart', training: 'Training', logicTraining: 'Logic', aiWorkflow: 'Workflow'
    },
    groups: {
      input: 'Input', process: 'Process', output: 'Output', utils: 'Utilities'
    },
    search: {
      title: 'Literature Search', subtitle: 'Find and analyze papers',
      source: { online: 'Online', local: 'Local' },
      placeholder: 'Search for papers...', btn: 'Search',
      filters: { time: 'Time Range' },
      sort: { label: 'Sort by', relevance: 'Relevance', date: 'Date', if: 'Impact Factor', added: 'Date Added' },
      upload: { btn: 'Upload', tip: 'PDF, DOCX, TXT' },
      results: 'Results', generateBtn: 'Generate Review'
    },
    trends: {
      title: 'Trends', subtitle: 'Analyze research trends',
      view: { researcher: 'Researcher', institution: 'Institution' },
      placeholder: 'Enter topic...', analyze: 'Analyze', timeRange: 'Time Range',
      emerging: 'Emerging', yoy: 'YoY Growth', hotspots: 'Hotspots', methodologies: 'Methodologies'
    },
    peer: {
      title: 'Peer Review', subtitle: 'Simulate peer review',
      uploadTitle: 'Upload Manuscript', uploadDesc: 'Upload your paper to get feedback',
      targetLabel: 'Target Journal', journalLabel: 'Journal Name',
      startBtn: 'Start Review', pending: 'Ready to Review', pendingDesc: 'Upload a file to start',
      rebuttalBtn: 'Generate Rebuttal', coverLetterBtn: 'Generate Cover Letter'
    },
    review: {
      scopeTitle: 'Define Scope', topicLabel: 'Topic', focusLabel: 'Focus', dbLabel: 'Databases', timeLabel: 'Time Range',
      searchBtn: 'Search Papers', selectTitle: 'Select Papers', configTitle: 'Configuration',
      wordCount: 'Word Count', langLabel: 'Language', genBtn: 'Generate Review', complete: 'Review Generated',
      steps: { 1: 'Scope', 2: 'Select', 3: 'Config', 4: 'Result' }
    },
    track: {
      title: 'Reference Tracker', subtitle: 'Track citation network',
      tabSearch: 'Search', tabUpload: 'Upload', placeholder: 'Enter paper title or DOI', btn: 'Track',
      dragDrop: 'Drag and drop file here'
    },
    polish: {
      title: 'Polish Assistant', subtitle: 'Improve your writing',
      tabText: 'Text', tabFile: 'File', placeholder: 'Paste text here...',
      config: {
        mode: 'Mode', tone: 'Tone', field: 'Field', glossary: 'Glossary',
        modes: { EnToEn: 'English Polish', CnToEn: 'Chinese to English', EnToCn: 'English to Chinese' },
        tones: { Academic: 'Academic', Native: 'Native', Concise: 'Concise', Paraphrase: 'Paraphrase' },
        fields: { General: 'General', CS: 'Computer Science', Medicine: 'Medicine', Engineering: 'Engineering', SocialSciences: 'Social Sciences', Economics: 'Economics' }
      },
      btn: 'Polish', revisionNotes: 'Revision Notes',
      control: { cleanView: 'Clean', diffView: 'Diff', chatPlaceholder: 'Refine this result...', accept: 'Accept', reject: 'Reject', version: 'Version' }
    },
    advisor: {
      title: 'Submission Advisor', subtitle: 'Get publication advice',
      paperTitle: 'Paper Title', paperAbstract: 'Abstract', journalTitle: 'Target Journal',
      abstractPlaceholder: 'Paste abstract...', focusLabel: 'Focus', focusPlaceholder: 'e.g. Methodology',
      btn: 'Analyze', history: 'History', alternatives: 'Alternatives', risks: 'Risks', apply: 'Apply'
    },
    ppt: {
      title: 'PPT Generator', subtitle: 'Create slides from paper',
      uploadLabel: 'Upload Paper', nameLabel: 'Name', schoolLabel: 'Affiliation',
      densityLabel: 'Content Density', densityLow: 'Simple', densityHigh: 'Rich',
      pagesLabel: 'Number of Slides', styleBtn: 'Analyze Style', steps: { 2: 'Config', 3: 'Style' },
      analyzing: 'Analyzing...', genBtn: 'Generate PPT', generating: 'Generating...',
      input: { referenceLabel: 'Reference', sourceLabel: 'Source', promptLabel: 'Prompt', promptPlaceholder: 'Describe slide...', backgroundOnly: 'Background Only', backgroundOnlyTip: 'Generate background only', sizeLabel: 'Size', dpiLabel: 'DPI', sizes: { single: 'Single Col', double: 'Double Col' } },
      template: { title: 'Template', subject: 'Subject', action: 'Action', environment: 'Environment', perspective: 'Perspective', subjectPh: 'Subject...', actionPh: 'Action...', environmentPh: 'Env...', perspectivePh: 'View...', apply: 'Apply' },
      mode: { generate: 'Generate', polish: 'Polish' }, polishTasks: { general: 'General', sketchTo3D: 'Sketch to 3D', chartBeautify: 'Beautify Chart' },
      result: 'Result', tools: { addLabel: 'Label', saveWithLabels: 'Save Labels' }, download: 'Download', refinePlaceholder: 'Refine...', history: 'History'
    },
    opening: {
      title: 'Opening Review', subtitle: 'Review opening report',
      uploadDesc: 'Upload opening report PDF', targetLabel: 'Target', targetPlaceholder: 'e.g. PhD Thesis',
      rolesLabel: 'Roles', focusLabel: 'Focus', focusPlaceholder: 'Specific concerns...', btn: 'Review',
      roles: { mentor: { name: 'Mentor', desc: 'Guidance' }, expert: { name: 'Expert', desc: 'Technical' }, peer: { name: 'Peer', desc: 'Feedback' }, committee: { name: 'Committee', desc: 'Rules' } }
    },
    data: {
      title: 'Data Analysis', subtitle: 'Analyze research data',
      upload: 'Upload Data', extracting: 'Extracting...'
    },
    code: {
      title: 'Code Assistant', newSession: 'New Session', history: 'History',
      inputPlaceholder: { generate: 'Describe code to generate...', debug: 'Paste code to debug...', explain: 'Paste code to explain...' },
      upload: 'Upload', stopBtn: 'Stop', btn: 'Run', shortcut: 'Ctrl + Enter to run', followUpPlaceholder: 'Follow up...'
    },
    experimentDesign: {
      title: 'Experiment Design', subtitle: 'Design your experiment',
      hypothesisLabel: 'Hypothesis', hypothesisPlaceholder: 'Enter hypothesis...', ivLabel: 'IV', dvLabel: 'DV',
      fieldLabel: 'Field', fields: { Psychology: 'Psychology', Medicine: 'Medicine', UX: 'UX', Biology: 'Biology', Sociology: 'Sociology' },
      methodologyLabel: 'Methodology', methodologies: { Auto: 'Auto', RCT: 'RCT', Survey: 'Survey', Lab: 'Lab Experiment', Longitudinal: 'Longitudinal' },
      structureLabel: 'Structure', structures: { Between: 'Between-Subjects', Within: 'Within-Subjects', Mixed: 'Mixed Design' },
      advancedSettings: 'Advanced Settings', alpha: 'Alpha', power: 'Power', effectSize: 'Effect Size',
      effectSizes: { small: 'Small', medium: 'Medium', large: 'Large', custom: 'Custom' },
      optimizeBtn: 'Optimize', optimizing: 'Optimizing...', btn: 'Generate Design', generating: 'Generating...',
      sampleSize: 'Sample Size', variables: 'Variables', analysis: 'Analysis', flow: 'Procedure',
      templates: { title: 'Templates', subtitle: 'Quick start', rct: 'RCT', ab: 'A/B Test', memory: 'Memory Exp', rctDesc: 'Medical trial', abDesc: 'User testing', memoryDesc: 'Cognitive' }
    },
    knowledge: {
      title: 'Knowledge Graph', subtitle: 'Visualize connections',
      connect: 'Connect', connecting: 'Connecting...', suggestions: 'Suggestions', gettingSuggestions: 'Thinking...',
      imageNote: 'Image Note', analyzingImage: 'Analyzing...', acceptNode: 'Accept Node', empty: 'Add papers or notes to start.'
    },
    grant: {
      title: 'Grant Application', subtitle: 'Drafting assistant',
      tabs: { rationale: 'Rationale', polish: 'Polish', check: 'Check', review: 'Review' },
      rationale: { title: 'Rationale Generation', references: 'References', refUpload: 'Upload PDF', fileLimit: '(Max 30)', imgUpload: 'Upload Image', refDoi: 'Paste DOIs...', modeLabel: 'Generation Mode', modes: { full: 'Full Rationale', status: 'Research Status', significance: 'Significance' } },
      polish: { title: 'Polish Proposal', section: 'Section', sections: { significance: 'Significance', innovation: 'Innovation', foundation: 'Foundation' }, content: 'Content', placeholder: 'Paste content...' },
      check: { title: 'Format Check', upload: 'Upload Proposal', dash: { hard: 'Hard Rules', logic: 'Logic' } },
      review: { title: 'Review Simulation', roleLabel: 'Role', frameworkLabel: 'Framework', frameworkPlaceholder: '...', upload: 'Upload Proposal', startBtn: 'Start Review', reportTitle: 'Review Report', verdict: 'Verdict', downloadPdf: 'Download PDF' }
    },
    conference: {
      title: 'Conference Finder', subtitle: 'Find conferences',
      topicLabel: 'Topic', searching: 'Searching...', searchBtn: 'Search',
      rankLabel: 'Rank', daysLeft: 'days left', website: 'Website', conferences: 'Conferences', journals: 'Journals',
      filters: { type: 'Type', typeOpts: { all: 'All', conf: 'Conf', journal: 'Journal' }, status: 'Status', statusOpts: { all: 'All', upcoming: 'Upcoming', passed: 'Passed', tba: 'TBA' }, metrics: 'Metrics', h5Opts: { all: 'All', gt20: '> 20', gt50: '> 50', gt100: '> 100' }, location: 'Location', locationOpts: { all: 'All', asia: 'Asia', europe: 'Europe', na: 'North America', online: 'Online' } },
      sort: { deadline: 'Deadline', rank: 'Rank', h5: 'H5 Index' }
    },
    aiDetector: {
      title: 'AI Detector', subtitle: 'Detect AI generated content',
      checkBtn: 'Check', humanizeBtn: 'Humanize', highlights: 'Highlights', humanized: 'Humanized', copy: 'Copy'
    },
    discussion: {
      title: 'Research Discussion', subtitle: 'Simulate discussions',
      placeholder: 'Enter discussion topic...', participantsHeader: 'Participants', addRole: 'Add Role', btn: 'Start Discussion',
      scorecard: { title: 'Scorecard', theory: 'Theory', method: 'Method', app: 'Application' },
      feasibility: { title: 'Feasibility', data: 'Data', tech: 'Tech', ethics: 'Ethics' },
      personas: { reviewer: 'Reviewer', interdisciplinary: 'Interdisciplinary', mentor: 'Mentor' }
    },
    titlePrism: {
      title: 'Title Prism', subtitle: 'Optimize titles',
      inputSection: 'Input', draftTitle: 'Draft Title', draftPlaceholder: '...', abstract: 'Abstract', abstractPlaceholder: '...', target: 'Target', targetPlaceholder: '...', optimizeBtn: 'Optimize',
      councilTitle: 'Council Feedback', optionsTitle: 'Refined Options', copy: 'Copied'
    },
    flowchart: {
      title: 'Flowchart Generator', subtitle: 'Generate flowcharts',
      chartType: 'Type', types: { flowchart: 'Flowchart', sequence: 'Sequence', class: 'Class', state: 'State', er: 'ER', gantt: 'Gantt' },
      uploadImage: 'Upload Image', inputPlaceholder: 'Describe process...', btn: 'Generate',
      resultTitle: 'Result', copyCode: 'Copy Code', download: 'Download'
    },
    aiWorkflow: {
      title: 'AI Workflow', subtitle: 'Research workflow assistant',
      steps: { 1: 'Direction', 2: 'Problems', 3: 'Angles', 4: 'Framework' },
      step1: { label: 'Research Direction', placeholder: 'e.g. AI in Healthcare', btn: 'Start' },
      step2: { title: 'Select Problem', subtitle: 'Choose a problem to solve' },
      step3: { title: 'Refine Angle', subtitle: 'Choose a research angle', rationale: 'Rationale' },
      step4: { logic: 'Logic Framework', innovation: 'Innovation', method: 'Methodology', data: 'Data', export: 'Export PDF' },
      loading: { problems: 'Generating Problems...', angles: 'Refining Angles...', framework: 'Building Framework...' },
      restart: 'Restart', back: 'Back'
    },
    training: {
      title: 'Research Training', subtitle: 'Improve research skills',
      menu: { defense: 'Defense', logic: 'Logic' },
      setup: { uploadLabel: 'Upload Paper', topicLabel: 'Topic', placeholder: 'Enter topic...', personaLabel: 'Persona', personas: { method: 'Methodology', methodDesc: 'Focus on method', innov: 'Innovation', innovDesc: 'Focus on novelty', prac: 'Practical', pracDesc: 'Focus on application' }, btn: 'Start Training' },
      battle: { turnReport: 'Turn Analysis', original: 'Original', better: 'Better', strengths: 'Strengths', weaknesses: 'Weaknesses', nextQ: 'Next Question', hint: 'Hint', aiThinking: 'AI is thinking...' },
      report: { title: 'Training Report', actionPlan: 'Action Plan', restart: 'Restart' },
      logic: { fallacy: 'Fallacy', reconstruction: 'Reconstruction', stress: 'Stress Test' },
      fallacy: { task: 'Find the Fallacy', reason: 'Reasoning', check: 'Check', types: { strawman: 'Strawman', adhominem: 'Ad Hominem', slipperyslope: 'Slippery Slope', circular: 'Circular Reasoning' } },
      reconstruction: { task: 'Reconstruct Argument', premise: 'Premise', evidence: 'Evidence', conclusion: 'Conclusion', evaluate: 'Evaluate' },
      stress: { placeholder: 'Enter hypothesis to test...', start: 'Start Test' }
    },
    pdfChat: {
      title: 'PDF Chat',
      modes: { standard: 'Standard', guided: 'Guided', game: 'Game' },
      tools: { outline: 'Outline', notes: 'Notes', bookmarks: 'Bookmarks', addNote: 'Add Note', addBookmark: 'Bookmark' },
      guided: { path: 'Reading Path' },
      game: { points: 'Points', level: 'Level', challengeBtn: 'Quiz Challenge', quizTitle: 'Pop Quiz' },
      chatTitle: 'Chat', chatWelcome: 'Ask questions about the paper.', chatPlaceholder: 'Ask...'
    },
    chart: {
      title: 'Chart Extraction', subtitle: 'Extract data from charts',
      upload: 'Upload Image', extracting: 'Extracting...'
    },
    scientific: {
      title: 'Scientific Plotting', subtitle: 'Plot scientific data',
      import: 'Import', config: 'Config', style: 'Style',
      upload: 'Upload Data', paste: 'Paste Data',
      types: { bar: 'Bar', line: 'Line', scatter: 'Scatter', pie: 'Pie', radar: 'Radar' },
      axes: { x: 'X Axis', y: 'Y Axis' }, stats: { mean: 'Mean & Error' },
      themes: { Nature: 'Nature', Science: 'Science', Cell: 'Cell', Classic: 'Classic' },
      aiPrompt: 'Ask AI to configure plot...'
    },
    welcome: {
      title: 'Welcome to ResearchAI', subtitle: 'Your AI Research Assistant',
      opensource: 'This is an open-source project designed to help researchers.',
      githubBtn: 'View on GitHub', starSupport: 'Star to support us', close: 'Close', license: 'MIT License'
    },
    idea: {
      title: 'Idea Guide', subtitle: 'Generate research ideas',
      placeholder: 'Enter research interest...', focus: { label: 'Focus', general: 'General', data: 'Data-Driven', policy: 'Policy', theory: 'Theory' },
      btn: 'Generate Ideas', exportProposal: 'Export', directions: 'Directions', selectDirection: 'Select',
      methodology: 'Methodology', dataSources: 'Data Sources', titles: 'Titles', corePapers: 'Core Papers',
      journals: 'Journals', followUpPlaceholder: 'Deep dive query...', followUpBtn: 'Ask', logicFlow: 'Logic Flow', deepDive: 'Deep Dive', keywords: 'Keywords'
    },
    figure: {
      title: 'Figure Generator', subtitle: 'Generate scientific figures',
      mode: { generate: 'Generate', polish: 'Polish' },
      polishTasks: { general: 'General', sketchTo3D: 'Sketch to 3D', chartBeautify: 'Beautify Chart' },
      input: { referenceLabel: 'Reference', sourceLabel: 'Source', promptLabel: 'Prompt', promptPlaceholder: 'Describe figure...', backgroundOnly: 'Background Only', backgroundOnlyTip: 'Generate background only', sizeLabel: 'Size', dpiLabel: 'DPI', sizes: { single: 'Single Col', double: 'Double Col' } },
      template: { title: 'Template', subject: 'Subject', action: 'Action', environment: 'Environment', perspective: 'Perspective', subjectPh: 'Subject...', actionPh: 'Action...', environmentPh: 'Env...', perspectivePh: 'View...', apply: 'Apply' },
      btn: 'Generate', generating: 'Generating...', result: 'Result', tools: { addLabel: 'Label', saveWithLabels: 'Save Labels' }, download: 'Download', refinePlaceholder: 'Refine...', history: 'History',
      chartTypes: { Mechanism: 'Mechanism', Data: 'Data Plot', Schematic: 'Schematic', Photo: 'Photograph' },
      colorPalettes: { Default: 'Default', Nature: 'Nature', Science: 'Science', Vibrant: 'Vibrant', Grayscale: 'Grayscale' }
    }
  },
  ZH: {
    appName: 'ResearchAI',
    nav: {
      search: '文献搜索', track: '引用追踪', ideaGuide: '灵感指南', trends: '趋势分析',
      experimentDesign: '实验设计', data: '数据分析', code: '代码助手', plotting: '科研绘图',
      knowledge: '知识图谱', chart: '图表提取',
      review: '综述生成', polish: '论文润色', titlePrism: '标题棱镜', peer: '模拟评审',
      advisor: '投稿顾问', aiDetector: 'AI 检测', opening: '开题报告', conference: '会议查询',
      grant: '标书助手', discussion: '学术讨论',
      ppt: 'PPT 生成', flowchart: '流程图', training: '科研训练', logicTraining: '逻辑训练', aiWorkflow: 'AI 工作流'
    },
    groups: {
      input: '输入', process: '处理', output: '输出', utils: '工具'
    },
    search: {
      title: '文献搜索', subtitle: '发现并分析文献',
      source: { online: '在线', local: '本地' },
      placeholder: '搜索论文...', btn: '搜索',
      filters: { time: '时间范围' },
      sort: { label: '排序', relevance: '相关性', date: '日期', if: '影响因子', added: '添加日期' },
      upload: { btn: '上传', tip: 'PDF, DOCX, TXT' },
      results: '结果', generateBtn: '生成综述'
    },
    trends: {
      title: '趋势分析', subtitle: '分析研究热点',
      view: { researcher: '研究者', institution: '机构' },
      placeholder: '输入主题...', analyze: '分析', timeRange: '时间范围',
      emerging: '新兴技术', yoy: '同比增长', hotspots: '热点', methodologies: '方法论'
    },
    peer: {
      title: '模拟评审', subtitle: '获取评审意见',
      uploadTitle: '上传稿件', uploadDesc: '上传论文以获取反馈',
      targetLabel: '目标期刊', journalLabel: '期刊名称',
      startBtn: '开始评审', pending: '准备就绪', pendingDesc: '上传文件开始',
      rebuttalBtn: '生成回复信', coverLetterBtn: '生成投稿信'
    },
    review: {
      scopeTitle: '定义范围', topicLabel: '主题', focusLabel: '侧重点', dbLabel: '数据库', timeLabel: '时间范围',
      searchBtn: '搜索论文', selectTitle: '选择论文', configTitle: '配置',
      wordCount: '字数', langLabel: '语言', genBtn: '生成综述', complete: '生成完成',
      steps: { 1: '范围', 2: '选择', 3: '配置', 4: '结果' }
    },
    track: {
      title: '引用追踪', subtitle: '追踪引文网络',
      tabSearch: '搜索', tabUpload: '上传', placeholder: '输入标题或 DOI', btn: '追踪',
      dragDrop: '拖拽文件到此处'
    },
    polish: {
      title: '润色助手', subtitle: '提升写作质量',
      tabText: '文本', tabFile: '文件', placeholder: '粘贴文本...',
      config: {
        mode: '模式', tone: '语气', field: '领域', glossary: '术语表',
        modes: { EnToEn: '英文润色', CnToEn: '中译英', EnToCn: '英译中' },
        tones: { Academic: '学术', Native: '地道', Concise: '简洁', Paraphrase: '改写' },
        fields: { General: '通用', CS: '计算机', Medicine: '医学', Engineering: '工程', SocialSciences: '社科', Economics: '经济' }
      },
      btn: '润色', revisionNotes: '修改记录',
      control: { cleanView: '纯净版', diffView: '对比版', chatPlaceholder: '微调结果...', accept: '接受', reject: '拒绝', version: '版本' }
    },
    advisor: {
      title: '投稿顾问', subtitle: '获取投稿建议',
      paperTitle: '论文标题', paperAbstract: '摘要', journalTitle: '目标期刊',
      abstractPlaceholder: '粘贴摘要...', focusLabel: '侧重点', focusPlaceholder: '例如：方法论',
      btn: '分析', history: '历史记录', alternatives: '推荐期刊', risks: '风险评估', apply: '应用'
    },
    ppt: {
      title: 'PPT 生成', subtitle: '论文转 PPT',
      uploadLabel: '上传论文', nameLabel: '姓名', schoolLabel: '单位',
      densityLabel: '内容密度', densityLow: '简洁', densityHigh: '丰富',
      pagesLabel: '页数', styleBtn: '分析风格', steps: { 2: '配置', 3: '风格' },
      analyzing: '分析中...', genBtn: '生成 PPT', generating: '生成中...',
      input: { referenceLabel: '参考图', sourceLabel: '源文件', promptLabel: '提示词', promptPlaceholder: '描述幻灯片...', backgroundOnly: '仅背景', backgroundOnlyTip: '仅生成背景图', sizeLabel: '尺寸', dpiLabel: 'DPI', sizes: { single: '单栏', double: '双栏' } },
      template: { title: '模板', subject: '主体', action: '动作', environment: '环境', perspective: '视角', subjectPh: '主体...', actionPh: '动作...', environmentPh: '环境...', perspectivePh: '视角...', apply: '应用' },
      mode: { generate: '生成', polish: '润色' }, polishTasks: { general: '通用', sketchTo3D: '草图转3D', chartBeautify: '图表美化' },
      result: '结果', tools: { addLabel: '标签', saveWithLabels: '保存标签' }, download: '下载', refinePlaceholder: '优化...', history: '历史'
    },
    opening: {
      title: '开题报告', subtitle: '开题报告评审',
      uploadDesc: '上传开题报告 PDF', targetLabel: '目标', targetPlaceholder: '例如：博士学位论文',
      rolesLabel: '评审角色', focusLabel: '侧重点', focusPlaceholder: '具体关注点...', btn: '评审',
      roles: { mentor: { name: '导师', desc: '指导方向' }, expert: { name: '专家', desc: '技术细节' }, peer: { name: '同行', desc: '反馈建议' }, committee: { name: '委员会', desc: '规范审查' } }
    },
    data: {
      title: '数据分析', subtitle: '分析研究数据',
      upload: '上传数据', extracting: '提取中...'
    },
    code: {
      title: '代码助手', newSession: '新会话', history: '历史',
      inputPlaceholder: { generate: '描述要生成的代码...', debug: '粘贴代码以调试...', explain: '粘贴代码以解释...' },
      upload: '上传', stopBtn: '停止', btn: '运行', shortcut: 'Ctrl + Enter 运行', followUpPlaceholder: '追问...'
    },
    experimentDesign: {
      title: '实验设计', subtitle: '设计实验方案',
      hypothesisLabel: '假设', hypothesisPlaceholder: '输入假设...', ivLabel: '自变量', dvLabel: '因变量',
      fieldLabel: '领域', fields: { Psychology: '心理学', Medicine: '医学', UX: '用户体验', Biology: '生物', Sociology: '社会学' },
      methodologyLabel: '方法论', methodologies: { Auto: '自动', RCT: '随机对照', Survey: '调查', Lab: '实验室', Longitudinal: '纵向' },
      structureLabel: '结构', structures: { Between: '组间', Within: '组内', Mixed: '混合' },
      advancedSettings: '高级设置', alpha: 'Alpha', power: 'Power', effectSize: '效应量',
      effectSizes: { small: '小', medium: '中', large: '大', custom: '自定义' },
      optimizeBtn: '优化', optimizing: '优化中...', btn: '生成设计', generating: '生成中...',
      sampleSize: '样本量', variables: '变量', analysis: '分析方法', flow: '流程',
      templates: { title: '模板', subtitle: '快速开始', rct: '随机对照', ab: 'A/B 测试', memory: '记忆实验', rctDesc: '医学试验', abDesc: '用户测试', memoryDesc: '认知实验' }
    },
    knowledge: {
      title: '知识图谱', subtitle: '可视化关联',
      connect: '连接', connecting: '连接中...', suggestions: '建议', gettingSuggestions: '思考中...',
      imageNote: '图片笔记', analyzingImage: '分析中...', acceptNode: '接受节点', empty: '添加论文或笔记以开始。'
    },
    grant: {
      title: '标书助手', subtitle: '基金申请辅助',
      tabs: { rationale: '立项依据', polish: '润色', check: '形式审查', review: '模拟评审' },
      rationale: { title: '立项依据生成', references: '参考文献', refUpload: '上传 PDF', fileLimit: '(最多30篇)', imgUpload: '上传机制图', refDoi: '粘贴 DOI...', modeLabel: '生成模式', modes: { full: '完整立项依据', status: '研究现状', significance: '科学意义' } },
      polish: { title: '标书润色', section: '章节', sections: { significance: '科学意义', innovation: '创新点', foundation: '研究基础' }, content: '内容', placeholder: '粘贴内容...' },
      check: { title: '形式审查', upload: '上传标书', dash: { hard: '硬性规定', logic: '逻辑检查' } },
      review: { title: '模拟评审', roleLabel: '评审专家角色', frameworkLabel: '评审标准', frameworkPlaceholder: '...', upload: '上传标书', startBtn: '开始评审', reportTitle: '评审报告', verdict: '评审结论', downloadPdf: '下载 PDF' }
    },
    conference: {
      title: '会议查询', subtitle: '查询学术会议',
      topicLabel: '主题', searching: '搜索中...', searchBtn: '搜索',
      rankLabel: '等级', daysLeft: '天剩余', website: '官网', conferences: '会议', journals: '期刊',
      filters: { type: '类型', typeOpts: { all: '全部', conf: '会议', journal: '期刊' }, status: '状态', statusOpts: { all: '全部', upcoming: '即将召开', passed: '已结束', tba: '待定' }, metrics: '指标', h5Opts: { all: '全部', gt20: '> 20', gt50: '> 50', gt100: '> 100' }, location: '地点', locationOpts: { all: '全部', asia: '亚洲', europe: '欧洲', na: '北美', online: '线上' } },
      sort: { deadline: '截止日期', rank: '等级', h5: 'H5 指数' }
    },
    aiDetector: {
      title: 'AI 检测', subtitle: '检测 AI 生成内容',
      checkBtn: '检测', humanizeBtn: '人性化', highlights: '高亮', humanized: '人性化结果', copy: '复制'
    },
    discussion: {
      title: '学术讨论', subtitle: '模拟学术讨论',
      placeholder: '输入讨论主题...', participantsHeader: '参与者', addRole: '添加角色', btn: '开始讨论',
      scorecard: { title: '评分卡', theory: '理论', method: '方法', app: '应用' },
      feasibility: { title: '可行性', data: '数据', tech: '技术', ethics: '伦理' },
      personas: { reviewer: '审稿人', interdisciplinary: '跨学科专家', mentor: '导师' }
    },
    titlePrism: {
      title: '标题棱镜', subtitle: '优化论文标题',
      inputSection: '输入', draftTitle: '草拟标题', draftPlaceholder: '...', abstract: '摘要', abstractPlaceholder: '...', target: '目标', targetPlaceholder: '...', optimizeBtn: '优化',
      councilTitle: '专家委员会反馈', optionsTitle: '优化选项', copy: '已复制'
    },
    flowchart: {
      title: '流程图生成', subtitle: '生成流程图',
      chartType: '类型', types: { flowchart: '流程图', sequence: '时序图', class: '类图', state: '状态图', er: 'ER图', gantt: '甘特图' },
      uploadImage: '上传图片', inputPlaceholder: '描述流程...', btn: '生成',
      resultTitle: '结果', copyCode: '复制代码', download: '下载'
    },
    aiWorkflow: {
      title: 'AI 工作流', subtitle: '研究工作流助手',
      steps: { 1: '方向', 2: '问题', 3: '切入点', 4: '框架' },
      step1: { label: '研究方向', placeholder: '例如：医疗 AI', btn: '开始' },
      step2: { title: '选择问题', subtitle: '选择要解决的问题' },
      step3: { title: '优化切入点', subtitle: '选择研究切入点', rationale: '理由' },
      step4: { logic: '逻辑框架', innovation: '创新点', method: '方法论', data: '数据', export: '导出 PDF' },
      loading: { problems: '生成问题中...', angles: '优化切入点中...', framework: '构建框架中...' },
      restart: '重新开始', back: '返回'
    },
    training: {
      title: '科研训练', subtitle: '提升科研能力',
      menu: { defense: '答辩', logic: '逻辑' },
      setup: { uploadLabel: '上传论文', topicLabel: '主题', placeholder: '输入主题...', personaLabel: '角色', personas: { method: '方法论', methodDesc: '关注方法', innov: '创新性', innovDesc: '关注新颖性', prac: '实用性', pracDesc: '关注应用' }, btn: '开始训练' },
      battle: { turnReport: '回合分析', original: '原始回答', better: '优化回答', strengths: '优点', weaknesses: '缺点', nextQ: '下一题', hint: '提示', aiThinking: 'AI 思考中...' },
      report: { title: '训练报告', actionPlan: '行动计划', restart: '重新开始' },
      logic: { fallacy: '谬误', reconstruction: '重构', stress: '压力测试' },
      fallacy: { task: '寻找谬误', reason: '理由', check: '检查', types: { strawman: '稻草人谬误', adhominem: '人身攻击', slipperyslope: '滑坡谬误', circular: '循环论证' } },
      reconstruction: { task: '重构论证', premise: '前提', evidence: '证据', conclusion: '结论', evaluate: '评估' },
      stress: { placeholder: '输入假设以测试...', start: '开始测试' }
    },
    pdfChat: {
      title: 'PDF 导读',
      modes: { standard: '标准', guided: '导读', game: '游戏' },
      tools: { outline: '大纲', notes: '笔记', bookmarks: '书签', addNote: '添加笔记', addBookmark: '添加书签' },
      guided: { path: '阅读路径' },
      game: { points: '积分', level: '等级', challengeBtn: '挑战问答', quizTitle: '小测验' },
      chatTitle: '对话', chatWelcome: '关于论文提问。', chatPlaceholder: '提问...'
    },
    chart: {
      title: '图表提取', subtitle: '提取图表数据',
      upload: '上传图片', extracting: '提取中...'
    },
    scientific: {
      title: '科研绘图', subtitle: '绘制科研图表',
      import: '导入', config: '配置', style: '样式',
      upload: '上传数据', paste: '粘贴数据',
      types: { bar: '柱状图', line: '折线图', scatter: '散点图', pie: '饼图', radar: '雷达图' },
      axes: { x: 'X 轴', y: 'Y 轴' }, stats: { mean: '均值与误差' },
      themes: { Nature: 'Nature', Science: 'Science', Cell: 'Cell', Classic: '经典' },
      aiPrompt: '让 AI 配置图表...'
    },
    welcome: {
      title: '欢迎使用 ResearchAI', subtitle: '您的 AI 科研助手',
      opensource: '这是一个旨在帮助研究人员的开源项目。',
      githubBtn: '在 GitHub 上查看', starSupport: '点星支持我们', close: '关闭', license: 'MIT 协议'
    },
    idea: {
      title: '灵感指南', subtitle: '生成研究灵感',
      placeholder: '输入研究兴趣...', focus: { label: '侧重点', general: '通用', data: '数据驱动', policy: '政策导向', theory: '理论重度' },
      btn: '生成灵感', exportProposal: '导出', directions: '方向', selectDirection: '选择',
      methodology: '方法论', dataSources: '数据来源', titles: '标题', corePapers: '核心文献',
      journals: '期刊', followUpPlaceholder: '深入追问...', followUpBtn: '提问', logicFlow: '逻辑流', deepDive: '深入挖掘', keywords: '关键词'
    },
    figure: {
      title: '图像生成', subtitle: '生成科研图像',
      mode: { generate: '生成', polish: '润色' },
      polishTasks: { general: '通用', sketchTo3D: '草图转3D', chartBeautify: '图表美化' },
      input: { referenceLabel: '参考', sourceLabel: '源', promptLabel: '提示词', promptPlaceholder: '描述图像...', backgroundOnly: '仅背景', backgroundOnlyTip: '仅生成背景', sizeLabel: '尺寸', dpiLabel: 'DPI', sizes: { single: '单栏', double: '双栏' } },
      template: { title: '模板', subject: '主体', action: '动作', environment: '环境', perspective: '视角', subjectPh: '主体...', actionPh: '动作...', environmentPh: '环境...', perspectivePh: '视角...', apply: '应用' },
      btn: '生成', generating: '生成中...', result: '结果', tools: { addLabel: '标签', saveWithLabels: '保存标签' }, download: '下载', refinePlaceholder: '优化...', history: '历史',
      chartTypes: { Mechanism: '机理图', Data: '数据图', Schematic: '示意图', Photo: '照片' },
      colorPalettes: { Default: '默认', Nature: 'Nature', Science: 'Science', Vibrant: '鲜艳', Grayscale: '灰度' }
    }
  }
};
