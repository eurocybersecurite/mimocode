import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Settings, Zap, Activity, Trash2, 
  AlertCircle, Globe, Download, History as HistoryIcon, 
  Code, Search, Layout
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';

interface ModalsProps {
  editingAgent: any;
  setEditingAgent: (val: any) => void;
  isAddMCPModalOpen: boolean;
  setIsAddMCPModalOpen: (val: boolean) => void;
  newMCP: any;
  setNewMCP: (val: any) => void;
  handleAddMCP: () => void;
  isEditMCPModalOpen: boolean;
  setIsEditMCPModalOpen: (val: boolean) => void;
  editingMCP: any;
  setEditingMCP: (val: any) => void;
  handleUpdateMCP: () => void;
  isCreatingAgent: boolean;
  setIsCreatingAgent: (val: boolean) => void;
  newAgent: any;
  setNewAgent: (val: any) => void;
  handleCreateAgent: (e: React.FormEvent) => void;
  isCreatingSkill: boolean;
  setIsCreatingSkill: (val: boolean) => void;
  newSkill: any;
  setNewSkill: (val: any) => void;
  handleCreateSkill: (e: React.FormEvent) => void;
  isCreatingSecret: boolean;
  setIsCreatingSecret: (val: boolean) => void;
  newSecret: any;
  setNewSecret: (val: any) => void;
  handleCreateSecret: (key: string, val: string) => void;
  confirmDeleteSkill: string | null;
  setConfirmDeleteSkill: (val: string | null) => void;
  handleDeleteSkill: (name: string) => void;
  confirmDelete: string | null;
  setConfirmDelete: (val: string | null) => void;
  handleDeleteAgent: (name: string) => void;
  isMcpCatalogOpen: boolean;
  setIsMcpCatalogOpen: (val: boolean) => void;
  mcpCatalog: any[];
  config: any;
  setConfig: (val: any) => void;
  isHealConfirmOpen: boolean;
  setIsHealConfirmOpen: (val: boolean) => void;
  isImproveConfirmOpen: boolean;
  setIsImproveConfirmOpen: (val: boolean) => void;
  isRestoreConfirmOpen: boolean;
  setIsRestoreConfirmOpen: (val: boolean) => void;
  isRagClearConfirmOpen: boolean;
  setIsRagClearConfirmOpen: (val: boolean) => void;
  handleHealSystem: () => void;
  handleImproveSystem: () => void;
  handleRestoreLatest: () => void;
  handleRagClear: () => void;
  isSystemActionLoading: boolean;
  selectedHistoryEntry: any;
  setSelectedHistoryEntry: (val: any) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  updateConfig: (patch: any) => void;
  availableModels: string[];
  isModelsLoading: boolean;
  handleVSCodeSetup: () => void;
}

