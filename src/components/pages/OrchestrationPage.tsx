import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Share2, Code, Activity, Zap } from 'lucide-react';

interface OrchestrationPageProps {
  orchestrationNodes: any[];
  orchestrationEdges: any[];
  orchestrationLogs: any[];
  setOrchestrationNodes: (nodes: any[]) => void;
  setOrchestrationEdges: (edges: any[]) => void;
  setOrchestrationLogs: (logs: any[]) => void;
  mcpTools: any[];
}

export function OrchestrationPage({
  orchestrationNodes,
  orchestrationEdges,
  orchestrationLogs,
  setOrchestrationNodes,
  setOrchestrationEdges,
  setOrchestrationLogs,
  mcpTools
}: OrchestrationPageProps) {
  return (
    <motion.div 
      key="orchestration"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-100">Agent Orchestration</h3>
          <p className="text-xs text-zinc-500">Visualize agent delegation and tool usage</p>
        </div>
        <button 
          onClick={() => {
            setOrchestrationNodes([]);
            setOrchestrationEdges([]);
            setOrchestrationLogs([]);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
        >
          <RotateCcw size={14} /> Reset View
        </button>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-3xl aspect-video bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-inner">
          <div className="absolute inset-0 p-12">
            {/* Dynamic Nodes */}
            {orchestrationNodes.map((node) => (
              <motion.div 
                key={node.id}
                layoutId={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  position: 'absolute', 
                  left: `${node.pos.x}%`, 
                  top: `${node.pos.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 shadow-2xl transition-all z-10 ${
                  node.status === 'active' ? 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/20' : 
                  node.status === 'error' ? 'bg-red-600/20 border-red-500 shadow-red-500/20' :
                  'bg-zinc-800 border-zinc-700 shadow-black/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${node.status === 'active' ? 'text-indigo-400' : 'text-zinc-500'}`}>
                  {node.type === 'lead' ? <Share2 size={24} /> : <Code size={20} />}
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{node.type}</div>
                  <div className="text-[11px] font-bold text-zinc-200 truncate px-2">{node.name}</div>
                </div>
                {node.status === 'active' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
                )}
              </motion.div>
            ))}

            {/* Dynamic Edges (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orientation="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3f3f46" />
                </marker>
              </defs>
              {orchestrationEdges.map((edge, i) => {
                const from = orchestrationNodes.find(n => n.id === edge.from);
                const to = orchestrationNodes.find(n => n.id === edge.to);
                if (!from || !to) return null;
                return (
                  <motion.line 
                    key={i}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    x1={`${from.pos.x}%`} 
                    y1={`${from.pos.y}%`} 
                    x2={`${to.pos.x}%`} 
                    y2={`${to.pos.y}%`} 
                    stroke={edge.status === 'active' ? '#6366f1' : '#3f3f46'} 
                    strokeWidth={edge.status === 'active' ? '2' : '1'} 
                    strokeDasharray={edge.status === 'active' ? '0' : '4 4'}
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>
          </div>
        </div>
        <div className="mt-8 w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> Live Activity Log
            </h4>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 h-56 overflow-y-auto font-mono text-[10px] space-y-2 shadow-inner">
              {orchestrationLogs.length === 0 && <div className="text-zinc-700 italic">Waiting for agent activity...</div>}
              {orchestrationLogs.map((log, i) => (
                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left duration-300">
                  <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                  <span className={`font-bold ${
                    log.type === 'delegate' ? 'text-indigo-400' : 
                    log.type === 'tool' ? 'text-yellow-400' : 
                    'text-zinc-400'
                  }`}>{log.type}</span>
                  <span className="text-zinc-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} /> Active Tool Usage
            </h4>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 h-56 overflow-y-auto space-y-3 shadow-inner">
              {mcpTools.slice(0, 5).map(tool => (
                <div key={tool.name} className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center text-zinc-500">
                      <Code size={14} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-200">{tool.name}</div>
                      <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Active</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-indigo-400">12 calls</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
