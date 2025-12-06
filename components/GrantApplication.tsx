
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Feather, ShieldCheck, Send, Loader2, Sparkles, AlertTriangle, CheckCircle, Download, BookOpen, Key, Briefcase, Upload, Link, Trash2, List, Lightbulb, Eye, Edit3, Wand2, Layers, Zap, Scale, LayoutDashboard, AlertOctagon, GitMerge, CheckSquare, VenetianMask, File as FileIcon, Settings, History, MessageSquare, Plus, Minus, ArrowRight, FileOutput, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateGrantLogicFramework, expandGrantRationale, polishGrantProposal, checkGrantFormat, getGrantInspiration } from '../services/geminiService';
import { Language, GrantCheckResult, LogicNode, GrantPolishVersion } from '../types';
import { TRANSLATIONS } from '../translations';

// ... (Interface definitions and LogicNodeEditor component remain same) ...
interface GrantApplicationProps {
  language: Language;
}

interface ProjectConfig {
    name: string;
    code: string;
    keywords: string;
}

interface HistoryItem {
    id: string;
    type: 'rationale' | 'polish' | 'check';
    timestamp: number;
    summary: string;
    data: any;
}

const LogicNodeEditor: React.FC<{ node: LogicNode, onChange: (node: LogicNode) => void, onDelete?: () => void, depth?: number }> = ({ node, onChange, onDelete, depth = 0 }) => {
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...node, label: e.target.value });
    };

    const handleAddChild = () => {
        const newChild: LogicNode = { id: Date.now().toString(), label: "New Point", children: [] };
        onChange({ ...node, children: [...(node.children || []), newChild] });
    };

    const handleChildChange = (idx: number, newChild: LogicNode) => {
        if (!node.children) return;
        const newChildren = [...node.children];
        newChildren[idx] = newChild;
        onChange({ ...node, children: newChildren });
    };

    const handleDeleteChild = (idx: number) => {
        if (!node.children) return;
        const newChildren = node.children.filter((_, i) => i !== idx);
        onChange({ ...node, children: newChildren });
    };

    return (
        <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-6 mt-2 border-l-2 border-slate-200 pl-4' : ''}`}>
            <div className="flex items-center gap-2 group">
                {depth > 0 && <div className="w-2 h-2 rounded-full bg-indigo-300"></div>}
                <input 
                    value={node.label}
                    onChange={handleLabelChange}
                    className={`flex-grow bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-2 py-1 text-sm ${depth === 0 ? 'font-bold text-lg text-indigo-700' : 'text-slate-700'}`}
                />
                <button onClick={handleAddChild} className="opacity-0 group-hover:opacity-100 text-indigo-500 hover:bg-indigo-50 p-1 rounded transition-opacity" title="Add Child">
                    <Plus size={14} />
                </button>
                {onDelete && (
                    <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 p-1 rounded transition-opacity" title="Delete Node">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            {node.children && node.children.map((child, idx) => (
                <LogicNodeEditor 
                    key={child.id} 
                    node={child} 
                    onChange={(n) => handleChildChange(idx, n)} 
                    onDelete={() => handleDeleteChild(idx)}
                    depth={depth + 1}
                />
            ))}
        </div>
    );
};

