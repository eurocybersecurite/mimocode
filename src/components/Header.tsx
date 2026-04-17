import React from 'react';
import { 
  Zap, 
  Settings, 
  Globe, 
  Activity, 
  Plus, 
  Upload,
  Menu,
  X
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
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
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
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const primaryColor = config?.theme?.web?.primaryColor || '#6366f1';

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 bg-zinc-950/50 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 lg:hidden hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h2 className="text-sm font-semibold text-zinc-300 capitalize truncate max-w-[120px] sm:max-w-none">{activeTab}</h2>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors hidden sm:block"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Zap size={18} /> : <Activity size={18} />}
        </button>
        {isDeploying ? (
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 text-[10px] sm:text-xs font-medium">
            <Activity size={14} className="animate-spin" />
            <span className="hidden xs:inline">{deployStatus?.step || 'Deploying...'}</span>
          </div>
        ) : (
          <button 
            onClick={handleDeploy}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-[10px] sm:text-xs font-medium transition-colors"
          >
            <Globe size={14} /> <span className="hidden sm:inline">Deploy</span>
          </button>
        )}
        {activeTab === 'agents' && (
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsCreatingAgent(true)}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-white transition-colors shadow-lg"
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
            >
              <Plus size={14} /> <span className="hidden xs:inline">New</span>
            </button>
            <label className="cursor-pointer flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 text-[10px] sm:text-xs text-zinc-400 transition-colors hidden sm:flex">
              <Upload size={14} /> Import
              <input type="file" className="hidden" accept=".json" onChange={handleImportAgent} />
            </label>
          </div>
        )}
        {activeTab === 'skills' && (
          <button 
            onClick={() => setIsCreatingSkill(true)}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-white transition-colors shadow-lg"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
          >
            <Plus size={14} /> <span className="hidden xs:inline">New Skill</span>
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
