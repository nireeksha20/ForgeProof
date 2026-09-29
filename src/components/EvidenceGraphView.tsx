import React, { useState, useEffect } from 'react';
import { 
  EvidenceGraphData, 
  EvidenceGraphNode, 
  MaintenanceTask 
} from '../types/veriwork';
import { 
  Share2, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Link2, 
  User, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  Info,
  ArrowRight
} from 'lucide-react';

interface EvidenceGraphViewProps {
  tasks: MaintenanceTask[];
  selectedTaskId: string;
  onSelectTaskId: (taskId: string) => void;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTaskId,
}) => {
  const [graphData, setGraphData] = useState<EvidenceGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<EvidenceGraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch graph for currently selected task
  useEffect(() => {
    async function loadGraph() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tasks/${selectedTaskId}/graph`);
        const json = await res.json();
        if (json.success && json.graph) {
          setGraphData(json.graph);
          // Set first node as selected by default
          if (json.graph.nodes.length > 0) {
            setSelectedNode(json.graph.nodes[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load graph:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGraph();
  }, [selectedTaskId]);

  // Compute node coordinates in a circular/hierarchical layout
  const positionedNodes = React.useMemo(() => {
    if (!graphData) return [];

    const nodes = [...graphData.nodes];
    const total = nodes.length;
    const centerX = 420;
    const centerY = 280;

    // Find center node (the task)
    const taskNode = nodes.find((n) => n.type === 'TASK');
    const otherNodes = nodes.filter((n) => n.type !== 'TASK');

    const result = [];
    if (taskNode) {
      result.push({ ...taskNode, x: centerX, y: centerY });
    }

    const radius = 210;
    otherNodes.forEach((node, i) => {
      const angle = (i / otherNodes.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      result.push({ ...node, x, y });
    });

    return result;
  }, [graphData]);

  const getNodeColor = (node: EvidenceGraphNode) => {
    if (node.isFlagged) return { stroke: '#f43f5e', fill: '#4c0519', text: '#fecdd3' }; // Rose
    switch (node.type) {
      case 'TASK':
        return { stroke: '#06b6d4', fill: '#083344', text: '#cffafe' }; // Cyan
      case 'ASSET':
        return { stroke: '#3b82f6', fill: '#172554', text: '#dbeafe' }; // Blue
      case 'TECHNICIAN':
        return { stroke: '#8b5cf6', fill: '#2e1065', text: '#ede9fe' }; // Purple
      case 'EVIDENCE':
        return { stroke: '#10b981', fill: '#022c22', text: '#d1fae5' }; // Emerald
      case 'COMMITMENT':
        return { stroke: '#a855f7', fill: '#3b0764', text: '#f3e8ff' }; // Purple
      case 'VERIFICATION':
        return { stroke: '#eab308', fill: '#422006', text: '#fef08a' }; // Amber
      case 'ALERT':
        return { stroke: '#ef4444', fill: '#450a0a', text: '#fee2e2' }; // Red
      default:
        return { stroke: '#64748b', fill: '#0f172a', text: '#f1f5f9' };
    }
  };

  const currentTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Task Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
              Evidence Lineage & Relationship Graph
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual forensic exploration of technician attestations, physical artifacts, cross-task replay links, and MST commitments.
          </p>
        </div>

        {/* Task Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <span className="text-slate-400 px-2">Focus Task:</span>
          <select
            value={selectedTaskId}
            onChange={(e) => onSelectTaskId(e.target.value)}
            className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer pr-2"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                {t.id}: {t.title.slice(0, 32)}... ({t.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-[#070b12] p-4 relative overflow-hidden shadow-2xl min-h-[580px] flex flex-col justify-between">
          
          {/* Top Canvas Controls */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-cyan-300 font-semibold">{currentTask.id}</span>
              <span>·</span>
              <span>Nodes: {graphData?.nodes.length || 0}</span>
              <span>·</span>
              <span>Edges: {graphData?.edges.length || 0}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-400">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 ml-1"
                title="Reset View"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* SVG Visualizer */}
          <div className="w-full flex-1 flex items-center justify-center overflow-auto my-2">
            {isLoading ? (
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Computing Evidence Graph Topology...</span>
              </div>
            ) : (
              <svg
                viewBox="0 0 840 560"
                className="w-full h-[520px] transition-transform duration-200 select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <defs>
                  {/* Standard edge marker */}
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="20"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#475569" />
                  </marker>

                  {/* Warning edge marker */}
                  <marker
                    id="arrowhead-warning"
                    markerWidth="9"
                    markerHeight="7"
                    refX="22"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 9 3.5, 0 7" fill="#f43f5e" />
                  </marker>
                </defs>

                {/* Edges */}
                {graphData?.edges.map((edge) => {
                  const sourceNode = positionedNodes.find((n) => n.id === edge.source);
                  const targetNode = positionedNodes.find((n) => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const isWarning = edge.isWarning;

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isWarning ? '#f43f5e' : '#334155'}
                        strokeWidth={isWarning ? 2.5 : 1.5}
                        strokeDasharray={edge.isDashed || isWarning ? '5,4' : undefined}
                        className={isWarning ? 'animate-pulse' : ''}
                        markerEnd={isWarning ? 'url(#arrowhead-warning)' : 'url(#arrowhead)'}
                      />
                      {/* Edge Label text */}
                      <text
                        x={(sourceNode.x + targetNode.x) / 2}
                        y={(sourceNode.y + targetNode.y) / 2 - 6}
                        fill={isWarning ? '#fda4af' : '#64748b'}
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="bg-black/60 px-1"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {positionedNodes.map((node) => {
                  const colors = getNodeColor(node);
                  const isSelected = selectedNode?.id === node.id;
                  const isCentral = node.type === 'TASK';
                  const radius = isCentral ? 38 : 28;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      {/* Outer selection ring */}
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 6}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="4,3"
                        />
                      )}

                      {/* Main node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={node.isFlagged ? 3 : 2}
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                      />

                      {/* Flagged warning badge */}
                      {node.isFlagged && (
                        <circle
                          cx={node.x + radius - 4}
                          cy={node.y - radius + 4}
                          r="7"
                          fill="#ef4444"
                          stroke="#000"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Node Label inside/below */}
                      <text
                        x={node.x}
                        y={node.y + 4}
                        fill={colors.text}
                        fontSize={isCentral ? '11' : '10'}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        {node.label.length > 14 ? node.label.slice(0, 12) + '..' : node.label}
                      </text>

                      {/* Subtitle below circle */}
                      <text
                        x={node.x}
                        y={node.y + radius + 15}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {node.type}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Bottom Legend */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2 z-10">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Task Claim</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Physical Asset</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Technician</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Evidence Package</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Reused / Flagged</span>
            </div>
            <span className="font-mono text-cyan-400">Click any node to inspect metadata</span>
          </div>

        </div>

        {/* Selected Node Inspection Drawer */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display text-sm font-bold text-white">
              Node Forensic Inspector
            </h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                  Type: {selectedNode.type}
                </span>
                <div className="text-base font-bold text-slate-100">
                  {selectedNode.label}
                </div>
                {selectedNode.subtitle && (
                  <div className="text-xs text-slate-300 mt-1 font-mono">
                    {selectedNode.subtitle}
                  </div>
                )}
              </div>

              {selectedNode.isFlagged && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>⚠️ REPLAY / FRAUD ALERT</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This evidence artifact has identical hash fingerprint matches in historical maintenance claims. Potential duplicate or cross-task replay attack.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                  <span>Graph Node ID</span>
                  <span className="font-mono text-slate-200">{selectedNode.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                  <span>Context Task</span>
                  <span className="font-mono text-cyan-300">{currentTask.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                  <span>MST Status</span>
                  <span className="font-mono text-purple-300">
                    {currentTask.blockchainCommitment ? 'Anchored' : 'Pending'}
                  </span>
                </div>
              </div>

              {selectedNode.type === 'TASK' && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Task Problem:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-950/70 p-2.5 rounded border border-slate-800">
                    {currentTask.description}
                  </p>
                </div>
              )}

              {selectedNode.type === 'ALERT' && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const conflictTask = selectedNode.id.replace('conflict-', '');
                      onSelectTaskId(conflictTask);
                    }}
                    className="w-full py-2 bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Switch to Conflicting Task</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Select a node in the graph to inspect its relationship manifest.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
