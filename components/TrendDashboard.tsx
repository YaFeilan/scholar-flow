
import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as d3 from 'd3';
import { EMERGING_TECH, HOTSPOTS } from '../constants';
import { analyzeResearchTrends } from '../services/geminiService';
import { Search, Loader2, Move } from 'lucide-react';
import { Language } from '../types';
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
  
  // Initial State with mocked data
  const [trendData, setTrendData] = useState({
    emergingTech: EMERGING_TECH,
    hotspots: HOTSPOTS,
    methodologies: [
      { name: 'Transformer Architecture', value: 10500, growth: 180.1 },
      { name: 'Diffusion Models', value: 8900, growth: 210.3 },
      { name: 'Generative AI', value: 7800, growth: 165.9 },
      { name: 'Graph Neural Networks', value: 6100, growth: 62.5 },
      { name: 'Federated Learning', value: 4900, growth: 40.8 },
    ]
  });

  const handleAnalyze = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    const result = await analyzeResearchTrends(topic, language);
    if (result && result.emergingTech && result.hotspots && result.methodologies) {
      setTrendData(result);
    }
    setIsLoading(false);
  };

  // Improved Force-Directed Word Cloud using D3
  useEffect(() => {
    if (!cloudRef.current) return;
    const container = d3.select(cloudRef.current);
    container.selectAll("*").remove(); // Clear previous

    const width = cloudRef.current.clientWidth;
    const height = 450;

    const rawData = trendData.hotspots || [];
    if (rawData.length === 0) return;

    // Clone data for D3 mutation
    const data = rawData.map(d => ({ ...d }));

    // Scale for font size
    const sizeScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.value) || 0, d3.max(data, d => d.value) || 100])
      .range([12, 36]);

    // Create SVG
    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .style("overflow", "visible");

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Simulation Setup
    const simulation = d3.forceSimulation(data as any)
      .force("charge", d3.forceManyBody().strength(-15)) // Light repulsion
      .force("center", d3.forceCenter(0, 0)) // Pull to center
      .force("y", d3.forceY(0).strength(0.05)) // Centering gravity Y
      .force("x", d3.forceX(0).strength(0.05)) // Centering gravity X
      .force("collide", d3.forceCollide().radius((d: any) => {
          // Estimate text width for collision radius
          const text = d.text.split('(')[0];
          const fontSize = sizeScale(d.value);
          // Heuristic: Roughly half text width + padding
          return (text.length * fontSize * 0.35) + 8;
      }).iterations(2));

    // Render Text Nodes
    const textNodes = g.selectAll("text")
      .data(data)
      .enter().append("text")
      .style("font-size", d => `${sizeScale(d.value)}px`)
      .style("font-family", "sans-serif")
      .style("font-weight", (d, i) => i < 3 ? "800" : "500")
      .style("fill", (d, i) => i < 3 ? "#2563eb" : "#475569") // Primary blue for top 3, slate for others
      .style("cursor", "grab")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(d => d.text.split('(')[0]) // Show English text
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any
      );

    // Hover effects
    textNodes
      .on("mouseover", function() { 
        d3.select(this)
          .transition().duration(200)
          .style("fill", "#7c3aed") // Purple on hover
          .style("font-size", (d: any) => `${sizeScale(d.value) * 1.2}px`);
      })
      .on("mouseout", function(event, d: any) { 
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
      d3.select(this).style("cursor", "grabbing");
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(this).style("cursor", "grab");
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [trendData.hotspots]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Left: Research Hotspots (Word Cloud) */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <span className="text-blue-600"><Move size={20} /></span>
                 <h3 className="text-lg font-bold text-slate-800">{t.hotspots}</h3>
               </div>
               <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Drag to rearrange</span>
            </div>
            
            {/* Interactive Force Layout Cloud */}
            <div className="relative flex-grow bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden" ref={cloudRef}>
                {/* D3 renders here */}
            </div>
         </div>

         {/* Right: Methodology Rankings */}
         <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
               <span className="text-secondary"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></span>
               <h3 className="text-lg font-bold text-slate-800">{t.methodologies}</h3>
            </div>

            <div className="h-96 relative">
               {isLoading ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                   <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
                 </div>
               ) : (
                <>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={trendData.methodologies} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={12}>
                       <XAxis type="number" hide />
                       <YAxis type="category" dataKey="name" width={1} hide />
                       <Tooltip 
                         contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                         cursor={{fill: 'transparent'}}
                       />
                       <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {trendData.methodologies.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index < 2 ? '#4f46e5' : '#818cf8'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
                 
                 <div className="absolute top-0 right-0 left-0 bottom-0 flex flex-col justify-around pointer-events-none py-2">
                    {trendData.methodologies.map((item, idx) => (
                       <div key={idx} className="relative flex justify-between items-center group mb-2 px-4">
                          <div className="flex items-center gap-4 pr-2 bg-white/40 backdrop-blur-[1px] rounded p-1">
                             <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                             <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4 pl-2 bg-white/40 backdrop-blur-[1px] rounded p-1">
                             <span className="text-xs text-slate-400 font-mono hidden sm:inline">{item.value} papers</span>
                             <span className="text-xs font-bold text-green-500">↑ {item.growth}%</span>
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