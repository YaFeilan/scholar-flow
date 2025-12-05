
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as d3 from 'd3';
import { EMERGING_TECH, HOTSPOTS } from '../constants';
import { analyzeResearchTrends } from '../services/geminiService';
import { Search, Loader2, Move, BarChart2, Tag, X, Filter } from 'lucide-react';
import { Language, HotspotItem } from '../types';
import { TRANSLATIONS } from '../translations';

interface TrendDashboardProps {
  language: Language;
}

const TrendDashboard: React.FC<TrendDashboardProps> = ({ language }) => {
  const t = TRANSLATIONS[language].trends;
  const appName = TRANSLATIONS[language].appName;
  const cloudRef = useRef<HTMLDivElement>(null);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  
  // Initial State with mocked data including relationships
  const [trendData, setTrendData] = useState({
    emergingTech: EMERGING_TECH,
    hotspots: HOTSPOTS,
    methodologies: [
      { 
        name: 'Transformer Architecture', 
        value: 10500, 
        growth: 180.1, 
        relatedHotspots: ['Large Language Models (大规模语言模型)', 'Natural Language Processing (自然语言处理)', 'Generative AI'] 
      },
      { 
        name: 'Diffusion Models', 
        value: 8900, 
        growth: 210.3,
        relatedHotspots: ['Generative AI', 'Computer Vision (计算机视觉)', 'Deep Learning (深度学习)']
      },
      { 
        name: 'Generative AI', 
        value: 7800, 
        growth: 165.9,
        relatedHotspots: ['Large Language Models (大规模语言模型)', 'Generative AI', 'Natural Language Processing (自然语言处理)']
      },
      { 
        name: 'Graph Neural Networks', 
        value: 6100, 
        growth: 62.5,
        relatedHotspots: ['Graph Neural Networks', 'Deep Learning (深度学习)']
      },
      { 
        name: 'Federated Learning', 
        value: 4900, 
        growth: 40.8,
        relatedHotspots: ['Deep Learning (深度学习)', 'Reinforcement Learning (强化学习)']
      },
    ] as any[]
  });

  const handleAnalyze = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setSelectedKeyword(null);
    const result = await analyzeResearchTrends(topic, language);
    if (result && result.emergingTech && result.hotspots && result.methodologies) {
      setTrendData(result);
    }
    setIsLoading(false);
  };

  // Filter methodologies based on selected keyword using fuzzy matching on the `relatedHotspots` list
  const displayedMethodologies = useMemo(() => {
    if (!selectedKeyword) return trendData.methodologies;
    
    // Simple text matching to find relevant methodologies
    const filtered = trendData.methodologies.filter(m => {
        if (!m.relatedHotspots || !Array.isArray(m.relatedHotspots)) return false;
        // Check if the selected keyword is in the list, or if it is a substring of any related hotspot
        const kw = selectedKeyword.toLowerCase();
        return m.relatedHotspots.some((h: string) => {
           const hStr = h.toLowerCase();
           return hStr.includes(kw) || kw.includes(hStr);
        });
    });

    // If filter returns nothing, fallback to showing all but maybe with a visual cue (or just return empty to show "No direct links")
    // Let's return filtered list. If empty, UI handles it.
    return filtered;
  }, [selectedKeyword, trendData.methodologies]);

  // Improved Force-Directed Word Cloud using D3
  useEffect(() => {
    if (!cloudRef.current) return;
    const container = d3.select(cloudRef.current);
    container.selectAll("*").remove(); // Clear previous

    const width = cloudRef.current.clientWidth;
    const height = 500;

    const rawData = trendData.hotspots || [];
    if (rawData.length === 0) return;

    // Clone data for D3 mutation
    const data = rawData.map(d => ({ ...d }));

    // Scale for font size
    const sizeScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.value) || 0, d3.max(data, d => d.value) || 100])
      .range([14, 42]);

    // Create SVG
    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .style("overflow", "visible");

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Simulation Setup
    const simulation = d3.forceSimulation(data as any)
      .force("charge", d3.forceManyBody().strength(-30)) // Increased repulsion
      .force("center", d3.forceCenter(0, 0)) // Pull to center
      .force("y", d3.forceY(0).strength(0.08)) // Centering gravity Y
      .force("x", d3.forceX(0).strength(0.08)) // Centering gravity X
      .force("collide", d3.forceCollide().radius((d: any) => {
          // Estimate text width for collision radius
          const text = d.text.split('(')[0];
          const fontSize = sizeScale(d.value);
          // Heuristic: Roughly half text width + padding
          return (text.length * fontSize * 0.35) + 12;
      }).iterations(3));

    // Render Text Nodes
    const textNodes = g.selectAll("text")
      .data(data)
      .enter().append("text")
      .style("font-size", d => `${sizeScale(d.value)}px`)
      .style("font-family", "sans-serif")
      .style("font-weight", (d, i) => i < 3 ? "800" : "500")
      .style("fill", (d) => {
        // Highlighting logic
        if (selectedKeyword && d.text === selectedKeyword) return "#e11d48"; // Red for selected
        return selectedKeyword ? "#94a3b8" : (data.indexOf(d) < 3 ? "#2563eb" : "#475569"); // Dim others if one selected
      }) 
      .style("opacity", (d) => {
         if (selectedKeyword && d.text !== selectedKeyword) return 0.4;
         return 1;
      })
      .style("cursor", "pointer")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(d => d.text.split('(')[0]) // Show English text
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedKeyword(d.text === selectedKeyword ? null : d.text);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any
      );

    // Hover effects
    textNodes
      .on("mouseover", function(event, d) { 
        if (selectedKeyword) return; // Disable hover effect when selection is active
        d3.select(this)
          .transition().duration(200)
          .style("fill", "#7c3aed") // Purple on hover
          .style("font-size", (d: any) => `${sizeScale(d.value) * 1.1}px`);
      })
      .on("mouseout", function(event, d: any) { 
        if (selectedKeyword) return;
        d3.select(this)
          .transition().duration(200)
          .style("fill", (d: any, i) => data.indexOf(d) < 3 ? "#2563eb" : "#475569")
          .style("font-size", `${sizeScale(d.value)}px`);
      });

    // Update positions on tick
    simulation.on("tick", () => {
      textNodes
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [trendData.hotspots, selectedKeyword]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-darkbg rounded-xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl transition-all duration-500">
         <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-blue-400 font-bold">~</span>
                     <h2 className="text-2xl font-bold font-serif">{appName} <span className="text-slate-400 font-sans font-normal text-lg">{t.title}</span></h2>
                  </div>
                  <p className="text-slate-400 text-sm max-w-lg">{t.subtitle}</p>
                </div>
                
                {/* Input Section */}
                <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <input 
                          type="text" 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                          className="w-full bg-transparent border-none text-white text-sm px-4 py-2 focus:ring-0 placeholder-slate-500 outline-none"
                          placeholder={t.placeholder}
                        />
                    </div>
                    <button 
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                      {t.analyze}
                    </button>
                </div>
            </div>

             {/* Emerging Tech Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10">
                {trendData.emergingTech.map((tech, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/5 hover:bg-white/15 transition-all animate-fadeIn">
                     <p className="text-xs font-bold text-blue-300 uppercase mb-2 tracking-wider">{tech.type || t.emerging}</p>
                     <h3 className="text-lg font-bold leading-tight mb-4">{tech.name}</h3>
                     <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-green-400">+{tech.growth}%</span>
                        <span className="text-xs text-slate-400 mb-1">{t.yoy}</span>
                     </div>
                  </div>
                ))}
             </div>
         </div>
         
         {/* Background Decor */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Research Hotspots (Word Cloud + Stats) */}
         <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
               <div className="flex items-center gap-2">
                 <span className="text-blue-600 bg-blue-50 p-1.5 rounded"><Move size={18} /></span>
                 <h3 className="text-lg font-bold text-slate-800">{t.hotspots}</h3>
               </div>
               <div className="flex items-center gap-2">
                  {isLoading && <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> {t.extracting}</span>}
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">Interactive Visualization</span>
               </div>
            </div>
            
            <div className="flex flex-grow gap-4 h-full overflow-hidden">
                {/* Left: Interactive Force Layout Cloud */}
                <div 
                   className="flex-grow bg-slate-50/30 rounded-lg border border-slate-100 overflow-hidden relative" 
                   ref={cloudRef}
                   onClick={() => setSelectedKeyword(null)} // Click background to deselect
                >
                   {/* D3 renders here */}
                   <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 pointer-events-none">
                      Force-Directed Layout • Click to Filter Methodologies
                   </div>
                </div>

                {/* Right: Frequency Statistics Panel */}
                <div className="w-64 flex-shrink-0 border-l border-slate-100 pl-4 flex flex-col">
                   <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                      <BarChart2 size={16} /> {t.keywordStats}
                   </div>
                   <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {[...trendData.hotspots].sort((a,b) => b.value - a.value).map((item, idx) => (
                         <div 
                           key={idx} 
                           className={`group cursor-pointer rounded-lg p-2 transition-all border ${
                              selectedKeyword === item.text 
                              ? 'bg-blue-50 border-blue-200 shadow-sm' 
                              : 'bg-white border-transparent hover:bg-slate-50'
                           }`}
                           onClick={() => setSelectedKeyword(item.text === selectedKeyword ? null : item.text)}
                         >
                            <div className="flex justify-between items-center mb-1">
                               <span className={`text-xs font-bold truncate pr-2 ${selectedKeyword === item.text ? 'text-blue-700' : 'text-slate-700'}`}>
                                  {item.text.split('(')[0]}
                               </span>
                               <span className="text-[10px] text-slate-400 font-mono">{item.value}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                               <div 
                                 className={`h-full rounded-full transition-all duration-500 ${selectedKeyword === item.text ? 'bg-blue-500' : 'bg-slate-300 group-hover:bg-blue-400'}`} 
                                 style={{ width: `${item.value}%` }}
                               ></div>
                            </div>
                            {item.category && (
                              <div className="mt-1.5 flex justify-end">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded flex items-center gap-1">
                                   <Tag size={8} /> {item.category}
                                </span>
                              </div>
                            )}
                         </div>
                      ))}
                   </div>
                </div>
            </div>
         </div>

         {/* Methodology Rankings (Sidebar) */}
         <div className={`lg:col-span-4 bg-white p-6 rounded-xl border shadow-sm flex flex-col h-[600px] transition-all ${selectedKeyword ? 'border-blue-300 shadow-md ring-1 ring-blue-50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
               <div className="flex items-center gap-2">
                 <span className={`p-1.5 rounded transition-colors ${selectedKeyword ? 'bg-blue-100 text-blue-600' : 'bg-purple-50 text-secondary'}`}>
                   {selectedKeyword ? <Filter size={18} /> : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                 </span>
                 <h3 className="text-lg font-bold text-slate-800">
                   {selectedKeyword ? 'Related Methods' : t.methodologies}
                 </h3>
               </div>
               {selectedKeyword && (
                 <button 
                   onClick={() => setSelectedKeyword(null)}
                   className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                 >
                   Clear <X size={12} />
                 </button>
               )}
            </div>

            {selectedKeyword && (
               <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2 animate-fadeIn">
                  <div className="mt-0.5"><Filter size={12} /></div>
                  <div>
                    <span className="font-bold">Filtering by Hotspot:</span><br/>
                    <span className="italic">"{selectedKeyword.split('(')[0]}"</span>
                  </div>
               </div>
            )}

            <div className="flex-grow relative">
               {isLoading ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                   <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
                 </div>
               ) : displayedMethodologies.length === 0 ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                    <Filter size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">No direct methodology links found for this keyword.</p>
                    <button onClick={() => setSelectedKeyword(null)} className="mt-4 text-blue-600 text-sm font-bold hover:underline">View All</button>
                 </div>
               ) : (
                <>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={displayedMethodologies} margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={12}>
                       <XAxis type="number" hide />
                       <YAxis type="category" dataKey="name" width={1} hide />
                       <Tooltip 
                         contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                         cursor={{fill: 'transparent'}}
                       />
                       <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {displayedMethodologies.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={selectedKeyword ? '#2563eb' : (index < 2 ? '#4f46e5' : '#818cf8')} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
                 
                 <div className="absolute top-0 right-0 left-0 bottom-0 flex flex-col justify-around pointer-events-none py-2">
                    {displayedMethodologies.map((item, idx) => (
                       <div key={idx} className="relative flex justify-between items-center group mb-2 pl-2 pr-4">
                          <div className="flex items-center gap-3 pr-2 bg-white/60 backdrop-blur-[1px] rounded p-1">
                             <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                             <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 pl-2 bg-white/60 backdrop-blur-[1px] rounded p-1">
                             <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{item.value}</span>
                             <span className="text-[10px] font-bold text-green-500">↑ {item.growth}%</span>
                          </div>
                       </div>
                    ))}
                 </div>
                </>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default TrendDashboard;
