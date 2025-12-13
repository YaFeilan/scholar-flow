
import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar, Label,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { Upload, Download, Settings, BarChart2, TrendingUp, ScatterChart as ScatterIcon, PieChart as PieIcon, Hexagon, Activity, FileText, Send, Sparkles, Loader2, Copy } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Language, PlotConfig } from '../types';
import { TRANSLATIONS } from '../translations';
import { generatePlotConfig, suggestChartType } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ScientificPlottingProps {
  language: Language;
}

const ScientificPlotting: React.FC<ScientificPlottingProps> = ({ language }) => {
  const t = TRANSLATIONS[language].scientific;
  
  // Data State
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  
  // Configuration State
  const [config, setConfig] = useState<PlotConfig>({
      type: 'bar',
      xAxis: '',
      yAxis: '',
      series: '',
      title: 'Scientific Figure',
      xLabel: '',
      yLabel: '',
      style: 'Nature',
      errorBars: false,
      logScale: false,
      showLegend: true
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'import' | 'config' | 'style'>('import');
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // -- Data Handlers --

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const jsonData = XLSX.utils.sheet_to_json(ws);
          
          if (jsonData.length > 0) {
              setColumns(Object.keys(jsonData[0] as object));
              setData(jsonData);
              setFileName(file.name);
              // Auto-set initial config
              const cols = Object.keys(jsonData[0] as object);
              setConfig(prev => ({
                  ...prev, 
                  xAxis: cols[0], 
                  yAxis: cols[1] || cols[0],
                  xLabel: cols[0],
                  yLabel: cols[1] || cols[0]
              }));
          }
      };
      reader.readAsBinaryString(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData('Text');
      // Simple TSV/CSV parser
      const rows = text.trim().split('\n').map(row => row.split(/\t|,/));
      if (rows.length > 1) {
          const headers = rows[0];
          const parsedData = rows.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((h, i) => obj[h.trim()] = isNaN(Number(row[i])) ? row[i] : Number(row[i]));
              return obj;
          });
          setColumns(headers.map(h => h.trim()));
          setData(parsedData);
          setFileName('Pasted Data');
      }
  };

  // -- AI Handlers --

  const handleAIGenerate = async () => {
      if (!data.length || !aiPrompt.trim()) return;
      setLoading(true);
      const newConfig = await generatePlotConfig(aiPrompt, columns, data, language);
      if (newConfig) {
          setConfig(newConfig);
          setActiveTab('config');
      }
      setLoading(false);
  };

  // -- Export Handlers --

  const exportImage = async (format: 'png' | 'svg') => {
      if (!chartRef.current) return;
      const canvas = await html2canvas(chartRef.current, { scale: 3 }); // High DPI
      const imgData = canvas.toDataURL(`image/${format}`);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Figure_1.${format}`;
      link.click();
  };

  const exportPDF = async () => {
      if (!chartRef.current) return;
      const canvas = await html2canvas(chartRef.current, { scale: 3 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('Figure_1.pdf');
  };

  // -- Rendering Logic --

  const getThemeColors = () => {
      switch(config.style) {
          case 'Science': return ['#D12B2B', '#2A5F8E', '#E6A32E', '#3E8E3E'];
          case 'Cell': return ['#BF40BF', '#40BF40', '#40BFFF', '#BFBF40'];
          case 'Classic': return ['#000000', '#666666', '#999999', '#CCCCCC'];
          case 'Nature': default: return ['#E64B35', '#4DBBD5', '#00A087', '#3C5488'];
      }
  };

  const colors = getThemeColors();

  // Calculate error bars if needed (simple SD for demo)
  const processedData = React.useMemo(() => {
      if (!config.errorBars || config.type !== 'bar') return data;
      // Group by X, calculate Mean/SD
      const grouped: Record<string, number[]> = {};
      data.forEach(d => {
          const key = d[config.xAxis];
          const val = Number(d[config.yAxis]);
          if (!grouped[key]) grouped[key] = [];
          if (!isNaN(val)) grouped[key].push(val);
      });
      
      return Object.keys(grouped).map(key => {
          const vals = grouped[key];
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          const sd = Math.sqrt(vals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / vals.length);
          return {
              [config.xAxis]: key,
              [config.yAxis]: mean,
              error: sd // Error bar value
          };
      });
  }, [data, config]);

  const renderChart = () => {
      const commonProps = {
          data: processedData,
          margin: { top: 20, right: 30, left: 20, bottom: 20 }
      };

      const ChartComponent = {
          bar: BarChart,
          line: LineChart,
          scatter: ScatterChart,
          box: BarChart, // Recharts doesn't native box, simulate with bar for now
          heatmap: ScatterChart, // Simulated
          violin: BarChart, // Simulated
          area: BarChart,
          pie: PieChart,
          radar: RadarChart
      }[config.type] || BarChart;

      const AxisX = config.type === 'radar' || config.type === 'pie' ? null : <XAxis dataKey={config.xAxis} label={{ value: config.xLabel, position: 'insideBottom', offset: -10 }} />;
      const AxisY = config.type === 'radar' || config.type === 'pie' ? null : <YAxis label={{ value: config.yLabel, angle: -90, position: 'insideLeft' }} scale={config.logScale ? 'log' : 'auto'} domain={config.logScale ? ['auto', 'auto'] : [0, 'auto']} />;

      return (
          <ResponsiveContainer width="100%" height="100%">
              <ChartComponent {...commonProps}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {AxisX}
                  {AxisY}
                  <Tooltip />
                  {config.showLegend && <Legend />}
                  
                  {config.type === 'bar' && (
                      <Bar dataKey={config.yAxis} fill={colors[0]}>
                          {config.errorBars && <ErrorBar dataKey="error" width={4} strokeWidth={2} stroke="black" />}
                      </Bar>
                  )}
                  {config.type === 'line' && <Line type="monotone" dataKey={config.yAxis} stroke={colors[0]} strokeWidth={3} dot={{r: 4}} />}
                  {config.type === 'scatter' && <Scatter name={config.yAxis} data={data} fill={colors[0]} />}
                  {config.type === 'radar' && (
                      <>
                          <PolarGrid />
                          <PolarAngleAxis dataKey={config.xAxis} />
                          <PolarRadiusAxis />
                          <Radar name={config.yAxis} dataKey={config.yAxis} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
                      </>
                  )}
                  {/* Add more types as needed */}
              </ChartComponent>
          </ResponsiveContainer>
      );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="text-pink-600" /> {t.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
           
           {/* Left Panel: Configuration */}
           <div className="lg:col-span-4 flex flex-col gap-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="flex border-b border-slate-200 dark:border-slate-700">
                   <button onClick={() => setActiveTab('import')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'import' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-500'}`}>{t.import}</button>
                   <button onClick={() => setActiveTab('config')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'config' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-500'}`}>{t.config}</button>
                   <button onClick={() => setActiveTab('style')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'style' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-500'}`}>{t.style}</button>
               </div>

               <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                   {activeTab === 'import' && (
                       <div className="space-y-6">
                           <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                               <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                               <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.upload}</span>
                               <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.xlsx" />
                           </div>
                           <textarea 
                              onPaste={handlePaste} 
                              placeholder={t.paste} 
                              className="w-full h-32 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-xs bg-slate-50 dark:bg-slate-900 resize-none outline-none"
                           />
                           {data.length > 0 && (
                               <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                                   <FileText size={12}/> {fileName || 'Data Loaded'} ({data.length} rows)
                               </div>
                           )}
                       </div>
                   )}

                   {activeTab === 'config' && (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Chart Type</label>
                               <div className="grid grid-cols-3 gap-2">
                                   {Object.entries(t.types).map(([key, label]) => (
                                       <button 
                                          key={key} 
                                          onClick={() => setConfig({...config, type: key as any})}
                                          className={`text-[10px] p-2 rounded border font-bold flex flex-col items-center gap-1 ${config.type === key ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                       >
                                           {key === 'bar' && <BarChart2 size={16}/>}
                                           {key === 'line' && <TrendingUp size={16}/>}
                                           {key === 'scatter' && <ScatterIcon size={16}/>}
                                           {key === 'pie' && <PieIcon size={16}/>}
                                           {key === 'radar' && <Hexagon size={16}/>}
                                           {label}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.axes.x}</label>
                                   <select value={config.xAxis} onChange={e => setConfig({...config, xAxis: e.target.value})} className="w-full p-2 border rounded text-xs">
                                       {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.axes.y}</label>
                                   <select value={config.yAxis} onChange={e => setConfig({...config, yAxis: e.target.value})} className="w-full p-2 border rounded text-xs">
                                       {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                   </select>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <input type="checkbox" checked={config.errorBars} onChange={e => setConfig({...config, errorBars: e.target.checked})} />
                               <label className="text-xs font-bold text-slate-600">{t.stats.mean}</label>
                           </div>
                           <div className="flex items-center gap-2">
                               <input type="checkbox" checked={config.logScale} onChange={e => setConfig({...config, logScale: e.target.checked})} />
                               <label className="text-xs font-bold text-slate-600">Log Scale</label>
                           </div>
                       </div>
                   )}

                   {activeTab === 'style' && (
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Theme</label>
                               <select value={config.style} onChange={e => setConfig({...config, style: e.target.value as any})} className="w-full p-2 border rounded text-xs">
                                   {Object.entries(t.themes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                               </select>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Labels</label>
                               <input value={config.title} onChange={e => setConfig({...config, title: e.target.value})} placeholder="Title" className="w-full p-2 border rounded text-xs mb-2" />
                               <input value={config.xLabel} onChange={e => setConfig({...config, xLabel: e.target.value})} placeholder="X Label" className="w-full p-2 border rounded text-xs mb-2" />
                               <input value={config.yLabel} onChange={e => setConfig({...config, yLabel: e.target.value})} placeholder="Y Label" className="w-full p-2 border rounded text-xs" />
                           </div>
                       </div>
                   )}
               </div>

               {/* AI Assistant Bar */}
               <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                   <div className="relative">
                       <input 
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          placeholder={t.aiPrompt}
                          className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                          onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
                       />
                       <button onClick={handleAIGenerate} disabled={loading} className="absolute right-2 top-2 text-pink-600 disabled:opacity-50">
                           {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                       </button>
                   </div>
               </div>
           </div>

           {/* Right Panel: Preview */}
           <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.title} Preview</h3>
                   <div className="flex gap-2">
                       <button onClick={() => exportImage('png')} className="text-xs font-bold bg-white border px-3 py-1.5 rounded hover:bg-slate-50 flex items-center gap-1"><Download size={14}/> PNG</button>
                       <button onClick={exportPDF} className="text-xs font-bold bg-white border px-3 py-1.5 rounded hover:bg-slate-50 flex items-center gap-1"><Download size={14}/> PDF</button>
                   </div>
               </div>
               
               <div className="flex-grow p-8 flex items-center justify-center bg-white" ref={chartRef}>
                   {data.length > 0 ? (
                       <div className="w-full h-full">
                           <h4 className="text-center font-bold mb-4 font-serif text-lg">{config.title}</h4>
                           {renderChart()}
                       </div>
                   ) : (
                       <div className="text-center text-slate-400">
                           <BarChart2 size={64} className="mx-auto mb-4 opacity-50" />
                           <p>Import data to start plotting.</p>
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

export default ScientificPlotting;
