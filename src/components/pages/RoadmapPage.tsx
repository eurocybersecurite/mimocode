import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface RoadmapPageProps {
  roadmapPhases?: any[];
}

export function RoadmapPage({ roadmapPhases }: RoadmapPageProps) {
  const phases = roadmapPhases || [
    { 
      title: 'Phase 1: Foundation & Orchestration', 
      date: 'Q1 2026', 
      status: 'completed', 
      desc: 'Initial release with core agent orchestration, terminal interface, and MCP protocol support.',
      features: ['Expert Agent Delegation', 'MCP Tool Integration', 'Real-time Terminal', 'Basic Skill Discovery']
    },
    { 
      title: 'Phase 2: Collaborative Ecosystem', 
      date: 'Q2 2026', 
      status: 'in-progress', 
      desc: 'Community-driven agent sharing, advanced skill discovery, and collaborative workspaces.',
      features: ['Agent Marketplace', 'Skill Versioning', 'Multi-user Sessions', 'Advanced Git Integration']
    },
    { 
      title: 'Phase 3: Enterprise MCP & Security', 
      date: 'Q3 2026', 
      status: 'planned', 
      desc: 'Advanced MCP server management, secure data connectors, and enterprise-grade access controls.',
      features: ['Secure Data Connectors', 'RBAC for Agents', 'Audit Logging', 'Private MCP Servers']
    },
    { 
      title: 'Phase 4: Autonomous DevOps', 
      date: 'Q4 2026', 
      status: 'planned', 
      desc: 'Self-healing deployments, automated CI/CD pipeline optimization, and predictive scaling.',
      features: ['Self-healing Deployments', 'AI-driven CI/CD', 'Predictive Resource Scaling', 'Automated Testing']
    }
  ];

  return (
    <motion.div 
      key="roadmap"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 p-8 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">Strategic Roadmap</h2>
          <p className="text-zinc-500 text-sm">Our vision for the future of autonomous software engineering</p>
        </div>
        
        <div className="grid grid-cols-1 gap-12 relative">
          <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-zinc-800 to-zinc-900" />
          
          {phases.map((step, i) => (
            <div key={i} className="relative pl-16 group">
              <div className={`absolute left-0 top-0 w-11 h-11 rounded-full border-4 border-zinc-950 flex items-center justify-center z-10 transition-all duration-500 ${
                step.status === 'completed' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 
                step.status === 'in-progress' ? 'bg-indigo-500 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 
                'bg-zinc-800'
              }`}>
                {step.status === 'completed' ? <Check size={20} className="text-white" /> : <div className="w-2 h-2 bg-white/50 rounded-full" />}
              </div>
              
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl group-hover:border-zinc-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{step.date}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      step.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                      step.status === 'in-progress' ? 'bg-indigo-500/10 text-indigo-500' : 
                      'bg-zinc-800 text-zinc-500'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-3">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">{step.desc}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {step.features.map((f: any, fi: number) => (
                    <div key={fi} className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <div className={`w-1 h-1 rounded-full ${step.status === 'completed' ? 'bg-green-500' : 'bg-zinc-700'}`} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
