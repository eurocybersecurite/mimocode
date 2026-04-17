import React from 'react';
import { motion } from 'motion/react';
import { Search, X, Users, Settings, FileJson, Trash2, Play } from 'lucide-react';

interface Agent {
  name: string;
  description: string;
  tags?: string[];
  systemInstruction?: string;
  model?: string;
  tools?: string[];
}

interface AgentsPageProps {
  agentSearchTerm: string;
  setAgentSearchTerm: (val: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  allTags: string[];
  filteredAgents: Agent[];
  setEditingAgent: (agent: Agent) => void;
  handleExportAgent: (agent: Agent) => void;
  setConfirmDelete: (name: string) => void;
  handleRunAgent: (name: string) => void;
  config: any;
}

export function AgentsPage({
  agentSearchTerm,
  setAgentSearchTerm,
  selectedTag,
  setSelectedTag,
  allTags,
  filteredAgents,
  setEditingAgent,
  handleExportAgent,
  setConfirmDelete,
  handleRunAgent,
  config
}: AgentsPageProps) {
  return (
    <motion.div 
      key="agents"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      <div className="max-w-6xl mx-auto pb-32">
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search agents by name or description..." 
            value={agentSearchTerm}
            onChange={(e) => setAgentSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          {agentSearchTerm && (
            <button 
              onClick={() => setAgentSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Filter by Tag:</span>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-1 text-[10px] rounded-md transition-all ${!selectedTag ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-1 text-[10px] rounded-md transition-all ${selectedTag === tag ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                style={selectedTag === tag ? { backgroundColor: config?.theme?.web?.primaryColor || '#6366f1' } : {}}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <div key={agent.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-zinc-700 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-500">
                <Users size={20} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingAgent(agent)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300"
                  title="Edit"
                >
                  <Settings size={14} />
                </button>
                <button 
                  onClick={() => handleExportAgent(agent)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300"
                  title="Export"
                >
                  <FileJson size={14} />
                </button>
                <button 
                  onClick={() => setConfirmDelete(agent.name)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-zinc-100 mb-1">@{agent.name}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {agent.tags?.map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] rounded uppercase tracking-wider">{tag}</span>
              ))}
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2 mb-6 flex-1">{agent.description || 'No description provided.'}</p>
            <button 
              onClick={() => handleRunAgent(agent.name)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-indigo-600 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all"
            >
              <Play size={12} /> Run Agent
            </button>
          </div>
        ))}
        {filteredAgents.length === 0 && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-600">
            <Users size={48} className="opacity-20 mb-4" />
            <p className="text-sm font-medium">No agents found</p>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
}
