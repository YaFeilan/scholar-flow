
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Feather, ShieldCheck, Send, Loader2, Sparkles, AlertTriangle, CheckCircle, Download, BookOpen, Key, Briefcase, Upload, Link, Trash2, List, Lightbulb, Eye, Edit3, Wand2, Layers, Zap, Scale, LayoutDashboard, AlertOctagon, GitMerge, CheckSquare, VenetianMask, File as FileIcon, Settings, History, MessageSquare, Plus, Minus, ArrowRight, FileOutput, Network, Gavel, User, Layout, Image as ImageIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateGrantLogicFramework, expandGrantRationale, polishGrantProposal, checkGrantFormat, getGrantInspiration, generateGrantReview } from '../services/geminiService';
import { Language, GrantCheckResult, LogicNode, GrantPolishVersion, GrantReviewResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { jsPDF } from 'jspdf';

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
    type: 'rationale' | 'polish' | 'check' | 'review';
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
  const [activeTab, setActiveTab] = useState<'rationale' | 'polish' | 'check' | 'review'>('rationale');
  
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
  const [rationaleImage, setRationaleImage] = useState<globalThis.File | null>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);
  const rationaleImageRef = useRef<HTMLInputElement>(null);
  
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

  // Review State
  const [reviewFile, setReviewFile] = useState<globalThis.File | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRole, setReviewRole] = useState('Senior Researcher');
  const [reviewFramework, setReviewFramework] = useState(language === 'ZH' ? '请重点评估创新性、可行性以及研究基础。' : 'Focus on innovation, feasibility, and research foundation.');
  const [reviewResult, setReviewResult] = useState<GrantReviewResult | null>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);
  
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
          references,
          rationaleImage || undefined
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
          setRefFiles(prev => [...prev, ...newFiles].slice(0, 30)); 
      }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setRationaleImage(e.target.files[0]);
      }
  };

  const removeRefFile = (index: number) => {
      setRefFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePolish = async () => {
      if (!polishText.trim()) return;
      setLoading(true);
      const instruction = customInstruction || `Enhance readability and impact for ${sectionType}.`;
      const polished = await polishGrantProposal(polishText, sectionType, language, instruction);
      if (polished) {
          setPolishVersions(prev => [...prev, { type: sectionType, clean: polished, revisions: polished, comment: 'Polished by AI' }]);
          setActiveVersionIdx(prev => prev + 1);
          addToHistory('polish', `Polished ${sectionType}`, polished);
      }
      setLoading(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="text-indigo-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
           {/* Left Panel: Tabs & Inputs */}
           <div className="lg:w-1/3 flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="flex border-b border-slate-200 dark:border-slate-700">
                   <button onClick={() => setActiveTab('rationale')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'rationale' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{t.tabs.rationale}</button>
                   <button onClick={() => setActiveTab('polish')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'polish' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{t.tabs.polish}</button>
                   <button onClick={() => setActiveTab('check')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'check' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{t.tabs.check}</button>
                   <button onClick={() => setActiveTab('review')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'review' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{t.tabs.review}</button>
               </div>

               <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                   {activeTab === 'rationale' && (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Project Name</label>
                               <input value={projectConfig.name} onChange={e => setProjectConfig({...projectConfig, name: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="e.g. Mechanism of..." />
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Domain Code</label>
                                   <input value={projectConfig.code} onChange={e => setProjectConfig({...projectConfig, code: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="e.g. H0101" />
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Keywords</label>
                                   <input value={projectConfig.keywords} onChange={e => setProjectConfig({...projectConfig, keywords: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="Separated by comma" />
                               </div>
                           </div>
                           
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
                                       <div className="text-[10px] text-slate-400 text-right">{refFiles.length}/30 {t.rationale.fileLimit}</div>
                                   </div>
                               )}
                           </div>

                           <button onClick={handleGenerateFramework} disabled={loading || !projectConfig.name} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
                               {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Generate Framework'}
                           </button>
                       </div>
                   )}
                   {activeTab === 'polish' && (
                       <div className="space-y-4">
                           <select value={sectionType} onChange={e => setSectionType(e.target.value)} className="w-full border rounded p-2 text-sm">
                               {Object.entries(t.polish.sections).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                           </select>
                           <textarea value={polishText} onChange={e => setPolishText(e.target.value)} className="w-full h-40 border rounded p-2 text-sm" placeholder={t.polish.placeholder} />
                           <button onClick={handlePolish} disabled={loading || !polishText} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
                               {loading ? <Loader2 className="animate-spin mx-auto" /> : t.polish.title}
                           </button>
                       </div>
                   )}
                   {/* ... Other tabs ... */}
               </div>
           </div>

           {/* Right Panel: Output */}
           <div className="lg:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                   {rationaleResult ? (
                       <div className="prose prose-sm dark:prose-invert max-w-none">
                           <ReactMarkdown>{rationaleResult}</ReactMarkdown>
                       </div>
                   ) : (
                       <div className="flex items-center justify-center h-full text-slate-400">
                           <FileText size={48} className="opacity-50 mb-2" />
                           <p>Output will appear here.</p>
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

export default GrantApplication;
