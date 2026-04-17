import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  Share2, 
  Code, 
  Activity, 
  Zap, 
  Cpu, 
  Shield, 
  Target, 
  Layers, 
  Server,
  Terminal,
  MousePointer2,
  Network
} from 'lucide-react';

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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Statistics Calculation
  const stats = useMemo(() => {
    return {
      activeAgents: orchestrationNodes.filter(n => n.status === 'running' || n.status === 'active').length,
      completedTasks: orchestrationNodes.filter(n => n.status === 'completed').length,
      totalTools: mcpTools.length,
      avgLatency: '42ms'
    };
  }, [orchestrationNodes, mcpTools]);

  return (
    <motion.div 
      key="orchestration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col bg-zinc-950/50"
    >
      <div className="p-8 border-b border-zinc-800 bg-zinc-900/20 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 ring-4 border-zinc-950 ring-indigo-500/10">
            <Network size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-zinc-100 tracking-tight">Orchestration Engine</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Neural Multi-Agent Coordination</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 px-6 py-2 bg-zinc-900/50 rounded-2xl border border-zinc-800 mr-4">
            <div className="text-center">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Active</div>
              <div className="text-sm font-black text-indigo-400">{stats.activeAgents}</div>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div className="text-center">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Resolved</div>
              <div className="text-sm font-black text-green-500">{stats.completedTasks}</div>
            </div>
          </div>
          <button 
            onClick={() => {
              setOrchestrationNodes([{ id: 'lead', name: 'Lead Agent', type: 'lead', status: 'idle', pos: { x: 50, y: 50 } }]);
              setOrchestrationEdges([]);
              setOrchestrationLogs([]);
            }}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl border border-zinc-800 transition-all"
            title="Reset Engine View"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="p-8 pb-32 max-w-7xl mx-auto w-full space-y-8">
        {/* Visual Graph View */}
        <div className="relative w-full h-[600px] bg-[#020202] border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl group/graph">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: 'radial-gradient(circle, #3f3f46 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }} />
          
          <div className="absolute inset-0 p-12">
            {/* Dynamic Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead-pro" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orientation="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
              </defs>
              {orchestrationEdges.map((edge, i) => {
                const from = orchestrationNodes.find(n => n.id === edge.source || n.id === edge.from);
                const to = orchestrationNodes.find(n => n.id === edge.target || n.id === edge.to);
                if (!from || !to) return null;
                
                return (
                  <motion.line 
                    key={i}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    x1={`${from.pos.x}%`} 
                    y1={`${from.pos.y}%`} 
                    x2={`${to.pos.x}%`} 
                    y2={`${to.pos.y}%`} 
                    stroke={edge.status === 'active' || from.status === 'running' ? '#6366f1' : '#18181b'} 
                    strokeWidth="2" 
                    strokeDasharray={from.status === 'running' ? '0' : '4 4'}
                    markerEnd="url(#arrowhead-pro)"
                  />
                );
              })}
            </svg>

            {/* Dynamic Nodes */}
            {orchestrationNodes.map((node) => (
              <motion.div 
                key={node.id}
                layoutId={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  position: 'absolute', 
                  left: `${node.pos.x}%`, 
                  top: `${node.pos.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center gap-2 shadow-2xl transition-all z-10 cursor-pointer ${
                  node.status === 'running' ? 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/40 scale-110 ring-8 ring-indigo-500/5' : 
                  node.status === 'completed' ? 'bg-green-600/10 border-green-500 shadow-green-500/20' :
                  node.status === 'error' ? 'bg-red-600/20 border-red-500 shadow-red-500/20' :
                  'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className={`p-3 rounded-full transition-colors ${
                  node.status === 'running' ? 'text-indigo-400' : 
                  node.status === 'completed' ? 'text-green-400' : 'text-zinc-500'
                }`}>
                  {node.type === 'lead' ? <Cpu size={28} /> : 
                   node.type === 'step' ? <Target size={24} /> : <Code size={24} />}
                </div>
                <div className="text-center px-4 overflow-hidden w-full">
                  <div className="text-[10px] font-black text-zinc-100 truncate">{node.name}</div>
                  <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{node.type}</div>
                </div>

                {node.status === 'running' && (
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-20" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Node Details Overlay */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-8 top-8 w-64 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl pointer-events-none"
              >
                <h4 className="text-sm font-black text-white mb-2">Node Inspection</h4>
                <div className="space-y-3">
                   <div className="flex justify-between text-[10px]">
                     <span className="text-zinc-500 uppercase font-bold">Status</span>
                     <span className="text-indigo-400 font-black">{orchestrationNodes.find(n => n.id === hoveredNode)?.status}</span>
                   </div>
                   <div className="flex justify-between text-[10px]">
                     <span className="text-zinc-500 uppercase font-bold">Type</span>
                     <span className="text-zinc-300 font-black">{orchestrationNodes.find(n => n.id === hoveredNode)?.type}</span>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Console and Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Neural Logs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Terminal size={14} className="text-indigo-500" /> Neural Execution Logs
              </h4>
              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[8px] font-black rounded uppercase">Live Feed</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] p-6 h-[400px] overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-3 shadow-inner backdrop-blur-sm">
              {orchestrationLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <Activity size={48} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">Awaiting Impulse</p>
                </div>
              )}
              {orchestrationLogs.map((log, i) => (
                <div key={i} className="flex gap-4 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30 group hover:border-indigo-500/20 transition-all">
                  <span className="text-zinc-600 font-bold shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <div className="space-y-1">
                    <span className="text-indigo-400 font-black uppercase text-[9px] tracking-widest block">System Event</span>
                    <span className="text-zinc-300 leading-relaxed">{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tools */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <Layers size={14} className="text-indigo-500" /> Loaded MCP Capabilities
            </h4>
            <div className="space-y-3">
              {mcpTools.slice(0, 8).map((tool, i) => (
                <motion.div 
                  key={tool.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl group hover:bg-zinc-900/50 transition-all cursor-default"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-indigo-400 transition-colors border border-zinc-800">
                      <Shield size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-zinc-200">{tool.name}</div>
                      <div className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Secured Core</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
