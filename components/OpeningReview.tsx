import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Upload, FileText, Send, Download, CheckCircle, AlertTriangle, ClipboardCheck, Loader2, BookOpen, Target, Shield, Zap, ChevronRight, X, PenTool, ExternalLink, RefreshCw, Layout, ChevronDown, ChevronUp, MessageSquare, UserCheck, Gavel, Users, Scale, MessageCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { generateOpeningReview, optimizeOpeningSection } from '../services/geminiService';
import { Language, OpeningReviewResponse, ReviewRole } from '../types';
import { TRANSLATIONS } from '../translations';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import * as pdfjsLib from 'pdfjs-dist';

// Robust PDF.js Initialization
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;
if (pdfjs && typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface OpeningReviewProps {
  language: Language;
}

const OpeningReview: React.FC<OpeningReviewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].opening;
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [target, setTarget] = useState('');
  
  // Replaced single persona with multiple selected roles
  const [selectedRoles, setSelectedRoles] = useState<Set<ReviewRole>>(new Set(['Mentor']));
  const [customFocus, setCustomFocus] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<OpeningReviewResponse | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Optimization State
  const [optimizing, setOptimizing] = useState<string | null>(null); // key of section being optimized
  const [optimizationResult, setOptimizationResult] = useState<{key: string, text: string} | null>(null);

  // PDF Viewer State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Accordion State for Report Sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
      'title': true,
      'method': true,
      'logic': true,
      'lit': true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const rolesConfig: { id: ReviewRole, icon: any, color: string }[] = [
      { id: 'Mentor', icon: UserCheck, color: 'emerald' },
      { id: 'Expert', icon: Gavel, color: 'red' },
      { id: 'Peer', icon: Users, color: 'blue' },
      { id: 'Committee', icon: Scale, color: 'purple' }
  ];

  // Loading Message Cycle
  useEffect(() => {
    let interval: any;
    if (loading) {
      const messages = language === 'ZH' 
        ? [
            "评审团正在集结...",
            "导师正在补充意见...", 
            "外审专家正在挑刺...", 
            "学术委员正在核查规范...",
            "多方观点正在汇总..."
          ]
        : [
            "Assembling the review board...",
            "Mentor is adding comments...", 
            "External reviewer is critiquing...", 
            "Committee checking compliance...",
            "Synthesizing perspectives..."
          ];
      
      let index = 0;
      setLoadingMessage(messages[0]);
      
      interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading, language]);

  // --- PDF Handling ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setPdfDoc(null);
    }
  };

  useEffect(() => {
      if (fileUrl) {
          const loadPdf = async () => {
              try {
                  const loadingTask = pdfjs.getDocument(fileUrl);
                  const pdf = await loadingTask.promise;
                  setPdfDoc(pdf);
                  setNumPages(pdf.numPages);
                  setPageNum(1);
              } catch (err) {
                  console.error("PDF Load Error", err);
              }
          };
          loadPdf();
      }
  }, [fileUrl]);

  useEffect(() => {
      const renderPage = async () => {
          if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;
          
          if (renderTaskRef.current) {
              try { await renderTaskRef.current.cancel(); } catch(e) {}
          }

          try {
              const page = await pdfDoc.getPage(pageNum);
              const viewport = page.getViewport({ scale });
              const canvas = canvasRef.current;
              const context = canvas.getContext('2d');
              const textLayerDiv = textLayerRef.current;

              // Reset Text Layer
              textLayerDiv.innerHTML = '';
              textLayerDiv.style.width = `${viewport.width}px`;
              textLayerDiv.style.height = `${viewport.height}px`;
              textLayerDiv.style.setProperty('--scale-factor', `${scale}`);

              if (context) {
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  
                  const renderContext = {
                      canvasContext: context,
                      viewport: viewport
                  };
                  
                  const renderTask = page.render(renderContext);
                  renderTaskRef.current = renderTask;
                  await renderTask.promise;

                  const textContent = await page.getTextContent();
                  if (pdfjs.renderTextLayer) {
                      pdfjs.renderTextLayer({
                          textContentSource: textContent,
                          container: textLayerDiv,
                          viewport: viewport,
                          textDivs: []
                      });
                  }
              }
          } catch (error: any) {
              if (error.name !== 'RenderingCancelledException') console.error('Render error:', error);
          }
      };
      renderPage();
  }, [pdfDoc, pageNum, scale]);

  // --- Interaction Logic ---

  const scrollToHighlight = (quote: string) => {
      if (!textLayerRef.current || !quote || quote === 'N/A') return;
      
      const existing = textLayerRef.current.querySelectorAll('.review-highlight');
      existing.forEach(el => {
          el.classList.remove('review-highlight', 'bg-red-200', 'border-red-500', 'border-2');
          (el as HTMLElement).style.backgroundColor = '';
      });

      const spans = Array.from(textLayerRef.current.querySelectorAll('span')) as HTMLSpanElement[];
      const targetText = quote.trim();
      
      let found = false;
      for (const span of spans) {
          if (span.textContent && span.textContent.includes(targetText)) {
              span.classList.add('review-highlight');
              span.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
              span.style.borderBottom = '2px solid red';
              span.scrollIntoView({ behavior: 'smooth', block: 'center' });
              found = true;
              break; 
          }
      }
      
      if (!found) {
          alert("Could not locate specific text on this page. Try scrolling or checking other pages.");
      }
  };

  const toggleSection = (key: string) => {
      setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRole = (role: ReviewRole) => {
      const newRoles = new Set(selectedRoles);
      if (newRoles.has(role)) {
          if (newRoles.size > 1) newRoles.delete(role);
      } else {
          newRoles.add(role);
      }
      setSelectedRoles(newRoles);
  };

  // --- Review Logic ---

  const handleReview = async () => {
    if (!file || !target) return;
    setLoading(true);
    setReport(null);
    const result = await generateOpeningReview(file, target, language, Array.from(selectedRoles), customFocus);
    setReport(result);
    setLoading(false);
  };

  const handleOptimize = async (section: string, context: string) => {
    setOptimizing(section);
    const result = await optimizeOpeningSection(section, context, language);
    setOptimizationResult({ key: section, text: result });
    setOptimizing(null);
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.text("Review Report", 20, 20);
    doc.save('Opening_Review_Report.pdf');
  };

  const radarData = useMemo(() => {
    if (!report || !report.radarMap) return [];
    const r = report.radarMap;
    return [
      { subject: language === 'ZH' ? '选题创新性' : 'Innovation', A: r.innovation || 0, fullMark: 100 },
      { subject: language === 'ZH' ? '逻辑严密性' : 'Logic', A: r.logic || 0, fullMark: 100 },
      { subject: language === 'ZH' ? '方法可行性' : 'Method', A: r.feasibility || 0, fullMark: 100 },
      { subject: language === 'ZH' ? '文献综述' : 'Literature', A: r.literature || 0, fullMark: 100 },
      { subject: language === 'ZH' ? '格式规范' : 'Format', A: r.format || 0, fullMark: 100 },
    ];
  }, [report, language]);

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-slate-50">
      {/* Top Bar / Configuration */}
      {!report && (
        <div className="max-w-4xl mx-auto w-full px-4 py-8 overflow-y-auto custom-scrollbar">
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-emerald-600 p-6 text-white">
                   <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                      <ClipboardCheck size={24} /> {t.title}
                   </h2>
                   <p className="text-emerald-100 mt-1">{t.subtitle}</p>
                </div>
                
                <div className="p-8 space-y-6 relative">
                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center rounded-xl">
                            <div className="relative mb-6">
                                <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Shield size={32} className="text-emerald-600" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{language === 'ZH' ? '多角色评审进行中' : 'Multi-Role Review in Progress'}</h3>
                            <p className="text-emerald-600 font-medium animate-pulse text-lg px-4">{loadingMessage}</p>
                        </div>
                    )}

                    {/* File Upload */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                    >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="application/pdf"
                          onChange={handleFileChange} 
                        />
                        {file ? (
                          <div className="flex flex-col items-center">
                              <FileText size={48} className="text-emerald-500 mb-2" />
                              <p className="font-bold text-slate-800 break-all">{file.name}</p>
                              <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-slate-400">
                              <Upload size={48} className="mb-2" />
                              <p className="font-medium text-slate-600">{t.uploadDesc}</p>
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Target */}
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">{t.targetLabel}</label>
                          <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder={t.targetPlaceholder}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                       </div>
                       
                       {/* Role Selection (Multi-select) */}
                       <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-slate-700 mb-2">{t.rolesLabel}</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                             {rolesConfig.map((role) => {
                                 const isSelected = selectedRoles.has(role.id);
                                 const RoleIcon = role.icon;
                                 // Safely access translation
                                 const roleTrans = (t.roles as any)[role.id.toLowerCase()];
                                 
                                 return (
                                     <div 
                                        key={role.id}
                                        onClick={() => toggleRole(role.id)}
                                        className={`border rounded-xl p-3 cursor-pointer transition-all relative overflow-hidden group
                                            ${isSelected 
                                                ? `bg-${role.color}-50 border-${role.color}-500 shadow-md` 
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                                        `}
                                     >
                                         {isSelected && (
                                             <div className={`absolute top-2 right-2 w-4 h-4 rounded-full bg-${role.color}-500 flex items-center justify-center`}>
                                                 <CheckCircle size={10} className="text-white" />
                                             </div>
                                         )}
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isSelected ? `bg-${role.color}-200 text-${role.color}-700` : 'bg-slate-100 text-slate-500'}`}>
                                             <RoleIcon size={16} />
                                         </div>
                                         <h4 className={`font-bold text-sm mb-1 ${isSelected ? `text-${role.color}-900` : 'text-slate-700'}`}>{roleTrans.name}</h4>
                                         <p className={`text-[10px] ${isSelected ? `text-${role.color}-700` : 'text-slate-500'}`}>{roleTrans.desc}</p>
                                     </div>
                                 );
                             })}
                          </div>
                       </div>
                    </div>

                    {/* Review Focus */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <MessageSquare size={16} className="text-emerald-500" /> 
                            {t.focusLabel}
                        </label>
                        <textarea
                            value={customFocus}
                            onChange={(e) => setCustomFocus(e.target.value)}
                            placeholder={t.focusPlaceholder}
                            className="w-full h-20 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        />
                    </div>

                    <button 
                      onClick={handleReview}
                      disabled={!file || !target || loading}
                      className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        {t.btn}
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Report View */}
      {report && (
         <div className="flex flex-grow overflow-hidden relative">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 z-20 shadow-sm">
               <div className="flex items-center gap-4">
                  <button onClick={() => setReport(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">{file?.name}</span>
                  <div className="flex gap-1">
                      {Array.from(selectedRoles).map(role => (
                          <span key={role} className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-50 border-slate-200 text-slate-600">
                              {(t.roles as any)[(role as string).toLowerCase()].name}
                          </span>
                      ))}
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600">Score:</span>
                  <span className={`text-lg font-black px-3 py-1 rounded bg-slate-900 text-white ${report.overallScore >= 80 ? 'bg-emerald-600' : report.overallScore < 60 ? 'bg-red-500' : 'bg-amber-500'}`}>
                     {report.overallScore}
                  </span>
                  <button onClick={handleDownloadPDF} className="bg-slate-100 hover:bg-slate-200 p-2 rounded text-slate-600 ml-4"><Download size={18} /></button>
               </div>
            </div>

            {/* Left Panel: PDF Viewer */}
            <div ref={scrollContainerRef} className="w-1/2 bg-slate-100 pt-14 border-r border-slate-200 hidden lg:flex items-center justify-center overflow-auto relative">
                {pdfDoc ? (
                    <div className="relative shadow-lg m-8">
                        <canvas ref={canvasRef} className="block bg-white" />
                        <div ref={textLayerRef} className="textLayer absolute top-0 left-0 right-0 bottom-0 overflow-hidden opacity-30 text-transparent leading-none pointer-events-none" />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full flex gap-4 text-sm items-center pointer-events-auto shadow-lg backdrop-blur-sm">
                            <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} className="hover:text-blue-300 disabled:opacity-50">Prev</button>
                            <span>{pageNum} / {numPages}</span>
                            <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages} className="hover:text-blue-300 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" />
                        Loading PDF...
                    </div>
                )}
            </div>

            {/* Right Panel: Analysis Report */}
            <div className="w-full lg:w-1/2 bg-white pt-14 overflow-y-auto relative scroll-smooth custom-scrollbar" id="report-container">
               <div className="p-8 max-w-3xl mx-auto space-y-8 pb-20">
                  
                  {/* Executive Summary */}
                  <section>
                     <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Layout className="text-emerald-600" /> Executive Summary
                     </h3>
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-sm">
                        {report.executiveSummary}
                     </div>
                  </section>

                  {/* Role Insights Grid (New Feature) */}
                  {report.roleInsights && report.roleInsights.length > 0 && (
                      <section>
                          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Users className="text-blue-600" /> Role Perspectives
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                              {report.roleInsights.map((insight, idx) => {
                                  // Find role config to get color/icon
                                  // The API returns role name, we might need to map back or just trust UI state if strict
                                  // For robustness, let's use a simple heuristic or cycle colors if mapping fails
                                  // But `insight.key` should map to ReviewRole if we implemented the service correctly
                                  const roleConf = rolesConfig.find(r => r.id === insight.key as ReviewRole) || rolesConfig[idx % rolesConfig.length];
                                  const RoleIcon = roleConf.icon;
                                  
                                  return (
                                      <div key={idx} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-${roleConf.color}-500`}>
                                          <div className="flex items-center gap-2 mb-2">
                                              <div className={`p-1.5 rounded-full bg-${roleConf.color}-100 text-${roleConf.color}-600`}>
                                                  <RoleIcon size={14} />
                                              </div>
                                              <span className="font-bold text-slate-800">{insight.role}</span>
                                          </div>
                                          <div className="text-sm text-slate-600 leading-relaxed pl-8">
                                              {insight.summary}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </section>
                  )}

                  {/* Radar Chart */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                              <Radar name="Score" dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.5} />
                           </RadarChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-3">
                         {radarData.map(d => (
                            <div key={d.subject} className="flex items-center justify-between">
                               <span className="text-xs font-bold text-slate-600 uppercase w-24">{d.subject}</span>
                               <div className="flex-grow mx-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.A}%` }}></div>
                               </div>
                               <span className="text-sm font-mono font-bold text-slate-800 w-8 text-right">{d.A}</span>
                            </div>
                         ))}
                     </div>
                  </section>

                  {/* Detailed Analysis Sections */}
                  {[
                      { key: 'title', title: 'Title Analysis', icon: FileText, data: report.titleAnalysis },
                      { key: 'method', title: 'Methodology & Logic', icon: Zap, data: report.methodologyAnalysis },
                      { key: 'logic', title: 'Logic Coherence', icon: Layout, data: report.logicAnalysis },
                      { key: 'lit', title: 'Literature Review', icon: BookOpen, data: report.literatureAnalysis }
                  ].map((section) => (
                      <div key={section.key} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <button 
                             onClick={() => toggleSection(section.key)}
                             className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
                          >
                              <div className="flex items-center gap-2">
                                  <section.icon className="text-blue-500" size={18} />
                                  <span className="font-bold text-slate-800">{section.title}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${section.data?.score >= 8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>Score: {section.data?.score}</span>
                              </div>
                              {openSections[section.key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          
                          {openSections[section.key] && section.data && (
                              <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-6 animate-fadeIn">
                                  {/* Strengths */}
                                  {section.data.strengths.length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={12}/> Strengths</h4>
                                          <ul className="space-y-1">
                                              {section.data.strengths.map((str, i) => (
                                                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                      <span className="text-green-500 mt-1">•</span> {str}
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}

                                  {/* Weaknesses */}
                                  {section.data.weaknesses.length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Weaknesses & Fixes</h4>
                                          <div className="space-y-3">
                                              {section.data.weaknesses.map((item, i) => (
                                                  <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition-all group" onClick={() => scrollToHighlight(item.quote)}>
                                                      <div className="flex justify-between items-start mb-1">
                                                          <span className="text-sm font-bold text-slate-800">{item.point}</span>
                                                          <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Locate</span>
                                                      </div>
                                                      <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded mb-2 border-l-2 border-slate-300">
                                                          "{item.quote}"
                                                      </div>
                                                      <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded">
                                                          <PenTool size={12} className="mt-0.5" /> 
                                                          <span className="font-bold">Suggestion:</span> {item.suggestion}
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  
                                  <div className="flex justify-end">
                                      <button 
                                        onClick={() => handleOptimize(section.title, section.data.weaknesses.map(w => w.point).join('; '))}
                                        className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                                      >
                                          <RefreshCw size={12} /> AI Optimize Section
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}

                  {/* Journal Fit */}
                  {report.journalFit && (
                  <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Target className="text-purple-500" /> Journal Fit
                         </h3>
                         <div className={`px-3 py-1 rounded text-sm font-bold ${report.journalFit.score >= 6 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Fit Score: {report.journalFit.score}/10
                         </div>
                      </div>
                      <p className="text-slate-600 text-sm mb-6">{report.journalFit.analysis}</p>
                      
                      {report.journalFit.score < 8 && (
                         <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recommended Alternatives</h4>
                            <div className="grid grid-cols-1 gap-3">
                               {report.journalFit.alternativeJournals?.map((j, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                                     <div>
                                        <div className="font-bold text-purple-900">{j.name}</div>
                                        <div className="text-xs text-purple-700">{j.reason}</div>
                                     </div>
                                     <span className="text-xs font-bold bg-white px-2 py-1 rounded text-purple-600 border border-purple-200">IF: {j.if}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                  </section>
                  )}
               </div>
               
               {/* Optimization Modal */}
               {optimizationResult && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOptimizationResult(null)}>
                     <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full m-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-slate-800 flex items-center gap-2"><RefreshCw className="text-amber-500" /> AI Optimization Suggestion</h3>
                           <button onClick={() => setOptimizationResult(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm leading-relaxed text-slate-700 font-medium max-h-96 overflow-y-auto">
                           {optimizationResult.text}
                        </div>
                        <div className="mt-4 flex justify-end">
                           <button onClick={() => navigator.clipboard.writeText(optimizationResult.text)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800">Copy Result</button>
                        </div>
                     </div>
                  </div>
               )}
               
               {/* Loading Overlay for Optimization */}
               {optimizing && (
                  <div className="absolute inset-0 z-40 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                     <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
                        <Loader2 className="animate-spin text-blue-600" />
                        <span className="font-bold text-slate-700">Optimizing {optimizing}...</span>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default OpeningReview;