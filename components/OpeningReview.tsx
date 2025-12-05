
import React, { useState, useRef } from 'react';
import { Upload, FileText, Send, Download, CheckCircle, AlertTriangle, ClipboardCheck, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { generateOpeningReview } from '../services/geminiService';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface OpeningReviewProps {
  language: Language;
}

const OpeningReview: React.FC<OpeningReviewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].opening;
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleReview = async () => {
    if (!file || !target) return;
    setLoading(true);
    const result = await generateOpeningReview(file, target, language);
    setReport(result);
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    
    doc.setFontSize(16);
    doc.text("Opening Proposal Review Report", margin, margin);
    
    doc.setFontSize(10);
    doc.text(`Target: ${target}`, margin, margin + 10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, margin + 16);

    // Simple text wrapping for the markdown content
    // For a real production app, we might parse markdown to styled PDF elements,
    // but splitting text is sufficient for a downloadable report here.
    const splitText = doc.splitTextToSize(report.replace(/[*#]/g, ''), maxLineWidth);
    
    let cursorY = margin + 30;
    doc.setFontSize(11);
    
    splitText.forEach((line: string) => {
        if (cursorY > 280) {
            doc.addPage();
            cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += 7;
    });

    doc.save('Opening_Review_Report.pdf');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <ClipboardCheck size={24} className="text-emerald-100" />
              </div>
              <h2 className="text-3xl font-serif font-bold">{t.title}</h2>
            </div>
            <p className="text-emerald-100 max-w-xl">{t.subtitle}</p>
          </div>
          <div className="hidden md:block opacity-30">
             <FileText size={120} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Upload size={18} className="text-emerald-600" /> {t.uploadTitle}
             </h3>

             {/* File Upload */}
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors mb-6"
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
                      <p className="text-xs mt-1">PDF Only</p>
                   </div>
                )}
             </div>

             {/* Target Input */}
             <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.targetLabel}</label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={t.targetPlaceholder}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
             </div>

             <button 
               onClick={handleReview}
               disabled={!file || !target || loading}
               className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
             >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                {t.btn}
             </button>
          </div>

          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 text-emerald-800 text-sm">
             <h4 className="font-bold mb-2 flex items-center gap-2"><CheckCircle size={16} /> Analysis Criteria</h4>
             <ul className="space-y-2 pl-1">
                <li className="flex items-start gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></span>
                   <span>{t.sections.titleCheck}</span>
                </li>
                <li className="flex items-start gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></span>
                   <span>{t.sections.methodCheck}</span>
                </li>
                <li className="flex items-start gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></span>
                   <span>{t.sections.logicCheck}</span>
                </li>
                <li className="flex items-start gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></span>
                   <span>{t.sections.journalMatch}</span>
                </li>
             </ul>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7">
           {report ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-fadeIn">
                 <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between rounded-t-xl">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                       <ClipboardCheck size={18} className="text-emerald-600" /> {t.reportTitle}
                    </span>
                    <button 
                      onClick={handleDownloadPDF}
                      className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                       <Download size={14} /> {t.download}
                    </button>
                 </div>
                 <div className="p-8 overflow-y-auto prose prose-slate max-w-none prose-headings:text-slate-800">
                    <ReactMarkdown components={{
                       h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-emerald-900 border-b-2 border-emerald-100 pb-4 mb-6" {...props} />,
                       h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props} />,
                       li: ({node, ...props}) => <li className="my-1" {...props} />
                    }}>
                       {report}
                    </ReactMarkdown>
                 </div>
              </div>
           ) : (
              <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <AlertTriangle className="text-slate-300" size={40} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-400 mb-2">No Report Generated</h3>
                 <p className="text-slate-400 text-sm max-w-xs">Upload your proposal and set a target to receive a detailed analysis.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default OpeningReview;
