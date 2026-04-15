import React from 'react';
import { motion } from 'framer-motion';

interface ActivityLog {
  timestamp: string;
  agent: string;
  message: string;
}

interface OrchestrationPanelProps {
  activityLogs: ActivityLog[];
}

export const OrchestrationPanel: React.FC<OrchestrationPanelProps> = ({ activityLogs }) => {
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
          <p className="text-xs text-zinc-500">Live agent delegation and task execution logs</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-zinc-950">
        <div className="space-y-3 font-mono text-[10px] text-zinc-400">
          {activityLogs.map((log, idx) => (
            <div key={idx} className="flex gap-4 border-b border-zinc-900 pb-2">
              <span className="opacity-50 min-w-[80px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="font-bold text-indigo-400 min-w-[60px]">@{log.agent}</span>
              <span className="text-zinc-300">{log.message}</span>
            </div>
          ))}
          {activityLogs.length === 0 && (
            <div className="text-center text-zinc-600 mt-20 italic">No activity detected yet. Start a task to see agent delegation here.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
