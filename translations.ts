
import { Language } from './types';

export const TRANSLATIONS: Record<Language, any> = {
  EN: {
    appName: 'ResearchAI',
    groups: {
      input: 'Input & Discovery',
      process: 'Analysis & Processing',
      output: 'Writing & Review',
      utils: 'Utilities & Training'
    },
    nav: {
      search: 'Search', track: 'Track', ideaGuide: 'Idea Guide', trends: 'Trends',
      experimentDesign: 'Experiment', data: 'Data Analysis', code: 'Code', plotting: 'Plotting',
      knowledge: 'Knowledge Graph', chart: 'Chart Extraction',
      review: 'Review', polish: 'Polish', titlePrism: 'Title Prism', peer: 'Peer Review',
      advisor: 'Advisor', aiDetector: 'AI Detector', opening: 'Opening', conference: 'Conferences',
      grant: 'Grant', discussion: 'Discussion',
      ppt: 'PPT', flowchart: 'Flowchart', training: 'Training', logicTraining: 'Logic', aiWorkflow: 'Thesis Builder'
    },
    figure: {
      title: 'Figure Generator',
      subtitle: 'Create scientific diagrams and polish charts',
      mode: { generate: 'Generate', polish: 'Polish' },
      polishTasks: { general: 'General Polish', sketchTo3D: 'Sketch to 3D', chartBeautify: 'Chart Beautify' },
      input: {
        referenceLabel: 'Reference Image',
        sourceLabel: 'Source Image',
        promptLabel: 'Description / Prompt',
        promptPlaceholder: 'Describe the scientific process or mechanism...',
        sizeLabel: 'Size',
        dpiLabel: 'DPI',
        sizes: { single: 'Single Column', double: 'Double Column' },
        backgroundOnly: 'Background Only',
        backgroundOnlyTip: 'Generate background for overlaying text later.'
      },
      template: {
        title: 'Template',
        subject: 'Subject',
        subjectPh: 'e.g. Mitochondria',
        action: 'Action',
        actionPh: 'e.g. Producing ATP',
        environment: 'Environment',
        environmentPh: 'e.g. Cell cytoplasm',
        perspective: 'Perspective',
        perspectivePh: 'e.g. Cross-section',
        apply: 'Apply Template'
      },
      chartTypes: {
        Mechanism: 'Mechanism', Flowchart: 'Flowchart', DataPlot: 'Data Plot', Illustration: 'Illustration'
      },
      colorPalettes: {
        Default: 'Default', Nature: 'Nature', Science: 'Science', Cell: 'Cell', Grayscale: 'Grayscale'
      },
      btn: 'Generate Figure',
      result: 'Result',
      download: 'Download',
      refinePlaceholder: 'Refine this image (e.g., make it brighter)...',
      tools: {
        addLabel: 'Add Label',
        saveWithLabels: 'Save with Labels'
      },
      history: 'History'
    },
    aiWorkflow: {
      title: 'Thesis Workflow', subtitle: 'Step-by-step graduation thesis builder',
      steps: { 1: 'Vague Entry', 2: 'Dimensions', 3: 'Context', 4: 'Titles', 5: 'Framework' },
      step1: { label: 'Research Area', placeholder: 'e.g. Short Video E-commerce', btn: 'Start Analysis' },
      step2: { title: 'Select Direction', subtitle: 'Choose a research dimension' },
      step3: { title: 'Refine Context', subtitle: 'Narrow down scope and method' },
      step4: { title: 'Lock Topic', subtitle: 'Select a finalized title' },
      step5: { title: 'Thesis Framework', subtitle: 'Generated research structure', export: 'Export PDF' },
      loading: { dimensions: 'Analyzing dimensions...', context: 'Generating context questions...', titles: 'Locking variables & titles...', framework: 'Building framework...' },
      restart: 'Restart', back: 'Back'
    },
    // Fallback/Placeholders for other components to prevent crashes if accessing deeply
    pdfChat: { title: 'PDF Chat', modes: { standard: 'Standard', guided: 'Guided', game: 'Game' }, tools: { outline: 'Outline', notes: 'Notes', bookmarks: 'Bookmarks', addNote: 'Add Note', addBookmark: 'Bookmark' }, guided: { path: 'Learning Path' }, game: { points: 'Points', level: 'Level', challengeBtn: 'Challenge Quiz', quizTitle: 'Pop Quiz' } },
    welcome: { title: 'Welcome to ResearchAI', subtitle: 'Your AI-powered academic research assistant.', opensource: 'This project is open source.', githubBtn: 'View on GitHub', starSupport: 'Star us if you like it!', close: 'Get Started', license: 'MIT License' },
    search: { title: 'Literature Search', subtitle: 'Find relevant papers from multiple databases', source: { online: 'Online', local: 'Local' }, placeholder: 'Search for papers...', btn: 'Search', filters: { time: 'Time Range', metrics: 'Metrics', location: 'Location', type: 'Type', status: 'Status' }, upload: { btn: 'Upload Papers', tip: 'PDF, DOCX supported' }, sort: { label: 'Sort by', relevance: 'Relevance', date: 'Date', if: 'Impact Factor', added: 'Date Added', rank: 'Rank', h5: 'H5 Index', deadline: 'Deadline' }, results: 'Results', generateBtn: 'Generate Review' },
    track: { title: 'Citation Tracker', subtitle: 'Visualize research impact', tabSearch: 'Search', tabUpload: 'Upload', placeholder: 'Paper Title...', btn: 'Track', dragDrop: 'Drag & Drop PDF' },
    trends: { title: 'Trend Analysis', subtitle: 'Identify emerging topics', placeholder: 'Topic...', analyze: 'Analyze', timeRange: 'Time Range', emerging: 'Emerging', yoy: 'YoY Growth', hotspots: 'Hotspots', methodologies: 'Top Methodologies', view: { researcher: 'Researcher', institution: 'Institution' } },
    experimentDesign: { title: 'Experiment Design', subtitle: 'Design robust experiments', hypothesisLabel: 'Hypothesis', hypothesisPlaceholder: 'Enter your hypothesis...', optimizeBtn: 'Optimize', optimizing: 'Optimizing...', ivLabel: 'Independent Variable', dvLabel: 'Dependent Variable', fieldLabel: 'Field', methodologyLabel: 'Methodology', structureLabel: 'Structure', advancedSettings: 'Advanced Stats', alpha: 'Alpha', power: 'Power', effectSize: 'Effect Size', effectSizes: { small: 'Small', medium: 'Medium', large: 'Large', custom: 'Custom' }, btn: 'Generate Design', generating: 'Generating...', sampleSize: 'Sample Size', variables: 'Variables', analysis: 'Analysis Plan', flow: 'Procedure Flow', templates: { title: 'Quick Templates', subtitle: 'Start with a preset', rct: 'RCT (Medical)', rctDesc: 'Randomized Controlled Trial', ab: 'A/B Test (UX)', abDesc: 'User Experience Testing', memory: 'Memory (Psych)', memoryDesc: 'Cognitive Psychology' }, fields: { Psychology: 'Psychology', Medicine: 'Medicine', UX: 'UX/HCI', Economics: 'Economics', Biology: 'Biology', Education: 'Education' }, methodologies: { Auto: 'Auto-Detect', Survey: 'Survey', Lab: 'Lab Experiment', Field: 'Field Study', RCT: 'RCT' }, structures: { Between: 'Between-Subjects', Within: 'Within-Subjects', Mixed: 'Mixed Design' } },
    data: { title: 'Data Analysis', subtitle: 'Analyze datasets with AI', upload: 'Upload Dataset', import: 'Import', config: 'Configure', style: 'Style', paste: 'Paste data here...', aiPrompt: 'Ask AI to visualize...', extracting: 'Extracting...', resultTitle: 'Extraction Result', copyCode: 'Copy Code', download: 'Download', axes: { x: 'X Axis', y: 'Y Axis' }, stats: { mean: 'Mean/Error Bars' }, types: { bar: 'Bar Chart', line: 'Line Chart', scatter: 'Scatter Plot', pie: 'Pie Chart', radar: 'Radar Chart' }, themes: { Nature: 'Nature', Science: 'Science', Cell: 'Cell', Classic: 'Classic' } },
    code: { title: 'Code Assistant', subtitle: 'Generate and debug code', newSession: 'New Session', history: 'History', inputPlaceholder: { generate: 'Describe what to code...', debug: 'Paste code to debug...', explain: 'Paste code to explain...' }, upload: 'Upload', shortcut: 'Ctrl+Enter to run', stopBtn: 'Stop', btn: 'Run' },
    scientific: { title: 'Scientific Plotting', subtitle: 'Create publication-ready plots', import: 'Import Data', config: 'Configuration', style: 'Style', upload: 'Upload CSV/Excel', paste: 'Paste Data', aiPrompt: 'Describe plot...', axes: { x: 'X Axis', y: 'Y Axis' }, stats: { mean: 'Mean & Error' }, types: { bar: 'Bar', line: 'Line', scatter: 'Scatter', pie: 'Pie', radar: 'Radar' }, themes: { Nature: 'Nature', Science: 'Science', Cell: 'Cell', Classic: 'Classic' } },
    knowledge: { title: 'Knowledge Graph', subtitle: 'Visualize connections', connect: 'Connect', connecting: 'Connecting...', suggestions: 'AI Suggestions', gettingSuggestions: 'Thinking...', acceptNode: 'Add to Graph', analyzingImage: 'Analyzing...', imageNote: 'Image Note', empty: 'No nodes yet. Add a note or connect papers.' },
    chart: { title: 'Chart Extraction', subtitle: 'Extract data from images', upload: 'Upload Image', extracting: 'Extracting...', resultTitle: 'Extracted Data', download: 'Download' },
    review: { title: 'Review Generator', subtitle: 'Generate literature reviews', steps: { 1: 'Scope', 2: 'Select', 3: 'Config', 4: 'Result' }, scopeTitle: 'Define Scope', topicLabel: 'Topic', focusLabel: 'Focus', dbLabel: 'Databases', timeLabel: 'Time Range', searchBtn: 'Search Papers', selectTitle: 'Select Papers', configTitle: 'Configuration', wordCount: 'Word Count', langLabel: 'Language', genBtn: 'Generate Review', complete: 'Review Generated' },
    polish: { title: 'Polish Assistant', subtitle: 'Improve academic writing', tabText: 'Text', tabFile: 'File', placeholder: 'Enter text to polish...', btn: 'Polish', revisionNotes: 'Revision Notes', control: { version: 'Version', cleanView: 'Clean', diffView: 'Diff', accept: 'Accept', reject: 'Reject', chatPlaceholder: 'Refine (e.g. "Make it more concise")' }, config: { mode: 'Mode', tone: 'Tone', field: 'Field', glossary: 'Glossary', modes: { EnToEn: 'English Polish', CnToEn: 'Chinese to English', EnToCn: 'English to Chinese' }, tones: { Academic: 'Academic', Native: 'Native', Concise: 'Concise', Paraphrase: 'Paraphrase' }, fields: { General: 'General', CS: 'Computer Science', Medicine: 'Medicine', Engineering: 'Engineering', SocialSciences: 'Social Sciences', Economics: 'Economics' } } },
    titlePrism: { title: 'Title Prism', subtitle: 'Optimize titles for impact', inputSection: 'Input', draftTitle: 'Draft Title', draftPlaceholder: 'Enter your draft title...', abstract: 'Abstract', abstractPlaceholder: 'Paste abstract context...', target: 'Target Journal', targetPlaceholder: 'e.g. Nature', optimizeBtn: 'Optimize Title', councilTitle: 'Council Diagnosis', optionsTitle: 'Refined Options', copy: 'Copied' },
    peer: { title: 'Peer Review', subtitle: 'Simulate academic peer review', uploadTitle: 'Upload Manuscript', uploadDesc: 'Click to upload PDF/Word', targetLabel: 'Target', journalLabel: 'Journal Name', startBtn: 'Start Review', pending: 'Waiting for Input', pendingDesc: 'Upload a file to start.', rebuttalBtn: 'Draft Rebuttal', coverLetterBtn: 'Draft Cover Letter' },
    advisor: { title: 'Submission Advisor', subtitle: 'Find the right journal', paperTitle: 'Paper Title', paperAbstract: 'Abstract', abstractPlaceholder: 'Paste abstract...', journalTitle: 'Target Journal', focusLabel: 'Review Focus', focusPlaceholder: 'e.g. Methodology', btn: 'Analyze Fit', history: 'History', risks: 'Risk Assessment', alternatives: 'Alternatives', apply: 'Apply' },
    aiDetector: { title: 'AI Detector', subtitle: 'Detect AI-generated text', checkBtn: 'Check Text', humanizeBtn: 'Humanize', highlights: 'AI Highlights', humanized: 'Humanized Version', copy: 'Copy' },
    opening: { title: 'Opening Review', subtitle: 'Thesis proposal check', targetLabel: 'Degree/Target', targetPlaceholder: 'e.g. PhD Thesis', rolesLabel: 'Review Roles', focusLabel: 'Focus', focusPlaceholder: 'e.g. Feasibility', btn: 'Start Review', uploadDesc: 'Upload Proposal PDF' },
    conference: { title: 'Conference Finder', subtitle: 'Find upcoming events', topicLabel: 'Topic', searchBtn: 'Find Events', searching: 'Searching...', daysLeft: 'days left', website: 'Website', rankLabel: 'Rank', conferences: 'Conferences', journals: 'Special Issues', sort: { deadline: 'Deadline', rank: 'Rank', h5: 'H5 Index' }, filters: { type: 'Type', status: 'Status', metrics: 'Metrics', location: 'Location', typeOpts: { all: 'All', conf: 'Conference', journal: 'Journal' }, statusOpts: { all: 'All', upcoming: 'Upcoming', passed: 'Passed', tba: 'TBA' }, h5Opts: { all: 'All', gt20: '> 20', gt50: '> 50', gt100: '> 100' }, locationOpts: { all: 'All', asia: 'Asia', europe: 'Europe', na: 'North America', online: 'Online' } } },
    grant: { title: 'Grant Assistant', subtitle: 'Write winning proposals', tabs: { rationale: 'Rationale', polish: 'Polish', check: 'Format Check', review: 'Review' }, rationale: { refUpload: 'Upload References', fileLimit: 'files' }, polish: { title: 'Polish Section', placeholder: 'Paste section text...', sections: { significance: 'Significance', innovation: 'Innovation', feasibility: 'Feasibility', foundation: 'Foundation' } } },
    discussion: { title: 'Research Discussion', subtitle: 'Simulate academic debate', placeholder: 'Describe your research idea...', participantsHeader: 'Participants', addRole: 'Add Role', btn: 'Start Discussion', scorecard: { title: 'Scorecard', theory: 'Theory', method: 'Method', app: 'Application' }, feasibility: { title: 'Feasibility', data: 'Data', tech: 'Tech', ethics: 'Ethics' }, personas: { reviewer: 'Reviewer', interdisciplinary: 'Collaborator', mentor: 'Mentor' } },
    ppt: { title: 'PPT Generator', subtitle: 'Create slides from paper', uploadLabel: 'Upload Paper/Image', nameLabel: 'Presenter Name', schoolLabel: 'Affiliation', densityLabel: 'Content Density', densityLow: 'Simple', densityHigh: 'Rich', pagesLabel: 'Pages', styleBtn: 'Analyze Style', steps: { 2: 'Config', 3: 'Style' }, analyzing: 'Analyzing Style...', generating: 'Generating Slides...', genBtn: 'Generate PPT' },
    flowchart: { title: 'Flowchart Generator', subtitle: 'Text to diagram', chartType: 'Chart Type', types: { flowchart: 'Flowchart', sequence: 'Sequence', class: 'Class', state: 'State', er: 'ER Diagram', gantt: 'Gantt', pie: 'Pie' }, uploadImage: 'Upload Image (Optional)', inputPlaceholder: 'Describe the process...', btn: 'Generate', resultTitle: 'Result', copyCode: 'Copy Code', download: 'Download SVG' },
    training: { title: 'Research Training', subtitle: 'Improve research skills', menu: { defense: 'Defense Battle', logic: 'Logic Training' }, setup: { uploadLabel: 'Upload Paper', topicLabel: 'Topic', placeholder: 'Enter topic...', personaLabel: 'Select Persona', btn: 'Start Training', personas: { method: 'Methodology', methodDesc: 'Focus on rigor', innov: 'Innovation', innovDesc: 'Focus on novelty', prac: 'Practical', pracDesc: 'Focus on application' } }, battle: { aiThinking: 'Reviewer is thinking...', turnReport: 'Turn Report', original: 'Your Answer', better: 'Optimized', strengths: 'Strengths', weaknesses: 'Weaknesses', nextQ: 'Next Question', hint: 'Hint' }, report: { title: 'Training Report', actionPlan: 'Action Plan', restart: 'New Session' }, logic: { fallacy: 'Fallacy Detective', reconstruction: 'Reconstruction', stress: 'Stress Test' }, fallacy: { task: 'Identify the Logical Fallacy', reason: 'Reasoning', check: 'Check Answer', types: { strawman: 'Strawman', adhominem: 'Ad Hominem', slipperyslope: 'Slippery Slope', circular: 'Circular Reasoning', generalization: 'Hasty Generalization' } }, reconstruction: { task: 'Reconstruct the Argument', premise: 'Premise', evidence: 'Evidence', conclusion: 'Conclusion', evaluate: 'Evaluate Structure' }, stress: { placeholder: 'Enter hypothesis to test...', start: 'Start Stress Test' } },
    idea: { title: 'Idea Guide', subtitle: 'Brainstorm research directions', placeholder: 'Enter your research interest...', focus: { label: 'Focus', general: 'General', data: 'Data-Driven', policy: 'Policy', theory: 'Theoretical' }, btn: 'Generate Ideas', directions: 'Research Directions', selectDirection: 'Deep Dive', methodology: 'Methodology', dataSources: 'Data Sources', titles: 'Potential Titles', corePapers: 'Core Papers', followUpPlaceholder: 'Ask specific question...', followUpBtn: 'Ask', deepDive: 'Deep Analysis', logicFlow: 'Logic Flow', keywords: 'Keywords', journals: 'Target Journals', exportProposal: 'Export Proposal' }
  },
  ZH: {
    appName: 'ResearchAI',
    groups: {
      input: '输入与发现',
      process: '分析与处理',
      output: '写作与评审',
      utils: '工具与训练'
    },
    nav: {
      search: '文献搜索', track: '引用追踪', ideaGuide: '灵感指南', trends: '趋势分析',
      experimentDesign: '实验设计', data: '数据分析', code: '代码助手', plotting: '科研绘图',
      knowledge: '知识图谱', chart: '图表提取',
      review: '综述生成', polish: '论文润色', titlePrism: '标题棱镜', peer: '模拟评审',
      advisor: '投稿顾问', aiDetector: 'AI 检测', opening: '开题报告', conference: '会议查询',
      grant: '标书助手', discussion: '学术讨论',
      ppt: 'PPT 生成', flowchart: '流程图', training: '科研训练', logicTraining: '逻辑训练', aiWorkflow: '毕业论文工作流'
    },
    figure: {
      title: '科研绘图',
      subtitle: '生成科学示意图与图表润色',
      mode: { generate: '生成模式', polish: '润色模式' },
      polishTasks: { general: '通用润色', sketchTo3D: '草图转3D', chartBeautify: '图表美化' },
      input: {
        referenceLabel: '参考图',
        sourceLabel: '原图',
        promptLabel: '描述 / 提示词',
        promptPlaceholder: '描述科学过程或机制...',
        sizeLabel: '尺寸',
        dpiLabel: '分辨率',
        sizes: { single: '单栏 (8-9cm)', double: '双栏 (17-19cm)' },
        backgroundOnly: '仅生成背景',
        backgroundOnlyTip: '生成背景以便后续叠加文字。'
      },
      template: {
        title: '提示词模板',
        subject: '主体',
        subjectPh: '例如：线粒体',
        action: '动作/过程',
        actionPh: '例如：产生 ATP',
        environment: '环境/背景',
        environmentPh: '例如：细胞质',
        perspective: '视角',
        perspectivePh: '例如：剖面图',
        apply: '应用模板'
      },
      chartTypes: {
        Mechanism: '机制图', Flowchart: '流程图', DataPlot: '数据图', Illustration: '示意图'
      },
      colorPalettes: {
        Default: '默认', Nature: 'Nature 配色', Science: 'Science 配色', Cell: 'Cell 配色', Grayscale: '灰度'
      },
      btn: '生成图片',
      result: '生成结果',
      download: '下载',
      refinePlaceholder: '微调图片 (例如：调亮一点)...',
      tools: {
        addLabel: '添加标注',
        saveWithLabels: '保存带标注图'
      },
      history: '历史记录'
    },
    aiWorkflow: {
      title: '毕业论文工作流', subtitle: '分步式毕业论文构建助手',
      steps: { 1: '模糊入口', 2: '维度裂变', 3: '现状定位', 4: '变量锁定', 5: '生成框架' },
      step1: { label: '研究领域', placeholder: '例如：短视频带货', btn: '开始分析' },
      step2: { title: '选择方向', subtitle: 'AI 导师拆解的学术维度' },
      step3: { title: '现状定位', subtitle: '进一步缩小范围与方法' },
      step4: { title: '题目定稿', subtitle: '基于变量锁定的题目选择' },
      step5: { title: '研究框架', subtitle: '最终生成的论文架构', export: '导出 PDF' },
      loading: { dimensions: '正在拆解维度...', context: '正在生成追问...', titles: '正在锁定变量与题目...', framework: '正在构建研究框架...' },
      restart: '重新开始', back: '返回'
    },
    // Complete structure for ZH
    pdfChat: { title: 'PDF 精读', modes: { standard: '标准工具', guided: '交互导读', game: '游戏闯关' }, tools: { outline: '大纲', notes: '笔记', bookmarks: '书签', addNote: '记笔记', addBookmark: '加书签' }, guided: { path: '学习路径' }, game: { points: '积分', level: '等级', challengeBtn: '挑战问答', quizTitle: '随堂测验' } },
    welcome: { title: '欢迎使用 ResearchAI', subtitle: '你的全能 AI 科研助手', opensource: '本项目完全开源。', githubBtn: '访问 GitHub', starSupport: '喜欢请点个 Star！', close: '开始使用', license: 'MIT 协议' },
    search: { title: '文献搜索', subtitle: '多源数据库智能检索', source: { online: '在线搜索', local: '本地文件' }, placeholder: '搜索论文...', btn: '搜索', filters: { time: '时间范围', metrics: '指标', location: '地区', type: '类型', status: '状态' }, upload: { btn: '上传论文', tip: '支持 PDF, DOCX' }, sort: { label: '排序', relevance: '相关性', date: '年份', if: '影响因子', added: '加入时间', rank: '等级', h5: 'H5 指数', deadline: '截稿日' }, results: '搜索结果', generateBtn: '生成综述' },
    track: { title: '引用追踪', subtitle: '可视化研究脉络', tabSearch: '搜索', tabUpload: '上传', placeholder: '论文标题...', btn: '追踪', dragDrop: '拖拽上传 PDF' },
    trends: { title: '趋势分析', subtitle: '发现前沿热点', placeholder: '输入话题...', analyze: '分析趋势', timeRange: '时间范围', emerging: '新兴技术', yoy: '同比增长', hotspots: '研究热点', methodologies: '热门方法', view: { researcher: '研究者视角', institution: '机构视角' } },
    experimentDesign: { title: '实验设计', subtitle: '设计严谨的实验方案', hypothesisLabel: '研究假设', hypothesisPlaceholder: '输入你的假设...', optimizeBtn: 'AI 优化', optimizing: '优化中...', ivLabel: '自变量', dvLabel: '因变量', fieldLabel: '领域', methodologyLabel: '方法论', structureLabel: '实验结构', advancedSettings: '高级统计设置', alpha: '显著性水平 (α)', power: '统计功效 (Power)', effectSize: '效应量', effectSizes: { small: '小', medium: '中', large: '大', custom: '自定义' }, btn: '生成方案', generating: '生成中...', sampleSize: '样本量计算', variables: '变量定义', analysis: '分析计划', flow: '实验流程', templates: { title: '快速模板', subtitle: '从预设开始', rct: 'RCT (医学)', rctDesc: '随机对照试验', ab: 'A/B 测试 (UX)', abDesc: '用户体验测试', memory: '记忆实验 (心理)', memoryDesc: '认知心理学' }, fields: { Psychology: '心理学', Medicine: '医学', UX: '人机交互', Economics: '经济学', Biology: '生物学', Education: '教育学' }, methodologies: { Auto: '自动推荐', Survey: '问卷调查', Lab: '实验室实验', Field: '田野调查', RCT: '随机对照' }, structures: { Between: '被试间设计', Within: '被试内设计', Mixed: '混合设计' } },
    data: { title: '数据分析', subtitle: 'AI 辅助数据洞察', upload: '上传数据集', import: '导入', config: '配置', style: '样式', paste: '粘贴数据...', aiPrompt: '让 AI 可视化...', extracting: '提取中...', resultTitle: '提取结果', copyCode: '复制代码', download: '下载', axes: { x: 'X 轴', y: 'Y 轴' }, stats: { mean: '均值/误差棒' }, types: { bar: '柱状图', line: '折线图', scatter: '散点图', pie: '饼图', radar: '雷达图' }, themes: { Nature: 'Nature', Science: 'Science', Cell: 'Cell', Classic: '经典' } },
    code: { title: '代码助手', subtitle: '生成与调试代码', newSession: '新会话', history: '历史记录', inputPlaceholder: { generate: '描述需求...', debug: '粘贴代码以调试...', explain: '粘贴代码以解释...' }, upload: '上传代码', shortcut: 'Ctrl+Enter 运行', stopBtn: '停止', btn: '运行' },
    scientific: { title: '科研绘图', subtitle: '创建出版级图表', import: '导入数据', config: '图表配置', style: '样式设置', upload: '上传 CSV/Excel', paste: '粘贴数据', aiPrompt: '描述图表需求...', axes: { x: 'X 轴', y: 'Y 轴' }, stats: { mean: '均值 & 误差' }, types: { bar: '柱状图', line: '折线图', scatter: '散点图', pie: '饼图', radar: '雷达图' }, themes: { Nature: 'Nature', Science: 'Science', Cell: 'Cell', Classic: '经典' } },
    knowledge: { title: '知识图谱', subtitle: '可视化知识关联', connect: '建立关联', connecting: '连接中...', suggestions: 'AI 推荐', gettingSuggestions: '思考中...', acceptNode: '添加到图谱', analyzingImage: '解析中...', imageNote: '图片笔记', empty: '暂无节点。添加笔记或关联论文。' },
    chart: { title: '图表提取', subtitle: '从图片提取数据', upload: '上传图片', extracting: '提取中...', resultTitle: '提取数据', download: '下载' },
    review: { title: '综述生成', subtitle: '自动生成文献综述', steps: { 1: '范围', 2: '选择', 3: '配置', 4: '结果' }, scopeTitle: '定义范围', topicLabel: '主题', focusLabel: '侧重点', dbLabel: '数据库', timeLabel: '时间范围', searchBtn: '搜索论文', selectTitle: '选择论文', configTitle: '生成配置', wordCount: '字数', langLabel: '语言', genBtn: '生成综述', complete: '综述已生成' },
    polish: { title: '论文润色', subtitle: '提升学术写作质量', tabText: '文本', tabFile: '文件', placeholder: '输入待润色文本...', btn: '开始润色', revisionNotes: '修改说明', control: { version: '版本', cleanView: '纯净版', diffView: '对比版', accept: '接受', reject: '拒绝', chatPlaceholder: '微调 (例如："更简洁一点")' }, config: { mode: '模式', tone: '语气', field: '领域', glossary: '术语表', modes: { EnToEn: '英文润色', CnToEn: '中译英', EnToCn: '英译中' }, tones: { Academic: '学术', Native: '地道', Concise: '简洁', Paraphrase: '改写' }, fields: { General: '通用', CS: '计算机', Medicine: '医学', Engineering: '工程', SocialSciences: '社科', Economics: '经济' } } },
    titlePrism: { title: '标题棱镜', subtitle: '多维度标题优化', inputSection: '输入', draftTitle: '草拟标题', draftPlaceholder: '输入草拟标题...', abstract: '摘要', abstractPlaceholder: '粘贴摘要...', target: '目标期刊', targetPlaceholder: '例如：Nature', optimizeBtn: '优化标题', councilTitle: '专家会诊', optionsTitle: '优化方案', copy: '已复制' },
    peer: { title: '模拟评审', subtitle: 'AI 模拟同行评审', uploadTitle: '上传稿件', uploadDesc: '点击上传 PDF/Word', targetLabel: '目标', journalLabel: '期刊名称', startBtn: '开始评审', pending: '等待输入', pendingDesc: '上传文件以开始。', rebuttalBtn: '草拟回信', coverLetterBtn: '草拟 Cover Letter' },
    advisor: { title: '投稿顾问', subtitle: '期刊匹配分析', paperTitle: '论文标题', paperAbstract: '摘要', abstractPlaceholder: '粘贴摘要...', journalTitle: '目标期刊', focusLabel: '评审侧重', focusPlaceholder: '例如：方法论创新', btn: '分析匹配度', history: '历史记录', risks: '风险评估', alternatives: '推荐备选', apply: '应用建议' },
    aiDetector: { title: 'AI 检测', subtitle: '检测 AI 生成痕迹', checkBtn: '开始检测', humanizeBtn: '去 AI 化', highlights: '高亮显示', humanized: '优化版本', copy: '复制' },
    opening: { title: '开题报告', subtitle: '开题质量检查', targetLabel: '学位/目标', targetPlaceholder: '例如：博士学位论文', rolesLabel: '评审角色', focusLabel: '侧重点', focusPlaceholder: '例如：可行性分析', btn: '开始审查', uploadDesc: '上传开题报告 PDF' },
    conference: { title: '会议查询', subtitle: '发现学术会议', topicLabel: '主题', searchBtn: '查询', searching: '查询中...', daysLeft: '天截止', website: '官网', rankLabel: '等级', conferences: '学术会议', journals: '特刊征稿', sort: { deadline: '截稿日', rank: '等级', h5: 'H5 指数' }, filters: { type: '类型', status: '状态', metrics: '指标', location: '地点', typeOpts: { all: '全部', conf: '会议', journal: '期刊' }, statusOpts: { all: '全部', upcoming: '即将截稿', passed: '已截稿', tba: '待定' }, h5Opts: { all: '全部', gt20: '> 20', gt50: '> 50', gt100: '> 100' }, locationOpts: { all: '全部', asia: '亚洲', europe: '欧洲', na: '北美', online: '线上' } } },
    grant: { title: '标书助手', subtitle: '撰写高命中率标书', tabs: { rationale: '立项依据', polish: '润色', check: '形式审查', review: '模拟评审' }, rationale: { refUpload: '上传参考文献', fileLimit: '文件' }, polish: { title: '润色段落', placeholder: '粘贴段落文本...', sections: { significance: '研究意义', innovation: '创新点', feasibility: '可行性', foundation: '研究基础' } } },
    discussion: { title: '学术讨论', subtitle: '多角色模拟辩论', placeholder: '描述你的研究想法...', participantsHeader: '参与角色', addRole: '添加角色', btn: '开始讨论', scorecard: { title: '创新性评分', theory: '理论性', method: '方法论', app: '应用性' }, feasibility: { title: '可行性评估', data: '数据', tech: '技术', ethics: '伦理' }, personas: { reviewer: '审稿人', interdisciplinary: '跨学科专家', mentor: '导师' } },
    ppt: { title: 'PPT 生成', subtitle: '论文转演示文稿', uploadLabel: '上传论文/图片', nameLabel: '汇报人', schoolLabel: '单位', densityLabel: '内容密度', densityLow: '简洁', densityHigh: '丰富', pagesLabel: '页数', styleBtn: '分析风格', steps: { 2: '配置', 3: '风格' }, analyzing: '分析风格中...', generating: '生成 PPT 中...', genBtn: '生成 PPT' },
    flowchart: { title: '流程图生成', subtitle: '文本转图表', chartType: '图表类型', types: { flowchart: '流程图', sequence: '时序图', class: '类图', state: '状态图', er: 'ER 图', gantt: '甘特图', pie: '饼图' }, uploadImage: '上传图片 (可选)', inputPlaceholder: '描述流程或粘贴文本...', btn: '生成', resultTitle: '生成结果', copyCode: '复制代码', download: '下载 SVG' },
    training: { title: '科研训练', subtitle: '提升科研能力', menu: { defense: '答辩演练', logic: '逻辑训练' }, setup: { uploadLabel: '上传论文', topicLabel: '主题', placeholder: '输入主题...', personaLabel: '选择评审风格', btn: '开始训练', personas: { method: '方法论控', methodDesc: '关注严谨性', innov: '创新控', innovDesc: '关注新颖性', prac: '应用控', pracDesc: '关注落地' } }, battle: { aiThinking: '评审思考中...', turnReport: '回合报告', original: '你的回答', better: '优化建议', strengths: '亮点', weaknesses: '不足', nextQ: '下一题', hint: '提示' }, report: { title: '训练报告', actionPlan: '提升计划', restart: '重新开始' }, logic: { fallacy: '谬误侦探', reconstruction: '论证重构', stress: '压力测试' }, fallacy: { task: '识别逻辑谬误', reason: '理由', check: '检查答案', types: { strawman: '稻草人谬误', adhominem: '人身攻击', slipperyslope: '滑坡谬误', circular: '循环论证', generalization: '以偏概全' } }, reconstruction: { task: '重构论证结构', premise: '前提', evidence: '证据', conclusion: '结论', evaluate: '评估结构' }, stress: { placeholder: '输入待测试的假设...', start: '开始压力测试' } },
    idea: { title: '灵感指南', subtitle: '头脑风暴与选题', placeholder: '输入感兴趣的研究方向...', focus: { label: '侧重', general: '通用', data: '数据驱动', policy: '政策导向', theory: '理论研究' }, btn: '生成灵感', directions: '研究方向', selectDirection: '深挖', methodology: '推荐方法', dataSources: '数据来源', titles: '推荐题目', corePapers: '核心文献', followUpPlaceholder: '追问细节...', followUpBtn: '追问', deepDive: '深度分析', logicFlow: '逻辑流', keywords: '关键词', journals: '目标期刊', exportProposal: '导出提案' }
  }
};
