import React, { useState, useRef, useEffect } from 'react';
import { Upload, Search, BookOpen, Layers, Tag, Loader2, FileText, Share2, List, X, Info } from 'lucide-react';
import * as d3 from 'd3';
import { trackCitationNetwork } from '../services/geminiService';
import { TrackedReference, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface ReferenceTrackerProps {
  language: Language;
}

const ReferenceTracker: React.FC<ReferenceTrackerProps> = ({ language }) => {
  const t = TRANSLATIONS[language].track;
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrackedReference[] | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Graph state
  const graphRef = useRef<HTMLDivElement>(null);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  const handleTrack = async (inputQuery: string, isFile: boolean) => {
    if (!inputQuery) return;
    setLoading(true);
    setResults(null);
    setSelectedPaper(null);
    const data = await trackCitationNetwork(inputQuery, isFile, language);
    setResults(data);
    setLoading(false);
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

  // D3 Graph Effect
  useEffect(() => {
    if (viewMode !== 'graph' || !results || !graphRef.current) return;

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
       radius: 25, 
       category: 'Source' 
    };
    
    const nodes: any[] = [rootNode];
    const links: any[] = [];
    
    // Flatten hierarchy
    results.forEach((cat, catIdx) => {
      // Safety check for papers array
      if (Array.isArray(cat.papers)) {
        cat.papers.forEach((paper, pIdx) => {
            const nodeId = `p-${catIdx}-${pIdx}`;
            nodes.push({
            id: nodeId,
            name: paper.title,
            author: paper.author,
            year: paper.year,
            description: paper.description,
            type: 'paper',
            radius: 8 + Math.random() * 4,
            category: cat.category
            });
            links.push({ source: 'root', target: nodeId });
        });
      }
    });

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "#f8fafc")
      .style("border-radius", "0.75rem");

    // Definitions (Arrow markers)
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) // Position relative to circle radius
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#cbd5e1");

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 15));

    // Draw Links
    const link = svg.append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Draw Nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
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

    // Node Circles
    node.append("circle")
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
      .on("mouseover", function() {
         d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("mouseout", function() {
         d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
      });

    // Node Labels
    node.append("text")
      .attr("dx", (d: any) => d.radius + 5)
      .attr("dy", ".35em")
      .text((d: any) => {
         const txt = d.name;
         return txt.length > 20 ? txt.substring(0, 20) + '...' : txt;
      })
      .style("font-size", "10px")
      .style("fill", "#475569")
      .style("pointer-events", "none")
      .style("font-family", "sans-serif");

    // Ticker
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [viewMode, results, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">{t.title}</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">{t.subtitle}</p>
      </div>

      {/* Input Area */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-8">
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

      {/* Results Controls */}
      {results && (
        <div className="flex justify-center mb-6">
           <div className="bg-slate-100 p-1 rounded-lg flex shadow-inner">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <List size={16} /> List View
              </button>
              <button 
                onClick={() => setViewMode('graph')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'graph' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Share2 size={16} /> Graph View
              </button>
           </div>
        </div>
      )}

      {/* Results Area */}
      {loading && (
        <div className="text-center py-12">
           <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
           <p className="text-slate-500 font-medium">Analyzing citation network & classifying references...</p>
        </div>
      )}

      {results && viewMode === 'list' && (
        <div className="animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{t.resultsTitle}</h3>
              <p className="text-sm text-slate-500">Categorized by technical contribution</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {results?.map((category, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <Tag size={16} className="text-blue-500" />
                    {category.category}
                  </span>
                  <span className="bg-white text-slate-500 text-xs px-2 py-1 rounded border border-slate-200 font-mono">
                    {category.papers?.length || 0} Refs
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {category.papers?.map((paper, pIdx) => (
                    <div key={pIdx} className="group">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                          {paper.title}
                        </h4>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                          {paper.year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic mb-1">{paper.author}</p>
                      <p className="text-xs text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-50">
                        <span className="font-bold text-blue-700">Role:</span> {paper.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graph View */}
      {results && viewMode === 'graph' && (
         <div className="animate-fadeIn relative">
            <div 
               ref={graphRef} 
               className="w-full h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner"
            ></div>
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-sm text-xs">
               <p className="font-bold text-slate-700 mb-2">Graph Legend</p>
               <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span> <span className="text-slate-600">Source Paper</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-400"></span> <span className="text-slate-600">Reference Node</span>
               </div>
               <p className="mt-2 text-slate-400 italic">Click nodes for details</p>
            </div>
         </div>
      )}

      {/* Node Detail Modal */}
      {selectedPaper && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPaper(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-start">
                  <div className="pr-4">
                     <h3 className="font-bold text-slate-800 text-lg leading-tight">{selectedPaper.name}</h3>
                     <p className="text-xs text-slate-500 mt-1">Reference Detail</p>
                  </div>
                  <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <X size={24} />
                  </button>
               </div>
               <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Author</span>
                        <p className="text-sm font-medium text-slate-800">{selectedPaper.author || 'Unknown'}</p>
                     </div>
                     <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</span>
                        <p className="text-sm font-medium text-slate-800">{selectedPaper.year || 'N/A'}</p>
                     </div>
                  </div>
                  <div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</span>
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-bold border border-purple-100">
                        <Tag size={10} /> {selectedPaper.category}
                     </span>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 relative">
                     <span className="absolute -top-2 left-3 bg-white px-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider border border-blue-100 rounded">Analysis</span>
                     <p className="text-sm text-slate-700 leading-relaxed pt-1 flex gap-2">
                        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        {selectedPaper.description}
                     </p>
                  </div>
               </div>
               <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                     onClick={() => setSelectedPaper(null)}
                     className="text-sm font-bold text-slate-600 hover:text-slate-800"
                  >
                     Close
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ReferenceTracker;