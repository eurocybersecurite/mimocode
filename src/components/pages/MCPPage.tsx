import React from 'react';
import { motion } from 'motion/react';
import { Zap, RefreshCw, Plus, CheckCircle2, Code, Activity, Edit3, Trash2 } from 'lucide-react';

interface MCPPageProps {
  mcpServers: any[];
  mcpTools: any[];
  fetchMCPServers: () => void;
  isMCPLoading: boolean;
  setIsCreatingMCPServer: (val: boolean) => void;
  setEditingMCP: (server: any) => void;
  handleDeleteMCP: (name: string) => void;
}

export function MCPPage({
  mcpServers,
  mcpTools,
  fetchMCPServers,
  isMCPLoading,
  setIsCreatingMCPServer,
  setEditingMCP,
  handleDeleteMCP
}: MCPPageProps) {
  return (
    <motion.div 
      key="mcp"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-8 overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Model Context Protocol</h2>
            <p className="text-zinc-500 text-sm">Manage external tool connectors and data sources</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchMCPServers}
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
              disabled={isMCPLoading}
            >
              <RefreshCw size={18} className={isMCPLoading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setIsCreatingMCPServer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={14} /> Add MCP Server
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Servers List */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> Connected Servers
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {mcpServers.map((server) => (
                <div key={server.name} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl flex items-center justify-between group hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center text-indigo-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-200">{server.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{server.url || `${server.command} ${server.args?.join(' ')}`}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingMCP(server)}
                      className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMCP(server.name)}
                      className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-bold uppercase tracking-widest border border-green-500/20">
                      <CheckCircle2 size={10} /> Active
                    </div>
                  </div>
                </div>
              ))}
              {mcpServers.length === 0 && (
                <div className="py-12 text-center bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600">
                  <p className="text-sm font-medium">No MCP servers connected</p>
                </div>
              )}
            </div>
          </div>

          {/* Tools List */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Code size={14} /> Available Tools
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {mcpTools.map((tool) => (
                  <div key={tool.name} className="p-4 hover:bg-zinc-800/20 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">{tool.name}</div>
                      <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">{tool.server}</span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{tool.description}</p>
                  </div>
                ))}
                {mcpTools.length === 0 && (
                  <div className="p-12 text-center text-zinc-600">
                    <p className="text-sm font-medium">No tools discovered yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
