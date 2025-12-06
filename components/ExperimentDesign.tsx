
import React, { useState, useMemo } from 'react';
import { Beaker, Calculator, ListOrdered, GitBranch, Target, Download, Loader2, ArrowRight, Settings, ChevronDown, ChevronUp, Sparkles, Zap, Wand2 } from 'lucide-react';
import { Language, ExperimentDesignResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateExperimentDesign, optimizeHypothesis } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

interface ExperimentDesignProps {
  language: Language;
}

const ExperimentDesign: React.FC<ExperimentDesignProps> = ({ language }) => {
  const t = TRANSLATIONS[language].experimentDesign;
  
  // State
  const [hypothesis, setHypothesis] = useState('');
  const [field, setField] = useState('Psychology');
  const [methodology, setMethodology] = useState('Auto'); 
  const [structure, setStructure] = useState('Between');
  
  // New Variables
  const [iv, setIv] = useState('');
  const [dv, setDv] = useState('');

  // Optimization State
  const [optimizing, setOptimizing] = useState(false);

  // Advanced Stats Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alpha, setAlpha] = useState<number>(0.05);
  const [power, setPower] = useState<number>(0.80);
  const [effectSizeType, setEffectSizeType] = useState<'small'|'medium'|'large'|'custom'>('medium');
  const [customEffectSize, setCustomEffectSize] = useState<string>('0.5');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExperimentDesignResult | null>(null);

  const handleGenerate = async () => {
    if (!hypothesis.trim()) return;
    setLoading(true);
    setResult(null);
    
    const effectSizeVal = effectSizeType === 'custom' ? customEffectSize : 
                          effectSizeType === 'small' ? 'Small (e.g. d=0.2)' :
                          effectSizeType === 'medium' ? 'Medium (e.g. d=0.5)' : 'Large (e.g. d=0.8)';

    const statsParams = {
        alpha,
        power,
        effectSize: effectSizeVal
    };

    const selectedMethodologyLabel = t.methodologies[methodology as keyof typeof t.methodologies];
    const selectedStructureLabel = t.structures[structure as keyof typeof t.structures];

    const data = await generateExperimentDesign(hypothesis, field, selectedMethodologyLabel, language, iv, dv, statsParams, selectedStructureLabel);
    setResult(data);
    setLoading(false);
  };

  const handleOptimizeHypothesis = async () => {
      if (!hypothesis.trim()) return;
      setOptimizing(true);
      const optimized = await optimizeHypothesis(hypothesis, language);
      if (optimized) setHypothesis(optimized.replace(/^"|"$/g, ''));
      setOptimizing(false);
  };

  const handleTemplateClick = (template: 'rct' | 'ab' | 'memory') => {
      if (template === 'rct') {
          setField('Medicine');
          setMethodology('RCT');
          setStructure('Between');
          setHypothesis(language === 'ZH' ? '新药物X相比安慰剂能显著降低高血压患者的收缩压。' : 'New Drug X significantly reduces systolic blood pressure in hypertensive patients compared to placebo.');
      } else if (template === 'ab') {
          setField('UX');
          setMethodology('Survey'); 
          setStructure('Between');
          setHypothesis(language === 'ZH' ? '绿色购买按钮相比红色按钮能提高结账转化率。' : 'A green checkout button increases conversion rate compared to a red button.');
      } else {
          setField('Psychology');
          setMethodology('Auto');
          setStructure('Within');
          setHypothesis(language === 'ZH' ? '间隔重复学习法相比集中学习法能显著提高长期记忆保留率。' : 'Spaced repetition improves long-term memory retention compared to massed practice.');
      }
  };

  const handleExport = () => {
    if (!result) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(result.title || "Experiment Design", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const hText = `Hypothesis: ${hypothesis}`;
    const hLines = doc.splitTextToSize(hText, maxWidth);
    doc.text(hLines, margin, y);
    y += hLines.length * 5 + 5;

    // Sample Size
    if (result.sampleSize) {
        doc.setFont("helvetica", "bold");
        doc.text("Sample Size Calculation", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.text(`Recommended N: ${result.sampleSize.recommended}`, margin, y);
        y += 6;
        result.sampleSize.parameters?.forEach(p => {
            doc.text(`- ${p.label}: ${p.value}`, margin + 5, y);
            y += 6;
        });
        const expLines = doc.splitTextToSize(`Reasoning: ${result.sampleSize.explanation}`, maxWidth);
        doc.text(expLines, margin, y);
        y += expLines.length * 5 + 10;
    }

    // Variables
    if (result.variables) {
        doc.setFont("helvetica", "bold");
        doc.text("Variables", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        if (result.variables.independent) { doc.text(`IV: ${result.variables.independent.join(', ')}`, margin, y); y += 6; }
        if (result.variables.dependent) { doc.text(`DV: ${result.variables.dependent.join(', ')}`, margin, y); y += 6; }
        if (result.variables.control) { doc.text(`Control: ${result.variables.control.join(', ')}`, margin, y); y += 6; }
        if (result.variables.confounders) { doc.text(`Confounders: ${result.variables.confounders.join(', ')}`, margin, y); y += 10; }
    }

    // Flow
    if (result.flow && result.flow.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Experimental Flow", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        result.flow.forEach(step => {
            if (y > 270) { doc.addPage(); y = margin; }
            const sText = `${step.step}. ${step.name}: ${step.description}`;
            const sLines = doc.splitTextToSize(sText, maxWidth);
            doc.text(sLines, margin, y);
            y += sLines.length * 5 + 4;
        });
    }

    doc.save("Experiment_Design.pdf");
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
              <Beaker className="text-purple-600" /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
             
             {/* Scrollable Content */}
             <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 pb-4">
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Target size={16} className="text-blue-500" /> {t.hypothesisLabel}
                        </label>
                        <textarea 
                           value={hypothesis}
                           onChange={(e) => setHypothesis(e.target.value)}
                           placeholder={t.hypothesisPlaceholder}
                           className="w-full h-24 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none leading-relaxed mb-2"
                        />
                        <button 
                            onClick={handleOptimizeHypothesis}
                            disabled={!hypothesis.trim() || optimizing}
                            className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded px-3 py-1.5 flex items-center gap-1 transition-colors"
                        >
                            {optimizing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            {optimizing ? t.optimizing : t.optimizeBtn}
                        </button>
                    </div>
                    
                    {/* Specific Variable Inputs */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.ivLabel} <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                            <input 
                               type="text"
                               value={iv}
                               onChange={(e) => setIv(e.target.value)}
                               placeholder="e.g. Drug Dosage"
                               className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.dvLabel} <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                            <input 
                               type="text"
                               value={dv}
                               onChange={(e) => setDv(e.target.value)}
                               placeholder="e.g. Recovery Time"
                               className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{t.fieldLabel}</label>
                            <select 
                            value={field}
                            onChange={(e) => setField(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white cursor-pointer"
                            >
                                {Object.entries(t.fields).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Split Dropdowns */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">{t.methodologyLabel}</label>
                                <select 
                                value={methodology}
                                onChange={(e) => setMethodology(e.target.value)}
                                className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white cursor-pointer border-slate-300`}
                                >
                                    {Object.entries(t.methodologies).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">{t.structureLabel}</label>
                                <select 
                                value={structure}
                                onChange={(e) => setStructure(e.target.value)}
                                className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white cursor-pointer border-slate-300`}
                                >
                                    {Object.entries(t.structures).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Advanced Settings */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <button 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between p-3 bg-slate-50 text-slate-700 font-bold text-xs uppercase hover:bg-slate-100 transition-colors"
                        >
                            <span className="flex items-center gap-2"><Settings size={14} /> {t.advancedSettings}</span>
                            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        
                        {showAdvanced && (
                            <div className="p-4 space-y-4 bg-white animate-fadeIn">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">{t.alpha}</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={alpha}
                                            onChange={(e) => setAlpha(parseFloat(e.target.value))}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">{t.power}</label>
                                        <input 
                                            type="number"
                                            step="0.1"
                                            value={power}
                                            onChange={(e) => setPower(parseFloat(e.target.value))}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">{t.effectSize}</label>
                                    <select 
                                        value={effectSizeType}
                                        onChange={(e) => setEffectSizeType(e.target.value as any)}
                                        className="w-full border border-slate-300 rounded p-2 text-sm mb-2"
                                    >
                                        <option value="small">{t.effectSizes.small} (d ≈ 0.2)</option>
                                        <option value="medium">{t.effectSizes.medium} (d ≈ 0.5)</option>
                                        <option value="large">{t.effectSizes.large} (d ≈ 0.8)</option>
                                        <option value="custom">{t.effectSizes.custom}</option>
                                    </select>
                                    {effectSizeType === 'custom' && (
                                        <input 
                                            type="text"
                                            placeholder="Enter value (e.g. 0.3)"
                                            value={customEffectSize}
                                            onChange={(e) => setCustomEffectSize(e.target.value)}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
             </div>
             
             {/* Sticky Footer Button */}
             <div className="flex-shrink-0 pt-2 pb-1 pr-2">
                 <button 
                   onClick={handleGenerate}
                   disabled={loading || !hypothesis}
                   className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transform active:scale-[0.99]"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} className="fill-white" />}
                    {t.btn}
                 </button>
             </div>
          </div>

          {/* Right Panel: Results or Templates */}
          <div className="lg:col-span-8 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col">
              {result ? (
                  <div className="flex-grow overflow-y-auto p-8 space-y-8 animate-fadeIn custom-scrollbar">
                      {/* ... Header & Cards ... */}
                      <div className="flex justify-between items-start">
                          <h3 className="text-2xl font-bold text-slate-800">{result.title}</h3>
                          <button onClick={handleExport} className="text-slate-500 hover:text-purple-600">
                              <Download size={20} />
                          </button>
                      </div>

                      {/* Sample Size Card */}
                      {result.sampleSize && (
                          <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-10 -mt-10"></div>
                              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4 relative z-10">
                                  <Calculator className="text-purple-500" /> {t.sampleSize}
                              </h4>
                              
                              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                  <div className="flex-shrink-0">
                                      <div className="text-5xl font-black text-purple-600 mb-1">{result.sampleSize.recommended}</div>
                                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Participants</div>
                                  </div>
                                  <div className="flex-grow space-y-4">
                                      <div className="flex flex-wrap gap-2">
                                          {result.sampleSize.parameters?.map((p, i) => (
                                              <span key={i} className="bg-purple-50 text-purple-800 px-3 py-1 rounded-full text-xs font-bold border border-purple-100">
                                                  {p.label}: {p.value}
                                              </span>
                                          ))}
                                      </div>
                                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                          <span className="font-bold text-slate-700">Calculation Logic:</span> {result.sampleSize.explanation}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* ... Variables, Analysis, Flow Sections ... */}
                      {/* Variables */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {result.variables && (
                              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                      <GitBranch className="text-blue-500" /> {t.variables}
                                  </h4>
                                  <div className="space-y-4">
                                      {result.variables.independent && (
                                          <div>
                                              <span className="text-xs font-bold text-slate-400 uppercase">Independent Variables (IV)</span>
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                  {result.variables.independent.map((v, i) => (
                                                      <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">{v}</span>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                      {result.variables.dependent && (
                                          <div>
                                              <span className="text-xs font-bold text-slate-400 uppercase">Dependent Variables (DV)</span>
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                  {result.variables.dependent.map((v, i) => (
                                                      <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded text-sm font-medium">{v}</span>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                      {(result.variables.control || result.variables.confounders) && (
                                          <div>
                                              <span className="text-xs font-bold text-slate-400 uppercase">Control / Confounders</span>
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                  {[...(result.variables.control || []), ...(result.variables.confounders || [])].map((v, i) => (
                                                      <span key={i} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm">{v}</span>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )}
                          
                          {result.analysis && (
                              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
                                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                      <Settings className="text-amber-500" /> {t.analysis}
                                  </h4>
                                  <div className="flex-grow flex flex-col justify-center">
                                      <div className="text-lg font-bold text-slate-800 mb-2">{result.analysis.method}</div>
                                      <p className="text-sm text-slate-600 leading-relaxed">{result.analysis.description}</p>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Flow */}
                      {result.flow && result.flow.length > 0 && (
                          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                  <ListOrdered className="text-emerald-500" /> {t.flow}
                              </h4>
                              <div className="space-y-0 relative">
                                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100"></div>
                                  {result.flow.map((step, idx) => (
                                      <div key={idx} className="relative pl-12 pb-8 last:pb-0">
                                          <div className="absolute left-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-sm z-10">
                                              {step.step}
                                          </div>
                                          <div>
                                              <h5 className="font-bold text-slate-800 text-sm mb-1">{step.name}</h5>
                                              <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                      {/* ... Loading or Templates ... */}
                      {loading ? (
                          <>
                             <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
                             <h3 className="text-xl font-bold text-slate-800">{t.generating}</h3>
                             <p className="text-slate-500 mt-2">Analyzing parameters and statistical requirements...</p>
                          </>
                      ) : (
                          <div className="w-full max-w-2xl">
                             <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-700 mb-2">{t.templates.title}</h3>
                                <p className="text-slate-400">{t.templates.subtitle}</p>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div onClick={() => handleTemplateClick('rct')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 cursor-pointer transition-all group">
                                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Zap size={24} />
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">{t.templates.rct}</h4>
                                    <p className="text-xs text-slate-500">{t.templates.rctDesc}</p>
                                </div>
                                
                                <div onClick={() => handleTemplateClick('ab')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Sparkles size={24} />
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">{t.templates.ab}</h4>
                                    <p className="text-xs text-slate-500">{t.templates.abDesc}</p>
                                </div>
                                
                                <div onClick={() => handleTemplateClick('memory')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all group">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Beaker size={24} />
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">{t.templates.memory}</h4>
                                    <p className="text-xs text-slate-500">{t.templates.memoryDesc}</p>
                                </div>
                             </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
       </div>
    </div>
  );
};

export default ExperimentDesign;
