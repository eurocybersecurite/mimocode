import React from 'react';
import { motion } from 'motion/react';
import { Plus, RefreshCw, Download, CheckCircle2, Globe } from 'lucide-react';

interface PluginsPageProps {
  plugins: any[];
  fetchPluginStore: () => void;
  isPluginsLoading: boolean;
  handleInstallPlugin: (id: string) => void;
}

export function PluginsPage({
  plugins,
  fetchPluginStore,
  isPluginsLoading,
  handleInstallPlugin
}: PluginsPageProps) {
  return (
    <motion.div 
      key="plugins"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-8 overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Plugin Store</h2>
            <p className="text-zinc-500 text-sm">Extend Mimocode with community-built agents and tools</p>
          </div>
          <button 
            onClick={fetchPluginStore}
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
            disabled={isPluginsLoading}
          >
            <RefreshCw size={18} className={isPluginsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin) => (
            <div key={plugin.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col hover:border-zinc-700 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-all">
                  {plugin.icon === 'globe' ? <Globe size={24} /> : <Plus size={24} />}
                </div>
                {plugin.installed ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                    <CheckCircle2 size={12} /> Installed
                  </div>
                ) : (
                  <button 
                    onClick={() => handleInstallPlugin(plugin.id)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    <Download size={12} /> Install
                  </button>
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">{plugin.name}</h3>
              <p className="text-xs text-zinc-500 line-clamp-3 flex-1 mb-6">{plugin.description}</p>
              <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                    {plugin.author[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">{plugin.author}</span>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono">{plugin.version}</div>
              </div>
            </div>
          ))}
          {plugins.length === 0 && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
              <Plus size={48} className="opacity-10 mb-4" />
              <p className="text-sm font-medium">No plugins available in the store right now</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
