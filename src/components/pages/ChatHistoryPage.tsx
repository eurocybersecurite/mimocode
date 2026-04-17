import React from 'react';
import { motion } from 'motion/react';
import { Activity, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatHistoryPageProps {
  chatHistory: any[];
  isChatLoading: boolean;
  fetchChatHistory: () => void;
}

export function ChatHistoryPage({
  chatHistory,
  isChatLoading,
  fetchChatHistory
}: ChatHistoryPageProps) {
  return (
    <motion.div 
      key="chat"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      <div className="max-w-4xl mx-auto pb-32 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-zinc-100">Full Conversation History</h3>
        <button 
          onClick={fetchChatHistory}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
          disabled={isChatLoading}
        >
          <Activity size={18} className={isChatLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {chatHistory.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-600">
          <Users size={48} className="opacity-20 mb-4" />
          <p className="text-sm font-medium">No chat history found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl border ${
                msg.role === 'user' 
                  ? 'bg-indigo-600/10 border-indigo-500/30 text-zinc-200' 
                  : msg.role === 'system'
                  ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500 text-xs italic'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{msg.role}</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
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
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </motion.div>
  );
}
