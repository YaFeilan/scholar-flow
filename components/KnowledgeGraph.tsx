
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Network, Plus, Share2, Filter, Search, FileText, Image as ImageIcon, Loader2, X, Maximize2, Minimize2, Calendar, Layout, Link as LinkIcon, ArrowRight, Tag, Sparkles, MessageCircle, Send, Play, Terminal, FileCode, Edit3, Eye, Star } from 'lucide-react';
import { GraphNode, GraphLink, Language } from '../types';
import { generateKnowledgeGraph, analyzeImageNote, chatWithKnowledgeGraph, generateGraphSuggestions, deepParsePDF, runCodeSimulation, findRelevantNodes } from '../services/geminiService';
import { TRANSLATIONS } from '../translations';
import { MOCK_PAPERS } from '../constants';
import ReactMarkdown from 'react-markdown';

interface KnowledgeGraphProps {
  language: Language;
}

// Internal Code Block Component for Execution
const CodeBlock = ({ language, value, onRun }: { language: string, value: string, onRun: (code: string) => Promise<string> }) => {
    const [output, setOutput] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        const result = await onRun(value);
        setOutput(result);
        setLoading(false);
    };

    return (
        <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-sm relative group">
            <div className="flex justify-between items-center px-3 py-1.5 bg-slate-800 text-xs text-slate-400 border-b border-slate-700">
                <span className="font-mono">{language || 'code'}</span>
                <button 
                    onClick={handleRun}
                    disabled={loading}
                    className="flex items-center gap-1 hover:text-green-400 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    {loading ? 'Running...' : 'Run'}
                </button>
            </div>
            <pre className="p-3 overflow-x-auto text-xs font-mono text-slate-200">
                <code>{value}</code>
            </pre>
            {output && (
                <div className="border-t border-slate-700 bg-black p-3 font-mono text-xs text-green-400">
                    <div className="flex items-center gap-2 mb-1 text-slate-500 uppercase font-bold text-[10px]">
                        <Terminal size={10} /> Output
                    </div>
                    <div className="whitespace-pre-wrap">{output}</div>
                </div>
            )}
        </div>
    );
};

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ language }) => {
  const t = TRANSLATIONS[language].knowledge;
  
  // Graph State
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  
  // AI Suggestions State
  const [suggestedNodes, setSuggestedNodes] = useState<GraphNode[]>([]);
  const [suggestedLinks, setSuggestedLinks] = useState<GraphLink[]>([]);
  const [suggestionsMode, setSuggestionsMode] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const graphRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [parsingPDF, setParsingPDF] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editMode, setEditMode] = useState(false); // Toggle Edit vs Preview for nodes

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State (RAG)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartition, setFilterPartition] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All'); // 'All', '2024', '2023', 'Older'
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [semanticSearchIds, setSemanticSearchIds] = useState<string[] | null>(null);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  
  // Helper: Assign Groups for Clustering
  const assignGroups = (nodeList: GraphNode[]): GraphNode[] => {
      return nodeList.map(n => {
          let group = 'Uncategorized';
          if (n.type === 'Note') {
              group = 'Personal Notes';
          } else if (n.badges && n.badges.length > 0) {
              // Group by highest partition or type
              const badge = n.badges.find(b => b.partition) || n.badges[0];
              group = badge.partition ? `${badge.type} ${badge.partition}` : badge.type;
          } else {
              // Keyword-based clustering for mock data without badges
              const title = n.label.toLowerCase();
              if (title.includes('hierarchical') || title.includes('ensemble')) group = 'Ensemble Learning';
              else if (title.includes('quantum') || title.includes('physics')) group = 'Quantum AI';
              else if (title.includes('medical') || title.includes('biomedical')) group = 'Healthcare';
              else group = 'General AI';
          }
          return { ...n, group };
      });
  };

  // Initialize with some mock data if empty (for demo)
  useEffect(() => {
      if (nodes.length === 0) {
          const initialNodes: GraphNode[] = MOCK_PAPERS.map(p => ({
              id: p.id,
              label: p.title,
              type: 'Paper',
              content: p.abstract,
              addedDate: p.addedDate || new Date().toISOString().split('T')[0],
              year: p.year,
              badges: p.badges,
              isStarred: false
          }));
          setNodes(assignGroups(initialNodes));
          
          // Add some mock links for demonstration of "Explicit Relationships"
          const mockLinks: GraphLink[] = [
              { source: '1', target: '2', label: 'Evolved To' },
              { source: '1', target: '3', label: 'Inspired' },
              { source: '2', target: '4', label: 'Explained By' },
              { source: '5', target: '1', label: 'Compares With' }
          ];
          setLinks(mockLinks);
      }
  }, []);

  // Filter Logic
  const filteredNodes = useMemo(() => {
      const realNodes = nodes.filter(n => {
          // 1. Semantic Filter
          if (semanticSearchIds !== null) {
              return semanticSearchIds.includes(n.id);
          }

          // 2. Standard Filters
          // Text Search: Check Label AND Content
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = n.label.toLowerCase().includes(searchLower) || (n.content && n.content.toLowerCase().includes(searchLower));
          
          // Partition Filter
          const matchesPartition = filterPartition === 'All' || 
              (n.badges && n.badges.some(b => b.type === 'SCI' || b.type === 'CJR' || b.partition === filterPartition));
          
          // Year Filter
          let matchesYear = true;
          if (filterYear !== 'All' && n.year) {
              if (filterYear === 'Older') matchesYear = n.year < 2022;
              else matchesYear = n.year === parseInt(filterYear);
          }

          // Starred Filter
          const matchesStar = !onlyStarred || n.isStarred;

          return matchesSearch && matchesPartition && matchesYear && matchesStar;
      });
      // Append suggested nodes if mode is active (and not searching semantically)
      return (suggestionsMode && semanticSearchIds === null) ? [...realNodes, ...suggestedNodes] : realNodes;
  }, [nodes, searchTerm, filterPartition, filterYear, onlyStarred, suggestionsMode, suggestedNodes, semanticSearchIds]);

  const activeLinks = useMemo(() => {
      // Filter links to only include those where both source and target exist in filteredNodes
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const realLinks = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
      // Append suggested links if mode is active AND nodes exist (handling ghost-to-ghost or real-to-ghost)
      const suggestions = suggestionsMode ? suggestedLinks.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target)) : [];
      return [...realLinks, ...suggestions];
  }, [links, filteredNodes, suggestionsMode, suggestedLinks]);

  // Determine Related Links for Selected Node (Bidirectional)
  const relatedLinks = useMemo(() => {
      if (!selectedNode) return [];
      return activeLinks.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).map(l => {
          const isSource = l.source === selectedNode.id;
          const otherId = isSource ? l.target : l.source;
          const otherNode = filteredNodes.find(n => n.id === otherId);
          return {
              ...l,
              direction: isSource ? 'Outgoing' : 'Incoming',
              otherNode
          };
      });
  }, [selectedNode, activeLinks, filteredNodes]);

  // AI Connection (Existing Feature)
  const handleConnect = async () => {
      if (nodes.length < 2) return;
      setLoading(true);
      const newLinks = await generateKnowledgeGraph(nodes, language);
      if (newLinks) {
          setLinks(prev => {
              const combined = [...prev, ...newLinks];
              const unique = Array.from(new Set(combined.map(l => `${l.source}-${l.target}`)))
                  .map(key => combined.find(l => `${l.source}-${l.target}` === key)!);
              return unique;
          });
      }
      setLoading(false);
  };

  // AI Suggestions (New Feature)
  const handleGenerateSuggestions = async () => {
      if (nodes.length < 2) return;
      setLoadingSuggestions(true);
      setSuggestionsMode(true);
      
      const result = await generateGraphSuggestions(nodes, language);
      if (result) {
          // Add ghost nodes
          const ghostNodes = result.recommendedNodes.map(n => ({ ...n, isSuggestion: true, group: 'Suggestion' }));
          setSuggestedNodes(ghostNodes);
          
          // Add ghost links
          const ghostLinks = result.suggestedLinks.map(l => ({ ...l, isSuggestion: true }));
          setSuggestedLinks(ghostLinks);
      }
      setLoadingSuggestions(false);
  };

  const handleAcceptNode = (node: GraphNode) => {
      const realNode = { ...node, isSuggestion: false, group: 'New Research' };
      setNodes(prev => [...prev, realNode]);
      setSuggestedNodes(prev => prev.filter(n => n.id !== node.id));
      
      const connectedLinks = suggestedLinks.filter(l => l.source === node.id || l.target === node.id);
      const realLinks = connectedLinks.map(l => ({ ...l, isSuggestion: false }));
      setLinks(prev => [...prev, ...realLinks]);
      setSuggestedLinks(prev => prev.filter(l => l.source !== node.id && l.target !== node.id));
      
      setSelectedNode(realNode);
  };

  const handleAcceptLink = (link: GraphLink) => {
      const realLink = { ...link, isSuggestion: false };
      setLinks(prev => [...prev, realLink]);
      setSuggestedLinks(prev => prev.filter(l => !(l.source === link.source && l.target === link.target)));
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
              addedDate: new Date().toISOString().split('T')[0],
              group: 'Personal Notes'
          };
          
          setNodes(prev => [...prev, newNode]);
          setAnalyzingImage(false);
          setSidebarOpen(true);
          setSelectedNode(newNode);
      }
  };

  const handlePDFParsing = async (file: File) => {
      setParsingPDF(true);
      const result = await deepParsePDF(file, language);
      if (result) {
          const parentId = `paper-${Date.now()}`;
          const parentNode: GraphNode = {
              id: parentId,
              label: file.name.replace('.pdf', ''),
              type: 'Paper',
              content: result.summary,
              addedDate: new Date().toISOString().split('T')[0],
              year: new Date().getFullYear(),
              group: 'Deep Parsed'
          };
          
          const childNodes: GraphNode[] = result.elements.map((el, idx) => ({
              id: `${parentId}-c${idx}`,
              label: el.label,
              type: 'Concept', // Using 'Concept' to represent Formula/Algo/Chart
              content: `**Type:** ${el.type}\n\n${el.content}`,
              addedDate: new Date().toISOString().split('T')[0],
              year: new Date().getFullYear(),
              group: el.type
          }));
          
          const childLinks: GraphLink[] = childNodes.map(child => ({
              source: parentId,
              target: child.id,
              label: 'Contains'
          }));

          setNodes(prev => [...prev, parentNode, ...childNodes]);
          setLinks(prev => [...prev, ...childLinks]);
          setSelectedNode(parentNode);
          setSidebarOpen(true);
      }
      setParsingPDF(false);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
          handlePDFParsing(file);
      } else {
          // Handle image or generic note if needed
      }
  };

  const handleAddManualNote = () => {
      const newNode: GraphNode = {
          id: `note-${Date.now()}`,
          label: language === 'ZH' ? '新笔记' : 'New Note',
          type: 'Note',
          content: '',
          addedDate: new Date().toISOString().split('T')[0],
          group: 'Personal Notes'
      };
      setNodes(prev => [...prev, newNode]);
      setSelectedNode(newNode);
      setSidebarOpen(true);
      setEditMode(true); // Auto-edit new notes
  };

  const handleSemanticSearch = async () => {
      if (!searchTerm.trim()) return;
      setIsSemanticSearching(true);
      const ids = await findRelevantNodes(searchTerm, nodes, language);
      setSemanticSearchIds(ids.length > 0 ? ids : []);
      setIsSemanticSearching(false);
  };

  const clearSearch = () => {
      setSearchTerm('');
      setSemanticSearchIds(null);
  };

  const toggleStar = (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isStarred: !n.isStarred } : n));
      // Update selected node state if it's the one being toggled
      if (selectedNode && selectedNode.id === nodeId) {
          setSelectedNode(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
      }
  };

  const handleChatSubmit = async () => {
      if (!chatInput.trim()) return;
      const q = chatInput;
      setChatInput('');
      setChatHistory(prev => [...prev, { role: 'user', text: q }]);
      setChatLoading(true);
      
      // Pass visible nodes as context
      await chatWithKnowledgeGraph(q, nodes, language, (partial) => {
          // Optional streaming update logic if supported by UI component
      }).then(res => {
          setChatHistory(prev => [...prev, { role: 'ai', text: res }]);
          setChatLoading(false);
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
  };

  // Run Code
  const handleRunCode = async (code: string) => {
      return await runCodeSimulation(code, language);
  };

  // D3 Effect
  useEffect(() => {
      if (!graphRef.current || filteredNodes.length === 0) {
          // Clear if no nodes to prevent ghosting
          if (graphRef.current) d3.select(graphRef.current).selectAll("*").remove();
          return;
      }
      
      const width = graphRef.current.clientWidth;
      const height = graphRef.current.clientHeight;
      const container = d3.select(graphRef.current);
      container.selectAll("*").remove();

      const svg = container.append("svg")
          .attr("width", "100%")
          .attr("height", "100%")
          .attr("viewBox", [0, 0, width, height]);

      // Color Scale for Clustering
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Simulation
      const simulation = d3.forceSimulation(filteredNodes as any)
          .force("link", d3.forceLink(activeLinks).id((d: any) => d.id).distance(200)) 
          .force("charge", d3.forceManyBody().strength(-400))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide().radius(50));

      // Arrow Marker
      svg.append("defs").append("marker")
          .attr("id", "arrow")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 32) // Adjusted for node radius
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", "#94a3b8");

      const link = svg.append("g")
          .attr("stroke-opacity", 0.8)
          .selectAll("line")
          .data(activeLinks)
          .join("line")
          .attr("stroke", d => d.isSuggestion ? "#fbbf24" : "#cbd5e1") // Yellow for suggestions
          .attr("stroke-width", d => d.isSuggestion ? 2 : 1.5)
          .attr("stroke-dasharray", d => d.isSuggestion ? "5,5" : "0")
          .attr("marker-end", "url(#arrow)")
          .attr("cursor", d => d.isSuggestion ? "pointer" : "default")
          .on("click", (event, d) => {
              if (d.isSuggestion) handleAcceptLink(d as GraphLink);
          });

      // Edge Labels
      const linkLabelGroup = svg.append("g")
          .selectAll("g")
          .data(activeLinks)
          .join("g")
          .attr("class", "link-label-group");

      linkLabelGroup.append("rect")
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("fill", d => d.isSuggestion ? "#fffbeb" : "white")
          .attr("fill-opacity", 0.9)
          .attr("stroke", d => d.isSuggestion ? "#fbbf24" : "#e2e8f0")
          .attr("stroke-width", 1);

      linkLabelGroup.append("text")
          .text(d => d.label)
          .attr("font-size", 9)
          .attr("fill", d => d.isSuggestion ? "#d97706" : "#475569")
          .attr("text-anchor", "middle")
          .attr("dy", 3)
          .attr("font-weight", "bold");

      linkLabelGroup.each(function() {
          const g = d3.select(this);
          const t = g.select("text");
          const bbox = (t.node() as SVGTextElement).getBBox();
          g.select("rect")
             .attr("x", -bbox.width/2 - 6)
             .attr("y", -bbox.height/2 - 2)
             .attr("width", bbox.width + 12)
             .attr("height", bbox.height + 4);
      });

      const node = svg.append("g")
          .selectAll("g")
          .data(filteredNodes)
          .join("g")
          .attr("cursor", "pointer")
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended) as any)
          .on("click", (event, d) => {
              if (d.isSuggestion) {
                  // Optional: Direct accept or just show details
                  setSelectedNode(d as GraphNode);
                  setSidebarOpen(true);
              } else {
                  setSelectedNode(d as GraphNode);
                  setSidebarOpen(true);
                  setEditMode(false);
              }
          });

      // Node Circle
      node.append("circle")
          .attr("r", 24)
          .attr("fill", d => d.isSuggestion ? "#fff" : (d.type === 'Note' ? '#10b981' : colorScale(d.group || 'Other')))
          .attr("stroke", (d: any) => d.isSuggestion ? "#fbbf24" : (d.isStarred ? "#fbbf24" : "#fff"))
          .attr("stroke-width", (d: any) => d.isSuggestion ? 2 : (d.isStarred ? 4 : 3))
          .attr("stroke-dasharray", d => d.isSuggestion ? "4,2" : "0")
          .attr("opacity", d => d.isSuggestion ? 0.8 : 1);

      node.append("text")
          .attr("dy", 5)
          .attr("text-anchor", "middle")
          .attr("fill", d => d.isSuggestion ? "#d97706" : "white")
          .attr("font-weight", "bold")
          .attr("font-size", 12)
          .text(d => d.isSuggestion ? '+' : (d.type === 'Paper' ? 'P' : 'N'));

      // Star Indicator
      node.each(function(d: any) {
          if (d.isStarred) {
              d3.select(this).append("text")
                  .text("★")
                  .attr("x", 15)
                  .attr("y", -15)
                  .attr("font-size", 16)
                  .attr("fill", "#fbbf24");
          }
      });

      node.append("text")
          .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
          .attr("dy", 40)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#334155")
          .attr("font-weight", "500")
          .style("pointer-events", "none")
          .style("text-shadow", "0 1px 2px white");

      simulation.on("tick", () => {
          link
              .attr("x1", (d: any) => d.source.x)
              .attr("y1", (d: any) => d.source.y)
              .attr("x2", (d: any) => d.target.x)
              .attr("y2", (d: any) => d.target.y);

          linkLabelGroup
              .attr("transform", (d: any) => {
                  const x = (d.source.x + d.target.x) / 2;
                  const y = (d.source.y + d.target.y) / 2;
                  return `translate(${x},${y})`;
              });

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
  }, [filteredNodes, activeLinks]);

  return (
    <div className="h-[calc(100vh-80px)] flex relative bg-slate-50 overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 max-w-[600px]">
            <div className="bg-white p-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-2">
                <input 
                   type="text" 
                   placeholder="Search..." 
                   className="text-xs border-none outline-none w-32"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                />
                {searchTerm && (
                    <button onClick={clearSearch} className="text-slate-400 hover:text-slate-600"><X size={12}/></button>
                )}
                {isSemanticSearching ? (
                    <Loader2 size={14} className="animate-spin text-purple-500" />
                ) : (
                    <button 
                       onClick={handleSemanticSearch} 
                       disabled={!searchTerm.trim()}
                       className="p-1 hover:bg-purple-100 rounded text-purple-500 transition-colors"
                       title="AI Semantic Search"
                    >
                        <Sparkles size={14} />
                    </button>
                )}
            </div>
            
            <div className="bg-white p-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select 
                   value={filterPartition} 
                   onChange={(e) => setFilterPartition(e.target.value)}
                   className="text-xs border-none outline-none bg-transparent cursor-pointer text-slate-600 font-medium w-20"
                >
                    <option value="All">All Part.</option>
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="SCI">SCI</option>
                </select>
                <div className="w-px h-3 bg-slate-200"></div>
                <select 
                   value={filterYear} 
                   onChange={(e) => setFilterYear(e.target.value)}
                   className="text-xs border-none outline-none bg-transparent cursor-pointer text-slate-600 font-medium w-16"
                >
                    <option value="All">All Time</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="Older">Older</option>
                </select>
                <div className="w-px h-3 bg-slate-200"></div>
                <button 
                   onClick={() => setOnlyStarred(!onlyStarred)}
                   className={`p-1 rounded transition-colors ${onlyStarred ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}
                   title="Show Starred Only"
                >
                    <Star size={14} fill={onlyStarred ? "currentColor" : "none"} />
                </button>
            </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
               onClick={handleConnect}
               disabled={loading}
               className="bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-lg shadow-md border border-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
            >
               {loading ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />} 
               {loading ? t.connecting : t.connect}
            </button>
            <button 
               onClick={handleGenerateSuggestions}
               disabled={loadingSuggestions}
               className={`px-4 py-2 rounded-lg shadow-md text-xs font-bold flex items-center gap-2 transition-colors
                  ${suggestionsMode ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white hover:bg-amber-50 text-amber-600 border border-slate-200'}
               `}
            >
               {loadingSuggestions ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} 
               {loadingSuggestions ? t.gettingSuggestions : t.suggestions}
            </button>
            <button 
               onClick={handleAddManualNote}
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md text-xs font-bold flex items-center gap-2 transition-colors"
            >
               <Plus size={14} /> Note
            </button>
            <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={analyzingImage}
               className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md text-xs font-bold flex items-center gap-2 transition-colors"
            >
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
               {analyzingImage ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />} 
               {analyzingImage ? t.analyzingImage : t.imageNote}
            </button>
        </div>

        {/* Graph Area */}
        <div 
            ref={graphRef} 
            className={`flex-grow h-full bg-slate-50 cursor-grab active:cursor-grabbing relative ${isDragOver ? 'bg-blue-50 border-4 border-blue-400 border-dashed m-4 rounded-xl' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <FileCode size={64} className="text-blue-500 mb-4 animate-bounce" />
                    <h3 className="text-2xl font-bold text-blue-600">Drop PDF to Deep Parse</h3>
                    <p className="text-blue-400">Extracts formulas, algorithms, and charts.</p>
                </div>
            )}
            
            {parsingPDF && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                    <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Analyzing Paper Structure...</h3>
                    <p className="text-slate-500">Extracting mathematical models and core concepts.</p>
                </div>
            )}

            {filteredNodes.length === 0 && !parsingPDF && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Network size={48} className="mb-4 opacity-50" />
                    <p>{searchTerm ? 'No matching nodes.' : t.empty}</p>
                    {searchTerm && semanticSearchIds && <p className="text-xs text-purple-500 mt-2">AI Search found no semantic matches.</p>}
                </div>
            )}
        </div>

        {/* RAG Chat Window */}
        <div className={`absolute bottom-4 right-4 z-20 flex flex-col items-end transition-all ${chatOpen ? 'w-96' : 'w-auto'}`}>
            {!chatOpen ? (
                <button 
                   onClick={() => setChatOpen(true)}
                   className="bg-slate-900 text-white p-4 rounded-full shadow-xl hover:bg-slate-800 transition-colors flex items-center gap-2 font-bold"
                >
                   <MessageCircle size={20} /> {t.chatTitle}
                </button>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full h-[500px] flex flex-col overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 p-1.5 rounded text-emerald-600"><Sparkles size={14} /></div>
                            <h4 className="font-bold text-slate-800 text-sm">{t.chatTitle}</h4>
                        </div>
                        <button onClick={() => setChatOpen(false)}><X size={16} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
                        {chatHistory.length === 0 && (
                            <div className="text-center text-slate-400 py-10 text-sm px-4">
                                <p>{t.chatWelcome}</p>
                            </div>
                        )}
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-xl p-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                                    <ReactMarkdown className="prose prose-sm max-w-none">{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none p-3 shadow-sm">
                                    <Loader2 size={16} className="animate-spin text-slate-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-slate-100 bg-white">
                        <div className="relative">
                            <input 
                               value={chatInput}
                               onChange={(e) => setChatInput(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                               placeholder={t.chatPlaceholder}
                               className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                            />
                            <button 
                               onClick={handleChatSubmit}
                               disabled={!chatInput.trim() || chatLoading}
                               className="absolute right-1.5 top-1.5 p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-50"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Node Detail Sidebar (Quick Preview) */}
        {sidebarOpen && selectedNode && (
            <div className="w-[500px] bg-white border-l border-slate-200 h-full shadow-2xl flex flex-col absolute right-0 z-20 animate-slideInRight">
                <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
                    <div className="flex-grow pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider 
                                ${selectedNode.isSuggestion ? 'bg-amber-100 text-amber-700' : selectedNode.type === 'Paper' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}
                            `}>
                                {selectedNode.isSuggestion ? 'AI Suggestion' : selectedNode.type}
                            </span>
                            {selectedNode.group && (
                                <span className="text-[10px] px-2 py-0.5 rounded border border-purple-200 text-purple-700 bg-purple-50 flex items-center gap-1 font-bold">
                                    <Tag size={10} /> {selectedNode.group}
                                </span>
                            )}
                            <button 
                               onClick={(e) => toggleStar(selectedNode.id, e)}
                               className={`ml-auto p-1 rounded hover:bg-slate-100 ${selectedNode.isStarred ? 'text-amber-500' : 'text-slate-300'}`}
                            >
                                <Star size={16} fill={selectedNode.isStarred ? "currentColor" : "none"} />
                            </button>
                        </div>
                        <input 
                           value={selectedNode.label}
                           onChange={(e) => {
                               const newLabel = e.target.value;
                               setSelectedNode({...selectedNode, label: newLabel});
                               setNodes(prev => prev.map(n => n.id === selectedNode.id ? {...n, label: newLabel} : n));
                           }}
                           className="font-bold text-xl text-slate-900 outline-none w-full bg-transparent border-b border-transparent focus:border-blue-300 transition-colors"
                        />
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 p-1.5 rounded hover:bg-slate-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-6">
                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                <Calendar size={12} /> Joined: {selectedNode.addedDate}
                            </div>
                            {selectedNode.year && (
                                <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    <Calendar size={12} /> Pub: {selectedNode.year}
                                </div>
                            )}
                            {selectedNode.badges?.map((b: any, i: number) => (
                                <span key={i} className="flex items-center gap-1.5 text-slate-600 border border-slate-200 px-2 py-1 rounded font-medium">
                                    {b.type} {b.partition && `• ${b.partition}`} {b.if && `• IF: ${b.if}`}
                                </span>
                            ))}
                        </div>

                        {/* Suggestion Reason */}
                        {selectedNode.isSuggestion && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h4 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-1">
                                    <Sparkles size={12} /> Why Recommended?
                                </h4>
                                <p className="text-sm text-amber-900 leading-relaxed">{selectedNode.reason || "AI identified this as a relevant topic extension."}</p>
                                <button 
                                   onClick={() => handleAcceptNode(selectedNode)}
                                   className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                   {t.acceptNode}
                                </button>
                            </div>
                        )}

                        {/* Explicit Relationships View */}
                        {relatedLinks.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <LinkIcon size={12} /> Connected Nodes
                                </h4>
                                <div className="space-y-2">
                                    {relatedLinks.map((link, i) => (
                                        <div key={i} className={`flex items-center justify-between text-sm p-2 rounded border ${link.isSuggestion ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${link.direction === 'Outgoing' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {link.direction === 'Outgoing' ? '→' : '←'}
                                                </span>
                                                <span className="font-bold text-slate-700">{link.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 max-w-[150px]">
                                                <span className="truncate">{link.otherNode?.label}</span>
                                                <button onClick={() => { if(link.otherNode) setSelectedNode(link.otherNode); }} className="hover:text-blue-600"><ArrowRight size={14}/></button>
                                            </div>
                                            {link.isSuggestion && (
                                                <button onClick={() => handleAcceptLink(link)} className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded hover:bg-amber-300">
                                                    Accept
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content / Notes */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={12} /> {selectedNode.type === 'Note' ? 'Note Content' : 'Abstract / Summary'}
                                </h4>
                                <div className="flex bg-slate-100 rounded-lg p-0.5">
                                    <button 
                                        onClick={() => setEditMode(true)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${editMode ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                                    >
                                        <Edit3 size={10} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => setEditMode(false)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${!editMode ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                                    >
                                        <Eye size={10} /> Preview
                                    </button>
                                </div>
                            </div>
                            
                            {editMode ? (
                                <textarea 
                                   className="w-full min-h-[300px] resize-none outline-none text-sm text-slate-700 leading-7 p-4 border border-slate-200 focus:border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-50 transition-all bg-white font-mono"
                                   value={selectedNode.content}
                                   onChange={(e) => {
                                       const newContent = e.target.value;
                                       setSelectedNode({...selectedNode, content: newContent});
                                       setNodes(prev => prev.map(n => n.id === selectedNode.id ? {...n, content: newContent} : n));
                                   }}
                                   placeholder="Add your notes, observations, or summary here..."
                                />
                            ) : (
                                <div className="w-full min-h-[300px] p-4 border border-slate-200 rounded-xl bg-white prose prose-sm max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            code({className, children, ...props}: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return match ? (
                                                    <CodeBlock 
                                                        language={match[1]} 
                                                        value={String(children).replace(/\n$/, '')} 
                                                        onRun={handleRunCode}
                                                    />
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {selectedNode.content || ''}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default KnowledgeGraph;