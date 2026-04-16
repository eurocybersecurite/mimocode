import React from 'react';
import { Cpu, Activity } from 'lucide-react';

interface SystemStatusBarProps {
  config: any;
  agents: any[];
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({ config, agents }) => {
  return (
    <div className="h-12 border-b border-zinc-800 bg-zinc-900/20 flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Orchestrator Online</span>
        </div>
        <div className="h-3 w-px bg-zinc-800" />
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CPU: 12%</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">MEM: 1.2GB</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-[10px] font-mono text-zinc-600">v{config?.version || '1.0.0'}</div>
        <div className="flex -space-x-2">
          {agents.slice(0, 3).map((a, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[8px] font-bold text-zinc-400" title={a.name}>
              {a.name[0].toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
