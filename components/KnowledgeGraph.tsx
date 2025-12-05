
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Network, Plus, Share2, Filter, Search, FileText, Image as ImageIcon, Loader2, X, Maximize2, Minimize2, Calendar, Layout } from 'lucide-react';
import { GraphNode, GraphLink, Language } from '../types';
import { generateKnowledgeGraph, analyzeImageNote } from '../services/geminiService';
import { TRANSLATIONS } from '../translations';
import { MOCK_PAPERS } from '../constants'; // Import MOCK_PAPERS to simulate "Import from Search"

interface KnowledgeGraphProps {
  language: Language;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ language }) => {
  const t = TRANSLATIONS[language].knowledge;
  
  // Graph State
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const graphRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartition, setFilterPartition] = useState<string>('All');
  
  // Initialize with some mock data if empty (for demo)
  useEffect(() => {
      if (nodes.length === 0) {
          const initialNodes: GraphNode[] = MOCK_PAPERS.slice(0, 3).map(p => ({
              id: p.id,
              label: p.title,
              type: 'Paper',
              content: p.abstract,
              addedDate: p.addedDate || new Date().toISOString().split('T')[0],
              badges: p.badges
          }));
          setNodes(initialNodes);
      }
  }, []);

  // Filter Logic
  const filteredNodes = useMemo(() => {
      return nodes.filter(n => {
          const matchesSearch = n.label.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesPartition = filterPartition === 'All' || 
              (n.badges && n.badges.some(b => b.type === 'SCI' || b.type === 'CJR' || b.partition === filterPartition)); // Simplified check
          return matchesSearch && matchesPartition;
      });
  }, [nodes, searchTerm, filterPartition]);

  // AI Connection
  const handleConnect = async () => {
      if (nodes.length < 2) return;
      setLoading(true);
      const newLinks = await generateKnowledgeGraph(nodes, language);
      if (newLinks) {
          // Merge avoiding duplicates
          setLinks(prev => {
              const combined = [...prev, ...newLinks];
              // Simple dedup based on source-target
              const unique = Array.from(new Set(combined.map(l => `${l.source}-${l.target}`)))
                  .map(key => combined.find(l => `${l.source}-${l.target}` === key)!);
              return unique;
          });
      }
      setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setAnalyzingImage(true);
          const file = e.target.files[0];
          const text = await analyzeImageNote(file, language);
          
          const newNode: GraphNode = {
              id: `note-${Date.now()}`,
              label: file.name,
              type: 'Note',
              content: text,
              addedDate: new Date().toISOString().split('T')[0]
          };
          
          setNodes(prev => [...prev, newNode]);
          setAnalyzingImage(false);
          setSidebarOpen(true);
          setSelectedNode(newNode);
      }
  };

  const handleAddManualNote = () => {
      const newNode: GraphNode = {
          id: `note-${Date.now()}`,
          label: language === 'ZH' ? '新笔记' : 'New Note',
          type: 'Note',
          content: '',
          addedDate: new Date().toISOString().split('T')[0]
      };
      setNodes(prev => [...prev, newNode]);
      setSelectedNode(newNode);
      setSidebarOpen(true);
  };

  // D3 Effect
  useEffect(() => {
      if (!graphRef.current || filteredNodes.length === 0) return;
      
      const width = graphRef.current.clientWidth;
      const height = graphRef.current.clientHeight;
      const container = d3.select(graphRef.current);
      container.selectAll("*").remove();

      const svg = container.append("svg")
          .attr("width", "100%")
          .attr("height", "100%")
          .attr("viewBox", [0, 0, width, height]);

      // Filter links to only include those where both source and target exist in filteredNodes
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const activeLinks = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

      // Simulation
      const simulation = d3.forceSimulation(filteredNodes as any)
          .force("link", d3.forceLink(activeLinks).id((d: any) => d.id).distance(150))
          .force("charge", d3.forceManyBody().strength(-300))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide().radius(40));

      // Arrow Marker
      svg.append("defs").append("marker")
          .attr("id", "arrow")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 25)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", "#94a3b8");

      const link = svg.append("g")
          .attr("stroke", "#94a3b8")
          .attr("stroke-opacity", 0.6)
          .selectAll("line")
          .data(activeLinks)
          .join("line")
          .attr("stroke-width", 1.5)
          .attr("marker-end", "url(#arrow)");

      const linkLabel = svg.append("g")
          .selectAll("text")
          .data(activeLinks)
          .join("text")
          .text(d => d.label)
          .attr("font-size", 10)
          .attr("fill", "#64748b")
          .attr("text-anchor", "middle");

      const node = svg.append("g")
          .selectAll("g")
          .data(filteredNodes)
          .join("g")
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended) as any)
          .on("click", (event, d) => {
              setSelectedNode(d as GraphNode);
              setSidebarOpen(true);
          });

      // Node Circle
      node.append("circle")
          .attr("r", 20)
          .attr("fill", d => d.type === 'Paper' ? '#3b82f6' : '#10b981') // Blue for Paper, Green for Note
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);

      // Node Label (Icon)
      node.append("text")
          .attr("dy", 5)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("font-family", "lucide")
          .text(d => d.type === 'Paper' ? 'P' : 'N'); // Simple text for now, could use icon font

      // Node Text Label
      node.append("text")
          .text(d => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label)
          .attr("dy", 35)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#1e293b")
          .style("pointer-events", "none");

      simulation.on("tick", () => {
          link
              .attr("x1", (d: any) => d.source.x)
              .attr("y1", (d: any) => d.source.y)
              .attr("x2", (d: any) => d.target.x)
              .attr("y2", (d: any) => d.target.y);

          linkLabel
              .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
              .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

          node
              .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

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
  }, [filteredNodes, links]);

  return (
    <div className="h-[calc(100vh-80px)] flex relative bg-slate-50 overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-white p-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-2">
                <input 
                   type="text" 
                   placeholder="Search nodes..." 
                   className="text-xs border-none outline-none w-32"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="text-slate-400" />
            </div>
            
            <div className="bg-white p-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select 
                   value={filterPartition} 
                   onChange={(e) => setFilterPartition(e.target.value)}
                   className="text-xs border-none outline-none bg-transparent cursor-pointer"
                >
                    <option value="All">All Partitions</option>
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="SCI">SCI</option>
                    <option value="CJR">CJR</option>
                </select>
            </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
               onClick={handleConnect}
               disabled={loading}
               className="bg-white hover:bg-blue-50 text-blue-600 px-3 py-2 rounded-lg shadow-md border border-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
            >
               {loading ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />} 
               {loading ? t.connecting : t.connect}
            </button>
            <button 
               onClick={handleAddManualNote}
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg shadow-md text-xs font-bold flex items-center gap-2 transition-colors"
            >
               <Plus size={14} /> Note
            </button>
            <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={analyzingImage}
               className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-md text-xs font-bold flex items-center gap-2 transition-colors"
            >
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
               {analyzingImage ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />} 
               {analyzingImage ? t.analyzingImage : t.imageNote}
            </button>
        </div>

        {/* Graph Area */}
        <div ref={graphRef} className="flex-grow h-full bg-slate-50 cursor-grab active:cursor-grabbing">
            {nodes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Network size={48} className="mb-4 opacity-50" />
                    <p>{t.empty}</p>
                </div>
            )}
        </div>

        {/* Node Detail Sidebar */}
        {sidebarOpen && selectedNode && (
            <div className="w-96 bg-white border-l border-slate-200 h-full shadow-xl flex flex-col absolute right-0 z-20 animate-slideInRight">
                <div className="p-4 border-b border-slate-200 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${selectedNode.type === 'Paper' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {selectedNode.type}
                            </span>
                            {selectedNode.badges?.map((b: any, i: number) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                                    {b.type} {b.partition}
                                </span>
                            ))}
                        </div>
                        <input 
                           value={selectedNode.label}
                           onChange={(e) => {
                               const newLabel = e.target.value;
                               setSelectedNode({...selectedNode, label: newLabel});
                               setNodes(prev => prev.map(n => n.id === selectedNode.id ? {...n, label: newLabel} : n));
                           }}
                           className="font-bold text-lg text-slate-800 outline-none w-full border-b border-transparent focus:border-blue-500"
                        />
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                
                <div className="p-4 flex-grow overflow-y-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                        <Calendar size={12} /> {t.filter.time}: {selectedNode.addedDate}
                    </div>
                    
                    <textarea 
                       className="w-full h-[calc(100%-2rem)] resize-none outline-none text-sm text-slate-600 leading-relaxed p-2 border border-transparent focus:border-slate-200 rounded"
                       value={selectedNode.content}
                       onChange={(e) => {
                           const newContent = e.target.value;
                           setSelectedNode({...selectedNode, content: newContent});
                           setNodes(prev => prev.map(n => n.id === selectedNode.id ? {...n, content: newContent} : n));
                       }}
                       placeholder="Add notes or content here..."
                    />
                </div>
            </div>
        )}
    </div>
  );
};

export default KnowledgeGraph;
