
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Search, BookOpen, Layers, Tag, Loader2, FileText, Share2, List, X, Info, Clock, ExternalLink, Download, MessageCircle, ArrowRight, Zap, Target } from 'lucide-react';
import * as d3 from 'd3';
import { trackCitationNetwork, analyzeNetworkGaps, chatWithCitationNetwork } from '../services/geminiService';
import { TrackedReference, Language, GapAnalysisResult } from '../types';
import { TRANSLATIONS } from '../translations';

interface ReferenceTrackerProps {
  language: Language;
}

const ReferenceTracker: React.FC<ReferenceTrackerProps> = ({ language }) => {
  const t = TRANSLATIONS[language].track;
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'timeline'>('graph');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrackedReference[] | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Advanced Features
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Graph state
  const graphRef = useRef<HTMLDivElement>(null);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());

  // Flatten papers for easier access with defensive checks
  const allPapers = useMemo(() => {
      if (!results) return [];
      return results.flatMap(cat => cat.papers || []).filter(p => !!p);
  }, [results]);

  const handleTrack = async (inputQuery: string, isFile: boolean) => {
    if (!inputQuery) return;
    setLoading(true);
    setResults(null);
    setSelectedPaper(null);
    setGapAnalysis(null);
    setChatMessages([]);
    const data = await trackCitationNetwork(inputQuery, isFile, language);
    setResults(data);
    setLoading(false);
  };

  const handleGapAnalysis = async () => {
    if (!allPapers.length) return;
    setAnalyzingGap(true);
    const result = await analyzeNetworkGaps(allPapers, language);
    setGapAnalysis(result);
    setAnalyzingGap(false);
  };

  const handleChat = async () => {
      if (!chatQuery.trim()) return;
      const q = chatQuery;
      setChatQuery('');
      setChatMessages(prev => [...prev, { role: 'user', text: q }]);
      setChatLoading(true);
      const ans = await chatWithCitationNetwork(q, allPapers, language);
      setChatMessages(prev => [...prev, { role: 'ai', text: ans }]);
      setChatLoading(false);
  };

  const handleExportBibTex = () => {
      const selected = allPapers.filter(p => p.id && selectedPaperIds.has(p.id));
      const targets = selected.length > 0 ? selected : allPapers;
      
      const bib = targets.map((p, i) => {
          if (!p) return '';
          const author = p.author || 'Unknown';
          const id = author.split(' ')[0] + (p.year || '0000');
          return `@article{${id},
  title={${p.title || 'Untitled'}},
  author={${author}},
  year={${p.year || '0000'}},
  note={${p.description || ''}}
}`;
      }).join('\n\n');

      const blob = new Blob([bib], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'citations.bib';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setQuery(file.name);
      handleTrack(file.name, true);
    }
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedPaperIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedPaperIds(newSet);
  };

  // D3 Graph Effect
  useEffect(() => {
    if ((viewMode !== 'graph' && viewMode !== 'timeline') || !results || !graphRef.current) return;

    // Clear previous graph
    const container = d3.select(graphRef.current);
    container.selectAll("*").remove();

    const width = graphRef.current.clientWidth;
    const height = 600;

    // Transform Data
    const rootNode = { 
       id: 'root', 
       name: query || 'Main Paper', 
       type: 'root', 
       radius: 20, 
       category: 'Source',
       year: new Date().getFullYear() 
    };
    
    let nodes: any[] = [rootNode];
    let links: any[] = [];
    
    // Flatten hierarchy and create nodes
    results.forEach((cat, catIdx) => {
      if (Array.isArray(cat.papers)) {
        cat.papers.forEach((paper, pIdx) => {
            if (!paper) return; // Fix: Check if paper is null
            const nodeId = paper.id || `p-${catIdx}-${pIdx}`;
            const radius = Math.max(5, Math.min(15, (paper.citations || 0) / 10 + 5));
            nodes.push({
                ...paper,
                id: nodeId,
                name: paper.title || "Untitled",
                type: 'paper',
                radius: radius,
                category: cat.category,
                // Fallback year if missing
                year: paper.year || (new Date().getFullYear() - Math.floor(Math.random() * 5))
            });
            links.push({ source: 'root', target: nodeId, type: 'citation' });
        });
      }
    });

    // Simulate Co-citation Links (Same Category + Random)
    if (nodes.length > 5) {
        for (let i = 1; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].category === nodes[j].category) {
                     // Link papers in same category loosely
                     links.push({ source: nodes[i].id, target: nodes[j].id, type: 'co-citation' });
                }
            }
        }
    }

    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "#f8fafc")
      .style("border-radius", "0.75rem");

    // Timeline Scale
    const years = nodes.map(d => d.year).filter(y => y);
    const minYear = d3.min(years) || 2000;
    const maxYear = d3.max(years) || 2024;
    const xScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([50, width - 50]);

    if (viewMode === 'timeline') {
        // Draw Axis
        const axis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        svg.append("g")
           .attr("transform", `translate(0, ${height - 30})`)
           .call(axis)
           .attr("color", "#94a3b8");
    }

    // Definitions (Arrow markers)
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) 
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#cbd5e1");

    // Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(d => d.type === 'co-citation' ? 50 : 100).strength(d => d.type === 'co-citation' ? 0.05 : 0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 5));

    if (viewMode === 'timeline') {
        simulation.force("x", d3.forceX((d: any) => xScale(d.year)).strength(0.8));
        simulation.force("y", d3.forceY(height / 2).strength(0.1));
    } else {
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
    }

    // Draw Links
    const link = svg.append("g")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => d.type === 'co-citation' ? "#e2e8f0" : "#94a3b8")
      .attr("stroke-width", d => d.type === 'co-citation' ? 1 : 1.5)
      .attr("stroke-dasharray", d => d.type === 'co-citation' ? "4,2" : "0")
      .attr("marker-end", d => d.type === 'citation' ? "url(#arrow)" : null);

    // Color Scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Draw Nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => d.type === 'root' ? '#2563eb' : colorScale(d.category))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
         event.stopPropagation();
         if (d.type === 'paper') {
            setSelectedPaper(d);
         }
      })
      .call(d3.drag()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any);

    // Labels (Only for root and larger nodes to reduce clutter)
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes.filter((d: any) => d.radius > 8 || d.type === 'root'))
      .join("text")
      .attr("dx", 0)
      .attr("dy", (d: any) => d.radius + 12)
      .text((d: any) => {
         const txt = d.name || "";
         return txt.length > 15 ? txt.substring(0, 15) + '...' : txt;
      })
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#64748b")
      .style("pointer-events", "none")
      .style("font-weight", "bold")
      .style("text-shadow", "0 1px 0 #fff");

    // Ticker
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [viewMode, results, query]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 relative flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Input Area (Collapsed if results exist) */}
      {!results && (
        <div className="max-w-3xl mx-auto w-full mb-10 flex-shrink-0">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">{t.title}</h2>
                <p className="text-slate-500">{t.subtitle}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-100">
                <button 
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    onClick={() => { setActiveTab('search'); setResults(null); setQuery(''); setSelectedPaper(null); }}
                >
                    <Search size={18} /> {t.tabSearch}
                </button>
                <button 
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    onClick={() => { setActiveTab('upload'); setResults(null); setQuery(''); setSelectedPaper(null); }}
                >
                    <Upload size={18} /> {t.tabUpload}
                </button>
                </div>

                <div className="p-8">
                {activeTab === 'search' ? (
                    <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t.placeholder}
                        className="flex-grow border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleTrack(query, false)}
                    />
                    <button 
                        onClick={() => handleTrack(query, false)}
                        disabled={loading || !query}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : t.btn}
                    </button>
                    </div>
                ) : (
                    <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    >
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <FileText size={24} />
                    </div>
                    <p className="font-bold text-slate-700 mb-1">{t.dragDrop}</p>
                    <p className="text-xs text-slate-400">PDF, DOCX (Max 10MB)</p>
                    <input 
                        type="file" 
                        className="hidden" 
                        id="file-upload"
                        onChange={(e) => {
                        if(e.target.files?.[0]) {
                            setQuery(e.target.files[0].name);
                            handleTrack(e.target.files[0].name, true);
                        }
                        }}
                    />
                    <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
                    </div>
                )}
                </div>
            </div>
        </div>
      )}

      {loading && (
        <div className="flex-grow flex flex-col items-center justify-center text-center">
           <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
           <p className="text-lg font-bold text-slate-800">Analyzing citation network...</p>
           <p className="text-slate-500 text-sm">Identifying support/dispute relationships and contexts.</p>
        </div>
      )}

      {results && (
         <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden animate-fadeIn">
            {/* Left Panel: Visualization */}
            <div className="lg:w-7/12 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('graph')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ${viewMode === 'graph' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                            <Share2 size={14} /> Network
                        </button>
                        <button onClick={() => setViewMode('timeline')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ${viewMode === 'timeline' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                            <Clock size={14} /> Timeline
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={handleGapAnalysis} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                             <Zap size={14} /> AI Gap Analysis
                         </button>
                         <button onClick={() => setShowChat(!showChat)} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                             <MessageCircle size={14} /> Chat
                         </button>
                    </div>
                </div>
                
                <div className="flex-grow relative bg-slate-50/50">
                    <div ref={graphRef} className="w-full h-full absolute inset-0"></div>
                    {/* Gap Analysis Overlay */}
                    {gapAnalysis && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-purple-100 shadow-lg animate-fadeIn z-10 max-h-60 overflow-y-auto">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-purple-800 flex items-center gap-2"><Target size={16}/> Research Gaps Identified</h4>
                                <button onClick={() => setGapAnalysis(null)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                            </div>
                            <p className="text-sm text-slate-700 mb-3 italic">"{gapAnalysis.suggestion}"</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Missing Themes</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {gapAnalysis.missingThemes.map((t, i) => <span key={i} className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{t}</span>)}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Underrepresented Methods</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {gapAnalysis.underrepresentedMethods.map((t, i) => <span key={i} className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">{t}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {analyzingGap && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
                            <Loader2 className="animate-spin text-purple-600 h-8 w-8" />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: List / Details / Chat */}
            <div className="lg:w-5/12 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
                {showChat ? (
                    <div className="flex flex-col h-full">
                         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
                             <h3 className="font-bold text-emerald-800 flex items-center gap-2"><MessageCircle size={18}/> Chat with Network</h3>
                             <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                         </div>
                         <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50">
                             {chatMessages.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                         {msg.text}
                                     </div>
                                 </div>
                             ))}
                             {chatLoading && <div className="flex justify-start"><div className="bg-slate-200 rounded-lg p-3"><Loader2 size={16} className="animate-spin text-slate-500" /></div></div>}
                         </div>
                         <div className="p-3 border-t border-slate-100 flex gap-2">
                             <input 
                               type="text" 
                               className="flex-grow border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                               placeholder="Ask about these papers..."
                               value={chatQuery}
                               onChange={e => setChatQuery(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleChat()}
                             />
                             <button onClick={handleChat} disabled={!chatQuery} className="bg-emerald-600 text-white p-2 rounded-lg"><ArrowRight size={18}/></button>
                         </div>
                    </div>
                ) : selectedPaper ? (
                    <div className="flex flex-col h-full animate-slideInRight">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                             <div>
                                 <h3 className="font-bold text-slate-900 leading-snug">{selectedPaper.title || 'Untitled'}</h3>
                                 <p className="text-xs text-slate-500 mt-1">{selectedPaper.author || 'Unknown'} • {selectedPaper.year || 'N/A'}</p>
                             </div>
                             <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                    ${selectedPaper.sentiment === 'Support' ? 'bg-green-100 text-green-700' : 
                                      selectedPaper.sentiment === 'Dispute' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
                                `}>
                                    {selectedPaper.sentiment || 'Mention'}
                                </span>
                                {selectedPaper.isStrong && (
                                    <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 flex items-center gap-1">
                                        <Zap size={12}/> Strong Citation
                                    </span>
                                )}
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400 text-sm text-slate-700 italic">
                                " {selectedPaper.snippet || 'Context snippet unavailable.'} "
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Role in Research</h4>
                                <p className="text-sm text-slate-700">{selectedPaper.description || 'No description available.'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <div className="text-xs text-slate-400 font-bold uppercase">Citations</div>
                                    <div className="text-lg font-bold text-slate-800">{selectedPaper.citations || '0'}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <div className="text-xs text-slate-400 font-bold uppercase">Category</div>
                                    <div className="text-sm font-bold text-blue-600 truncate">{selectedPaper.category || 'General'}</div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">User Notes</h4>
                                <textarea 
                                    className="w-full h-20 border border-slate-200 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="Add your notes here..."
                                ></textarea>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
                                    <ExternalLink size={16}/> View DOI
                                </button>
                                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                                    <Download size={16}/> PDF
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                             <div className="flex items-center gap-2">
                                 <List size={16} className="text-slate-500"/>
                                 <span className="font-bold text-slate-700 text-sm">References ({allPapers.length})</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <button onClick={handleExportBibTex} className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1">
                                     <Download size={14}/> Export
                                 </button>
                             </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2">
                            {allPapers.map((paper, idx) => {
                                if (!paper) return null; // Defensive check
                                return (
                                <div 
                                  key={idx} 
                                  onClick={() => setSelectedPaper(paper)}
                                  className="group p-3 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-blue-100 transition-all mb-1"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <input 
                                              type="checkbox" 
                                              onClick={(e) => {e.stopPropagation(); if(paper.id) toggleSelection(paper.id);}} 
                                              checked={!!paper.id && selectedPaperIds.has(paper.id)}
                                              className="rounded border-slate-300 text-blue-600 focus:ring-0"
                                            />
                                            <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-blue-600">{paper.title || "Untitled"}</h4>
                                        </div>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ml-2
                                            ${paper.sentiment === 'Support' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                                        `}>
                                            {paper.sentiment?.[0] || 'M'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pl-6">
                                        <span className="text-xs text-slate-500">{paper.author || "Unknown"} • {paper.year || "N/A"}</span>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded">{paper.citations || 0} cit.</span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
         </div>
      )}
    </div>
  );
};

export default ReferenceTracker;
