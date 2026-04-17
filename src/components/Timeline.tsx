import React from 'react';
import { motion } from 'motion/react';
import { Activity, Globe, Terminal as TerminalIcon, Zap } from 'lucide-react';

interface TimelineProps {
  events: any[];
  setActiveTab: (tab: string) => void;
}

export const Timeline = ({ events, setActiveTab }: TimelineProps) => {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Action Timeline</h2>
          <p className="text-zinc-400 text-sm">Real-time history of agent activities and deployments</p>
        </div>
        <button 
          onClick={() => setActiveTab('deploy')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Globe size={18} />
          Deploy App
        </button>
      </div>

      <div className="space-y-6">
        {events.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl">
            <Activity size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500">No events recorded yet. Start interacting with Mimocode!</p>
          </div>
        ) : (
          events.map((event, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-6 relative group"
            >
              {i !== events.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg ${
                event.type.includes('success') || event.type === 'deploy_success' ? 'bg-green-500 text-white' :
                event.type.includes('error') || event.type === 'deploy_error' ? 'bg-red-500 text-white' :
                event.type.includes('deploy') ? 'bg-amber-500 text-white' :
                'bg-indigo-500 text-white'
              }`}>
                {event.type.includes('chat') ? <TerminalIcon size={14} /> :
                 event.type.includes('tool') ? <Zap size={14} /> :
                 event.type.includes('deploy') ? <Globe size={14} /> :
                 <Activity size={14} />}
              </div>
              <div className="flex-1 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-all backdrop-blur-sm text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {event.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-zinc-200">
                  {event.type === 'tool_start' && (
                    <p>Executing tool <code className="text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">{event.data.name}</code></p>
                  )}
                  {event.type === 'tool_success' && (
                    <p>Successfully executed <code className="text-green-400 font-mono bg-green-500/10 px-1.5 py-0.5 rounded">{event.data.name}</code></p>
                  )}
                  {event.type === 'file_save' && (
                    <p>Saved file <code className="text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">{event.data.filePath}</code></p>
                  )}
                  {event.type === 'git_commit' && (
                    <p>Committed changes: <span className="text-zinc-400 italic">"{event.data.message}"</span></p>
                  )}
                  {event.type === 'deploy_progress' && (
                    <div className="space-y-3">
                      <p className="font-medium">{event.data.step}</p>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500" 
                          style={{ width: `${event.data.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {event.type === 'deploy_success' && (
                    <div className="space-y-2">
                      <p className="text-green-400 font-bold">Deployment Successful!</p>
                      <p className="text-xs text-zinc-400">Your application is live at:</p>
                      <a href={event.data.url} target="_blank" rel="noreferrer" className="text-indigo-400 underline break-all">{event.data.url}</a>
                    </div>
                  )}
                  {event.type === 'chat_start' && (
                    <p className="italic text-zinc-400 border-l-2 border-zinc-700 pl-3">"{event.data.input}"</p>
                  )}
                  {!['tool_start', 'tool_success', 'file_save', 'git_commit', 'deploy_progress', 'deploy_success', 'chat_start'].includes(event.type) && (
                    <p>{typeof event.data === 'string' ? event.data : JSON.stringify(event.data)}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