const GrantApplication: React.FC<GrantApplicationProps> = ({ language }) => {
  const t = TRANSLATIONS[language].grant;
  const [activeTab, setActiveTab] = useState<'rationale' | 'polish' | 'check'>('rationale');
  
  // Global Project Configuration
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({
      name: '',
      code: '',
      keywords: ''
  });

  // Rationale State
  const [rationaleStep, setRationaleStep] = useState<0 | 1 | 2>(0); // 0: Input, 1: MindMap, 2: Text
  const [logicTree, setLogicTree] = useState<LogicNode | null>(null);
  const [rationaleResult, setRationaleResult] = useState('');
  const [refFiles, setRefFiles] = useState<globalThis.File[]>([]);
  const [doiInput, setDoiInput] = useState('');
  const [genMode, setGenMode] = useState<'full' | 'status' | 'significance'>('full');
  const refFileInputRef = useRef<HTMLInputElement>(null);
  
  // Polish State
  const [polishText, setPolishText] = useState('');
  const [sectionType, setSectionType] = useState('significance');
  const [polishVersions, setPolishVersions] = useState<GrantPolishVersion[]>([]);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [polishView, setPolishView] = useState<'clean' | 'revision'>('revision');
  const [customInstruction, setCustomInstruction] = useState('');
  
  // Check State
  const [checkText, setCheckText] = useState('');
  const [checkFile, setCheckFile] = useState<globalThis.File | null>(null);
  const [checkResult, setCheckResult] = useState<GrantCheckResult | null>(null);
  const checkFileInputRef = useRef<HTMLInputElement>(null);
  
  // Dashboard & History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inspiration, setInspiration] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Auto-fetch inspiration when config changes
  useEffect(() => {
      if (projectConfig.name.length > 5 && projectConfig.code) {
          const fetchInspiration = async () => {
              const sentences = await getGrantInspiration(projectConfig.name, projectConfig.code, language);
              if (sentences && sentences.length > 0) {
                  setInspiration(sentences);
              }
          };
          // Debounce
          const handler = setTimeout(fetchInspiration, 1500);
          return () => clearTimeout(handler);
      }
  }, [projectConfig.name, projectConfig.code, language]);

  const addToHistory = (type: HistoryItem['type'], summary: string, data: any) => {
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          type,
          timestamp: Date.now(),
          summary,
          data
      };
      setHistory(prev => [newItem, ...prev]);
  };

  const handleGenerateFramework = async () => {
      if (!projectConfig.name.trim()) return;
      setLoading(true);
      const kws = projectConfig.keywords.split(/[,，]/).map(k => k.trim()).filter(k => k);
      
      const references: { type: 'pdf' | 'doi', content: string | globalThis.File }[] = [];
      doiInput.split('\n').forEach(doi => { if (doi.trim()) references.push({ type: 'doi', content: doi.trim() }); });
      refFiles.forEach(file => { references.push({ type: 'pdf', content: file }); });

      const tree = await generateGrantLogicFramework(
          { name: projectConfig.name, keywords: kws, domainCode: projectConfig.code },
          language,
          genMode,
          references
      );
      
      if (tree) {
          setLogicTree(tree);
          setRationaleStep(1);
      }
      setLoading(false);
  };

  const handleExpandToText = async () => {
      if (!logicTree) return;
      setLoading(true);
      const text = await expandGrantRationale(logicTree, language);
      setRationaleResult(text);
      setRationaleStep(2);
      addToHistory('rationale', `Rationale: ${projectConfig.name.substring(0, 30)}...`, text);
      setLoading(false);
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = (Array.from(e.target.files) as globalThis.File[]).filter(f => f.type === 'application/pdf');
          setRefFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Limit to 10
      }
  };

  const removeRefFile = (index: number) => {
      setRefFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePolish = async () => {
      if (!polishText.trim()) return;
      setLoading(true);
      setPolishVersions([]);
      setActiveVersionIdx(0);
      
      const contextInstruction = `${customInstruction}. Context: Project "${projectConfig.name}" (Code: ${projectConfig.code}).`;

      const res = await polishGrantProposal(polishText, sectionType, language, contextInstruction);
      if (res && res.versions) {
          setPolishVersions(res.versions);
          const profIdx = res.versions.findIndex((v: any) => v.type === 'Professional');
          if (profIdx !== -1) setActiveVersionIdx(profIdx);
          
          addToHistory('polish', `Polish: ${sectionType}`, res);
      }
      setLoading(false);
  };

  const handleCheckFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setCheckFile(e.target.files[0]);
          setCheckText(''); 
      }
  };

  const handleCheck = async () => {
      if (!checkText.trim() && !checkFile) return;
      setLoading(true);
      const content = checkFile || checkText;
      const res = await checkGrantFormat(content, language);
      setCheckResult(res);
      addToHistory('check', `Check: Score ${res?.score}`, res);
      setLoading(false);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('Copied!');
  };

  const handleExportWord = () => {
      if (!rationaleResult) return;
      const blob = new Blob(['<html><body>' + rationaleResult.replace(/\n/g, '<br/>') + '</body></html>'], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectConfig.name}_Rationale.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleExportLatex = () => {
      if (!rationaleResult) return;
      let latex = rationaleResult
          .replace(/^# (.*$)/gim, '\\section{$1}')
          .replace(/^## (.*$)/gim, '\\subsection{$1}')
          .replace(/^### (.*$)/gim, '\\subsubsection{$1}')
          .replace(/\*\*(.*)\*\*/gim, '\\textbf{$1}')
          .replace(/\*(.*)\*/gim, '\\textit{$1}');
      
      const blob = new Blob([latex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectConfig.name}_Rationale.tex`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const polishTags = language === 'ZH' 
    ? ['更学术化', '精简字数', '强调创新性', '降低查重率/重写']
    : ['More Academic', 'Concise', 'Highlight Innovation', 'Reduce Plagiarism/Rewrite'];

  const promptTemplates = [
      { label: "如何描述机制研究？", value: "请生成一段关于[主题]分子机制研究的描述，强调通路间的串扰。" },
      { label: "如何写研究背景？", value: "请基于[主题]写一段研究背景，从临床问题切入，引出科学问题。" },
      { label: "创新点怎么写？", value: "请列出[主题]项目的三个可能的创新点，分别从理论、技术和应用角度。" }
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       {/* ... (Header and Left Panel logic same as before) ... */}
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="text-indigo-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
           <div className="lg:w-1/3 flex flex-col gap-4 overflow-hidden">
               {/* Global Project Config */}
               <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-lg flex-shrink-0">
                   <div className="flex items-center gap-2 mb-4">
                       <Settings size={18} className="text-indigo-300" />
                       <h3 className="font-bold text-sm uppercase tracking-wider">{language === 'ZH' ? '项目配置' : 'Project Configuration'}</h3>
                   </div>
                   <div className="space-y-3">
                       <div>
                           <label className="text-[10px] uppercase text-indigo-300 font-bold block mb-1">{language === 'ZH' ? '项目名称 (课题)' : 'Project Name (Topic)'}</label>
                           <input 
                              value={projectConfig.name}
                              onChange={(e) => setProjectConfig({...projectConfig, name: e.target.value})}
                              placeholder={language === 'ZH' ? '例如：肺癌耐药机制研究...' : 'e.g. Mechanism of Drug Resistance...'}
                              className="w-full bg-indigo-800/50 border border-indigo-700 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                           <div>
                               <label className="text-[10px] uppercase text-indigo-300 font-bold block mb-1">{language === 'ZH' ? '申请代码' : 'Domain Code'}</label>
                               <input 
                                  value={projectConfig.code}
                                  onChange={(e) => setProjectConfig({...projectConfig, code: e.target.value})}
                                  placeholder={language === 'ZH' ? '例如：H1602' : 'e.g. H01'}
                                  className="w-full bg-indigo-800/50 border border-indigo-700 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                               />
                           </div>
                           <div>
                               <label className="text-[10px] uppercase text-indigo-300 font-bold block mb-1">{language === 'ZH' ? '核心关键词' : 'Core Keywords'}</label>
                               <input 
                                  value={projectConfig.keywords}
                                  onChange={(e) => setProjectConfig({...projectConfig, keywords: e.target.value})}
                                  placeholder={language === 'ZH' ? '例如：靶点, 通路' : 'e.g. Target, Pathway'}
                                  className="w-full bg-indigo-800/50 border border-indigo-700 rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                               />
                           </div>
                       </div>
                   </div>
               </div>

               {/* Tabs & Tools */}
               <div className="flex-grow flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                   <div className="flex border-b border-slate-200 dark:border-slate-700">
                       <button 
                          onClick={() => setActiveTab('rationale')}
                          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'rationale' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                       >
                           <BookOpen size={16} /> {t.tabs.rationale}
                       </button>
                       <button 
                          onClick={() => setActiveTab('polish')}
                          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'polish' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                       >
                           <Feather size={16} /> {t.tabs.polish}
                       </button>
                       <button 
                          onClick={() => setActiveTab('check')}
                          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'check' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                       >
                           <ShieldCheck size={16} /> {t.tabs.check}
                       </button>
                   </div>

                   <div className="p-6 flex-grow overflow-y-auto space-y-6 custom-scrollbar">
                       {activeTab === 'rationale' && (
                           <div className="space-y-4 animate-fadeIn">
                               <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.rationale.title}</h3>
                               
                               {rationaleStep === 0 && (
                                   <>
                                       {/* Reference Section */}
                                       <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                           <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1">
                                               <BookOpen size={12} /> {t.rationale.references}
                                            </label>
                                           
                                           {/* File Upload */}
                                           <div className="mb-3">
                                               <button 
                                                  onClick={() => refFileInputRef.current?.click()}
                                                  className="w-full bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                               >
                                                   <Upload size={14} /> {t.rationale.refUpload}
                                               </button>
                                               <input 
                                                  type="file" 
                                                  multiple 
                                                  ref={refFileInputRef} 
                                                  className="hidden" 
                                                  accept="application/pdf"
                                                  onChange={handleRefFileChange}
                                               />
                                               {refFiles.length > 0 && (
                                                   <div className="mt-2 space-y-1">
                                                       {refFiles.map((f, i) => (
                                                           <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                                               <span className="truncate max-w-[200px]">{f.name}</span>
                                                               <button onClick={() => removeRefFile(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                                                           </div>
                                                       ))}
                                                       <div className="text-[10px] text-slate-400 text-right">{refFiles.length}/10 {t.rationale.fileLimit}</div>
                                                   </div>
                                               )}
                                           </div>

                                           {/* DOI Input */}
                                           <div>
                                               <textarea 
                                                  value={doiInput}
                                                  onChange={(e) => setDoiInput(e.target.value)}
                                                  placeholder={t.rationale.refDoi}
                                                  className="w-full h-16 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white dark:bg-slate-800"
                                               />
                                           </div>
                                       </div>

                                       {/* Generation Mode Selector */}
                                       <div>
                                           <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.rationale.modeLabel}</label>
                                           <div className="grid grid-cols-1 gap-2">
                                               {['full', 'status', 'significance'].map((m) => (
                                                   <button 
                                                      key={m}
                                                      onClick={() => setGenMode(m as any)}
                                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${genMode === m ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                   >
                                                       {m === 'full' && <List size={14} className={genMode === m ? 'text-indigo-600' : 'text-slate-400'} />}
                                                       {m === 'status' && <BookOpen size={14} className={genMode === m ? 'text-indigo-600' : 'text-slate-400'} />}
                                                       {m === 'significance' && <Lightbulb size={14} className={genMode === m ? 'text-indigo-600' : 'text-slate-400'} />}
                                                       {t.rationale.modes[m as keyof typeof t.rationale.modes]}
                                                   </button>
                                               ))}
                                           </div>
                                       </div>

                                       <button 
                                          onClick={handleGenerateFramework}
                                          disabled={loading || !projectConfig.name}
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                                       >
                                           {loading ? <Loader2 className="animate-spin" /> : <Network size={18} />}
                                           {language === 'ZH' ? '生成逻辑框架' : 'Generate Logic Framework'}
                                       </button>
                                   </>
                               )}

                               {rationaleStep === 1 && (
                                   <div className="flex flex-col gap-4">
                                       <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-700">
                                           {language === 'ZH' ? '请确认或编辑下方的逻辑树，然后生成全文。' : 'Confirm or edit the logic tree below, then expand to full text.'}
                                       </div>
                                       <div className="flex flex-col gap-2">
                                           <button 
                                              onClick={handleExpandToText}
                                              disabled={loading}
                                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                                           >
                                               {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                                               {language === 'ZH' ? '确认并扩写全文' : 'Confirm & Expand to Text'}
                                           </button>
                                           <button 
                                              onClick={() => setRationaleStep(0)}
                                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg transition-colors text-xs"
                                           >
                                               Back
                                           </button>
                                       </div>
                                   </div>
                               )}

                               {rationaleStep === 2 && (
                                   <div className="flex flex-col gap-2">
                                       <button 
                                          onClick={() => setRationaleStep(0)}
                                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                       >
                                           <ArrowRight size={14} className="rotate-180" /> Start Over
                                       </button>
                                   </div>
                               )}
                           </div>
                       )}

                       {activeTab === 'polish' && (
                           <div className="space-y-4 animate-fadeIn">
                               <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.polish.title}</h3>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.polish.section}</label>
                                   <select 
                                      value={sectionType}
                                      onChange={(e) => setSectionType(e.target.value)}
                                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-slate-200"
                                   >
                                       {Object.entries(t.polish.sections).map(([k, v]) => (
                                           <option key={k} value={k}>{v}</option>
                                       ))}
                                   </select>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.polish.content}</label>
                                   <textarea 
                                      value={polishText}
                                      onChange={(e) => setPolishText(e.target.value)}
                                      placeholder={t.polish.placeholder}
                                      className="w-full h-48 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
                                   />
                               </div>
                               
                               <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase block flex items-center gap-1">
                                        <Wand2 size={12} /> {language === 'ZH' ? '自定义指令' : 'Custom Instructions'}
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {polishTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setCustomInstruction(tag)}
                                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <input 
                                        value={customInstruction}
                                        onChange={(e) => setCustomInstruction(e.target.value)}
                                        placeholder={language === 'ZH' ? '例如：把被动语态改为主动语态...' : 'e.g. Change passive voice to active...'}
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-slate-200"
                                    />
                               </div>

                               <button 
                                  onClick={handlePolish}
                                  disabled={loading || !polishText}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                               >
                                   {loading ? <Loader2 className="animate-spin" /> : <Feather size={18} />}
                                   {language === 'ZH' ? '多版本润色' : 'Multi-Version Polish'}
                               </button>
                           </div>
                       )}

                       {activeTab === 'check' && (
                           <div className="space-y-4 animate-fadeIn">
                               <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.check.title}</h3>
                               
                               <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                                   <input 
                                      type="file" 
                                      ref={checkFileInputRef}
                                      className="hidden" 
                                      accept=".pdf,.doc,.docx,.txt"
                                      onChange={handleCheckFileChange}
                                   />
                                   {checkFile ? (
                                       <div className="flex flex-col items-center">
                                           <FileIcon size={32} className="text-indigo-500 mb-2" />
                                           <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{checkFile.name}</p>
                                           <button onClick={() => setCheckFile(null)} className="text-xs text-red-500 mt-2 hover:underline">Remove</button>
                                       </div>
                                   ) : (
                                       <button 
                                          onClick={() => checkFileInputRef.current?.click()}
                                          className="flex flex-col items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors w-full"
                                       >
                                           <Upload size={24} />
                                           <span className="text-xs font-bold uppercase">{t.check.upload}</span>
                                           <span className="text-[10px] text-slate-400">PDF / Word</span>
                                       </button>
                                   )}
                               </div>

                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Or Paste Text</label>
                                   <textarea 
                                      value={checkText}
                                      onChange={(e) => setCheckText(e.target.value)}
                                      placeholder="Paste full proposal text here..."
                                      className="w-full h-32 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 dark:bg-slate-900 dark:text-slate-200"
                                      disabled={!!checkFile}
                                   />
                               </div>
                               
                               <button 
                                  onClick={handleCheck}
                                  disabled={loading || (!checkText && !checkFile)}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                               >
                                   {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                                   {t.check.btn}
                               </button>
                           </div>
                       )}
                   </div>
               </div>
           </div>

           {/* Right Panel: Output & Dashboard */}
           <div className="lg:w-2/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
               <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                   {loading && (
                       <div className="flex flex-col items-center justify-center h-full text-slate-400">
                           <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                           <p>AI is analyzing grant context...</p>
                       </div>
                   )}

                   {!loading && !rationaleResult && polishVersions.length === 0 && !checkResult && rationaleStep !== 1 && (
                       <div className="h-full flex flex-col gap-8 animate-fadeIn">
                           {/* Prompt Templates */}
                           <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                               <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-4">
                                   <MessageSquare size={18} /> Quick Prompt Templates
                               </h3>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   {promptTemplates.map((tpl, i) => (
                                       <button 
                                          key={i} 
                                          onClick={() => {
                                              setCustomInstruction(tpl.value);
                                              setActiveTab('polish');
                                          }}
                                          className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700 text-left hover:shadow-md transition-all group"
                                       >
                                           <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1 group-hover:text-indigo-600">{tpl.label}</div>
                                           <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{tpl.value}</div>
                                       </button>
                                   ))}
                               </div>
                           </div>

                           {/* Golden Sentences */}
                           {inspiration.length > 0 && (
                               <div>
                                   <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                                       <Sparkles size={18} className="text-amber-500" /> AI Golden Sentences ({projectConfig.code || 'Auto'})
                                   </h3>
                                   <div className="space-y-3">
                                       {inspiration.map((sent, i) => (
                                           <div key={i} className="flex gap-3 items-start bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                               <span className="text-amber-500 font-bold text-sm mt-0.5">{i+1}</span>
                                               <p className="text-sm text-slate-700 dark:text-slate-300 italic">{sent}</p>
                                               <button onClick={() => copyToClipboard(sent)} className="ml-auto text-slate-400 hover:text-amber-600"><Download size={14}/></button>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}

                           {/* History */}
                           {history.length > 0 && (
                               <div>
                                   <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                                       <History size={18} className="text-slate-500" /> Recent Activity
                                   </h3>
                                   <div className="space-y-2">
                                       {history.map((h) => (
                                           <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                               <div className="flex items-center gap-3">
                                                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                       h.type === 'rationale' ? 'bg-blue-100 text-blue-700' :
                                                       h.type === 'polish' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                                   }`}>{h.type}</span>
                                                   <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{h.summary}</span>
                                               </div>
                                               <span className="text-xs text-slate-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                       </div>
                   )}

                   {rationaleStep === 1 && logicTree && (
                       <div className="h-full flex flex-col animate-fadeIn">
                           <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center gap-2">
                               <Network size={20} /> Logic Framework (Editable)
                           </h3>
                           <div className="flex-grow bg-slate-50 rounded-xl border border-slate-200 p-6 overflow-y-auto">
                               <LogicNodeEditor node={logicTree} onChange={setLogicTree} />
                           </div>
                           <p className="text-xs text-slate-400 mt-2 text-center">Click text to edit. Hover to add/delete sub-points.</p>
                       </div>
                   )}

                   {!loading && rationaleStep === 2 && rationaleResult && (
                       <div className="flex flex-col h-full">
                           <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                               <h3 className="text-lg font-bold text-indigo-600 m-0">Rationale Draft ({t.rationale.modes[genMode]})</h3>
                               <div className="flex gap-2">
                                   <button 
                                      onClick={handleExportWord} 
                                      className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                                   >
                                       <FileOutput size={14} /> Word
                                   </button>
                                   <button 
                                      onClick={handleExportLatex} 
                                      className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                                   >
                                       <FileOutput size={14} /> LaTeX
                                   </button>
                                   <button onClick={() => copyToClipboard(rationaleResult)} className="text-slate-400 hover:text-indigo-600"><Download size={18}/></button>
                               </div>
                           </div>
                           <div className="flex-grow overflow-y-auto prose prose-sm prose-slate dark:prose-invert max-w-none custom-scrollbar">
                               <ReactMarkdown>{rationaleResult}</ReactMarkdown>
                           </div>
                       </div>
                   )}

                   {!loading && activeTab === 'polish' && polishVersions.length > 0 && (
                       <div>
                           <div className="flex flex-col mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                               <div className="flex justify-between items-center mb-4">
                                   <h3 className="text-lg font-bold text-indigo-600 m-0">Polished Proposal</h3>
                                   <button onClick={() => copyToClipboard(polishVersions[activeVersionIdx].clean)} className="text-slate-400 hover:text-indigo-600"><Download size={18}/></button>
                                </div>
                               
                               <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                                   {polishVersions.map((v, idx) => (
                                       <button
                                           key={idx}
                                           onClick={() => setActiveVersionIdx(idx)}
                                           className={`py-2 px-3 rounded-md text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                                               activeVersionIdx === idx 
                                               ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-100' 
                                               : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'
                                           }`}
                                       >
                                           <span className="flex items-center gap-1">
                                               {v.type === 'Conservative' && <Scale size={12} />}
                                               {v.type === 'Aggressive' && <Zap size={12} />}
                                               {v.type === 'Professional' && <Feather size={12} />}
                                               {language === 'ZH' 
                                                 ? (v.type === 'Conservative' ? '稳健型' : v.type === 'Aggressive' ? '进取型' : '专业型')
                                                 : v.type
                                               }
                                           </span>
                                       </button>
                                   ))}
                               </div>
                           </div>

                           <div className="flex gap-2 mb-4">
                               <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                   <button 
                                      onClick={() => setPolishView('revision')}
                                      className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${polishView === 'revision' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                                   >
                                       <Edit3 size={12} /> Revision
                                   </button>
                                   <button 
                                      onClick={() => setPolishView('clean')}
                                      className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${polishView === 'clean' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                                   >
                                       <Eye size={12} /> Clean
                                   </button>
                               </div>
                               <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-3 py-1 rounded text-xs flex items-center border border-amber-100 dark:border-amber-800 flex-grow">
                                   <span className="font-bold mr-1">Note:</span> {polishVersions[activeVersionIdx].comment}
                               </div>
                           </div>

                           <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-sm leading-relaxed font-serif">
                               {polishView === 'clean' ? (
                                   <div className="whitespace-pre-wrap">{polishVersions[activeVersionIdx].clean}</div>
                               ) : (
                                   <ReactMarkdown
                                      components={{
                                          del: ({node, ...props}) => <span className="bg-red-100 text-red-600 line-through decoration-red-500 px-0.5 rounded mx-0.5" {...props} />,
                                          strong: ({node, ...props}) => <span className="bg-green-100 text-green-700 font-bold px-0.5 rounded mx-0.5" {...props} />
                                      }}
                                   >
                                       {polishVersions[activeVersionIdx].revisions}
                                   </ReactMarkdown>
                               )}
                           </div>
                       </div>
                   )}

                   {!loading && activeTab === 'check' && checkResult && (
                       <div className="space-y-6">
                           <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
                               <div className="flex items-center gap-3">
                                   <LayoutDashboard className="text-indigo-600" />
                                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0">Review Dashboard</h3>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-lg font-black ${checkResult.score > 80 ? 'bg-green-100 text-green-700' : checkResult.score > 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                   {checkResult.score} / 100
                               </span>
                           </div>
                           
                           <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                               "{checkResult.summary}"
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {/* Hard Errors */}
                               <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                           <AlertOctagon size={16} className="text-red-500" /> {t.check.dash.hard}
                                       </h4>
                                       {checkResult.hardErrors?.status === 'Pass' 
                                           ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">PASS</span>
                                           : <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">FAIL</span>
                                       }
                                   </div>
                                   <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                                       {checkResult.hardErrors?.issues?.length > 0 ? (
                                           checkResult.hardErrors.issues.map((issue, i) => <li key={i} className="flex items-start gap-1"><span className="text-red-500">•</span> {issue}</li>)
                                       ) : (
                                           <li className="text-green-600 flex items-center gap-1"><CheckCircle size={10} /> No critical issues found.</li>
                                       )}
                                   </ul>
                               </div>

                               {/* Logic Check */}
                               <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                           <GitMerge size={16} className="text-amber-500" /> {t.check.dash.logic}
                                       </h4>
                                       {checkResult.logicCheck?.status === 'Pass' 
                                           ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">PASS</span>
                                           : <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">WARNING</span>
                                       }
                                   </div>
                                   <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                                       {checkResult.logicCheck?.issues?.length > 0 ? (
                                           checkResult.logicCheck.issues.map((issue, i) => <li key={i} className="flex items-start gap-1"><span className="text-amber-500">•</span> {issue}</li>)
                                       ) : (
                                           <li className="text-green-600 flex items-center gap-1"><CheckCircle size={10} /> Logic flow appears consistent.</li>
                                       )}
                                   </ul>
                               </div>

                               {/* Format Check */}
                               <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                           <CheckSquare size={16} className="text-blue-500" /> {t.check.dash.format}
                                       </h4>
                                       {checkResult.formatCheck?.status === 'Pass' 
                                           ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">PASS</span>
                                           : <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">REVIEW</span>
                                       }
                                   </div>
                                   <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                                       {checkResult.formatCheck?.issues?.length > 0 ? (
                                           checkResult.formatCheck.issues.map((issue, i) => <li key={i} className="flex items-start gap-1"><span className="text-blue-500">•</span> {issue}</li>)
                                       ) : (
                                           <li className="text-green-600 flex items-center gap-1"><CheckCircle size={10} /> Formatting looks good.</li>
                                       )}
                                   </ul>
                               </div>

                               {/* Anonymity Check */}
                               <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                           <VenetianMask size={16} className="text-purple-500" /> {t.check.dash.anon}
                                       </h4>
                                       {checkResult.anonymityCheck?.status === 'Pass' 
                                           ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">PASS</span>
                                           : <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded">RISK</span>
                                       }
                                   </div>
                                   <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                                       {checkResult.anonymityCheck?.issues?.length > 0 ? (
                                           checkResult.anonymityCheck.issues.map((issue, i) => <li key={i} className="flex items-start gap-1"><span className="text-purple-500">•</span> {issue}</li>)
                                       ) : (
                                           <li className="text-green-600 flex items-center gap-1"><CheckCircle size={10} /> No personal identifiers detected.</li>
                                       )}
                                   </ul>
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

export default GrantApplication;
