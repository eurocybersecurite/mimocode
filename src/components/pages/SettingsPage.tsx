import React from 'react';
import { motion } from 'motion/react';
import { Settings, Zap, Activity, Globe, Save, RefreshCw, Trash2 } from 'lucide-react';

interface SettingsPageProps {
  config: any;
  setConfig: (config: any) => void;
  saveConfig: () => void;
  isSaving: boolean;
  handleHealSystem: () => void;
  handleImproveSystem: () => void;
  handleRestoreLatest: () => void;
  handleRagClear: () => void;
  handleVSCodeSetup: () => void;
  isSystemActionLoading: boolean;
}

export function SettingsPage({
  config,
  setConfig,
  saveConfig,
  isSaving,
  handleHealSystem,
  handleImproveSystem,
  handleRestoreLatest,
  handleRagClear,
  handleVSCodeSetup,
  isSystemActionLoading
}: SettingsPageProps) {
  return (
    <motion.div 
      key="settings"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8"
    >
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">System Settings</h2>
            <p className="text-zinc-500 text-sm">Configure Mimocode behavior and visual appearance</p>
          </div>
          <button 
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:bg-zinc-800"
          >
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Visual Theme */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-indigo-500" /> Visual Identity
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={config.theme?.web?.primaryColor || '#6366f1'} 
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, web: { ...config.theme?.web, primaryColor: e.target.value } } })}
                    className="w-10 h-10 rounded-lg bg-zinc-800 border-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={config.theme?.web?.primaryColor || '#6366f1'} 
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, web: { ...config.theme?.web, primaryColor: e.target.value } } })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">UI Font Family</label>
                <select 
                  value={config.theme?.web?.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => setConfig({ ...config, theme: { ...config.theme, web: { ...config.theme?.web, fontFamily: e.target.value } } })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="Inter, sans-serif">Inter (Modern)</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono (Technical)</option>
                  <option value="system-ui, sans-serif">System Default</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Maintenance */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-green-500" /> Maintenance & Health
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <button 
                onClick={handleHealSystem}
                disabled={isSystemActionLoading}
                className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                    <Activity size={16} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-zinc-200">System Heal</div>
                    <div className="text-[9px] text-zinc-500">Fix common workspace issues</div>
                  </div>
                </div>
                <RefreshCw size={14} className={`text-zinc-600 group-hover:text-green-500 transition-all ${isSystemActionLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleImproveSystem}
                disabled={isSystemActionLoading}
                className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Zap size={16} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-zinc-200">Auto-Improve</div>
                    <div className="text-[9px] text-zinc-500">Optimize code and structure</div>
                  </div>
                </div>
                <RefreshCw size={14} className={`text-zinc-600 group-hover:text-indigo-500 transition-all ${isSystemActionLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleRagClear}
                disabled={isSystemActionLoading}
                className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                    <Trash2 size={16} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-zinc-200">Clear RAG Cache</div>
                    <div className="text-[9px] text-zinc-500">Reset agent memory index</div>
                  </div>
                </div>
                <RefreshCw size={14} className={`text-zinc-600 group-hover:text-red-500 transition-all ${isSystemActionLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Integrations */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} className="text-yellow-500" /> Advanced Integrations
          </h3>
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400">
                <Settings size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-100">VS Code Integration</h4>
                <p className="text-sm text-zinc-500 max-w-md">Enable deep integration with your local VS Code environment for seamless editing and debugging.</p>
              </div>
            </div>
            <button 
              onClick={handleVSCodeSetup}
              disabled={isSystemActionLoading}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700"
            >
              Setup Integration
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