export const Modals: React.FC<ModalsProps> = (props) => {
  const {
    editingAgent, setEditingAgent,
    isAddMCPModalOpen, setIsAddMCPModalOpen, newMCP, setNewMCP, handleAddMCP,
    isEditMCPModalOpen, setIsEditMCPModalOpen, editingMCP, setEditingMCP, handleUpdateMCP,
    isCreatingAgent, setIsCreatingAgent, newAgent, setNewAgent, handleCreateAgent,
    isCreatingSkill, setIsCreatingSkill, newSkill, setNewSkill, handleCreateSkill,
    isCreatingSecret, setIsCreatingSecret, newSecret, setNewSecret, handleCreateSecret,
    confirmDeleteSkill, setConfirmDeleteSkill, handleDeleteSkill,
    confirmDelete, setConfirmDelete, handleDeleteAgent,
    isMcpCatalogOpen, setIsMcpCatalogOpen, mcpCatalog, config, setConfig,
    isHealConfirmOpen, setIsHealConfirmOpen, handleHealSystem,
    isImproveConfirmOpen, setIsImproveConfirmOpen, handleImproveSystem,
    isRestoreConfirmOpen, setIsRestoreConfirmOpen, handleRestoreLatest,
    isRagClearConfirmOpen, setIsRagClearConfirmOpen, handleRagClear,
    isSystemActionLoading,
    selectedHistoryEntry, setSelectedHistoryEntry,
    isSettingsOpen, setIsSettingsOpen, updateConfig, availableModels, isModelsLoading, handleVSCodeSetup
  } = props;

  return (
    <AnimatePresence>
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingAgent(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-100">Edit Agent: @{editingAgent.name}</h3>
                <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[9px] rounded uppercase tracking-wider animate-pulse">Auto-saving</div>
              </div>
              <button onClick={() => setEditingAgent(null)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Description</label>
                <input 
                  type="text" 
                  value={editingAgent.description}
                  onChange={(e) => setEditingAgent({...editingAgent, description: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">System Instructions</label>
                <textarea 
                  rows={8}
                  value={editingAgent.systemInstruction}
                  onChange={(e) => setEditingAgent({...editingAgent, systemInstruction: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={editingAgent.tags?.join(', ')}
                  onChange={(e) => setEditingAgent({...editingAgent, tags: e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t)})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => setEditingAgent(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isAddMCPModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddMCPModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-500">
                  <Plus size={20} />
                </div>
                <h3 className="font-bold text-zinc-100">Add MCP Server</h3>
              </div>
              <button onClick={() => setIsAddMCPModalOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Server Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. filesystem-server"
                  value={newMCP.name}
                  onChange={(e) => setNewMCP({ ...newMCP, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Connection Type</label>
                <select 
                  value={newMCP.type}
                  onChange={(e) => setNewMCP({ ...newMCP, type: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="stdio">Stdio (Local Command)</option>
                  <option value="http">HTTP (Remote Server)</option>
                </select>
              </div>
              {newMCP.type === 'stdio' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Command</label>
                    <input 
                      type="text" 
                      placeholder="e.g. npx"
                      value={newMCP.command}
                      onChange={(e) => setNewMCP({ ...newMCP, command: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Arguments (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. -y, @mcp/server-fs"
                      value={newMCP.args.join(', ')}
                      onChange={(e) => setNewMCP({ ...newMCP, args: e.target.value.split(',').map((s: string) => s.trim()) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Server URL</label>
                  <input 
                    type="text" 
                    placeholder="e.g. http://localhost:3001"
                    value={newMCP.url}
                    onChange={(e) => setNewMCP({ ...newMCP, url: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex gap-3">
              <button 
                onClick={() => setIsAddMCPModalOpen(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddMCP}
                disabled={!newMCP.name || (newMCP.type === 'stdio' ? !newMCP.command : !newMCP.url)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                Add Server
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isEditMCPModalOpen && editingMCP && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditMCPModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-500">
                  <Settings size={20} />
                </div>
                <h3 className="font-bold text-zinc-100">Edit MCP Server</h3>
              </div>
              <button onClick={() => setIsEditMCPModalOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Server Name</label>
                <input 
                  type="text" 
                  disabled
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                  value={editingMCP.name}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Connection Type</label>
                <select 
                  value={editingMCP.type}
                  onChange={(e) => setEditingMCP({ ...editingMCP, type: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="stdio">Stdio (Local Command)</option>
                  <option value="http">HTTP (Remote Server)</option>
                </select>
              </div>
              {editingMCP.type === 'stdio' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Command</label>
                    <input 
                      type="text" 
                      placeholder="e.g. npx"
                      value={editingMCP.command}
                      onChange={(e) => setEditingMCP({ ...editingMCP, command: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Arguments (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. -y, @mcp/server-fs"
                      value={editingMCP.args.join(', ')}
                      onChange={(e) => setEditingMCP({ ...editingMCP, args: e.target.value.split(',').map((s: string) => s.trim()) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Server URL</label>
                  <input 
                    type="text" 
                    placeholder="e.g. http://localhost:3001"
                    value={editingMCP.url}
                    onChange={(e) => setEditingMCP({ ...editingMCP, url: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex gap-3">
              <button 
                onClick={() => setIsEditMCPModalOpen(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateMCP}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isCreatingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreatingAgent(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-100">Create New Agent</h3>
              <button onClick={() => setIsCreatingAgent(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateAgent} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Agent Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">@</span>
                    <input 
                      required
                      type="text" 
                      placeholder="architect"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value.replace(/[^a-z0-9_-]/gi, '') })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Role Title</label>
                  <input 
                    type="text" 
                    placeholder="Senior Architect"
                    value={newAgent.role}
                    onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Short Description</label>
                <input 
                  type="text" 
                  placeholder="Briefly describe what this agent specializes in..."
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">System Instructions (The "Brain")</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Define how this agent should behave, what tools it should prioritize, and its overall persona..."
                  value={newAgent.systemInstruction}
                  onChange={(e) => setNewAgent({ ...newAgent, systemInstruction: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                />
              </div>
              <div className="bg-zinc-900/50 border-t border-zinc-800 pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreatingAgent(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newAgent.name || !newAgent.systemInstruction}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Create Expert
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isCreatingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreatingSkill(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-100">Create New Skill</h3>
              <button onClick={() => setIsCreatingSkill(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSkill} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Skill Name</label>
                <input 
                  type="text" 
                  required
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                  placeholder="e.g., refactor-ts"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Description</label>
                <input 
                  type="text" 
                  required
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
                  placeholder="Briefly describe what this skill does"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Skill Prompt</label>
                <textarea 
                  rows={6}
                  required
                  value={newSkill.prompt}
                  onChange={(e) => setNewSkill({...newSkill, prompt: e.target.value})}
                  placeholder="Define how the AI should behave when using this skill..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Create Skill
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isCreatingSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-100">Add New Secret</h3>
              <button onClick={() => setIsCreatingSecret(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Secret Key</label>
                <input 
                  type="text" 
                  placeholder="e.g. OPENAI_API_KEY"
                  value={newSecret.key}
                  onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Secret Value</label>
                <input 
                  type="password" 
                  placeholder="sk-..."
                  value={newSecret.value}
                  onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => handleCreateSecret(newSecret.key, newSecret.value)}
                  disabled={!newSecret.key || !newSecret.value}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
                >
                  Save Secret
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {confirmDeleteSkill && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDeleteSkill(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center"
          >
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Delete Skill?</h3>
            <p className="text-xs text-zinc-500 mb-6">Are you sure you want to delete the skill <span className="text-zinc-300 font-bold">"{confirmDeleteSkill}"</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteSkill(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteSkill(confirmDeleteSkill)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Delete Agent?</h3>
            <p className="text-xs text-zinc-500 mb-6">Are you sure you want to delete <span className="text-zinc-300 font-bold">@{confirmDelete}</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteAgent(confirmDelete)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isMcpCatalogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMcpCatalogOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-100">MCP Server Catalog</h3>
                <p className="text-xs text-zinc-500">Ready-to-integrate servers for various services</p>
              </div>
              <button onClick={() => setIsMcpCatalogOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {mcpCatalog.map(item => (
                <div key={item.name} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                      <Globe size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          // Simulation de clone
                          alert(`Cloning ${item.name}...`);
                        }}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2"
                      >
                        <Download size={12} /> Clone Source
                      </button>
                      <button 
                        onClick={() => {
                          const newMcp = { name: item.name, type: item.type, command: item.command, args: item.args };
                          const updatedMcpServers = [...(config.mcpServers || []), newMcp];
                          setConfig({ ...config, mcpServers: updatedMcpServers });
                          setIsMcpCatalogOpen(false);
                        }}
                        className="px-4 py-1.5 bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        Add to Config
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 mb-1">{item.name}</h4>
                  <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded uppercase tracking-widest">{item.type}</span>
                    <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded truncate flex-1">{item.command} {item.args.join(' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {isHealConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSystemActionLoading && setIsHealConfirmOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-4">
              <Activity size={24} />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Repair System?</h3>
            <p className="text-xs text-zinc-500 mb-6">This will run a system-wide auto-repair which may modify multiple files. Are you sure you want to proceed?</p>
            <div className="flex gap-3">
              <button 
                disabled={isSystemActionLoading}
                onClick={() => setIsHealConfirmOpen(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isSystemActionLoading}
                onClick={handleHealSystem}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSystemActionLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Repair'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isImproveConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSystemActionLoading && setIsImproveConfirmOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-4">
              <Zap size={24} />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Improve Codebase?</h3>
            <p className="text-xs text-zinc-500 mb-6">This will apply AI-driven improvements across your codebase. This is a major change. Are you sure?</p>
            <div className="flex gap-3">
              <button 
                disabled={isSystemActionLoading}
                onClick={() => setIsImproveConfirmOpen(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isSystemActionLoading}
                onClick={handleImproveSystem}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSystemActionLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Improve'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isRestoreConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSystemActionLoading && setIsRestoreConfirmOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-4">
              <HistoryIcon size={24} />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Restore Latest?</h3>
            <p className="text-xs text-zinc-500 mb-6">This will revert your codebase to the latest checkpoint. Any changes since then will be lost. Are you sure?</p>
            <div className="flex gap-3">
              <button 
                disabled={isSystemActionLoading}
                onClick={() => setIsRestoreConfirmOpen(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isSystemActionLoading}
                onClick={handleRestoreLatest}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSystemActionLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Restore'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isRagClearConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSystemActionLoading && setIsRagClearConfirmOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Clear RAG Index?</h3>
            <p className="text-xs text-zinc-500 mb-6">This will delete all indexed data from your RAG system. You will need to re-index to use it again. Are you sure?</p>
            <div className="flex gap-3">
              <button 
                disabled={isSystemActionLoading}
                onClick={() => setIsRagClearConfirmOpen(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isSystemActionLoading}
                onClick={handleRagClear}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSystemActionLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Clear Index'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedHistoryEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistoryEntry(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div>
                <h3 className="font-bold text-zinc-100">History Detail: @{selectedHistoryEntry.agentName}</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">{new Date(selectedHistoryEntry.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedHistoryEntry(null)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-zinc-950/30">
              <div className="mb-8">
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">User Input</label>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300">
                  {selectedHistoryEntry.input}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">AI Output</label>
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
                    {selectedHistoryEntry.output}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-500">
                  <Settings size={20} />
                </div>
                <h3 className="font-bold text-zinc-100">System Settings</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              {/* AI Backend Section */}
              <section>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap size={12} /> AI Backend
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Runtime</label>
                    <select 
                      value={config?.runtime}
                      onChange={(e) => updateConfig({ runtime: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="ollama">Ollama</option>
                      <option value="lmstudio">LM Studio</option>
                      <option value="llama-cpp">Llama.cpp</option>
                      <option value="mlx">MLX (Apple Silicon)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Model</label>
                    <div className="relative">
                      <select 
                        value={config?.model}
                        onChange={(e) => updateConfig({ model: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 appearance-none"
                        disabled={isModelsLoading}
                      >
                        {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      {isModelsLoading && <Activity size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-600" />}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Endpoint URL</label>
                    <input 
                      type="text" 
                      value={config?.endpoint}
                      onChange={(e) => updateConfig({ endpoint: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
              </section>

              {/* AI Parameters Section */}
              <section>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={12} /> AI Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Temperature</label>
                      <span className="text-[10px] font-mono text-indigo-400">{config?.temperature || 0.7}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      value={config?.temperature || 0.7}
                      onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Top P</label>
                      <span className="text-[10px] font-mono text-indigo-400">{config?.topP || 0.9}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05"
                      value={config?.topP || 0.9}
                      onChange={(e) => updateConfig({ topP: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Top K</label>
                      <span className="text-[10px] font-mono text-indigo-400">{config?.topK || 40}</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" step="1"
                      value={config?.topK || 40}
                      onChange={(e) => updateConfig({ topK: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </section>

              {/* API Keys Section */}
              <section>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings size={12} /> API Keys & Secrets
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Mimocode API Key</label>
                    <input 
                      type="password" 
                      placeholder="Enter your Mimocode API key..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Search API Key (SerpApi/Mimocode)</label>
                    <input 
                      type="password" 
                      placeholder="Enter your Search API key..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
              </section>

              {/* MCP Configuration Section */}
              <section>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layout size={12} /> MCP Servers
                </h4>
                <div className="space-y-3">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-500">
                        <Globe size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Filesystem Server</div>
                        <div className="text-[10px] text-zinc-500 font-mono">mcp-filesystem</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAddMCPModalOpen(true)}
                    className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add MCP Server
                  </button>
                </div>
              </section>

              {/* Theme Section */}
              <section>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layout size={12} /> Theme & UI
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Web Interface</h5>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Primary Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map(color => (
                          <button 
                            key={color}
                            onClick={() => updateConfig({ theme: { ...config.theme, web: { ...config.theme.web, primaryColor: color } } })}
                            className={`w-6 h-6 rounded-full border-2 ${config?.theme?.web?.primaryColor === color ? 'border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input 
                          type="color" 
                          value={config?.theme?.web?.primaryColor || '#6366f1'}
                          onChange={(e) => updateConfig({ theme: { ...config.theme, web: { ...config.theme.web, primaryColor: e.target.value } } })}
                          className="w-6 h-6 rounded-full bg-transparent border-none p-0 overflow-hidden cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Font Family</label>
                      <select 
                        value={config?.theme?.web?.fontFamily}
                        onChange={(e) => updateConfig({ theme: { ...config.theme, web: { ...config.theme.web, fontFamily: e.target.value } } })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50"
                      >
                        <option value="Inter, sans-serif">Inter (Modern)</option>
                        <option value="'Outfit', sans-serif">Outfit (Geometric)</option>
                        <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech)</option>
                        <option value="'JetBrains Mono', monospace">JetBrains Mono (Dev)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Terminal</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Font Size</label>
                        <input 
                          type="number" 
                          value={config?.theme?.terminal?.fontSize}
                          onChange={(e) => updateConfig({ theme: { ...config.theme, terminal: { ...config.theme.terminal, fontSize: parseInt(e.target.value) } } })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Cursor Color</label>
                        <input 
                          type="color" 
                          value={config?.theme?.terminal?.cursor || '#6366f1'}
                          onChange={(e) => updateConfig({ theme: { ...config.theme, terminal: { ...config.theme.terminal, cursor: e.target.value } } })}
                          className="w-full h-8 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Critical Actions Section */}
              <section className="pt-4 border-t border-zinc-800">
                <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle size={12} /> Critical Actions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsHealConfirmOpen(true)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-500 uppercase tracking-widest transition-all"
                  >
                    <Zap size={12} /> Auto-Repair System
                  </button>
                  <button 
                    onClick={() => setIsRagClearConfirmOpen(true)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest transition-all"
                  >
                    <Trash2 size={12} /> Clear RAG Index
                  </button>
                  <button 
                    onClick={handleVSCodeSetup}
                    className="flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-[10px] font-bold text-blue-500 uppercase tracking-widest transition-all"
                  >
                    <Code size={12} /> Setup VS Code Integration
                  </button>
                  <button 
                    onClick={() => setIsRestoreConfirmOpen(true)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl text-[10px] font-bold text-yellow-500 uppercase tracking-widest transition-all"
                  >
                    <HistoryIcon size={12} /> Restore Latest Checkpoint
                  </button>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
