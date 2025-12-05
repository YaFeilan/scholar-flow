
import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, Send, Download, CheckCircle, AlertTriangle, ClipboardCheck, Loader2, BarChart2, BookOpen, Target, Shield, Zap, ChevronRight, X, PenTool, ExternalLink, RefreshCw, Layout } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { generateOpeningReview, optimizeOpeningSection } from '../services/geminiService';
import { Language, OpeningReviewResponse, ReviewPersona } from '../types';
import { TRANSLATIONS } from '../translations';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface OpeningReviewProps {
  language: Language;
}

const OpeningReview: React.FC<OpeningReviewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].opening;
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState('');
  const [persona, setPersona] = useState<ReviewPersona>('Gentle');
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<OpeningReviewResponse | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  // Optimization State
  const [optimizing, setOptimizing] = useState<string | null>(null); // key of section being optimized
  const [optimizationResult, setOptimizationResult] = useState<{key: string, text: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleReview = async () => {
    if (!file || !target) return;
    setLoading(true);
    setReport(null);
    const result = await generateOpeningReview(file, target, language, persona);
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
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    doc.setFontSize(16);
    doc.text("Opening Proposal Review Report", margin, margin);
    
    doc.setFontSize(10);
    doc.text(`Target: ${target}`, margin, margin + 10);
    doc.text(`Persona: ${persona}`, margin, margin + 15);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 20);

    let y = margin + 30;
    const addLine = (text: string, fontSize = 10, bold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      if (y + lines.length * 5 > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    };

    if (report.executiveSummary) {
        addLine("Executive Summary", 12, true);
        addLine(report.executiveSummary);
        y += 5;
    }
    
    if (report.titleAnalysis?.critique) {
        addLine("Title Analysis", 12, true);
        addLine(report.titleAnalysis.critique);
        y += 5;
    }

    if (report.methodologyAnalysis?.critique) {
        addLine("Methodology Analysis", 12, true);
        addLine(report.methodologyAnalysis.critique);
        y += 5;
    }

    doc.save('Opening_Review_Report.pdf');
  };

  // Radar Data
  const radarData = useMemo(() => {
    if (!report || !report.radarMap) return [];
    // Defensive coding for missing radarMap from AI response
    const r = report.radarMap;
    return [
      { subject: 'Topic', A: r.topic || 0, fullMark: 100 },
      { subject: 'Method', A: r.method || 0, fullMark: 100 },
      { subject: 'Data', A: r.data || 0, fullMark: 100 },
      { subject: 'Theory', A: r.theory || 0, fullMark: 100 },
      { subject: 'Language', A: r.language || 0, fullMark: 100 },
    ];
  }, [report]);

  // Scroll to section
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-slate-50">
      {/* Top Bar / Configuration */}
      {!report && (
        <div className="max-w-4xl mx-auto w-full px-4 py-8 overflow-y-auto">
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-emerald-600 p-6 text-white">
                   <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                      <ClipboardCheck size={24} /> {t.title}
                   </h2>
                   <p className="text-emerald-100 mt-1">{t.subtitle}</p>
                </div>
                
                <div className="p-8 space-y-6">
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
                       {/* Persona */}
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Reviewer Persona</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                             <button
                               onClick={() => setPersona('Gentle')}
                               className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${persona === 'Gentle' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                             >
                                <Shield size={14} /> Gentle Mentor
                             </button>
                             <button
                               onClick={() => setPersona('Critical')}
                               className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${persona === 'Critical' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                             >
                                <Zap size={14} /> Critical Reviewer
                             </button>
                          </div>
                       </div>
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

      {/* Split Screen View */}
      {report && (
         <div className="flex flex-grow overflow-hidden relative">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 z-20 shadow-sm">
               <div className="flex items-center gap-4">
                  <button onClick={() => setReport(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <span className="font-bold text-slate-800">{file?.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${persona === 'Gentle' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                     {persona} Review
                  </span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600">Overall Score:</span>
                  <span className={`text-lg font-black px-3 py-1 rounded bg-slate-900 text-white ${report.overallScore >= 80 ? 'bg-emerald-600' : report.overallScore < 60 ? 'bg-red-500' : 'bg-amber-500'}`}>
                     {report.overallScore}
                  </span>
                  <button onClick={handleDownloadPDF} className="bg-slate-100 hover:bg-slate-200 p-2 rounded text-slate-600 ml-4"><Download size={18} /></button>
               </div>
            </div>

            {/* Left Panel: PDF Preview */}
            <div className="w-1/2 bg-slate-100 pt-14 border-r border-slate-200 hidden lg:block">
               {fileUrl ? (
                  <iframe src={fileUrl} className="w-full h-full" title="PDF Preview" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Preview Available</div>
               )}
            </div>

            {/* Right Panel: Analysis Report */}
            <div className="w-full lg:w-1/2 bg-white pt-14 overflow-y-auto relative scroll-smooth" id="report-container">
               {/* Floating TOC */}
               <div className="fixed right-6 top-20 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur border border-slate-200 p-2 rounded-lg shadow-sm hidden xl:flex">
                  {[
                     { id: 'summary', label: 'Summary', icon: Layout },
                     { id: 'radar', label: 'Radar', icon: BarChart2 },
                     { id: 'title', label: 'Title', icon: FileText },
                     { id: 'method', label: 'Method', icon: Zap },
                     { id: 'journal', label: 'Fit', icon: Target },
                  ].map(item => (
                     <button key={item.id} onClick={() => scrollToSection(item.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title={item.label}>
                        <item.icon size={18} />
                     </button>
                  ))}
               </div>

               <div className="p-8 max-w-3xl mx-auto space-y-10 pb-20">
                  
                  {/* Executive Summary */}
                  <section id="summary">
                     <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Layout className="text-emerald-600" /> Executive Summary
                     </h3>
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                        {report.executiveSummary}
                     </div>
                  </section>

                  {/* Radar Chart */}
                  <section id="radar" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                              <Radar name="Score" dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.5} />
                           </RadarChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-3">
                         {radarData.map(d => (
                            <div key={d.subject} className="flex items-center justify-between">
                               <span className="text-sm font-bold text-slate-600">{d.subject}</span>
                               <div className="flex-grow mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.A}%` }}></div>
                               </div>
                               <span className="text-sm font-mono font-bold text-slate-800">{d.A}</span>
                            </div>
                         ))}
                     </div>
                  </section>

                  {/* Title Analysis */}
                  {report.titleAnalysis && (
                  <section id="title" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <FileText className="text-blue-500" /> Title Analysis
                         </h3>
                         <button 
                           onClick={() => handleOptimize('Title', report.titleAnalysis?.critique || 'Improve this title')}
                           className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
                         >
                            <RefreshCw size={12} /> Optimize
                         </button>
                      </div>
                      <p className="text-slate-600 mb-6 text-sm">{report.titleAnalysis.critique}</p>
                      
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Suggested Alternatives</h4>
                      <div className="space-y-2">
                         {report.titleAnalysis.suggestions?.map((sug, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 group cursor-pointer hover:bg-blue-100 transition-colors">
                               <span className="text-blue-500 font-bold text-sm">#{i+1}</span>
                               <span className="text-slate-800 font-medium text-sm flex-grow">{sug}</span>
                               <button className="text-blue-400 opacity-0 group-hover:opacity-100 hover:text-blue-700" onClick={() => navigator.clipboard.writeText(sug)}>Copy</button>
                            </div>
                         ))}
                      </div>
                  </section>
                  )}

                  {/* Methodology Analysis */}
                  {report.methodologyAnalysis && (
                  <section id="method" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                         <Zap className="text-amber-500" /> Methodology & Logic
                      </h3>
                      <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                         <p className="text-amber-900 text-sm">{report.methodologyAnalysis.critique}</p>
                      </div>
                      
                      <div className="space-y-4">
                         {report.methodologyAnalysis.suggestions?.map((item, i) => (
                            <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                               <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Suggestion {i+1}</span>
                                  <span className="text-xs font-bold text-amber-600">{item.reason}</span>
                               </div>
                               <div className="grid grid-cols-2 text-sm">
                                  <div className="p-3 border-r border-slate-200 bg-red-50/30 text-slate-500 line-through decoration-red-300 decoration-2">
                                     {item.original}
                                  </div>
                                  <div className="p-3 bg-green-50/30 text-green-800 font-medium">
                                     {item.better}
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                  </section>
                  )}

                  {/* Journal Fit */}
                  {report.journalFit && (
                  <section id="journal" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
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
                  
                   {/* Citations */}
                  <section>
                     <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                        <BookOpen className="text-slate-500" /> Recommended Literature
                     </h3>
                     <div className="grid grid-cols-1 gap-3">
                        {report.literature?.map((lit, i) => (
                           <div key={i} className="p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow bg-white group">
                              <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600">{lit.title}</h4>
                              <p className="text-xs text-slate-500 mb-2">{lit.author} • {lit.year}</p>
                              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mb-2">Why: {lit.reason}</p>
                              <div className="flex justify-end gap-2">
                                 {lit.link && (
                                    <a href={lit.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                       <ExternalLink size={12} /> Google Scholar
                                    </a>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>
               </div>
               
               {/* Optimization Modal */}
               {optimizationResult && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOptimizationResult(null)}>
                     <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles className="text-amber-500" /> AI Optimization Suggestion</h3>
                           <button onClick={() => setOptimizationResult(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm leading-relaxed text-slate-700 font-medium">
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

// Helper for icon
const Sparkles = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>
);

export default OpeningReview;
