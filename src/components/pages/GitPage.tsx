import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitBranch, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ArrowDown, 
  ArrowUp, 
  GitCommit, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  FileText,
  Activity,
  Check,
  Undo2,
  List,
  History,
  XCircle,
  Shield
} from 'lucide-react';
import axios from 'axios';
import Editor from '@monaco-editor/react';

interface GitPageProps {
  gitStatus: any[];
  fetchGitStatus: () => void;
  isGitLoading: boolean;
  gitBranches: any[];
  fetchGitBranches: () => void;
  handleCheckout: (branch: string) => void;
  fetchGitDiff: (path?: string) => void;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  handleCommit: () => void;
  isCommitting: boolean;
  gitDiff: string;
}

export function GitPage({
  gitStatus = [],
  fetchGitStatus,
  isGitLoading,
  gitBranches = [],
  fetchGitBranches,
  handleCheckout,
  fetchGitDiff,
  commitMessage,
  setCommitMessage,
  handleCommit,
  isCommitting,
  gitDiff
}: GitPageProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'custom'>('custom');
  const [activeSubTab, setActiveSubTab] = useState<'changes' | 'history'>('changes');
  const [commitLog, setCommitLog] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fetchLog = async () => {
    try {
      const res = await axios.get('/api/git/log');
      setCommitLog(res.data);
    } catch (e) { console.error(e); }
  };

  const handleStage = async (filePath: string) => {
    try {
      await axios.post('/api/git/stage', { filePath });
      fetchGitStatus();
    } catch (e) { console.error(e); }
  };

  const handleUnstage = async (filePath: string) => {
    try {
      await axios.post('/api/git/unstage', { filePath });
      fetchGitStatus();
    } catch (e) { console.error(e); }
  };

  const handleDiscard = async (filePath: string) => {
    if (confirm(`Discard all changes in ${filePath}? This cannot be undone.`)) {
      try {
        await axios.post('/api/git/discard', { filePath });
        fetchGitStatus();
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    fetchGitStatus();
    fetchGitBranches();
    fetchLog();
  }, []);

  return (
    <motion.div
      key="git"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col overflow-hidden bg-zinc-950"
    >
      {/* Top Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-500">
            <GitBranch size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Git Control Center</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Management & Synchronization</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
             <button 
               onClick={() => setActiveSubTab('changes')}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'changes' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               <List size={14} /> Changes
               {gitStatus.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] rounded-full">{gitStatus.length}</span>}
             </button>
             <button 
               onClick={() => { setActiveSubTab('history'); fetchLog(); }}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'history' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               <History size={14} /> History
             </button>
          </div>
          <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
          <button 
            onClick={() => {
              axios.post('/api/git/pull')
                .then(() => { fetchGitStatus(); fetchLog(); })
                .catch((err) => console.error(err));
            }}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-all"
            title="Pull Changes"
          >
            <ArrowDown size={18} />
          </button>
          <button 
            onClick={() => {
              axios.post('/api/git/push')
                .then(() => { fetchGitStatus(); fetchLog(); })
                .catch((err) => console.error(err));
            }}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all shadow-lg shadow-indigo-500/20"
            title="Push Changes"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Branches & File List or History */}
        <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/10">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <GitBranch size={12} className="text-indigo-500" /> Active Repository
              </span>
              <button
                onClick={async () => {
                  const name = `branch-${Date.now()}`;
                  axios.post('/api/git/branch/create', { name }).then(() => fetchGitBranches());
                }}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-indigo-400"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {gitBranches.map((branch: any, i: number) => (
                <div key={i} className="flex items-center group/branch">
                  <button
                    onClick={() => handleCheckout(branch.name)}
                    className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${branch.isCurrent ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-transparent'}`}
                  >
                    <GitBranch size={10} className={branch.isCurrent ? 'text-indigo-400' : 'text-zinc-600'} />
                    <span className="truncate">{branch.name}</span>
                    {branch.isCurrent && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                  </button>
                  {!branch.isCurrent && (
                    <button 
                      onClick={() => confirm(`Delete ${branch.name}?`) && axios.delete(`/api/git/branch/${branch.name}`).then(() => fetchGitBranches())}
                      className="p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover/branch:opacity-100"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {activeSubTab === 'changes' ? (
              <>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Modified Files</span>
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-zinc-900 rounded-lg border border-zinc-800">
                    <select id="versionBump" className="bg-transparent text-[9px] text-zinc-400 focus:outline-none cursor-pointer font-bold">
                      <option value="patch">PATCH</option>
                      <option value="minor">MINOR</option>
                      <option value="major">MAJOR</option>
                    </select>
                    <button
                      onClick={async () => {
                        const type = (document.getElementById('versionBump') as HTMLSelectElement).value;
                        await axios.post('/api/git/version/bump', { type });
                        fetchGitStatus();
                      }}
                      className="text-[9px] text-indigo-400 hover:text-indigo-300 font-black"
                    >
                      BUMP
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {gitStatus.map((item: any, i: number) => {
                    const isStaged = !item.code.startsWith(' ');
                    return (
                      <div key={i} className="group/item flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedFile(item.filePath); fetchGitDiff(item.filePath); }}
                          className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl transition-all border ${selectedFile === item.filePath ? 'bg-zinc-800/50 border-zinc-700' : 'hover:bg-zinc-900/50 border-transparent hover:border-zinc-800'} text-left overflow-hidden`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            item.code.includes('M') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            item.code.includes('A') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {item.code.trim() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-zinc-300 truncate font-bold">{item.filePath.split('/').pop()}</div>
                            <div className="text-[9px] text-zinc-600 truncate font-mono">{item.filePath}</div>
                          </div>
                        </button>
                        <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button 
                            onClick={() => isStaged ? handleUnstage(item.filePath) : handleStage(item.filePath)}
                            className={`p-1 rounded ${isStaged ? 'text-indigo-500 hover:bg-indigo-500/10' : 'text-zinc-600 hover:bg-zinc-800'}`}
                            title={isStaged ? "Unstage" : "Stage"}
                          >
                            <CheckCircle2 size={12} fill={isStaged ? "currentColor" : "none"} className={isStaged ? "text-zinc-950" : ""} />
                          </button>
                          <button 
                            onClick={() => handleDiscard(item.filePath)}
                            className="p-1 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded"
                            title="Discard Changes"
                          >
                            <Undo2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {gitStatus.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-40">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-3">
                        <Shield size={20} className="text-zinc-700" />
                      </div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Clean Tree</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {commitLog.map((commit, i) => (
                  <div key={i} className="relative pl-6 pb-6 group/commit">
                    {i !== commitLog.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-[1px] bg-zinc-800" />}
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center z-10 group-hover/commit:border-indigo-500 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover/commit:bg-indigo-500" />
                    </div>
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3 hover:border-zinc-700 transition-all cursor-default">
                      <div className="text-[10px] font-mono text-indigo-400 mb-1">{commit.hash}</div>
                      <div className="text-xs font-bold text-zinc-200 mb-1 line-clamp-2">{commit.message}</div>
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
                        <span>{commit.author}</span>
                        <span>{commit.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeSubTab === 'changes' && (
            <div className="mt-auto p-4 bg-zinc-950/80 border-t border-zinc-800 backdrop-blur-md">
              <textarea
                placeholder="Write a clear commit message..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 resize-none mb-3 transition-all placeholder:text-zinc-600"
              />
              <button
                onClick={handleCommit}
                disabled={isCommitting || !commitMessage || gitStatus.length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl text-xs font-black transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 group"
              >
                {isCommitting ? <Activity size={16} className="animate-spin" /> : <GitCommit size={16} className="group-hover:scale-110 transition-transform" />}
                COMMIT & SYNC
              </button>
            </div>
          )}
        </div>

        {/* Diff View Area */}
        <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden relative border-l border-zinc-800">
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-[10px]">
                 {viewMode === 'editor' ? '</>' : '://'}
               </div>
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedFile || 'Diff Inspector'}</span>
             </div>
             <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
               <button 
                 onClick={() => setViewMode('custom')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'custom' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Styled
               </button>
               <button 
                 onClick={() => setViewMode('editor')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'editor' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Monaco
               </button>
             </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {gitDiff ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {viewMode === 'custom' ? (
                  <div className="flex-1 overflow-auto p-8 font-mono text-[12px] custom-scrollbar text-left bg-[#020202]">
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {gitDiff.split('\n').map((line: string, i: number) => (
                        <div
                          key={i}
                          className={`px-3 py-0.5 rounded-sm transition-colors ${line.startsWith('+') && !line.startsWith('+++') ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' :
                              line.startsWith('-') && !line.startsWith('---') ? 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500' :
                                line.startsWith('@@') ? 'bg-indigo-500/5 text-indigo-400/60 my-4 italic py-2 border-y border-zinc-800/50' :
                                  'text-zinc-600'
                            }`}
                        >
                          <span className="mr-4 opacity-30 select-none text-[10px]">{i + 1}</span>
                          {line}
                        </div>
                      ))}
                    </pre>
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    defaultLanguage="diff"
                    theme="vs-dark"
                    value={gitDiff}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono, monospace',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 20, bottom: 20 }
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 bg-zinc-950">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-6">
                  <FileText size={40} className="text-zinc-700" />
                </div>
                <h4 className="text-zinc-400 font-black text-sm mb-2 uppercase tracking-[0.2em]">No Selection</h4>
                <p className="text-zinc-600 text-[10px] max-w-xs text-center leading-relaxed font-bold uppercase tracking-wider">Inspect changes by selecting a file from the list</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
