import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  Globe, 
  Box, 
  Cloud, 
  Database, 
  GitBranch, 
  Info, 
  X,
  ShieldCheck,
  Zap
} from 'lucide-react';

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
  const [selectedPlugin, setSelectedPlugin] = useState<any | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const onInstall = async (id: string) => {
    setInstallingId(id);
    await handleInstallPlugin(id);
    setTimeout(() => {
      setInstallingId(null);
      fetchPluginStore();
    }, 1500);
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'git': return <GitBranch size={24} />;
      case 'box': return <Box size={24} />;
      case 'cloud': return <Cloud size={24} />;
      case 'database': return <Database size={24} />;
      default: return <Plus size={24} />;
    }
  };

  return (
    <motion.div 
      key="plugins"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="max-w-6xl mx-auto p-8 pb-32 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">Plugin Store</h2>
            <p className="text-zinc-500 text-sm">Expand your Mimocode ecosystem with expert-grade plugins</p>
          </div>
          <button 
            onClick={fetchPluginStore}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-400 transition-all"
            disabled={isPluginsLoading}
          >
            <RefreshCw size={20} className={isPluginsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin) => (
            <div key={plugin.id} className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm rounded-[2rem] p-8 flex flex-col hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setSelectedPlugin(plugin)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400"
                >
                  <Info size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  plugin.installed ? 'bg-green-500/10 text-green-500' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'
                }`}>
                  {getIcon(plugin.icon)}
                </div>
              </div>

              <h3 className="text-xl font-bold text-zinc-100 mb-3">{plugin.name}</h3>
              <p className="text-sm text-zinc-500 line-clamp-3 flex-1 mb-8 leading-relaxed">
                {plugin.description}
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-zinc-700">
                      {plugin.author[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">{plugin.author}</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono bg-zinc-950 px-2 py-1 rounded-md">{plugin.version}</div>
                </div>

                {plugin.installed ? (
                  <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/5 text-green-500 rounded-2xl text-xs font-bold uppercase tracking-widest border border-green-500/20 shadow-inner">
                    <CheckCircle2 size={14} /> Installed
                  </div>
                ) : (
                  <button 
                    onClick={() => onInstall(plugin.id)}
                    disabled={installingId === plugin.id}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {installingId === plugin.id ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Installing...
                      </>
                    ) : (
                      <>
                        <Download size={14} /> Install Plugin
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {plugins.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/10 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <Box size={64} className="opacity-10 mb-6" />
            <p className="text-lg font-medium">Marketplace is currently empty</p>
            <button onClick={fetchPluginStore} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold underline">Refresh Catalog</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPlugin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedPlugin(null)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="p-10">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
                    {getIcon(selectedPlugin.icon)}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white mb-2">{selectedPlugin.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-zinc-700">v{selectedPlugin.version}</span>
                      <span className="text-zinc-500 text-sm italic">by {selectedPlugin.author}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Plugin Capabilities</h4>
                    <p className="text-zinc-300 leading-relaxed">
                      {selectedPlugin.details || selectedPlugin.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 flex items-center gap-3">
                      <ShieldCheck className="text-green-500" size={20} />
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">Verified Security</div>
                    </div>
                    <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 flex items-center gap-3">
                      <Zap className="text-amber-500" size={20} />
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">Low Latency Tools</div>
                    </div>
                  </div>

                  <div className="pt-6">
                    {selectedPlugin.installed ? (
                      <button className="w-full py-4 bg-zinc-800 text-zinc-500 rounded-2xl font-bold cursor-not-allowed border border-zinc-700">
                        Plugin Already Installed
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          onInstall(selectedPlugin.id);
                          setSelectedPlugin(null);
                        }}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/30 text-lg"
                      >
                        Install Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
