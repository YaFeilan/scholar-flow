


import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as d3 from 'd3';
import { EMERGING_TECH, HOTSPOTS } from '../constants';
import { analyzeResearchTrends, searchAcademicPapers, getPaperTLDR } from '../services/geminiService';
import { Search, Loader2, Move, BarChart2, Tag, X, Filter, BookOpen, Lightbulb, Share2, Github, LayoutGrid, MonitorPlay, Zap, ArrowRight, User } from 'lucide-react';
import { Language, HotspotItem, Paper, TrendTimeRange, TrendPersona, TrendAnalysisResult } from '../types';
import { TRANSLATIONS } from '../translations';

interface TrendDashboardProps {
  language: Language;
  onNavigateToIdea?: (topic: string) => void;
}

const TrendDashboard: React.FC<TrendDashboardProps> = ({ language, onNavigateToIdea }) => {
  const t = TRANSLATIONS[language].trends;
  const appName = TRANSLATIONS[language].appName;
  
  // -- State --
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [timeRange, setTimeRange] = useState<TrendTimeRange>('1Y');
  const [persona, setPersona] = useState<TrendPersona>('Researcher');
  
  // Views
  const [viewMode, setViewMode] = useState<'cloud' | 'graph'>('cloud');
  const [rightPanelTab, setRightPanelTab] = useState<'papers' | 'gaps'>('papers');
  
  // Selection
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  
  // Data
  const [trendData, setTrendData] = useState<TrendAnalysisResult>({
    emergingTech: EMERGING_TECH,
    hotspots: HOTSPOTS,
    methodologies: [],
    researchGaps: []
  });

  // Drill Down Data
  const [relatedPapers, setRelatedPapers] = useState<Paper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [paperTLDRs, setPaperTLDRs] = useState<Record<string, string>>({});

  // Refs
  const d3ContainerRef = useRef<HTMLDivElement>(null);

  // -- Handlers --
  const handleAnalyze = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setSelectedKeyword(null);
    setRightPanelTab('papers'); // reset to default
    
    // Simulate re-analysis with new context
    const result = await analyzeResearchTrends(topic, language, timeRange, persona);
    if (result) {
      setTrendData(result);
    }
    setIsLoading(false);
  };

  const handleTLDR = async (paperId: string, title: string) => {
    if (paperTLDRs[paperId]) return;
    setPaperTLDRs(prev => ({...prev, [paperId]: 'Loading...'}));
    const summary = await getPaperTLDR(title, language);
    setPaperTLDRs(prev => ({...prev, [paperId]: summary}));
  }

  const handleAddToPPT = (content: string) => {
     // Mock functionality for now - In a real app this would dispatch to global store
     alert("Added visual/data to PPT Clipboard");
  };

  // Fetch related papers when keyword is selected
  useEffect(() => {
    const fetchPapers = async () => {
      if (selectedKeyword) {
        setLoadingPapers(true);
        setRightPanelTab('papers');
        const papers = await searchAcademicPapers(selectedKeyword, language, 5);
        setRelatedPapers(papers);
        setLoadingPapers(false);
      } else {
        setRelatedPapers([]);
      }
    };
    fetchPapers();
  }, [selectedKeyword, language]);

  // -- D3 Visualization Effect --
  useEffect(() => {
    if (!d3ContainerRef.current) return;
    const container = d3.select(d3ContainerRef.current);
    container.selectAll("*").remove(); // Clear previous

    const width = d3ContainerRef.current.clientWidth;
    const height = 500;
    
    // Safety check: ensure hotspots is an array and items have text
    const rawData = (trendData.hotspots || []).filter(d => d && d.text);
    if (rawData.length === 0) return;

    // Create SVG
    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .style("overflow", "visible");

    // Force Simulation Setup
    let simulation: any;
    
    if (viewMode === 'cloud') {
        const data = rawData.map(d => ({ ...d }));
        const sizeScale = d3.scaleLinear()
          .domain([d3.min(data, d => d.value) || 0, d3.max(data, d => d.value) || 100])
          .range([14, 42]);

        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

        simulation = d3.forceSimulation(data as any)
          .force("charge", d3.forceManyBody().strength(-30))
          .force("center", d3.forceCenter(0, 0))
          .force("y", d3.forceY(0).strength(0.08))
          .force("x", d3.forceX(0).strength(0.08))
          .force("collide", d3.forceCollide().radius((d: any) => ((d.text || '').length * sizeScale(d.value) * 0.35) + 12).iterations(3));

        const textNodes = g.selectAll("text")
          .data(data)
          .enter().append("text")
          .style("font-size", d => `${sizeScale(d.value)}px`)
          .style("font-family", "sans-serif")
          .style("font-weight", (d, i) => i < 3 ? "800" : "500")
          .style("fill", (d) => selectedKeyword === d.text ? "#e11d48" : (selectedKeyword ? "#94a3b8" : (data.indexOf(d) < 3 ? "#2563eb" : "#475569")))
          .style("opacity", d => (selectedKeyword && d.text !== selectedKeyword) ? 0.4 : 1)
          .style("cursor", "pointer")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .text(d => (d.text || '').split('(')[0])
          .on("click", (event, d) => { event.stopPropagation(); setSelectedKeyword(d.text === selectedKeyword ? null : d.text); })
          .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any);

         simulation.on("tick", () => {
            textNodes.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
         });

    } else {
        // Graph View
        const nodes = rawData.map(d => ({ ...d, id: d.text, r: Math.max(20, d.value / 2) }));
        const links: any[] = [];
        
        // Infer links based on 'relatedTo' or mock based on category
        nodes.forEach((source, i) => {
           if (source.relatedTo) {
               source.relatedTo.forEach((targetName: string) => {
                   // Simple matching
                   const target = nodes.find(n => (n.text || '').includes(targetName) || targetName.includes(n.text || ''));
                   if (target) links.push({ source: source.id, target: target.id });
               });
           }
           // Fallback: Link same categories if sparse
           if (links.length < nodes.length) {
               for (let j=i+1; j<nodes.length; j++) {
                   if (nodes[i].category === nodes[j].category) {
                       links.push({ source: nodes[i].id, target: nodes[j].id, dashed: true });
                   }
               }
           }
        });

        simulation = d3.forceSimulation(nodes as any)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius((d: any) => d.r + 5));

        const link = svg.append("g")
            .attr("stroke", "#94a3b8")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", (d: any) => d.dashed ? "4,4" : "0");

        const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", (d: any) => d.r)
            .attr("fill", (d: any) => d.text === selectedKeyword ? "#e11d48" : "#3b82f6")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)
            .on("click", (event, d: any) => { event.stopPropagation(); setSelectedKeyword(d.text === selectedKeyword ? null : d.text); });

        const label = svg.append("g")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .text((d: any) => (d.text || '').substring(0, 15))
            .attr("font-size", 10)
            .attr("dx", 0)
            .attr("dy", (d: any) => d.r + 12)
            .attr("text-anchor", "middle")
            .attr("fill", "#475569")
            .style("pointer-events", "none");

        simulation.on("tick", () => {
            link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
            node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
            label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
        });
    }

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }

    return () => simulation.stop();
  }, [trendData.hotspots, selectedKeyword, viewMode]);


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Controls */}
      <div className="bg-darkbg rounded-xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div>
                  <h2 className="text-3xl font-bold font-serif mb-2">{appName} <span className="text-blue-400">{t.title}</span></h2>
                  <p className="text-slate-400 text-sm max-w-lg">{t.subtitle}</p>
                </div>
                
                {/* Global Controls */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                        <User size={14} className="ml-2 text-slate-400" />
                        <select 
                           value={persona}
                           onChange={(e) => setPersona(e.target.value as TrendPersona)}
                           className="bg-transparent text-white text-xs font-bold border-none focus:ring-0 cursor-pointer py-1"
                        >
                           <option value="Researcher">Researcher View</option>
                           <option value="Institution">Institution View</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="relative flex-grow md:w-64">
                            <input 
                              type="text" 
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-sm px-4 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder={t.placeholder}
                            />
                        </div>
                        <button 
                          onClick={handleAnalyze}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                          {t.analyze}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-500 uppercase">Time Range:</span>
                       {['1Y', '3Y', '5Y'].map((range) => (
                           <button
                             key={range}
                             onClick={() => setTimeRange(range as TrendTimeRange)}
                             className={`text-xs px-2 py-1 rounded border transition-all ${timeRange === range ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
                           >
                             {range}
                           </button>
                       ))}
                    </div>
                </div>
            </div>

             {/* Emerging Tech Cards (with Forecast) */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendData.emergingTech?.map((tech, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/5 hover:bg-white/15 transition-all group relative overflow-hidden">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">{tech.type || t.emerging}</p>
                        <button onClick={() => handleAddToPPT(`Emerging Tech: ${tech.name}`)} className="text-white/20 hover:text-white transition-colors"><MonitorPlay size={14} /></button>
                     </div>
                     <h3 className="text-lg font-bold leading-tight mb-4 pr-4">{tech.name}</h3>
                     <div className="flex items-end justify-between">
                        <div>
                            <span className="text-2xl font-bold text-green-400">+{tech.growth}%</span>
                            <span className="text-xs text-slate-400 ml-1 block">{t.yoy}</span>
                        </div>
                        {tech.predictedGrowth && (
                            <div className="text-right">
                                <span className="text-sm font-bold text-purple-300">+{tech.predictedGrowth}%</span>
                                <span className="text-[10px] text-slate-400 block">Next Year (Proj)</span>
                            </div>
                        )}
                     </div>
                     {/* Mini Sparkline Effect */}
                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500/50 to-green-500/0 opacity-50"></div>
                  </div>
                ))}
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Main Visualization Panel */}
         <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
               <div className="flex items-center gap-2">
                 <div className="flex bg-slate-100 rounded-lg p-1">
                    <button 
                        onClick={() => setViewMode('cloud')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'cloud' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                    >
                        <LayoutGrid size={14} /> Cloud
                    </button>
                    <button 
                        onClick={() => setViewMode('graph')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'graph' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                    >
                        <Share2 size={14} /> Network
                    </button>
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 ml-2">{t.hotspots}</h3>
               </div>
               
               <button onClick={() => handleAddToPPT('Hotspots Visualization')} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1">
                  <MonitorPlay size={14} /> Add to PPT
               </button>
            </div>
            
            <div className="flex-grow bg-slate-50/30 rounded-lg border border-slate-100 overflow-hidden relative cursor-crosshair">
               {/* D3 dedicated container - Separated to avoid React reconciliation issues */}
               <div ref={d3ContainerRef} className="w-full h-full absolute inset-0" onClick={() => setSelectedKeyword(null)}></div>
               
               {/* Overlay Legend - React Managed */}
               <div className="absolute bottom-4 left-4 pointer-events-none bg-white/80 backdrop-blur px-3 py-2 rounded text-xs text-slate-500 border border-slate-100">
                  {viewMode === 'cloud' ? 'Force-Directed Word Cloud' : 'Knowledge Graph Topology'} <br/>
                  <span className="opacity-70">Click nodes to drill down</span>
               </div>
            </div>
         </div>

         {/* Right Panel: Drill Down & Details */}
         <div className={`lg:col-span-4 bg-white rounded-xl border shadow-sm flex flex-col h-[600px] overflow-hidden transition-all ${selectedKeyword ? 'border-blue-300 ring-1 ring-blue-50' : 'border-slate-200'}`}>
            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button 
                   onClick={() => setRightPanelTab('papers')}
                   className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${rightPanelTab === 'papers' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                   {selectedKeyword ? 'Related Papers' : t.methodologies}
                </button>
                <button 
                   onClick={() => setRightPanelTab('gaps')}
                   className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${rightPanelTab === 'gaps' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                   <Zap size={14} className={rightPanelTab === 'gaps' ? 'text-purple-600' : 'text-slate-400'} /> Blue Ocean
                </button>
            </div>

            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar relative">
                {rightPanelTab === 'gaps' ? (
                    // Research Gaps View
                    <div className="space-y-4">
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-xs text-purple-800 mb-2">
                            AI-identified opportunities based on current literature saturation.
                        </div>
                        {trendData.researchGaps?.map((gap, i) => (
                            <div key={i} className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${gap.type === 'Blue Ocean' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{gap.type}</span>
                                    <span className={`text-[10px] font-bold ${gap.difficulty === 'High' ? 'text-red-500' : gap.difficulty === 'Medium' ? 'text-amber-500' : 'text-green-500'}`}>{gap.difficulty} Difficulty</span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm mb-2">{gap.problem}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">{gap.potential}</p>
                                <button className="w-full text-center py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-500 hover:bg-slate-50 group-hover:border-purple-200 group-hover:text-purple-600 transition-all">
                                    Draft Proposal
                                </button>
                            </div>
                        ))}
                         {trendData.researchGaps?.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                <Zap size={32} className="mx-auto mb-2 opacity-20" />
                                <p>Run analysis to identify gaps.</p>
                            </div>
                         )}
                    </div>
                ) : (
                    // Papers / Methodologies View
                    <>
                       {selectedKeyword ? (
                          // Drill Down: Related Papers
                          <div className="space-y-3">
                              <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase">Drill-down: {selectedKeyword}</h4>
                                  <button onClick={() => setSelectedKeyword(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                              </div>
                              
                              {loadingPapers ? (
                                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
                              ) : (
                                  relatedPapers.map((paper) => (
                                      <div key={paper.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-blue-300 transition-all group">
                                          <h5 className="font-bold text-sm text-slate-800 leading-tight mb-2 group-hover:text-blue-700">{paper.title}</h5>
                                          <div className="flex justify-between items-center mb-2">
                                              <span className="text-xs text-slate-500">{paper.year} • {paper.journal}</span>
                                              <div 
                                                className="text-xs font-bold text-purple-600 cursor-pointer flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded hover:bg-purple-100"
                                                onMouseEnter={() => handleTLDR(paper.id, paper.title)}
                                              >
                                                  <Zap size={10} /> AI TL;DR
                                              </div>
                                          </div>
                                          {/* AI TL;DR Tooltip Area */}
                                          {paperTLDRs[paper.id] && (
                                              <div className="bg-white p-2 rounded border border-purple-100 text-[10px] text-slate-600 shadow-sm animate-fadeIn mt-1">
                                                  {paperTLDRs[paper.id] === 'Loading...' ? <Loader2 size={10} className="animate-spin inline mr-1"/> : <span className="font-bold text-purple-700">Summary: </span>}
                                                  {paperTLDRs[paper.id]}
                                              </div>
                                          )}
                                      </div>
                                  ))
                              )}
                              
                              {onNavigateToIdea && (
                                <button 
                                    onClick={() => onNavigateToIdea(selectedKeyword)}
                                    className="w-full mt-4 bg-amber-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-amber-600 flex items-center justify-center gap-2"
                                >
                                    <Lightbulb size={16} /> Generate Research Idea
                                </button>
                              )}
                          </div>
                       ) : (
                          // Default: Methodologies Ranking
                          <div className="space-y-4">
                             {trendData.methodologies?.length === 0 && !isLoading && (
                                <div className="text-center py-10 text-slate-400">
                                   <BarChart2 size={32} className="mx-auto mb-2 opacity-20" />
                                   <p>Run analysis to see rankings.</p>
                                </div>
                             )}
                             {trendData.methodologies?.map((item, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                   <div className="flex justify-between items-start mb-1 relative z-10">
                                      <div className="flex items-center gap-2">
                                         <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                                         <span className="font-bold text-sm text-slate-800">{item.name}</span>
                                      </div>
                                      <span className="text-xs font-bold text-green-600">+{item.growth}%</span>
                                   </div>
                                   
                                   <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2 relative z-10">
                                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (item.value / 100))}%` }}></div>
                                   </div>

                                   {/* Code Stats */}
                                   <div className="flex gap-3 relative z-10">
                                       {item.codeStats && (
                                           <>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                <Github size={10} /> {item.codeStats.github}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                <span>🤗</span> {item.codeStats.huggingface}
                                            </div>
                                           </>
                                       )}
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default TrendDashboard;