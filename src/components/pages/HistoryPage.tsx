import React from 'react';
import { motion } from 'motion/react';
import { Search, X, History as HistoryIcon, Users, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface HistoryPageProps {
  historySearchTerm: string;
  setHistorySearchTerm: (val: string) => void;
  filteredHistory: any[];
  setSelectedHistoryEntry: (entry: any) => void;
  expandedHistoryIndex: number | null;
  setExpandedHistoryIndex: (index: number | null) => void;
}

export function HistoryPage({
  historySearchTerm,
  setHistorySearchTerm,
  filteredHistory,
  setSelectedHistoryEntry,
  expandedHistoryIndex,
  setExpandedHistoryIndex
}: HistoryPageProps) {
  return (
    <motion.div 
      key="history"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 overflow-hidden flex flex-col"
    >
      <div className="mb-6 relative w-full md:w-96">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search history..." 
          value={historySearchTerm}
          onChange={(e) => setHistorySearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
        />
        {historySearchTerm && (
          <button 
            onClick={() => setHistorySearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Input</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredHistory.slice().reverse().map((entry, i) => (
                <tr key={i} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-600/10 rounded-md flex items-center justify-center text-indigo-500">
                        <Users size={12} />
                      </div>
                      <span className="text-xs font-medium text-zinc-300">@{entry.agentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-500 truncate max-w-md">{entry.input}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] text-zinc-600 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedHistoryEntry(entry)}
                        className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-400"
                      >
                        View Output
                      </button>
                      <button 
                        onClick={() => setExpandedHistoryIndex(expandedHistoryIndex === i ? null : i)}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        {expandedHistoryIndex === i ? <ChevronRight size={14} className="rotate-90" /> : <ChevronRight size={14} />}
                      </button>
                    </div>
                    {expandedHistoryIndex === i && (
                      <div className="mt-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800 overflow-x-auto max-h-96">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {entry.output}
                        </ReactMarkdown>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredHistory.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <HistoryIcon size={48} className="opacity-20 mb-4" />
            <p className="text-sm font-medium">No history entries found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
