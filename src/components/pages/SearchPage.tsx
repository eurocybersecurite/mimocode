import React from 'react';
import { motion } from 'motion/react';
import { Search, FileCode, Users, Zap, Activity, ArrowRight } from 'lucide-react';

interface SearchPageProps {
  globalSearchTerm: string;
  setGlobalSearchTerm: (val: string) => void;
  handleGlobalSearch: (e: React.FormEvent) => void;
  searchResults: any[];
  isSearching: boolean;
  readFile: (path: string) => void;
  setActiveTab: (tab: any) => void;
}

export function SearchPage({
  globalSearchTerm,
  setGlobalSearchTerm,
  handleGlobalSearch,
  searchResults,
  isSearching,
  readFile,
  setActiveTab
}: SearchPageProps) {
  return (
    <motion.div 
      key="search"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="p-8 pb-32"
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-12 group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-500 transition-colors">
            <Search size={20} />
          </div>
          <form onSubmit={handleGlobalSearch}>
            <input 
              type="text"
              placeholder="Search across files, agents, history, and skills..."
              className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-indigo-500/50 rounded-3xl py-6 pl-16 pr-8 text-lg font-medium text-zinc-100 placeholder-zinc-600 outline-none transition-all shadow-2xl shadow-black/20"
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
            />
          </form>
          <div className="absolute right-6 inset-y-0 flex items-center">
            <div className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 border border-zinc-700">ENTER TO SEARCH</div>
          </div>
        </div>

        {!globalSearchTerm ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <FileCode size={20} />, label: 'Files', desc: 'Search source code' },
              { icon: <Users size={20} />, label: 'Agents', desc: 'Find specialized experts' },
              { icon: <Zap size={20} />, label: 'Skills', desc: 'Browse learned procedures' }
            ].map((cat, i) => (
              <button key={i} className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl hover:border-zinc-700 hover:bg-zinc-900/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-all">
                  {cat.icon}
                </div>
                <div className="font-bold text-zinc-200 mb-1">{cat.label}</div>
                <div className="text-xs text-zinc-500">{cat.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Search Results</h3>
              <span className="text-xs text-zinc-600">Found {searchResults.length} results for "{globalSearchTerm}"</span>
            </div>
            
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Activity size={32} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 text-sm">Searching workspace...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {searchResults.map((result: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      readFile(result.filePath);
                      setActiveTab('files');
                    }}
                    className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-zinc-700 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-indigo-400">
                          <FileCode size={16} />
                        </div>
                        <span className="text-sm font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">{result.filePath}</span>
                      </div>
                      <ArrowRight size={14} className="text-zinc-700 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 font-mono text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors overflow-hidden">
                      <div className="line-clamp-2">{result.content}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
                <Search size={48} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-zinc-500">No results found in the current workspace.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
