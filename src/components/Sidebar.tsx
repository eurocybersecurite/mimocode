import React from 'react';
import { 
  Terminal as TerminalIcon, 
  Zap, 
  Settings, 
  History as HistoryIcon, 
  Code, 
  Globe, 
  Activity, 
  Users, 
  Plus, 
  FileCode,
  Map as MapIcon,
  Share2,
  GitBranch,
  Lock as LockIcon,
  Search,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  config: any;
  fetchAgents: () => void;
  fetchHistory: () => void;
  fetchSkills: () => void;
  fetchFiles: (path?: string) => void;
  fetchMcpData: () => void;
  fetchGitStatus: () => void;
  fetchSecrets: () => void;
  fetchPluginStore: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  config,
  fetchAgents,
  fetchHistory,
  fetchSkills,
  fetchFiles,
  fetchMcpData,
  fetchGitStatus,
  fetchSecrets,
  fetchPluginStore,
}) => {
  const primaryColor = config?.theme?.web?.primaryColor || '#6366f1';

  const getTabStyle = (tab: string) => {
    if (activeTab === tab) {
      return { 
        color: primaryColor, 
        borderColor: primaryColor + '33', 
        backgroundColor: primaryColor + '11' 
      };
    }
    return {};
  };

  const getTabClassName = (tab: string) => {
    return `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      activeTab === tab 
        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
    }`;
  };

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <TerminalIcon size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Mimocode</h1>
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Enterprise CLI</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-8 custom-scrollbar">
        {/* Core Section */}
        <div>
          <div className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Core</div>
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('terminal')}
              className={getTabClassName('terminal')}
              style={getTabStyle('terminal')}
            >
              <TerminalIcon size={18} /> Terminal
            </button>
            <button 
              onClick={() => {
                setActiveTab('agents');
                fetchAgents();
              }}
              className={getTabClassName('agents')}
              style={getTabStyle('agents')}
            >
              <Users size={18} /> Agents
            </button>
            <button 
              onClick={() => {
                setActiveTab('files');
                fetchFiles();
              }}
              className={getTabClassName('files')}
              style={getTabStyle('files')}
            >
              <FileCode size={18} /> Files
            </button>
          </div>
        </div>

        {/* Tools Section */}
        <div>
          <div className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Tools</div>
          <div className="space-y-1">
            <button 
              onClick={() => {
                setActiveTab('git');
                fetchGitStatus();
              }}
              className={getTabClassName('git')}
              style={getTabStyle('git')}
            >
              <GitBranch size={18} /> Git Source
            </button>
            <button 
              onClick={() => {
                setActiveTab('mcp');
                fetchMcpData();
              }}
              className={getTabClassName('mcp')}
              style={getTabStyle('mcp')}
            >
              <Globe size={18} /> MCP Protocol
            </button>
            <button 
              onClick={() => {
                setActiveTab('plugins');
                fetchPluginStore();
              }}
              className={getTabClassName('plugins')}
              style={getTabStyle('plugins')}
            >
              <Plus size={18} /> Plugin Store
            </button>
            <button 
              onClick={() => {
                setActiveTab('secrets');
                fetchSecrets();
              }}
              className={getTabClassName('secrets')}
              style={getTabStyle('secrets')}
            >
              <LockIcon size={18} /> Secrets Manager
            </button>
          </div>
        </div>

        {/* Insights Section */}
        <div>
          <div className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Insights</div>
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={getTabClassName('dashboard')}
              style={getTabStyle('dashboard')}
            >
              <Layout size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={getTabClassName('timeline')}
              style={getTabStyle('timeline')}
            >
              <Activity size={18} /> Timeline
            </button>
            <button 
              onClick={() => setActiveTab('roadmap')}
              className={getTabClassName('roadmap')}
              style={getTabStyle('roadmap')}
            >
              <MapIcon size={18} /> Roadmap
            </button>
            <button 
              onClick={() => setActiveTab('orchestration')}
              className={getTabClassName('orchestration')}
              style={getTabStyle('orchestration')}
            >
              <Share2 size={18} /> Orchestration
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={getTabClassName('search')}
              style={getTabStyle('search')}
            >
              <Search size={18} /> Global Search
            </button>
          </div>
        </div>

        {/* History Section */}
        <div>
          <div className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">History</div>
          <div className="space-y-1">
            <button 
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={getTabClassName('history')}
              style={getTabStyle('history')}
            >
              <HistoryIcon size={18} /> Execution History
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={getTabClassName('chat')}
              style={getTabStyle('chat')}
            >
              <Users size={18} /> Chat History
            </button>
            <button 
              onClick={() => {
                setActiveTab('skills');
                fetchSkills();
              }}
              className={getTabClassName('skills')}
              style={getTabStyle('skills')}
            >
              <Code size={18} /> Skills
            </button>
          </div>
        </div>

        {/* System Section */}
        <div>
          <div className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">System</div>
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('settings')}
              className={getTabClassName('settings')}
              style={getTabStyle('settings')}
            >
              <Settings size={18} /> Settings
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Local Active
        </div>
        <div className="text-[10px] text-zinc-600 font-mono">v0.36.3-local</div>
      </div>
    </aside>
  );
};

const Layout = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>
  </svg>
);
