import React from 'react';
import { motion } from 'motion/react';
import { Check, Rocket, Users, Shield, Cpu, Sparkles, Zap, Code, Target, Globe } from 'lucide-react';

interface RoadmapPageProps {
  roadmapPhases?: any[];
}

export function RoadmapPage({ roadmapPhases }: RoadmapPageProps) {
  const phases = roadmapPhases?.length ? roadmapPhases : [
    { 
      title: 'Phase 1: Foundations of Autonomy', 
      date: 'Q1 2026', 
      status: 'completed', 
      icon: <Rocket size={20} />,
      desc: 'Building the bedrock of autonomous software engineering with multi-agent orchestration and specialized expert systems.',
      features: ['Lead Agent Orchestration', 'MCP Tool Ecosystem', 'Real-time Rich Terminal', 'Skill-Based Delegation', 'Automated File System Access']
    },
    { 
      title: 'Phase 2: Collaborative Intelligence', 
      date: 'Q2 2026', 
      status: 'in-progress', 
      icon: <Users size={20} />,
      desc: 'Moving from individual agents to collaborative swarms that can plan, execute, and verify complex architectural changes.',
      features: ['Multi-Agent Collaboration', 'Visual Action Timeline', 'Advanced Git/GitHub Sync', 'Skill Discovery & Refinement', 'Interactive Code Preview']
    },
    { 
      title: 'Phase 3: Cognitive Security & MCP+', 
      date: 'Q3 2026', 
      status: 'planned', 
      icon: <Shield size={20} />,
      desc: 'Integrating deep security audits and enterprise-grade protocol management for sensitive environments.',
      features: ['Autonomous Security Audits', 'Zero-Trust MCP Access', 'Enterprise Secret Management', 'RBAC for Agent Actions', 'Compliance Verification']
    },
    { 
      title: 'Phase 4: Self-Healing Ecosystem', 
      date: 'Q4 2026', 
      status: 'planned', 
      icon: <Cpu size={20} />,
      desc: 'Achieving the "Holy Grail" of DevOps: deployments that monitor, heal, and optimize themselves without human intervention.',
      features: ['Autonomous Incident Repair', 'AI-Driven CI/CD Pipelines', 'Predictive Resource Scaling', 'Automated Documentation Gen', 'Visual Roadmap Tracking']
    },
    { 
      title: 'Phase 5: Universal Connectivity', 
      date: '2027', 
      status: 'planned', 
      icon: <Globe size={20} />,
      desc: 'Expanding Mimocode to orchestrate entire cloud infrastructures and cross-platform mobile ecosystems.',
      features: ['Multi-Cloud Orchestration', 'Cross-Platform Automation', 'Unified Agent Protocol', 'Decentralized Intelligence', 'Human-AI Neural Pair Programming']
    }
  ];

  return (
    <motion.div 
      key="roadmap"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="relative overflow-hidden bg-indigo-600 rounded-[2rem] p-10 text-white shadow-2xl shadow-indigo-500/20">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-indigo-200" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Our Strategic Vision</span>
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">The Future of <br/>Autonomous Engineering</h2>
            <p className="text-indigo-100/80 max-w-2xl text-lg leading-relaxed">
              We are building more than a tool; we are crafting a digital workforce capable of designing, building, and maintaining the next generation of software with superhuman precision and speed.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
            <Target size={400} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
              <Check size={20} />
            </div>
            <div className="text-2xl font-bold text-zinc-100">85%</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Automation Velocity</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-4">
              <Zap size={20} />
            </div>
            <div className="text-2xl font-bold text-zinc-100">2.4ms</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Orchestration Latency</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <Code size={20} />
            </div>
            <div className="text-2xl font-bold text-zinc-100">12+</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Expert Agents Active</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-12 relative pt-8">
          <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-zinc-800 to-zinc-950" />
          
          {phases.map((step, i) => (
            <div key={i} className="relative pl-16 group">
              <div className={`absolute left-0 top-0 w-11 h-11 rounded-full border-4 border-zinc-950 flex items-center justify-center z-10 transition-all duration-500 ${
                step.status === 'completed' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 
                step.status === 'in-progress' ? 'bg-indigo-500 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 
                'bg-zinc-800'
              }`}>
                {step.status === 'completed' ? <Check size={20} className="text-white" /> : (step.icon || <div className="w-2 h-2 bg-white/50 rounded-full" />)}
              </div>
              
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl group-hover:border-zinc-700 transition-all duration-300 backdrop-blur-sm">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {step.features.map((f: any, fi: number) => (
                    <div key={fi} className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-950/40 px-3 py-2 rounded-xl border border-zinc-800/50">
                      <div className={`w-1 h-1 rounded-full shrink-0 ${step.status === 'completed' ? 'bg-green-500' : 'bg-zinc-700'}`} />
                      <span className="truncate">{f}</span>
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
