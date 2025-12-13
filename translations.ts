
export const TRANSLATIONS = {
  EN: {
    appName: 'Research Assistant',
    groups: {
      input: 'Input',
      process: 'Process',
      output: 'Output',
      utils: 'Utilities'
    },
    welcome: {
      title: 'Welcome to Research Assistant',
      subtitle: 'Your intelligent academic companion',
      opensource: 'This project is completely free and open source on GitHub.',
      githubBtn: 'View on GitHub',
      starSupport: 'If you find this helpful, please star us on GitHub to show your support! 🌟',
      license: 'Released under the MIT License',
      close: 'Get Started'
    },
    nav: {
      search: 'Search',
      track: 'Tracker',
      pdfChat: 'PDF Chat',
      idea: 'Idea Guide',
      trends: 'Trends',
      experimentDesign: 'Exp. Design',
      data: 'Data Analysis',
      code: 'Code Assistant',
      plotting: 'Plotting',
      knowledge: 'Knowledge Graph',
      chart: 'Chart Extract',
      review: 'Review Gen',
      polish: 'Polish',
      titlePrism: 'Title Prism',
      peer: 'Peer Review',
      advisor: 'Advisor',
      aiDetector: 'AI Detector',
      opening: 'Opening',
      conference: 'Conferences',
      grant: 'Grant App',
      discussion: 'Discussion',
      ppt: 'PPT Gen',
      flowchart: 'Flowchart',
      training: 'Training',
      aiWorkflow: 'AI Workflow'
    },
    aiWorkflow: {
      title: 'AI Research Workflow',
      subtitle: 'End-to-end research planning from topic to execution framework.',
      steps: {
        1: 'Direction',
        2: 'Problem',
        3: 'Refinement',
        4: 'Framework'
      },
      step1: {
        label: 'Research Direction',
        placeholder: 'e.g., Large Language Models in Healthcare',
        btn: 'Explore Problems'
      },
      step2: {
        title: 'Select a Problem',
        subtitle: 'AI identified these core problems in the field.'
      },
      step3: {
        title: 'Refine Angle',
        subtitle: 'Choose a specific research angle.',
        rationale: 'Rationale'
      },
      step4: {
        logic: 'Logic Framework',
        innovation: 'Innovation Points',
        method: 'Methodology',
        data: 'Data Sources',
        export: 'Export PDF'
      },
      loading: {
        problems: 'Analyzing field...',
        angles: 'Refining angles...',
        framework: 'Building framework...'
      },
      restart: 'Restart',
      back: 'Back'
    },
    scientific: {
      title: 'Scientific Plotting',
      subtitle: 'Create publication-ready charts from data.',
      import: 'Import Data',
      config: 'Configuration',
      style: 'Styling',
      upload: 'Upload CSV/Excel',
      paste: 'Paste data here...',
      types: {
        bar: 'Bar Chart',
        line: 'Line Chart',
        scatter: 'Scatter Plot',
        pie: 'Pie Chart',
        radar: 'Radar Chart'
      },
      themes: {
        Nature: 'Nature',
        Science: 'Science',
        Cell: 'Cell',
        Classic: 'Classic'
      },
      axes: { x: 'X Axis', y: 'Y Axis' },
      stats: { mean: 'Show Mean/Error' },
      aiPrompt: 'Describe the chart you want (AI)...',
      titlePreview: 'Preview'
    },
    pdfChat: {
        title: 'Intensive Reading',
        modes: { standard: 'Standard', guided: 'Guided', game: 'Game' },
        tools: { outline: 'Outline', notes: 'Notes', bookmarks: 'Bookmarks', addLabel: 'Label', addNote: 'Note', addBookmark: 'Bookmark' },
        game: { points: 'Points', level: 'Level', challengeBtn: 'Quiz Challenge', quizTitle: 'Pop Quiz' },
        guided: { path: 'Learning Path' }
    },
    search: { title: 'Search', subtitle: 'Find papers', source: {online: 'Online', local: 'Local'}, placeholder: 'Keywords...', btn: 'Search', filters: {time: 'Time'}, upload: {btn: 'Upload', tip: 'PDF'}, results: 'Results', sort: {label: 'Sort', relevance: 'Relevance', date: 'Date', if: 'IF', added: 'Added'}, generateBtn: 'Generate Review', interpret: 'Interpret', interpretationResult: 'Interpretation' },
    trends: { emerging: 'Emerging', yoy: 'YoY', hotspots: 'Hotspots', methodologies: 'Methodologies', analyze: 'Analyze', placeholder: 'Topic...', timeRange: 'Time Range', view: {researcher: 'Researcher', institution: 'Institution'} },
    track: { title: 'Reference Tracker', subtitle: 'Track citations', tabSearch: 'Search', tabUpload: 'Upload', placeholder: 'Paper title...', btn: 'Track', dragDrop: 'Drag PDF here' },
    code: { title: 'Code Assistant', newSession: 'New Session', history: 'History', inputPlaceholder: {generate: 'Describe code...', debug: 'Paste code to debug...', explain: 'Paste code to explain...'}, upload: 'Upload Script', stopBtn: 'Stop', btn: 'Run', shortcut: 'Ctrl+Enter' },
    experimentDesign: { title: 'Experiment Design', subtitle: 'Design your study', hypothesisLabel: 'Hypothesis', hypothesisPlaceholder: 'Enter hypothesis...', ivLabel: 'IV', dvLabel: 'DV', fieldLabel: 'Field', fields: {Psychology:'Psychology', Medicine:'Medicine', UX:'UX'}, methodologyLabel: 'Methodology', methodologies: {Lab:'Lab', Survey:'Survey', RCT:'RCT', Auto:'Auto'}, structureLabel: 'Structure', structures: {Between:'Between', Within:'Within'}, advancedSettings: 'Advanced Stats', alpha: 'Alpha', power: 'Power', effectSize: 'Effect Size', effectSizes: {small:'Small', medium:'Medium', large:'Large', custom:'Custom'}, optimizeBtn: 'Optimize', optimizing: 'Optimizing...', btn: 'Generate Design', sampleSize: 'Sample Size', variables: 'Variables', analysis: 'Analysis Plan', flow: 'Procedure Flow', templates: {title:'Templates', subtitle:'Quick Start', rct:'RCT', rctDesc:'Medical Trial', ab:'A/B Test', abDesc:'UX/Product', memory:'Memory', memoryDesc:'Cognitive'} },
    knowledge: { title: 'Knowledge Graph', subtitle: 'Visualize connections', connecting: 'Connecting...', connect: 'Connect', gettingSuggestions: 'Thinking...', suggestions: 'Suggest Nodes', imageNote: 'Image Note', analyzingImage: 'Analyzing...', acceptNode: 'Accept Suggestion', empty: 'Add nodes to start.' },
    chart: { title: 'Chart Extraction', subtitle: 'Extract data from images', upload: 'Upload Image', extracting: 'Extracting...' },
    review: { steps: {1:'Scope',2:'Select',3:'Config',4:'Result'}, scopeTitle: 'Define Scope', topicLabel: 'Topic', focusLabel: 'Focus', dbLabel: 'Databases', timeLabel: 'Time Range', searchBtn: 'Search Papers', selectTitle: 'Select Papers', configTitle: 'Configuration', wordCount: 'Word Count', langLabel: 'Language', genBtn: 'Generate', complete: 'Review Generated' },
    polish: { title: 'Polish Assistant', subtitle: 'Refine your writing', tabText: 'Text', tabFile: 'File', placeholder: 'Paste text...', config: {mode:'Mode', tone:'Tone', field:'Field', glossary:'Glossary', modes: {EnToEn:'En->En', CnToEn:'Cn->En', EnToCn:'En->Cn'}, tones: {Academic:'Academic', Native:'Native', Concise:'Concise', Paraphrase:'Paraphrase'}, fields: {General:'General', CS:'CS', Medicine:'Medicine', Engineering:'Engineering', SocialSciences:'Social Sciences', Economics:'Economics'}}, btn: 'Polish', control: {cleanView:'Clean', diffView:'Diff', version:'Version', chatPlaceholder:'Refine further...', accept:'Accept', reject:'Reject'}, revisionNotes: 'Revision Notes' },
    titlePrism: { title: 'Title Prism', subtitle: 'Optimize your title', inputSection: 'Input', draftTitle: 'Draft Title', draftPlaceholder: 'Enter title...', abstract: 'Abstract', abstractPlaceholder: 'Enter abstract...', target: 'Target Journal', targetPlaceholder: 'e.g. Nature', optimizeBtn: 'Optimize', councilTitle: 'The Council', optionsTitle: 'Refined Options', copy: 'Copied' },
    peer: { title: 'Peer Review Simulator', subtitle: 'Pre-submission check', uploadTitle: 'Upload Manuscript', uploadDesc: 'PDF/Word', targetLabel: 'Target', journalLabel: 'Journal', startBtn: 'Start Review', pending: 'Ready to Review', pendingDesc: 'Upload a file to begin.', rebuttalBtn: 'Draft Rebuttal', coverLetterBtn: 'Draft Cover Letter' },
    advisor: { title: 'Submission Advisor', subtitle: 'Journal matching', paperTitle: 'Paper Title', paperAbstract: 'Abstract', abstractPlaceholder: '...', journalTitle: 'Target Journal', focusLabel: 'Focus', focusPlaceholder: '...', btn: 'Analyze', history: 'History', alternatives: 'Alternatives', risks: 'Risks', apply: 'Apply' },
    aiDetector: { title: 'AI Detector', subtitle: 'Check for AI patterns', checkBtn: 'Detect', humanizeBtn: 'Humanize', highlights: 'AI Highlights', humanized: 'Humanized Text', copy: 'Copy' },
    opening: { title: 'Opening Review', subtitle: 'Proposal check', uploadDesc: 'Upload Proposal', targetLabel: 'Target', targetPlaceholder: 'e.g. PhD Thesis', rolesLabel: 'Roles', focusLabel: 'Focus', focusPlaceholder: '...', btn: 'Start Review', roles: {mentor:{name:'Mentor', desc:'Guide'}, expert:{name:'Expert', desc:'Critical'}, peer:{name:'Peer', desc:'Creative'}, committee:{name:'Committee', desc:'Strict'}} },
    conference: { title: 'Conference Finder', subtitle: 'Find venues', topicLabel: 'Topic', searchBtn: 'Search', searching: 'Searching...', rankLabel: 'Rank', filters: {type:'Type', status:'Status', metrics:'Metrics', location:'Location', typeOpts:{all:'All',conf:'Conf',journal:'Journal'}, statusOpts:{all:'All',upcoming:'Upcoming',passed:'Passed',tba:'TBA'}, h5Opts:{all:'All',gt20:'>20',gt50:'>50',gt100:'>100'}, locationOpts:{all:'All',asia:'Asia',europe:'Europe',na:'N. America',online:'Online'}}, sort: {deadline:'Deadline', rank:'Rank', h5:'H5'}, conferences: 'Conferences', journals: 'Journals', website: 'Website', daysLeft: 'days left' },
    grant: { title: 'Grant Application', subtitle: 'Drafting assistant', tabs: {rationale:'Rationale', polish:'Polish', check:'Check', review:'Review'}, rationale: {title:'Rationale', references:'References', refUpload:'Upload PDF', fileLimit:'(Max 10)', imgUpload:'Upload Image', refDoi:'Paste DOIs...', modeLabel:'Generation Mode', modes: {full:'Full Rationale', status:'Research Status', significance:'Significance'}}, polish: {title:'Polish', section:'Section', sections: {significance:'Significance', innovation:'Innovation', foundation:'Foundation'}, content:'Content', placeholder:'...'}, check: {title:'Format Check', upload:'Upload', dash: {hard:'Hard Rules', logic:'Logic'}}, review: {title:'Review Simulation', roleLabel:'Role', frameworkLabel:'Framework', frameworkPlaceholder:'...', upload:'Upload', startBtn:'Start Review', reportTitle:'Review Report', verdict:'Verdict', downloadPdf:'Download PDF'} },
    discussion: { title: 'Discussion', subtitle: 'Simulate debate', personas: {reviewer:'Reviewer', interdisciplinary:'Interdisciplinary', mentor:'Mentor'}, placeholder: 'Research topic...', participantsHeader: 'Participants', addRole: 'Add', btn: 'Start Discussion', scorecard: {title:'Scorecard', theory:'Theory', method:'Method', app:'App'}, feasibility: {title:'Feasibility', data:'Data', tech:'Tech', ethics:'Ethics'} },
    ppt: { title: 'PPT Generator', subtitle: 'Slides from paper', uploadLabel: 'Upload Paper', nameLabel: 'Name', schoolLabel: 'Affiliation', densityLabel: 'Content Density', densityLow: 'Simple', densityHigh: 'Rich', pagesLabel: 'Pages', styleBtn: 'Analyze Style', steps: {2:'Config', 3:'Style'}, analyzing: 'Analyzing...', genBtn: 'Generate PPT', generating: 'Generating...', download: 'Download' },
    flowchart: { title: 'Flowchart Gen', subtitle: 'Text to diagram', chartType: 'Type', types: {flowchart:'Flowchart', sequence:'Sequence', class:'Class', state:'State', er:'ER', gantt:'Gantt', mindmap:'Mindmap'}, uploadImage: 'Upload Sketch', inputPlaceholder: 'Describe process...', btn: 'Generate', resultTitle: 'Result', copyCode: 'Copy Code', download: 'SVG' },
    training: { title: 'Research Training', subtitle: 'Defense simulation', setup: {uploadLabel:'Upload Material', topicLabel:'Topic', placeholder:'...', personaLabel:'Interviewer Persona', personas: {method:'Methodology', methodDesc:'Strict on methods', innov:'Innovation', innovDesc:'Focus on novelty', prac:'Practical', pracDesc:'Real-world application'}, btn:'Start Battle'}, battle: {turn:'Turn', aiThinking:'Thinking...', turnReport:'Turn Analysis', original:'Your Answer', better:'Optimized', strengths:'Strengths', weaknesses:'Weaknesses', nextQ:'Next Question', hint:'Hint'}, report: {title:'Training Report', actionPlan:'Action Plan', restart:'Restart'} },
    data: { title: 'Data Analysis', subtitle: 'Automated insights', upload: 'Upload Data' },
    figure: { title: 'Figure Generator', subtitle: 'Scientific Illustrations', mode: {generate:'Generate', polish:'Polish'}, input: {referenceLabel: 'Reference Image', sourceLabel: 'Source Image', promptLabel: 'Prompt', promptPlaceholder: 'Describe figure...', sizeLabel: 'Size', dpiLabel: 'DPI', backgroundOnly: 'Background Only', backgroundOnlyTip: 'Generate background only', sizes: {single:'Single Col', double:'Double Col'}}, template: {title:'Template', subject:'Subject', action:'Action', environment:'Environment', perspective:'Perspective', subjectPh:'e.g. Protein', actionPh:'e.g. Binding', environmentPh:'e.g. Cell', perspectivePh:'e.g. 3D', apply:'Apply'}, polishTasks: {general:'General', sketchTo3D:'Sketch to 3D', chartBeautify:'Chart Beautify'}, btn: 'Generate', result: 'Result', tools: {addLabel:'Label', saveWithLabels:'Save Annotated'}, refinePlaceholder: 'Refine...', download: 'Download', history: 'History', chartTypes: {Mechanism:'Mechanism', Process:'Process', Structure:'Structure'}, colorPalettes: {Default:'Default', Nature:'Nature', Science:'Science'} }
  },
  ZH: {
    appName: '科研助手',
    groups: {
      input: '输入阶段',
      process: '处理分析',
      output: '输出撰写',
      utils: '工具箱'
    },
    welcome: {
      title: '欢迎使用科研助手',
      subtitle: '您的智能学术研究伙伴',
      opensource: '本项目是 GitHub 上的免费开源项目。',
      githubBtn: '前往 GitHub 仓库',
      starSupport: '如果您喜欢本项目，请前往 GitHub 为我们点星支持！🌟',
      license: '遵循 MIT 开源协议',
      close: '开始使用'
    },
    nav: {
      search: '学术搜索',
      track: '文献追踪',
      pdfChat: '精读助手',
      idea: '灵感指南',
      trends: '趋势分析',
      experimentDesign: '实验设计',
      data: '数据分析',
      code: '代码助手',
      plotting: '科研绘图',
      knowledge: '知识图谱',
      chart: '图表提取',
      review: '综述生成',
      polish: '润色助手',
      titlePrism: '标题棱镜',
      peer: '模拟评审',
      advisor: '投稿顾问',
      aiDetector: 'AI 检测',
      opening: '开题评审',
      conference: '会议查询',
      grant: '标书助手',
      discussion: '模拟研讨',
      ppt: 'PPT 生成',
      flowchart: '流程图生成',
      training: '答辩演练',
      aiWorkflow: 'AI工作流'
    },
    aiWorkflow: {
      title: 'AI 科研工作流',
      subtitle: '从选题到执行框架的全流程规划',
      steps: {
        1: '定方向',
        2: '选问题',
        3: '细化',
        4: '定框架'
      },
      step1: {
        label: '研究大方向',
        placeholder: '例如：大语言模型在医疗领域的应用',
        btn: '探索核心问题'
      },
      step2: {
        title: '选择核心问题',
        subtitle: 'AI 分析了该领域的关键痛点'
      },
      step3: {
        title: '细化切入点',
        subtitle: '选择具体的切入角度',
        rationale: '理由'
      },
      step4: {
        logic: '逻辑框架',
        innovation: '创新点',
        method: '方法论',
        data: '数据来源',
        export: '导出方案'
      },
      loading: {
        problems: '正在分析领域...',
        angles: '正在细化角度...',
        framework: '正在构建框架...'
      },
      restart: '重新开始',
      back: '返回'
    },
    scientific: {
      title: '科研绘图',
      subtitle: '生成符合出版要求的科学图表',
      import: '导入数据',
      config: '图表配置',
      style: '样式美化',
      upload: '上传 CSV/Excel',
      paste: '粘贴数据...',
      types: {
        bar: '柱状图',
        line: '折线图',
        scatter: '散点图',
        pie: '饼图',
        radar: '雷达图'
      },
      themes: {
        Nature: 'Nature 配色',
        Science: 'Science 配色',
        Cell: 'Cell 配色',
        Classic: '经典黑白'
      },
      axes: { x: 'X 轴', y: 'Y 轴' },
      stats: { mean: '显示均值/误差棒' },
      aiPrompt: '描述你想要的图表 (AI)...',
      titlePreview: '预览'
    },
    pdfChat: {
        title: '文献精读',
        modes: { standard: '标准模式', guided: '导读模式', game: '游戏模式' },
        tools: { outline: '大纲', notes: '笔记', bookmarks: '书签', addLabel: '标注', addNote: '笔记', addBookmark: '书签' },
        game: { points: '积分', level: '等级', challengeBtn: '挑战问答', quizTitle: '随堂测试' },
        guided: { path: '学习路径' }
    },
    search: { title: '学术搜索', subtitle: '智能检索与分析', source: {online: '在线搜索', local: '本地文件'}, placeholder: '输入关键词...', btn: '搜索', filters: {time: '时间范围'}, upload: {btn: '上传论文', tip: '支持 PDF, Word'}, results: '搜索结果', sort: {label: '排序', relevance: '相关性', date: '日期', if: '影响因子', added: '加入时间'}, generateBtn: '生成综述', interpret: 'AI 解读', interpretationResult: '解读结果' },
    trends: { emerging: '新兴技术', yoy: '增长率', hotspots: '热点词云', methodologies: '主流方法', analyze: '开始分析', placeholder: '输入领域...', timeRange: '时间范围', view: {researcher: '研究者视角', institution: '机构视角'} },
    track: { title: '文献追踪', subtitle: '引用网络与GAP分析', tabSearch: '搜索引用', tabUpload: '上传分析', placeholder: '输入论文标题...', btn: '追踪网络', dragDrop: '拖拽 PDF 到此处' },
    code: { title: '代码助手', newSession: '新会话', history: '历史记录', inputPlaceholder: {generate: '描述需求...', debug: '粘贴代码调试...', explain: '粘贴代码解释...'}, upload: '上传脚本', stopBtn: '停止', btn: '运行', shortcut: 'Ctrl+Enter 发送' },
    experimentDesign: { title: '实验设计', subtitle: '生成严谨的实验方案', hypothesisLabel: '研究假设', hypothesisPlaceholder: '输入假设...', ivLabel: '自变量', dvLabel: '因变量', fieldLabel: '领域', fields: {Psychology:'心理学', Medicine:'医学', UX:'用户体验'}, methodologyLabel: '方法论', methodologies: {Lab:'实验室', Survey:'问卷', RCT:'随机对照', Auto:'自动推荐'}, structureLabel: '实验结构', structures: {Between:'组间设计', Within:'组内设计'}, advancedSettings: '高级统计设置', alpha: '显著性水平', power: '统计效力', effectSize: '效应量', effectSizes: {small:'小', medium:'中', large:'大', custom:'自定义'}, optimizeBtn: '优化假设', optimizing: '优化中...', btn: '生成方案', sampleSize: '样本量', variables: '变量定义', analysis: '分析计划', flow: '流程步骤', templates: {title:'快速模板', subtitle:'常用范式', rct:'RCT试验', rctDesc:'医学临床对照', ab:'A/B测试', abDesc:'互联网产品', memory:'记忆实验', memoryDesc:'认知心理学'} },
    knowledge: { title: '知识图谱', subtitle: '可视化概念关联', connecting: '连接中...', connect: '建立连接', gettingSuggestions: '思考中...', suggestions: 'AI 联想', imageNote: '图片笔记', analyzingImage: '解析中...', acceptNode: '采纳建议', empty: '添加节点以开始' },
    chart: { title: '图表提取', subtitle: '从图片提取数据', upload: '上传图表', extracting: '提取中...' },
    review: { steps: {1:'范围',2:'筛选',3:'配置',4:'结果'}, scopeTitle: '定义综述范围', topicLabel: '主题', focusLabel: '侧重点', dbLabel: '数据库', timeLabel: '时间', searchBtn: '搜索文献', selectTitle: '选择文献', configTitle: '生成配置', wordCount: '字数', langLabel: '语言', genBtn: '生成综述', complete: '综述已生成' },
    polish: { title: '润色助手', subtitle: '提升写作质量', tabText: '文本', tabFile: '文件', placeholder: '在此粘贴文本...', config: {mode:'模式', tone:'语气', field:'领域', glossary:'术语表', modes: {EnToEn:'英文润色', CnToEn:'中译英', EnToCn:'英译中'}, tones: {Academic:'学术严谨', Native:'地道母语', Concise:'简洁有力', Paraphrase:'改写降重'}, fields: {General:'通用', CS:'计算机', Medicine:'医学', Engineering:'工程', SocialSciences:'社科', Economics:'经济'}}, btn: '开始润色', control: {cleanView:'纯净版', diffView:'对比版', version:'版本', chatPlaceholder:'对结果不满意？输入指令微调...', accept:'接受', reject:'拒绝'}, revisionNotes: '修改记录' },
    titlePrism: { title: '标题棱镜', subtitle: '多维度优化标题', inputSection: '输入信息', draftTitle: '草拟标题', draftPlaceholder: '输入标题...', abstract: '摘要', abstractPlaceholder: '输入摘要...', target: '目标期刊', targetPlaceholder: '例如：Nature', optimizeBtn: '开始优化', councilTitle: '专家评审团', optionsTitle: '优化方案', copy: '已复制' },
    peer: { title: '模拟同行评审', subtitle: '预审稿检查', uploadTitle: '上传稿件', uploadDesc: '支持 PDF/Word', targetLabel: '投稿目标', journalLabel: '期刊名称', startBtn: '开始评审', pending: '准备就绪', pendingDesc: '上传文件以开始模拟评审。', rebuttalBtn: '生成回信草稿', coverLetterBtn: '生成 Cover Letter' },
    advisor: { title: '投稿顾问', subtitle: '期刊匹配与分析', paperTitle: '论文标题', paperAbstract: '摘要', abstractPlaceholder: '...', journalTitle: '目标期刊', focusLabel: '侧重点', focusPlaceholder: '...', btn: '开始分析', history: '历史记录', alternatives: '推荐期刊', risks: '风险评估', apply: '应用修改' },
    aiDetector: { title: 'AI 内容检测', subtitle: '识别 AI 生成痕迹', checkBtn: '开始检测', humanizeBtn: '一键拟人化', highlights: '疑似 AI 片段', humanized: '拟人化结果', copy: '复制' },
    opening: { title: '开题评审', subtitle: '开题报告检查', uploadDesc: '上传开题报告', targetLabel: '目标学位/项目', targetPlaceholder: '例如：博士学位论文', rolesLabel: '评审角色', focusLabel: '侧重点', focusPlaceholder: '...', btn: '开始评审', roles: {mentor:{name:'导师', desc:'指导与辩护'}, expert:{name:'外审专家', desc:'严厉挑刺'}, peer:{name:'同行', desc:'关注创新'}, committee:{name:'学术委员', desc:'规范检查'}} },
    conference: { title: '会议/期刊查询', subtitle: '截稿日期查询', topicLabel: '主题/领域', searchBtn: '查询', searching: '查询中...', rankLabel: '等级', filters: {type:'类型', status:'状态', metrics:'指标', location:'地点', typeOpts:{all:'全部',conf:'会议',journal:'期刊'}, statusOpts:{all:'全部',upcoming:'即将截稿',passed:'已结束',tba:'待定'}, h5Opts:{all:'全部',gt20:'>20',gt50:'>50',gt100:'>100'}, locationOpts:{all:'全部',asia:'亚洲',europe:'欧洲',na:'北美',online:'线上'}}, sort: {deadline:'截稿时间', rank:'等级', h5:'H5指数'}, conferences: '会议', journals: '期刊专刊', website: '官网', daysLeft: '天后截止' },
    grant: { title: '标书助手', subtitle: '基金申请辅助', tabs: {rationale:'立项依据', polish:'润色', check:'形式审查', review:'模拟评审'}, rationale: {title:'立项依据生成', references:'参考文献', refUpload:'上传 PDF', fileLimit:'(最多10篇)', imgUpload:'上传机制图', refDoi:'粘贴 DOI...', modeLabel:'生成模式', modes: {full:'完整立项依据', status:'研究现状', significance:'科学意义'}}, polish: {title:'标书润色', section:'章节', sections: {significance:'科学意义', innovation:'创新点', foundation:'研究基础'}, content:'内容', placeholder:'...'}, check: {title:'形式审查', upload:'上传标书', dash: {hard:'硬性规定', logic:'逻辑检查'}}, review: {title:'模拟评审', roleLabel:'评审专家角色', frameworkLabel:'评审标准', frameworkPlaceholder:'...', upload:'上传标书', startBtn:'开始评审', reportTitle:'评审报告', verdict:'评审结论', downloadPdf:'下载 PDF'} },
    discussion: { title: '模拟研讨', subtitle: '多角色观点碰撞', personas: {reviewer:'审稿人', interdisciplinary:'跨学科专家', mentor:'导师'}, placeholder: '输入研究课题...', participantsHeader: '参与角色', addRole: '添加', btn: '开始研讨', scorecard: {title:'创新评分', theory:'理论', method:'方法', app:'应用'}, feasibility: {title:'可行性', data:'数据', tech:'技术', ethics:'伦理'} },
    ppt: { title: 'PPT 生成', subtitle: '论文转演示文稿', uploadLabel: '上传论文', nameLabel: '姓名', schoolLabel: '单位', densityLabel: '内容密度', densityLow: '简洁', densityHigh: '详实', pagesLabel: '页数', styleBtn: '分析风格', steps: {2:'配置', 3:'风格'}, analyzing: '分析中...', genBtn: '生成 PPT', generating: '生成中...', download: '下载' },
    flowchart: { title: '流程图生成', subtitle: '文本转图表', chartType: '图表类型', types: {flowchart:'流程图', sequence:'时序图', class:'类图', state:'状态图', er:'ER图', gantt:'甘特图', mindmap:'思维导图'}, uploadImage: '上传草图', inputPlaceholder: '描述流程或粘贴代码...', btn: '生成', resultTitle: '生成结果', copyCode: '复制代码', download: '下载 SVG' },
    training: { title: '答辩演练', subtitle: '模拟防御', setup: {uploadLabel:'上传材料', topicLabel:'答辩主题', placeholder:'...', personaLabel:'评委风格', personas: {method:'方法控', methodDesc:'死磕方法细节', innov:'创新控', innovDesc:'关注创新性', prac:'应用控', pracDesc:'关注落地应用'}, btn:'开始演练'}, battle: {turn:'回合', aiThinking:'思考中...', turnReport:'回合分析', original:'你的回答', better:'优化建议', strengths:'亮点', weaknesses:'不足', nextQ:'下一题', hint:'提示'}, report: {title:'演练报告', actionPlan:'改进计划', restart:'重新开始'} },
    data: { title: '数据分析', subtitle: '自动生成见解', upload: '上传数据' },
    figure: { title: '科研图生成', subtitle: '科学插图绘制', mode: {generate:'生成', polish:'润色'}, input: {referenceLabel: '参考图', sourceLabel: '源图片', promptLabel: '提示词', promptPlaceholder: '描述图片...', sizeLabel: '尺寸', dpiLabel: '分辨率', backgroundOnly: '仅背景', backgroundOnlyTip: '仅生成背景结构', sizes: {single:'单栏', double:'双栏'}}, template: {title:'快捷模板', subject:'主体', action:'动作', environment:'环境', perspective:'视角', subjectPh:'如：蛋白质', actionPh:'如：结合', environmentPh:'如：细胞内', perspectivePh:'如：3D', apply:'应用'}, polishTasks: {general:'通用', sketchTo3D:'草图转3D', chartBeautify:'图表美化'}, btn: '生成', result: '结果', tools: {addLabel:'标注', saveWithLabels:'保存带标注图'}, refinePlaceholder: '输入指令微调...', download: '下载', history: '历史', chartTypes: {Mechanism:'机制图', Process:'流程图', Structure:'结构图'}, colorPalettes: {Default:'默认', Nature:'Nature色', Science:'Science色'} }
  }
};
