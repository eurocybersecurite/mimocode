import React from 'react';
import { 
  Zap, 
  Settings, 
  Globe, 
  Activity, 
  Plus, 
  Upload
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isDeploying: boolean;
  deployStatus: any;
  handleDeploy: () => void;
  setIsCreatingAgent: (open: boolean) => void;
  handleImportAgent: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsCreatingSkill: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  config: any;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  theme,
  setTheme,
  isDeploying,
  deployStatus,
  handleDeploy,
  setIsCreatingAgent,
  handleImportAgent,
  setIsCreatingSkill,
  setIsSettingsOpen,
  config,
}) => {
  const primaryColor = config?.theme?.web?.primaryColor || '#6366f1';

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-zinc-300 capitalize">{activeTab}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Zap size={18} /> : <Activity size={18} />}
        </button>
        {isDeploying ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 text-xs font-medium">
            <Activity size={14} className="animate-spin" />
            {deployStatus?.step || 'Deploying...'}
          </div>
        ) : (
          <button 
            onClick={handleDeploy}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs font-medium transition-colors"
          >
            <Globe size={14} /> Deploy
          </button>
        )}
        {activeTab === 'agents' && (
          <>
            <button 
              onClick={() => setIsCreatingAgent(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors shadow-lg"
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
            >
              <Plus size={14} /> New Agent
            </button>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 text-xs text-zinc-400 transition-colors">
              <Upload size={14} /> Import
              <input type="file" className="hidden" accept=".json" onChange={handleImportAgent} />
            </label>
          </>
        )}
        {activeTab === 'skills' && (
          <button 
            onClick={() => setIsCreatingSkill(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors shadow-lg"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
          >
            <Plus size={14} /> New Skill
          </button>
        )}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};
