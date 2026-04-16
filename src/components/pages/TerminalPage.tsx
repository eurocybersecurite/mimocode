import React from 'react';
import { motion } from 'motion/react';
import { Terminal as TerminalIcon, Layout, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TerminalPageProps {
  terminalRef: React.RefObject<HTMLDivElement>;
  viewMode: 'split' | 'terminal' | 'rich';
  setViewMode: (mode: 'split' | 'terminal' | 'rich') => void;
  richOutput: string;
  setRichOutput: (val: string) => void;
}

export function TerminalPage({ 
  terminalRef, 
  viewMode, 
  setViewMode, 
  richOutput 
}: TerminalPageProps) {
  return (
    <motion.div 
      key="terminal"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setViewMode('terminal')}
            className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${viewMode === 'terminal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <TerminalIcon size={12} /> Terminal
          </button>
          <button 
            onClick={() => setViewMode('rich')}
            className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${viewMode === 'rich' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Layout size={12} /> Rich Output
          </button>
          <button 
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${viewMode === 'split' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Layout size={12} /> Split
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-black overflow-hidden flex">
        <div 
          ref={terminalRef} 
          className={`p-4 transition-all duration-300 ${viewMode === 'rich' ? 'w-0 opacity-0 pointer-events-none' : viewMode === 'split' ? 'w-1/2' : 'w-full opacity-100'}`}
        />
        
        {(viewMode === 'rich' || viewMode === 'split') && (
          <div className={`overflow-y-auto p-8 custom-scrollbar bg-zinc-950 transition-all duration-300 ${viewMode === 'split' ? 'w-1/2 border-l border-zinc-800' : 'w-full'}`}>
            <div className="max-w-4xl mx-auto">
              {richOutput ? (
                <div className="prose prose-invert prose-indigo max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative group">
                            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => navigator.clipboard.writeText(String(children))}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-all"
                              >
                                <Activity size={14} />
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-xl !bg-zinc-900 border border-zinc-800 !p-6"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-400" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {richOutput}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4 py-20">
                  <Layout size={48} className="opacity-20" />
                  <p className="text-sm font-medium">No rich output available. Run a command to see results here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
