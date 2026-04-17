import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Check
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

  useEffect(() => {
    fetchGitStatus();
    fetchGitBranches();
  }, []);

  return (
    <motion.div
      key="git"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
        <div>
          <h3 className="text-xl font-bold text-zinc-100">Git Source Control</h3>
          <p className="text-xs text-zinc-500">Manage changes and commits</p>
        </div>
        <div className="flex items-center gap-3">
          {gitBranches.length === 0 && (
            <button
              onClick={async () => {
                try {
                  await axios.post('/api/exec', { command: 'git init && git add . && git commit -m "Initial commit"' });
                  fetchGitStatus();
                  fetchGitBranches();
                } catch (e) { console.error(e); }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <GitBranch size={14} /> Initialize Repository
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
            <select id="versionBump" className="bg-transparent text-[10px] text-zinc-400 focus:outline-none cursor-pointer">
              <option value="patch">Patch</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
            <button
              onClick={async () => {
                const type = (document.getElementById('versionBump') as HTMLSelectElement).value;
                await axios.post('/api/git/version/bump', { type });
                fetchGitStatus();
              }}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded shadow-sm transition-colors"
            >
              Bump
            </button>
          </div>
          <button 
            onClick={() => {
              axios.post('/api/git/pull')
                .then(() => { fetchGitStatus(); alert('Pull réussi !'); })
                .catch((err) => alert('Erreur lors du pull : ' + err.message));
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs font-medium transition-colors"
            title="Pull changes"
          >
            <ArrowDown size={14} /> Pull
          </button>
          <button 
            onClick={() => {
              axios.post('/api/git/push')
                .then(() => { fetchGitStatus(); alert('Push réussi !'); })
                .catch((err) => alert('Erreur lors du push : ' + err.message));
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs font-medium transition-colors"
            title="Push changes"
          >
            <ArrowUp size={14} /> Push
          </button>
          <button
            onClick={fetchGitStatus}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
            title="Refresh Status"
          >
            <Activity size={18} className={isGitLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Changes List */}
        <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/20">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Branches</span>
              <button
                onClick={async () => {
                  const name = `branch-${Date.now()}`;
                  axios.post('/api/git/branch/create', { name })
                    .then(() => fetchGitStatus())
                    .catch(err => console.error(err));
                }}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-indigo-400 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {gitBranches.map((branch: any, i: number) => (
                <button
                  key={i}
                  onClick={() => handleCheckout(branch.name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${branch.isCurrent ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-transparent'}`}
                >
                  <GitBranch size={12} className={branch.isCurrent ? 'text-indigo-400' : 'text-zinc-600'} />
                  <span className="truncate">{branch.name}</span>
                  {branch.isCurrent && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                </button>
              ))}
              {gitBranches.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic py-2 text-center">No branches found</p>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden text-left">
            <div className="p-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Changes ({gitStatus.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {gitStatus.map((item: any, i: number) => (
                <button
                  key={i}
                  onClick={() => fetchGitDiff(item.filePath)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800/50 transition-all group border border-transparent hover:border-zinc-700/50 text-left"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm flex-shrink-0 ${
                      item.code.includes('M') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      item.code.includes('A') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      item.code.includes('D') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      'bg-zinc-700/10 text-zinc-400 border border-zinc-700/20'
                  }`}>
                    {item.code.trim() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate group-hover:text-white transition-colors font-medium">{item.filePath.split('/').pop()}</div>
                    <div className="text-[9px] text-zinc-500 truncate font-mono opacity-60">{item.filePath}</div>
                  </div>
                </button>
              ))}
              {gitStatus.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-12 opacity-40">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
                    <Check size={20} className="text-zinc-500" />
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Workspace Clean</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto p-4 bg-zinc-950/50 border-t border-zinc-800">
            <textarea
              placeholder="Commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none mb-3"
            />
            <button
              onClick={handleCommit}
              disabled={isCommitting || !commitMessage || gitStatus.length === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {isCommitting ? <Activity size={14} className="animate-spin" /> : <GitCommit size={14} />}
              Commit & Push
            </button>
          </div>
        </div>

        {/* Diff View */}
        <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden relative border-l border-zinc-800 text-left">
          <div className="p-2 border-b border-zinc-800 flex justify-end gap-2 bg-zinc-900/30">
             <button 
               onClick={() => setViewMode('custom')}
               className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${viewMode === 'custom' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               Custom View
             </button>
             <button 
               onClick={() => setViewMode('editor')}
               className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${viewMode === 'editor' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               Monaco View
             </button>
          </div>
          {gitDiff ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {viewMode === 'custom' ? (
                <div className="flex-1 overflow-auto p-6 font-mono text-[11px] custom-scrollbar text-left">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {gitDiff.split('\n').map((line: string, i: number) => (
                      <div
                        key={i}
                        className={`px-2 py-0.5 rounded-sm ${line.startsWith('+') && !line.startsWith('+++') ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' :
                            line.startsWith('-') && !line.startsWith('---') ? 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500' :
                              line.startsWith('@@') ? 'bg-indigo-500/5 text-indigo-400/60 my-2 italic' :
                                'text-zinc-500 opacity-80'
                          }`}
                      >
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
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                  }}
                />
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
                <GitBranch size={32} className="text-zinc-700" />
              </div>
              <h4 className="text-zinc-400 font-bold text-sm mb-2">No File Selected</h4>
              <p className="text-zinc-600 text-xs max-w-xs text-center leading-relaxed">Select a modified file from the list on the left to visualize the diff.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
