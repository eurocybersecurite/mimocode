import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'planned';
  progress: number; // 0-100
}

const milestones: Milestone[] = [
  { id: '1', title: 'CLI Core Stability & Rebranding', status: 'completed', progress: 100 },
  { id: '2', title: 'Git & Versioning Automation', status: 'completed', progress: 100 },
  { id: '3', title: 'Web UI Component Library', status: 'in-progress', progress: 65 },
  { id: '4', title: 'Collaborative Multi-Agent System', status: 'planned', progress: 10 },
];

export const RoadmapPanel: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full p-8 overflow-y-auto bg-zinc-950"
    >
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-zinc-100 mb-2">Business Roadmap</h3>
        <p className="text-sm text-zinc-500 mb-8">Visualizing project evolution and upcoming milestones.</p>

        <div className="space-y-4">
          {milestones.map((m) => (
            <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${m.status === 'completed' ? 'bg-green-500/10 text-green-500' : m.status === 'in-progress' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-zinc-800 text-zinc-500'}`}>
                    {m.status === 'completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <h4 className="text-md font-bold text-zinc-200">{m.title}</h4>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{m.status}</span>
                  </div>
                </div>
                <div className="text-xl font-mono font-bold text-zinc-700">{m.progress}%</div>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${m.status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${m.progress}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
