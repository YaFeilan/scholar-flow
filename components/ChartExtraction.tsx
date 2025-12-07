import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, FileText, Loader2, Download, Table2, Image as ImageIcon, X, Copy, CheckCircle, Crop, Check, RotateCcw, MousePointer2, Plus, Trash2, LayoutGrid, Edit2, GripVertical, ScanEye, TrendingUp, BarChart as BarChartIcon, Code, ArrowRight, Sparkles, MessageSquare, Filter, Calendar, Tag, FileSearch, Terminal, Database, FileOutput, Eye, Calculator, PenTool } from 'lucide-react';
import { Language, ChartExtractionResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { extractChartData, generateChartTrendAnalysis } from '../services/geminiService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

interface ChartExtractionProps {
  language: Language;
  onSendDataToAnalysis?: (data: any[][]) => void;
}

interface ChartFileMetadata {
    addedDate: string;
    partition: string;
}

interface ChartFile {
  id: string;
  file: File;
  previewUrl: string;
  result?: ChartExtractionResult;
  trendAnalysis?: string;
  metadata: ChartFileMetadata;
}

type ExtractionMode = 'chart' | 'formula' | 'text' | 'auto';

const ChartExtraction: React.FC<ChartExtractionProps> = ({ language, onSendDataToAnalysis }) => {
  const t = TRANSLATIONS[language].chart;
  
  const [chartFiles, setChartFiles] = useState<ChartFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingTrend, setAnalyzingTrend] = useState(false);
  
  const [resultTab, setResultTab] = useState<'data' | 'code' | 'analysis' | 'full'>('data');
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('auto');
  
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
      language === 'ZH' ? '正在预处理图片...' : 'Preprocessing image...',
      language === 'ZH' ? '正在识别坐标轴/文本/公式...' : 'Identifying content...',
      language === 'ZH' ? '正在检测数据点与结构...' : 'Detecting structures...',
      language === 'ZH' ? '正在拟合数值与转录...' : 'Transcribing...',
      language === 'ZH' ? '正在生成最终报告...' : 'Generating output...'
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterPartition, setFilterPartition] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  const activeFile = chartFiles.find(f => f.id === activeId) || null;
  const result = activeFile?.result || null;

  const [isCropping, setIsCropping] = useState(false);
  const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  const [codeLang, setCodeLang] = useState<'Python' | 'R'>('Python');

  const filteredFiles = useMemo(() => {
      return chartFiles.filter(f => {
          const matchPart = filterPartition === 'All' || f.metadata.partition === filterPartition;
          const matchDate = !filterDate || f.metadata.addedDate >= filterDate;
          return matchPart && matchDate;
      });
  }, [chartFiles, filterPartition, filterDate]);

  // Effect to switch default tab based on result type
  useEffect(() => {
      if (result) {
          const type = (result.type || '').toLowerCase();
          if (type.includes('formula') || type.includes('text') || (result.data && result.data.length === 0)) {
              setResultTab('full');
          } else {
              setResultTab('data');
          }
      }
  }, [result]);

  const updateMetadata = (id: string, key: keyof ChartFileMetadata, value: string) => {
      setChartFiles(prev => prev.map(f => f.id === id ? { ...f, metadata: { ...f.metadata, [key]: value } } : f));
  };

  const updateCell = (fileId: string, rowIndex: number, key: string, value: string) => {
    setChartFiles(prev => prev.map(f => {
        if (f.id === fileId && f.result && f.result.data) {
            const newData = [...f.result.data];
            newData[rowIndex] = { ...newData[rowIndex], [key]: value };
            return { ...f, result: { ...f.result, data: newData } };
        }
        return f;
    }));
  };

  const updateHeader = (fileId: string, oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    setChartFiles(prev => prev.map(f => {
        if (f.id === fileId && f.result && f.result.data) {
            const newData = f.result.data.map(row => {
                const newRow: any = {};
                Object.keys(row).forEach(k => {
                    if (k === oldKey) {
                        newRow[newKey] = row[oldKey];
                    } else {
                        newRow[k] = row[k];
                    }
                });
                return newRow;
            });
            return { ...f, result: { ...f.result, data: newData } };
        }
        return f;
    }));
  };

  const deleteRow = (fileId: string, rowIndex: number) => {
    setChartFiles(prev => prev.map(f => {
        if (f.id === fileId && f.result && f.result.data) {
            const newData = f.result.data.filter((_, i) => i !== rowIndex);
            return { ...f, result: { ...f.result, data: newData } };
        }
        return f;
    }));
  };

  const addRow = (fileId: string) => {
    setChartFiles(prev => prev.map(f => {
        if (f.id === fileId && f.result && f.result.data) {
            const keys = f.result.data.length > 0 ? Object.keys(f.result.data[0]) : ['Column 1', 'Column 2'];
            const newRow: any = {};
            keys.forEach(k => newRow[k] = "");
            return { ...f, result: { ...f.result, data: [...f.result.data, newRow] } };
        }
        return f;
    }));
  };

  const resetCrop = () => {
      setCroppedImageUrl(null);
      setCroppedBlob(null);
      setSelection(null);
      setIsCropping(false);
  };

  const handleSwitchFile = (id: string) => {
      if (id === activeId) return;
      setActiveId(id);
      resetCrop();
      setHoveredRowIndex(null);
  };

  const handleRemoveFile = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newFiles = chartFiles.filter(f => f.id !== id);
      setChartFiles(newFiles);
      if (activeId === id) {
          setActiveId(newFiles.length > 0 ? newFiles[0].id : null);
          resetCrop();
          setHoveredRowIndex(null);
      }
  };

  useEffect(() => {
    const handlePaste = (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      if (clipboardEvent.clipboardData && clipboardEvent.clipboardData.items) {
        const items = clipboardEvent.clipboardData.items;
        const newFiles: ChartFile[] = [];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
                const file = blob as any as File;
                newFiles.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file: file,
                    previewUrl: URL.createObjectURL(file),
                    metadata: { addedDate: new Date().toISOString().split('T')[0], partition: 'SCI' }
                });
            }
          }
        }

        if (newFiles.length > 0) {
            setChartFiles(prev => [...prev, ...newFiles]);
            if (!activeId) setActiveId(newFiles[0].id);
            if (chartFiles.length === 0) resetCrop();
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeId, chartFiles.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: ChartFile[] = Array.from(e.target.files).map(f => ({
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          previewUrl: URL.createObjectURL(f),
          metadata: { addedDate: new Date().toISOString().split('T')[0], partition: 'SCI' }
      }));
      
      setChartFiles(prev => [...prev, ...newFiles]);
      if (!activeId && newFiles.length > 0) setActiveId(newFiles[0].id);
      if (chartFiles.length === 0) resetCrop();
    }
  };

  const handleExtract = async () => {
    if (!activeFile) return;

    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
        setLoadingStep(prev => {
            if (prev < loadingSteps.length - 1) return prev + 1;
            return prev;
        });
    }, 2000); 

    const fileToUpload = croppedBlob || activeFile.file;
    
    let uploadFile: File;
    if (fileToUpload instanceof Blob && !(fileToUpload instanceof File)) {
        uploadFile = new File([fileToUpload], "cropped_chart.png", { type: "image/png" });
    } else {
        uploadFile = fileToUpload as File;
    }

    try {
        // Pass the selected mode to the service
        const data = await extractChartData(uploadFile, language, extractionMode);
        
        clearInterval(stepInterval);
        setLoadingStep(loadingSteps.length - 1); 
        
        setTimeout(() => {
            setChartFiles(prev => prev.map(f => 
                f.id === activeId ? { ...f, result: data } : f
            ));
            setLoading(false);
        }, 600);
        
    } catch (e) {
        console.error("Extraction failed", e);
        clearInterval(stepInterval);
        setLoading(false);
        alert(language === 'ZH' ? '提取失败，请重试' : 'Extraction failed, please try again');
    }
  };

  const handleGenerateTrend = async () => {
      if (!result || !result.data || !activeId) return;
      setAnalyzingTrend(true);
      const text = await generateChartTrendAnalysis(result.data, language);
      setChartFiles(prev => prev.map(f => 
          f.id === activeId ? { ...f, trendAnalysis: text } : f
      ));
      setAnalyzingTrend(false);
  };

  const handleSendToAnalysis = () => {
      if (!result || !result.data || result.data.length === 0 || !onSendDataToAnalysis) return;
      
      const keys = Object.keys(result.data[0]).filter(k => !k.startsWith('_'));
      const matrix = [keys];
      result.data.forEach(row => {
          matrix.push(keys.map(k => row[k]));
      });
      
      onSendDataToAnalysis(matrix);
  };

  const handleDownloadCSV = () => {
    if (!result || !result.data || result.data.length === 0) return;
    
    const headers = Object.keys(result.data[0]).filter(k => !k.startsWith('_'));
    const csvRows = [headers.join(',')];
    
    result.data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        return `"${val !== undefined && val !== null ? val : ''}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${result.title || 'extracted_data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFullReport = () => {
    if (!activeFile || !result) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const width = doc.internal.pageSize.getWidth();
    const contentWidth = width - margin * 2;

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Image Analysis Report", margin, y);
    y += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Filename: ${activeFile.file.name}`, margin, y);
    y += 6;
    doc.text(`Type: ${result.type}`, margin, y);
    y += 10;
    doc.setTextColor(0);

    if (result && result.fullDescription) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("1. Content Description", margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(result.fullDescription, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 10;
    }

    if (activeFile.trendAnalysis) {
        if (y > 250) { doc.addPage(); y = margin; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("2. Analysis", margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const cleanText = activeFile.trendAnalysis.replace(/[#*`]/g, '');
        const lines = doc.splitTextToSize(cleanText, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 10;
    }

    if (result && result.ocrText) {
        if (y > 240) { doc.addPage(); y = margin; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("3. Extracted Text / Formula", margin, y);
        y += 10;
        
        doc.setFont("courier", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(result.ocrText, contentWidth);
        doc.text(lines, margin, y);
    }

    doc.save(`${activeFile.file.name.replace(/\.[^/.]+$/, "")}_Report.pdf`);
  };

  const handleCopyLatex = () => {
      // If it's formula mode or just raw LaTeX text
      if (result?.ocrText) {
          navigator.clipboard.writeText(result.ocrText);
          alert("Content Copied");
          return;
      }
      
      if (!result || !result.data || result.data.length === 0) return;
      const headers = Object.keys(result.data[0]).filter(k => !k.startsWith('_'));
      let latex = `\\begin{table}[htbp]\n  \\centering\n  \\caption{${result.title || 'Extracted Data'}}\n  \\label{tab:data}\n  \\begin{tabular}{|${headers.map(() => 'c').join('|')}|}\n    \\hline\n`;
      latex += `    ${headers.map(h => h.replace(/_/g, '\\_')).join(' & ')} \\\\\n    \\hline\n`;
      result.data.forEach(row => {
          const rowStr = headers.map(h => {
              const val = row[h] !== undefined ? String(row[h]) : '';
              return val.replace(/([&%$#_{}])/g, '\\$1');
          }).join(' & ');
          latex += `    ${rowStr} \\\\\n    \\hline\n`;
      });
      latex += `  \\end{tabular}\n\\end{table}`;
      navigator.clipboard.writeText(latex);
      alert(language === 'ZH' ? 'LaTeX 表格代码已复制' : 'LaTeX table code copied');
  };

  const generateCode = (lang: 'Python' | 'R') => {
      if (!result || !result.data || result.data.length === 0) return "# No tabular data available for code generation.";
      const headers = Object.keys(result.data[0]).filter(k => !k.startsWith('_'));
      if (headers.length < 2) return "# Not enough data to generate plot code.";
      const xKey = headers[0];
      const yKeys = headers.slice(1);
      const title = result.title || "Extracted Chart";
      const type = (result.type || '').toLowerCase();
      const isBar = type.includes('bar') || type.includes('column');

      if (lang === 'Python') {
          let code = `import pandas as pd\nimport matplotlib.pyplot as plt\n\n`;
          code += `# Data Preparation\ndata = {\n`;
          code += `    '${xKey}': [${result.data.map(r => `'${r[xKey]}'`).join(', ')}],\n`;
          yKeys.forEach(k => {
              const vals = result.data.map(r => {
                  const v = parseFloat(String(r[k]).replace(/,/g, ''));
                  return isNaN(v) ? 0 : v;
              });
              code += `    '${k}': [${vals.join(', ')}],\n`;
          });
          code += `}\n\ndf = pd.DataFrame(data)\n\n`;
          code += `# Plotting\nplt.figure(figsize=(10, 6))\n`;
          if (isBar) {
               code += `df.plot(x='${xKey}', kind='bar', ax=plt.gca())\n`;
          } else {
               yKeys.forEach(k => {
                   code += `plt.plot(df['${xKey}'], df['${k}'], marker='o', label='${k}')\n`;
               });
               code += `plt.legend()\n`;
          }
          code += `plt.title('${title}')\nplt.xlabel('${xKey}')\nplt.ylabel('Value')\nplt.grid(True, linestyle='--', alpha=0.7)\nplt.tight_layout()\nplt.show()`;
          return code;
      } else {
          let code = `library(ggplot2)\nlibrary(tidyr)\n\n`;
          code += `# Data Preparation\ndf <- data.frame(\n  \`${xKey}\` = c(${result.data.map(r => `'${r[xKey]}'`).join(', ')}),\n`;
          const seriesParams: string[] = [];
          yKeys.forEach(k => {
              const vals = result.data.map(r => {
                  const v = parseFloat(String(r[k]).replace(/,/g, ''));
                  return isNaN(v) ? 0 : v;
              });
              seriesParams.push(`  \`${k}\` = c(${vals.join(', ')})`);
          });
          code += seriesParams.join(',\n') + `\n)\n\n`;
          code += `# Reshape for ggplot\ndf_long <- pivot_longer(df, cols = -c(\`${xKey}\`), names_to = "Series", values_to = "Value")\n\n`;
          code += `# Plotting\nggplot(df_long, aes(x = \`${xKey}\`, y = Value, fill = Series, color = Series${!isBar ? ', group = Series' : ''})) +\n`;
          if (isBar) code += `  geom_bar(stat = "identity", position = "dodge", alpha = 0.8) +\n`;
          else code += `  geom_line(size = 1) +\n  geom_point(size = 3) +\n`;
          code += `  labs(title = "${title}", x = "${xKey}", y = "Value") +\n  theme_minimal()\n`;
          return code;
      }
  };

  const getImgCoords = (e: React.MouseEvent) => {
      if (!imageRef.current) return { x: 0, y: 0 };
      const rect = imageRef.current.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isCropping) return;
      e.preventDefault();
      const coords = getImgCoords(e);
      setDragStart(coords);
      setSelection({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isCropping || !dragStart) return;
      e.preventDefault();
      const coords = getImgCoords(e);
      const width = Math.abs(coords.x - dragStart.x);
      const height = Math.abs(coords.y - dragStart.y);
      const x = Math.min(coords.x, dragStart.x);
      const y = Math.min(coords.y, dragStart.y);

      if (imageRef.current) {
          const maxWidth = imageRef.current.width;
          const maxHeight = imageRef.current.height;
          setSelection({
              x: Math.max(0, x),
              y: Math.max(0, y),
              w: Math.min(width, maxWidth - x),
              h: Math.min(height, maxHeight - y)
          });
      }
  };

  const handleMouseUp = () => {
      setDragStart(null);
  };

  const performCrop = () => {
      if (!imageRef.current || !selection || selection.w < 10 || selection.h < 10) return;
      const canvas = document.createElement('canvas');
      const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
      canvas.width = selection.w * scaleX;
      canvas.height = selection.h * scaleY;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(imageRef.current, selection.x * scaleX, selection.y * scaleY, selection.w * scaleX, selection.h * scaleY, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
          if (blob) {
              setCroppedBlob(blob);
              setCroppedImageUrl(URL.createObjectURL(blob));
              setIsCropping(false);
              setSelection(null);
          }
      }, 'image/png');
  };

  const renderReplot = () => {
      if (!result || !result.data || result.data.length === 0) return null;
      const firstRow = result.data[0];
      if (!firstRow) return null;
      const keys = Object.keys(firstRow).filter(k => !k.startsWith('_'));
      if (keys.length < 2) return null;
      const xKey = keys[0];
      const yKeys = keys.slice(1);
      const chartData = result.data.map(row => {
          const newRow: any = { [xKey]: row[xKey] };
          yKeys.forEach(k => {
              const val = parseFloat(String(row[k]).replace(/,/g, ''));
              newRow[k] = isNaN(val) ? 0 : val;
          });
          return newRow;
      });
      const chartType = (result.type || '').toLowerCase();
      const isLine = chartType.includes('line') || chartType.includes('scatter');
      const colors = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#db2777'];

      return (
          <ResponsiveContainer width="100%" height="100%">
              {isLine ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey={xKey} tick={{fontSize: 10}} stroke="#64748b" />
                      <YAxis tick={{fontSize: 10}} stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Legend />
                      {yKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />)}
                  </LineChart>
              ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey={xKey} tick={{fontSize: 10}} stroke="#64748b" />
                      <YAxis tick={{fontSize: 10}} stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Legend />
                      {yKeys.map((k, i) => <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={50} />)}
                  </BarChart>
              )}
          </ResponsiveContainer>
      );
  };

  // Helper to determine the button label based on mode
  const getExtractButtonLabel = () => {
      if (loading) return t.extracting;
      switch (extractionMode) {
          case 'chart': return language === 'ZH' ? '提取图表数据' : 'Extract Chart Data';
          case 'formula': return language === 'ZH' ? '识别数学公式' : 'Recognize Formula';
          case 'text': return language === 'ZH' ? '手写/文本转录' : 'Transcribe Text';
          default: return language === 'ZH' ? '智能识别 (Auto)' : 'Deep Scan (Auto)';
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
       <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Table2 className="text-blue-600" /> {language === 'ZH' ? '图像内容提取 (图表/公式/手写)' : 'Image Content Extraction'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
       </div>

       <div className="flex-grow flex flex-col md:flex-row gap-8 overflow-hidden">
           <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
               <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-2 items-center">
                   <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1">
                       <Filter size={12} className="text-slate-400" />
                       <select className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 font-bold w-16" value={filterPartition} onChange={(e) => setFilterPartition(e.target.value)}>
                           <option value="All">All</option>
                           <option value="SCI">SCI</option>
                           <option value="SSCI">SSCI</option>
                           <option value="CJR">CJR</option>
                       </select>
                   </div>
               </div>

               {chartFiles.length === 0 ? (
                   <div className="flex-grow flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                           <ImageIcon size={32} className="text-blue-500" />
                       </div>
                       <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">{t.upload}</h3>
                       <p className="text-xs text-slate-400 mb-4">JPG, PNG, WEBP</p>
                       <p className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded">{language === 'ZH' ? '支持 Ctrl+V 粘贴' : 'Ctrl+V to Paste'}</p>
                   </div>
               ) : (
                   <div className="flex h-full">
                       <div className="w-20 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col items-center py-4 gap-3 overflow-y-auto custom-scrollbar">
                           {filteredFiles.map((f, i) => (
                               <div key={f.id} onClick={() => handleSwitchFile(f.id)} className={`relative w-14 h-14 rounded-lg cursor-pointer overflow-hidden border-2 transition-all flex-shrink-0 group ${activeId === f.id ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-slate-200 dark:border-slate-600 opacity-70 hover:opacity-100'}`}>
                                   <img src={f.previewUrl} className="w-full h-full object-cover" alt="thumbnail" />
                                   {f.result && <div className="absolute bottom-0 right-0 bg-green-500 w-3 h-3 rounded-tl-md flex items-center justify-center"><Check size={8} className="text-white" /></div>}
                                   <button onClick={(e) => handleRemoveFile(f.id, e)} className="absolute top-0 right-0 bg-black/50 text-white w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"><X size={8} /></button>
                               </div>
                           ))}
                           <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-colors"><Plus size={18} /></button>
                       </div>

                       <div className="flex-grow flex flex-col p-4 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                           {activeFile && (
                               <div className="mb-4 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                   <div className="flex gap-1 mb-2">
                                       <button onClick={() => setExtractionMode('auto')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 ${extractionMode === 'auto' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Sparkles size={12}/> Auto</button>
                                       <button onClick={() => setExtractionMode('chart')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 ${extractionMode === 'chart' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><BarChartIcon size={12}/> Chart</button>
                                       <button onClick={() => setExtractionMode('formula')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 ${extractionMode === 'formula' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Calculator size={12}/> Math</button>
                                       <button onClick={() => setExtractionMode('text')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 ${extractionMode === 'text' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><PenTool size={12}/> Text</button>
                                   </div>
                               </div>
                           )}

                           <div className={`border-2 border-dashed rounded-xl p-2 text-center transition-colors mb-4 flex flex-col items-center justify-center min-h-[250px] relative bg-white dark:bg-slate-800 ${isCropping ? 'border-blue-500 cursor-crosshair' : 'border-slate-300 dark:border-slate-600'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                               {activeFile && (
                                   <div className="relative inline-block">
                                       <img ref={imageRef} src={croppedImageUrl || activeFile.previewUrl} alt="Chart" className={`max-h-[350px] max-w-full rounded shadow-sm object-contain select-none block ${isCropping ? 'opacity-80' : ''}`} draggable={false} />
                                       {result && result.data && showOverlay && !isCropping && extractionMode === 'chart' && (
                                           <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                               {result.data.map((row, i) => {
                                                   if (row._box_2d) {
                                                       const [ymin, xmin, ymax, xmax] = row._box_2d;
                                                       const width = xmax - xmin;
                                                       const height = ymax - ymin;
                                                       return <rect key={i} x={`${xmin/10}%`} y={`${ymin/10}%`} width={`${width/10}%`} height={`${height/10}%`} className={`transition-all duration-200 pointer-events-auto cursor-pointer ${hoveredRowIndex === i ? 'fill-blue-500/20 stroke-blue-500 stroke-2' : 'fill-transparent stroke-transparent hover:stroke-blue-300 hover:stroke-1'}`} onMouseEnter={() => setHoveredRowIndex(i)} onMouseLeave={() => setHoveredRowIndex(null)} />
                                                   }
                                                   return null;
                                               })}
                                           </svg>
                                       )}
                                       {isCropping && selection && (
                                           <div className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none" style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}>
                                               <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] px-1 rounded font-bold">{Math.round(selection.w)}x{Math.round(selection.h)}</div>
                                           </div>
                                       )}
                                   </div>
                               )}
                           </div>

                           {activeFile && (
                               <div className="mb-4 flex gap-2">
                                   {!isCropping ? (
                                       <>
                                           <button onClick={() => setIsCropping(true)} className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"><Crop size={14} /> {language === 'ZH' ? '裁剪模式' : 'Crop Area'}</button>
                                           {croppedImageUrl && <button onClick={resetCrop} className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"><RotateCcw size={14} /> {language === 'ZH' ? '重置原图' : 'Reset'}</button>}
                                       </>
                                   ) : (
                                       <>
                                           <button onClick={performCrop} disabled={!selection || selection.w < 10} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"><Check size={14} /> {language === 'ZH' ? '确认裁剪' : 'Confirm Crop'}</button>
                                           <button onClick={() => { setIsCropping(false); setSelection(null); }} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><X size={14} /> {language === 'ZH' ? '取消' : 'Cancel'}</button>
                                       </>
                                   )}
                               </div>
                           )}
                           
                           {isCropping && <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs p-3 rounded-lg mb-4 flex items-center gap-2 border border-blue-200 dark:border-blue-800"><MousePointer2 size={16} />{language === 'ZH' ? '请在图片上拖拽框选图表区域（排除无关文字）。' : 'Drag on the image to select the chart area (exclude captions).'}</div>}

                           <button onClick={handleExtract} disabled={!activeFile || loading || isCropping} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-auto">
                              {loading ? <Loader2 className="animate-spin" /> : (
                                  extractionMode === 'formula' ? <Calculator size={18} /> : 
                                  extractionMode === 'text' ? <FileText size={18} /> : 
                                  <FileText size={18} />
                              )}
                              {getExtractButtonLabel()}
                           </button>
                       </div>
                   </div>
               )}
           </div>

           <div className="w-full md:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
               {loading ? (
                   <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fadeIn">
                       <div className="relative mb-6">
                           <div className="w-20 h-20 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
                           <div className="absolute inset-0 flex items-center justify-center text-blue-600"><ScanEye size={32} className="animate-pulse" /></div>
                       </div>
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{loadingSteps[loadingStep]}</h3>
                       <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mt-4"><div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}></div></div>
                   </div>
               ) : result && activeId ? (
                   <div className="flex flex-col h-full animate-fadeIn">
                       <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                           <div className="p-4 flex justify-between items-center pb-2">
                               <div className="flex items-center gap-2">
                                   <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg text-green-600 dark:text-green-400"><CheckCircle size={16} /></div>
                                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">{result.title || t.resultTitle} <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-normal uppercase tracking-wider">{result.type}</span></h3>
                               </div>
                           </div>
                           
                           <div className="flex px-4 gap-1">
                               <button onClick={() => setResultTab('full')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-t border-x ${resultTab === 'full' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-blue-600 border-b-white dark:border-b-slate-900' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><div className="flex items-center gap-2"><Eye size={14}/> {language === 'ZH' ? '全内容 / 公式' : 'Content / Formula'}</div></button>
                               {result.data && result.data.length > 0 && (
                                   <>
                                       <button onClick={() => setResultTab('data')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-t border-x ${resultTab === 'data' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-blue-600 border-b-white dark:border-b-slate-900' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><div className="flex items-center gap-2"><Table2 size={14}/> Data</div></button>
                                       <button onClick={() => setResultTab('code')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-t border-x ${resultTab === 'code' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-blue-600 border-b-white dark:border-b-slate-900' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><div className="flex items-center gap-2"><Code size={14}/> Code</div></button>
                                       <button onClick={() => setResultTab('analysis')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-t border-x ${resultTab === 'analysis' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-blue-600 border-b-white dark:border-b-slate-900' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><div className="flex items-center gap-2"><Sparkles size={14}/> Analysis</div></button>
                                   </>
                               )}
                           </div>
                       </div>
                       
                       <div className="flex-grow overflow-hidden flex flex-col bg-white dark:bg-slate-900 relative">
                           {resultTab === 'data' && result.data && result.data.length > 0 && (
                               <>
                                   <div className="h-48 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 p-4 animate-fadeIn">
                                       {renderReplot() || <div className="h-full flex flex-col items-center justify-center text-slate-400"><BarChartIcon size={24} className="mb-2 opacity-50" /><p className="text-xs">Not enough data to re-plot.</p></div>}
                                   </div>
                                   <div className="flex-grow overflow-auto">
                                       {result.data && result.data.length > 0 ? (
                                           <table className="w-full text-sm text-left border-collapse">
                                               <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 shadow-sm z-10">
                                                   <tr>
                                                       <th className="w-10 border border-slate-200 dark:border-slate-700 p-2 text-center bg-slate-100 dark:bg-slate-800 text-slate-400">#</th>
                                                       {Object.keys(result.data[0]).filter(k => !k.startsWith('_')).map((header, i) => (
                                                           <th key={i} className="border border-slate-200 dark:border-slate-700 p-0 min-w-[100px] relative group">
                                                               <input className="w-full h-full bg-transparent px-3 py-2 font-bold outline-none focus:bg-white dark:focus:bg-slate-700 text-slate-700 dark:text-slate-200" defaultValue={header} onBlur={(e) => updateHeader(activeId, header, e.target.value)} />
                                                               <Edit2 size={10} className="absolute right-1 top-1 text-slate-400 opacity-0 group-hover:opacity-100 pointer-events-none" />
                                                           </th>
                                                       ))}
                                                       <th className="w-10 border border-slate-200 dark:border-slate-700 p-0 bg-slate-50 dark:bg-slate-800"><button onClick={() => addRow(activeId)} className="w-full h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"><Plus size={14}/></button></th>
                                                   </tr>
                                               </thead>
                                               <tbody>
                                                   {result.data.map((row, i) => (
                                                       <tr key={i} className={`transition-colors group ${hoveredRowIndex === i ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-blue-50 dark:hover:bg-slate-800/50'}`} onMouseEnter={() => setHoveredRowIndex(i)} onMouseLeave={() => setHoveredRowIndex(null)}>
                                                           <td className="border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 font-mono">{i + 1}</td>
                                                           {Object.keys(row).filter(k => !k.startsWith('_')).map((key, j) => (
                                                               <td key={j} className="border border-slate-200 dark:border-slate-700 p-0"><input className="w-full h-full bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 text-slate-600 dark:text-slate-300 transition-all" value={row[key]} onChange={(e) => updateCell(activeId, i, key, e.target.value)} /></td>
                                                           ))}
                                                           <td className="border border-slate-200 dark:border-slate-700 text-center"><button onClick={() => deleteRow(activeId, i)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100" title="Delete Row"><Trash2 size={12} /></button></td>
                                                       </tr>
                                                   ))}
                                               </tbody>
                                           </table>
                                       ) : <div className="flex flex-col items-center justify-center h-full text-slate-400"><p>No tabular data found.</p><button onClick={() => addRow(activeId)} className="mt-2 text-blue-500 hover:underline text-sm">Create empty row</button></div>}
                                   </div>
                               </>
                           )}

                           {resultTab === 'full' && (
                               <div className="flex-grow overflow-auto p-6 space-y-6">
                                   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                                       <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4"><FileSearch size={16} /> {language === 'ZH' ? '内容识别与OCR' : 'Content Recognition & OCR'}</h4>
                                       <div className="space-y-6">
                                           <div>
                                               <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{language === 'ZH' ? '视觉描述 / 公式解析' : 'Visual Description / Explanation'}</h5>
                                               <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-xs"><ReactMarkdown>{result.fullDescription || "No detailed description available."}</ReactMarkdown></div>
                                           </div>
                                           <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                               <div className="flex justify-between items-center mb-2">
                                                   <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                       {result.type === 'Formula' ? 'LaTeX Source' : 'Extracted Text / OCR'}
                                                   </h5>
                                                   <button onClick={() => { navigator.clipboard.writeText(result.ocrText || ""); alert("Content Copied"); }} className="text-[10px] text-blue-600 hover:underline">Copy Content</button>
                                               </div>
                                               
                                               {/* Latex Rendering if Formula */}
                                               {(result.type === 'Formula' || extractionMode === 'formula') && result.ocrText ? (
                                                   <div className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-lg text-center overflow-x-auto">
                                                       <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                           {`$$${result.ocrText}$$`}
                                                       </ReactMarkdown>
                                                   </div>
                                               ) : null}

                                               <pre className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono whitespace-pre-wrap text-slate-600 dark:text-slate-400 max-h-60 overflow-y-auto">{result.ocrText || "No text detected."}</pre>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           )}

                           {resultTab === 'code' && (
                               <div className="flex flex-col h-full">
                                   <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex gap-2">
                                       <button onClick={() => setCodeLang('Python')} className={`px-4 py-2 rounded text-xs font-bold transition-colors ${codeLang === 'Python' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>Python (Matplotlib)</button>
                                       <button onClick={() => setCodeLang('R')} className={`px-4 py-2 rounded text-xs font-bold transition-colors ${codeLang === 'R' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>R (ggplot2)</button>
                                       <div className="flex-grow"></div>
                                       <button onClick={() => { navigator.clipboard.writeText(generateCode(codeLang)); alert(language === 'ZH' ? '代码已复制' : 'Code copied to clipboard'); }} className="px-4 py-2 bg-slate-900 text-white rounded font-bold text-xs flex items-center gap-2 transition-colors hover:bg-slate-700"><Copy size={14} /> {language === 'ZH' ? '复制代码' : 'Copy Code'}</button>
                                   </div>
                                   <div className="flex-grow p-0 overflow-auto bg-[#1e1e1e]"><pre className="p-4 text-xs font-mono text-green-400 leading-relaxed"><code>{generateCode(codeLang)}</code></pre></div>
                               </div>
                           )}

                           {resultTab === 'analysis' && (
                               <div className="flex-grow overflow-auto p-6 space-y-6">
                                   <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-blue-100 dark:border-blue-900 shadow-sm">
                                       <div className="flex justify-between items-center mb-4">
                                           <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2"><Sparkles size={16} className="text-blue-500" /> Trend Analysis (Discussion)</h4>
                                           <div className="flex gap-2">
                                                <button onClick={handleGenerateTrend} disabled={analyzingTrend} className="text-xs font-bold text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">{analyzingTrend ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />} Generate Analysis</button>
                                               {activeFile.trendAnalysis && <button onClick={() => navigator.clipboard.writeText(activeFile.trendAnalysis || '')} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Copy size={12} /> Copy</button>}
                                           </div>
                                       </div>
                                       {activeFile.trendAnalysis ? <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs leading-relaxed"><ReactMarkdown>{activeFile.trendAnalysis}</ReactMarkdown></div> : <p className="text-xs text-slate-400 italic">Click generate to analyze trends based on data...</p>}
                                   </div>
                               </div>
                           )}
                       </div>
                       
                       <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                           <div className="flex gap-2">
                               <button onClick={handleExportFullReport} className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm text-purple-600 dark:text-purple-400"><FileOutput size={14} /> Full Report (PDF)</button>
                               <button onClick={handleCopyLatex} className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"><span className="font-mono text-[10px]">TeX</span> {result.type === 'Formula' ? 'LaTeX Equation' : 'LaTeX Table'}</button>
                               {result.data && result.data.length > 0 && <button onClick={handleDownloadCSV} className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"><Download size={14} /> Excel/CSV</button>}
                           </div>
                           <div className="flex gap-2">
                               {result.data && result.data.length > 0 && <button onClick={() => setResultTab('code')} className="text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white px-3 py-2 rounded hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"><Terminal size={14} /> Generate Python</button>}
                               {onSendDataToAnalysis && result.data && result.data.length > 0 && <button onClick={handleSendToAnalysis} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded flex items-center gap-2 transition-colors"><Database size={14} /> Send to Analysis</button>}
                           </div>
                       </div>
                   </div>
               ) : <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 p-8 text-center"><Table2 size={64} className="mb-4" /><p className="text-lg font-bold">No Data Extracted Yet</p><p className="text-sm max-w-xs mt-2">Upload images, select area, and click extraction button.</p></div>}
           </div>
       </div>
    </div>
  );
};

export default ChartExtraction;