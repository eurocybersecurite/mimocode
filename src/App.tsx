import React, { useEffect, useRef, useState, Fragment } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import axios from 'axios';
import { 
  Terminal as TerminalIcon, 
  Zap, 
  Settings, 
  History as HistoryIcon, 
  Info, 
  Layout, 
  Code, 
  Globe, 
  Download, 
  Activity, 
  Users, 
  Plus, 
  Trash2, 
  Play, 
  FileJson, 
  Upload, 
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Folder,
  File,
  Save,
  FileCode,
  Map as MapIcon,
  Share2,
  GitBranch,
  Lock as LockIcon,
  Check,
  GitCommit,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Cpu,
  RefreshCw,
  RotateCcw,
  Lightbulb
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// Page Components
import { TerminalPage } from './components/pages/TerminalPage';
import { AgentsPage } from './components/pages/AgentsPage';
import { FilesPage } from './components/pages/FilesPage';
import { HistoryPage } from './components/pages/HistoryPage';
import { ChatHistoryPage } from './components/pages/ChatHistoryPage';
import { SkillsPage } from './components/pages/SkillsPage';
import { PreviewPage } from './components/pages/PreviewPage';
import { TimelinePage } from './components/pages/TimelinePage';
import { DashboardPage } from './components/pages/DashboardPage';
import { SearchPage } from './components/pages/SearchPage';
import { OrchestrationPage } from './components/pages/OrchestrationPage';
import { RoadmapPage } from './components/pages/RoadmapPage';
import { GitPage } from './components/pages/GitPage';
import { SecretsPage } from './components/pages/SecretsPage';
import { PluginsPage } from './components/pages/PluginsPage';
import { MCPPage } from './components/pages/MCPPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { DeployPage } from './components/pages/DeployPage';
import { Timeline } from './components/Timeline';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SystemStatusBar } from './components/SystemStatusBar';

interface Agent {
  name: string;
  description: string;
  systemInstruction?: string;
  role?: string;
  tags?: string[];
  model?: string;
  tools?: string[];
}

interface Config {
  runtime?: string;
  model?: string;
  endpoint?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  theme?: {
    terminal?: {
      background?: string;
      foreground?: string;
      cursor?: string;
      fontSize?: number;
      fontFamily?: string;
    };
    web?: {
      primaryColor?: string;
      sidebarBackground?: string;
      fontFamily?: string;
    };
  };
}

interface HistoryEntry {
  agentName: string;
  input: string;
  output: string;
  timestamp: string;
}

export default function App() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const fetchTerminalHistory = async () => {
    try {
      const res = await axios.get('/api/terminal/history');
      setHistory(res.data);
    } catch (e) {
      console.error('Failed to fetch terminal history', e);
    }
  };

  const saveTerminalHistory = async (newHistory: string[]) => {
    try {
      await axios.post('/api/terminal/history', { history: newHistory });
    } catch (e) {
      console.error('Failed to save terminal history', e);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await axios.get('/api/timeline');
      setEvents(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchWorkspace = async () => {
    try {
      const res = await axios.get('/api/workspace');
      setWorkspace(res.data.path);
    } catch (e) { console.error(e); }
  };

  const updateWorkspace = async (path: string) => {
    try {
      const res = await axios.post('/api/workspace', { path });
      setWorkspace(res.data.path);
      fetchFiles(); // Refresh file list for new workspace
      alert(`Workspace changed to: ${res.data.path}`);
    } catch (e) { 
      console.error(e);
      alert('Failed to change workspace.');
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchWorkspace();
    fetchAgents();
    fetchHistory();
    fetchSkills();
    fetchFiles();
    fetchMcpData();
    fetchGitStatus();
    fetchGitBranches();
    fetchSecrets();
    fetchPluginStore();
    fetchDashboardMetrics();
    fetchTerminalHistory();
    fetchTimeline();
    fetchPendingSkills();

    const fetchRemoteStatus = async () => {
      try {
        const apiKey = import.meta.env.VITE_MIMOCODE_API_KEY;
        const res = await axios.get('/api/remote/status', { params: { apiKey } });
        setRemoteStatus(res.data);
      } catch (e) {
        setRemoteStatus(null);
      }
    };
    fetchRemoteStatus();
    const interval = setInterval(fetchRemoteStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [richOutput, setRichOutput] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'terminal' | 'split' | 'rich'>('split');
  const [activeTab, setActiveTab] = useState<'terminal' | 'agents' | 'history' | 'chat' | 'skills' | 'files' | 'preview' | 'timeline' | 'deploy' | 'dashboard' | 'roadmap' | 'mcp' | 'search' | 'orchestration' | 'git' | 'secrets' | 'plugins' | 'settings'>('terminal');
  const [remoteStatus, setRemoteStatus] = useState<any>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Files State
  const [files, setFiles] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState('.');
  const currentPathRef = useRef(currentPath);
  useEffect(() => { currentPathRef.current = currentPath; }, [currentPath]);
  const [openFiles, setOpenFiles] = useState<{path: string, content: string, originalContent: string, isDirty: boolean}[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [editorSearchTerm, setEditorSearchTerm] = useState('');
  const [editorReplaceTerm, setEditorReplaceTerm] = useState('');
  const [showEditorSearch, setShowEditorSearch] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingDir, setIsCreatingDir] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [fileTree, setFileTree] = useState<any[]>([]);

  // Orchestration State
  const [orchestrationNodes, setOrchestrationNodes] = useState<any[]>([
    { id: 'lead', name: 'Lead Agent', type: 'lead', status: 'idle', pos: { x: 50, y: 50 } }
  ]);
  const [orchestrationEdges, setOrchestrationEdges] = useState<any[]>([]);
  const [orchestrationLogs, setOrchestrationLogs] = useState<any[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  // Agents State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [execHistory, setExecHistory] = useState<HistoryEntry[]>([]);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newAgent, setNewAgent] = useState<Agent>({ name: '', description: '', systemInstruction: '', tags: [] });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [config, setConfig] = useState<any | null>(null);
  const [workspace, setWorkspace] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  
  // Real-time Sync State
  const [events, setEvents] = useState<any[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<any>(null);
  const [gitStatus, setGitStatus] = useState<any[]>([]);
  const [gitBranches, setGitBranches] = useState<any[]>([]);
  const [gitDiff, setGitDiff] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [isSecretsLoading, setIsSecretsLoading] = useState(false);
  const [pluginStore, setPluginStore] = useState<any[]>([]);
  const [mcpCatalog, setMcpCatalog] = useState<any[]>([]);
  const [isMcpCatalogOpen, setIsMcpCatalogOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showDiff, setShowDiff] = useState(false);
  const [originalContent, setOriginalContent] = useState('');

  // Skills Management
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', prompt: '', tags: [] });
  const [pendingSkills, setPendingSkills] = useState<any[]>([]);
  const [isPendingSkillsLoading, setIsPendingSkillsLoading] = useState(false);
  const [isGitLoading, setIsGitLoading] = useState(false);
  const [roadmapPhases, setRoadmapPhases] = useState<any[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [agentPerformance, setAgentPerformance] = useState<any>(null);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [confirmDeleteSkill, setConfirmDeleteSkill] = useState<string | null>(null);

  // SSE Connection
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev].slice(0, 100));
      
      if (data.type === 'tool_start' || data.type === 'tool_success' || data.type === 'tool_error') {
        // Auto-refresh files if a file tool was used
        if (['write_file', 'delete_file', 'create_project', 'create_directory'].includes(data.data.name)) {
          fetchFiles(currentPathRef.current);
        }
      }

      if (data.type === 'chat_start' || data.type === 'chat_end') {
        fetchChatHistory();
      }

      if (data.type.startsWith('deploy_')) {
        setDeployStatus(data.data);
        if (data.type === 'deploy_success' || data.type === 'deploy_error') {
          setIsDeploying(false);
        }
      }

      // Orchestration Events
      if (data.type === 'plan_generated') {
        const steps = data.data.steps;
        const nodes = [
          { id: 'lead', name: 'Lead Agent', type: 'lead', status: 'idle', pos: { x: 50, y: 50 } },
          ...steps.map((s: any, i: number) => ({
            id: `step-${s.id}`,
            name: s.description,
            type: 'step',
            status: 'pending',
            pos: { x: 250, y: 50 + (i * 100) }
          }))
        ];
        const edges = steps.map((s: any, i: number) => ({
          id: `e-${i}`,
          source: i === 0 ? 'lead' : `step-${steps[i-1].id}`,
          target: `step-${s.id}`
        }));
        setOrchestrationNodes(nodes);
        setOrchestrationEdges(edges);
        setOrchestrationLogs(prev => [{ timestamp: new Date().toISOString(), message: `Plan generated with ${steps.length} steps.` }, ...prev]);
      }

      if (data.type === 'step_start') {
        setOrchestrationNodes(prev => prev.map(n => 
          n.id === `step-${data.data.stepId}` ? { ...n, status: 'running' } : n
        ));
        setOrchestrationLogs(prev => [{ timestamp: new Date().toISOString(), message: `Starting step: ${data.data.description}` }, ...prev]);
      }

      if (data.type === 'step_completed') {
        setOrchestrationNodes(prev => prev.map(n => 
          n.id === `step-${data.data.stepId}` ? { ...n, status: 'completed' } : n
        ));
        setOrchestrationLogs(prev => [{ timestamp: new Date().toISOString(), message: `Step ${data.data.stepId} completed.` }, ...prev]);
      }

      if (data.type === 'skill_suggestion') {
        fetchPendingSkills();
      }
    };
    return () => eventSource.close();
  }, []);
  const fetchDashboardMetrics = async () => {
    try {
      const [agentsRes, historyRes, skillsRes, gitRes] = await Promise.all([
        axios.get('/api/agents/details'),
        axios.get('/api/history'),
        axios.get('/api/skills'),
        axios.get('/api/git/status')
      ]);
      
      const metrics = {
        totalAgents: agentsRes.data.length,
        totalActions: historyRes.data.length,
        totalSkills: skillsRes.data.length,
        gitChanges: gitRes.data.length,
        activityData: [
          { name: 'Mon', actions: 12 },
          { name: 'Tue', actions: 19 },
          { name: 'Wed', actions: 15 },
          { name: 'Thu', actions: 22 },
          { name: 'Fri', actions: 30 },
          { name: 'Sat', actions: 10 },
          { name: 'Sun', actions: 5 },
        ]
      };
      setDashboardMetrics(metrics);
    } catch (e) { console.error(e); }
  };

  const saveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await axios.post('/api/config', config);
      setIsSaving(false);
      alert('Settings saved successfully!');
    } catch (e) {
      console.error(e);
      setIsSaving(false);
      alert('Failed to save settings.');
    }
  };

  // History Expansion
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHealConfirmOpen, setIsHealConfirmOpen] = useState(false);
  const [isImproveConfirmOpen, setIsImproveConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isRagClearConfirmOpen, setIsRagClearConfirmOpen] = useState(false);
  const [isSystemActionLoading, setIsSystemActionLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any } | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // MCP State
  const [isAddMCPModalOpen, setIsAddMCPModalOpen] = useState(false);
  const [isEditMCPModalOpen, setIsEditMCPModalOpen] = useState(false);
  const [editingMCP, setEditingMCP] = useState<any>(null);
  const [newMCP, setNewMCP] = useState({ name: '', type: 'stdio' as 'stdio' | 'http', command: '', args: [] as string[], url: '' });
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [mcpStats, setMcpStats] = useState<any>({ connectedServers: 0, activeTools: 0, status: 'Loading...' });

  const fetchMcpData = async () => {
    try {
      const [toolsRes, statsRes] = await Promise.all([
        axios.get('/api/mcp/tools'),
        axios.get('/api/mcp/stats')
      ]);
      setMcpTools(toolsRes.data);
      setMcpStats(statsRes.data);
    } catch (e) { console.error(e); }
  };

  const handleAddMCP = async () => {
    try {
      await axios.post('/api/config/mcp', newMCP);
      setIsAddMCPModalOpen(false);
      fetchConfig();
      setNewMCP({ name: '', type: 'stdio', command: '', args: [], url: '' });
    } catch (e) { console.error(e); }
  };

  const handleUpdateMCP = async () => {
    if (!editingMCP) return;
    try {
      await axios.put(`/api/mcp/servers/${editingMCP.name}`, editingMCP);
      setIsEditMCPModalOpen(false);
      fetchConfig();
      setEditingMCP(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteMCP = async (name: string) => {
    if (!confirm(`Are you sure you want to delete MCP server ${name}?`)) return;
    try {
      await axios.delete(`/api/mcp/servers/${name}`);
      fetchConfig();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!editingAgent) return;
    const timer = setTimeout(async () => {
      try {
        await axios.post('/api/agents', editingAgent);
        fetchAgents();
      } catch (e) { console.error(e); }
    }, 1000); // 1s debounce
    return () => clearTimeout(timer);
  }, [editingAgent]);

  const fetchChatHistory = async () => {
    setIsChatLoading(true);
    try {
      const res = await axios.get('/api/chat/history');
      setChatHistory(res.data);
    } catch (e) { console.error(e); }
    finally { setIsChatLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'chat') fetchChatHistory();
  }, [activeTab]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/config');
      setConfig(res.data);
      fetchModels();
    } catch (e) { console.error(e); }
  };

  const fetchModels = async () => {
    setIsModelsLoading(true);
    try {
      const res = await axios.get('/api/models');
      setAvailableModels(res.data);
    } catch (e) { 
      console.error(e);
      setAvailableModels([]);
    } finally {
      setIsModelsLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<Config>) => {
    try {
      const res = await axios.post('/api/config', newConfig);
      setConfig(res.data.config);
    } catch (e) { console.error(e); }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get('/api/agents/details');
      setAgents(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/history');
      setExecHistory(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchSkills = async () => {
    try {
      const res = await axios.get('/api/skills');
      setSkills(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchPendingSkills = async () => {
    setIsPendingSkillsLoading(true);
    try {
      const res = await axios.get('/api/skills/pending');
      setPendingSkills(res.data);
    } catch (e) {
      console.error('Failed to fetch pending skills', e);
    } finally {
      setIsPendingSkillsLoading(false);
    }
  };

  const handleRunSkill = (name: string) => {
    setActiveTab('terminal');
    setTimeout(() => {
      if (xtermRef.current) {
        xtermRef.current.focus();
        const cmd = `mimocode skill run ${name}`;
        xtermRef.current.write(cmd);
        executeCommand(cmd);
      }
    }, 100);
  };

  const approveSkill = async (id: string) => {
    try {
      await axios.post('/api/skills/pending/approve', { id });
      fetchPendingSkills();
      fetchSkills();
    } catch (e) {
      console.error('Failed to approve skill', e);
    }
  };

  const rejectSkill = async (id: string) => {
    try {
      await axios.post('/api/skills/pending/reject', { id });
      fetchPendingSkills();
    } catch (e) {
      console.error('Failed to reject skill', e);
    }
  };

  const fetchFiles = async (path = '.') => {
    try {
      const res = await axios.get(`/api/files/list?dirPath=${path}`);
      setFiles(res.data);
      setCurrentPath(path);
      fetchFileTree(); // Also refresh tree
    } catch (e) { console.error(e); }
  };

  const fetchFileTree = async () => {
    try {
      const res = await axios.get('/api/files/tree');
      setFileTree(res.data);
    } catch (e) { console.error(e); }
  };

  const readFile = async (path: string) => {
    // Check if already open
    const existing = openFiles.find(f => f.path === path);
    if (existing) {
      setActiveFile(path);
      setFileContent(existing.content);
      setOriginalContent(existing.originalContent);
      setHasUnsavedChanges(existing.isDirty);
      return;
    }

    try {
      const res = await axios.get(`/api/files/read?filePath=${path}`);
      const newFile = {
        path,
        content: res.data.content,
        originalContent: res.data.content,
        isDirty: false
      };
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFile(path);
      setFileContent(res.data.content);
      setOriginalContent(res.data.content);
      setHasUnsavedChanges(false);
    } catch (e) { console.error(e); }
  };

  const closeFile = (path: string) => {
    setOpenFiles(prev => {
      const newOpenFiles = prev.filter(f => f.path !== path);
      if (activeFile === path) {
        if (newOpenFiles.length > 0) {
          const nextFile = newOpenFiles[newOpenFiles.length - 1];
          setActiveFile(nextFile.path);
          setFileContent(nextFile.content);
          setOriginalContent(nextFile.originalContent);
          setHasUnsavedChanges(nextFile.isDirty);
        } else {
          setActiveFile(null);
          setFileContent('');
          setOriginalContent('');
          setHasUnsavedChanges(false);
        }
      }
      return newOpenFiles;
    });
  };

  const deleteFile = async (path: string) => {
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
    try {
      await axios.post('/api/files/delete', { path });
      fetchFiles(currentPath);
      // Also close if open
      closeFile(path);
    } catch (e) { console.error(e); }
  };

  const renameFile = async (oldPath: string, newName: string) => {
    try {
      const dir = oldPath.includes('/') ? oldPath.split('/').slice(0, -1).join('/') : '';
      const newPath = dir ? `${dir}/${newName}` : newName;
      await axios.post('/api/files/move', { source: oldPath, destination: newPath });
      setIsRenaming(null);
      fetchFiles(currentPath);
      // Update openFiles if renamed
      setOpenFiles(prev => prev.map(f => f.path === oldPath ? { ...f, path: newPath } : f));
      if (activeFile === oldPath) setActiveFile(newPath);
    } catch (e) { console.error(e); }
  };

  const handleReplace = () => {
    if (!editorSearchTerm) return;
    const newContent = fileContent.replaceAll(editorSearchTerm, editorReplaceTerm);
    setFileContent(newContent);
    setHasUnsavedChanges(newContent !== originalContent);
    // Update openFiles
    setOpenFiles(prev => prev.map(f => f.path === activeFile ? { ...f, content: newContent, isDirty: newContent !== f.originalContent } : f));
  };

  const saveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      await axios.post('/api/files/write', { filePath: activeFile, content: fileContent });
      setIsSaving(false);
      setHasUnsavedChanges(false);
      // Update openFiles state
      setOpenFiles(prev => prev.map(f => f.path === activeFile ? { ...f, content: fileContent, originalContent: fileContent, isDirty: false } : f));
    } catch (e) { 
      console.error(e);
      setIsSaving(false);
    }
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchTerm) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`/api/search?q=${globalSearchTerm}`);
      setSearchResults(res.data);
    } catch (e) { console.error(e); }
    finally { setIsSearching(false); }
  };

  // Auto-save logic
  useEffect(() => {
    if (!hasUnsavedChanges || !activeFile) return;
    
    const timer = setTimeout(() => {
      saveFile();
    }, 2000); // 2s auto-save
    
    return () => clearTimeout(timer);
  }, [fileContent, activeFile, hasUnsavedChanges]);

  const handleCreateItem = async (isDirectory: boolean) => {
    if (!newItemName) return;
    try {
      const path = currentPath === '.' ? newItemName : `${currentPath}/${newItemName}`;
      await axios.post('/api/files/create', { path, isDirectory });
      setNewItemName('');
      setIsCreatingFile(false);
      setIsCreatingDir(false);
      fetchFiles(currentPath);
    } catch (e) { console.error(e); }
  };

  const searchFiles = async (query: string) => {
    setFileSearchTerm(query);
    if (!query) {
      fetchFiles(currentPath);
      return;
    }
    try {
      const res = await axios.get(`/api/files/search?query=${query}`);
      setFiles(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const file = params.get('file');
    if (tab && ['terminal', 'agents', 'history', 'skills', 'files', 'preview'].includes(tab)) {
      setActiveTab(tab as any);
    }
    if (file) {
      readFile(file);
    }
  }, []);

  useEffect(() => {
    if (!xtermRef.current || !config?.theme?.terminal) return;
    
    xtermRef.current.options.fontSize = config.theme.terminal.fontSize || 14;
    xtermRef.current.options.fontFamily = config.theme.terminal.fontFamily || 'JetBrains Mono, monospace';
    xtermRef.current.options.theme = {
      background: config.theme.terminal.background || '#09090b',
      foreground: config.theme.terminal.foreground || '#e4e4e7',
      cursor: config.theme.terminal.cursor || '#6366f1',
      selectionBackground: (config.theme.terminal.cursor || '#6366f1') + '44',
    };
  }, [config?.theme?.terminal]);

  useEffect(() => {
    if (activeTab !== 'terminal' || !terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: config?.theme?.terminal?.background || '#09090b',
        foreground: config?.theme?.terminal?.foreground || '#e4e4e7',
        cursor: config?.theme?.terminal?.cursor || '#6366f1',
        selectionBackground: (config?.theme?.terminal?.cursor || '#6366f1') + '44',
      },
      fontSize: config?.theme?.terminal?.fontSize || 14,
      fontFamily: config?.theme?.terminal?.fontFamily || 'JetBrains Mono, monospace',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('\x1b[1;35mWelcome to Mimocode CLI v0.36.4\x1b[0m');
    term.writeln('\x1b[1;32mType "mimocode help" to see available commands.\x1b[0m');
    term.write('\r\n$ ');

    xtermRef.current = term;

    const commands = [
      'config', 'agents', 'chat', 'heal', 'write', 'search', 'find', 'improve', 'list-agents', 'compare', 'remote', 'rag', 'skill', 'restore', 'learn'
    ];
    const agentSubcommands = ['list', 'create', 'history', 'run', 'delete', 'export', 'import'];
    const remoteSubcommands = ['status', 'download'];
    const ragSubcommands = ['index', 'query'];
    const skillSubcommands = ['create', 'list', 'run'];

    let currentLine = '';
    let historyIndex = -1;
    term.onData(async (data) => {
      const code = data.charCodeAt(0);
      if (code === 13) { // Enter
        if (currentLine.trim()) {
          executeCommand(currentLine);
          const newHistory = [...history, currentLine];
          setHistory(newHistory);
          saveTerminalHistory(newHistory);
        }
        term.write('\r\n$ ');
        currentLine = '';
        historyIndex = -1;
      } else if (code === 127) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\x1b[A') { // Up Arrow
        if (history.length > 0) {
          if (historyIndex === -1) historyIndex = history.length - 1;
          else if (historyIndex > 0) historyIndex--;
          
          const h = history[historyIndex];
          term.write('\b \b'.repeat(currentLine.length));
          currentLine = h;
          term.write(h);
        }
      } else if (data === '\x1b[B') { // Down Arrow
        if (historyIndex !== -1) {
          if (historyIndex < history.length - 1) {
            historyIndex++;
            const h = history[historyIndex];
            term.write('\b \b'.repeat(currentLine.length));
            currentLine = h;
            term.write(h);
          } else {
            historyIndex = -1;
            term.write('\b \b'.repeat(currentLine.length));
            currentLine = '';
          }
        }
      } else if (code === 9) { // Tab
        const parts = currentLine.trim().split(/\s+/);
        if (parts[0] === 'mimocode') {
          if (parts.length === 1 || (parts.length === 2 && !currentLine.endsWith(' '))) {
            const prefix = parts[1] || '';
            const matches = commands.filter(c => c.startsWith(prefix));
            if (matches.length === 1) {
              const toAdd = matches[0].slice(prefix.length);
              currentLine += toAdd + ' ';
              term.write(toAdd + ' ');
            } else if (matches.length > 1) {
              term.write('\r\n' + matches.join('  ') + '\r\n$ ' + currentLine);
            }
          } else if (parts[1] === 'agents') {
            if (parts.length === 2 || (parts.length === 3 && !currentLine.endsWith(' '))) {
              const prefix = parts[2] || '';
              const matches = agentSubcommands.filter(s => s.startsWith(prefix));
              if (matches.length === 1) {
                const toAdd = matches[0].slice(prefix.length);
                currentLine += toAdd + ' ';
                term.write(toAdd + ' ');
              } else if (matches.length > 1) {
                term.write('\r\n' + matches.join('  ') + '\r\n$ ' + currentLine);
              }
            } else if (['run', 'delete', 'export'].includes(parts[2])) {
              const prefix = parts[3] || '';
              try {
                const res = await axios.get('/api/agents');
                const agents = res.data as string[];
                const matches = agents.filter(a => a.startsWith(prefix));
                if (matches.length === 1) {
                  const toAdd = matches[0].slice(prefix.length);
                  currentLine += toAdd + ' ';
                  term.write(toAdd + ' ');
                } else if (matches.length > 1) {
                  term.write('\r\n' + matches.join('  ') + '\r\n$ ' + currentLine);
                }
              } catch (e) {}
            }
          } else if (parts[1] === 'remote') {
            if (parts.length === 2 || (parts.length === 3 && !currentLine.endsWith(' '))) {
              const prefix = parts[2] || '';
              const matches = remoteSubcommands.filter(s => s.startsWith(prefix));
              if (matches.length === 1) {
                const toAdd = matches[0].slice(prefix.length);
                currentLine += toAdd + ' ';
                term.write(toAdd + ' ');
              } else if (matches.length > 1) {
                term.write('\r\n' + matches.join('  ') + '\r\n$ ' + currentLine);
              }
            }
          } else if (parts[1] === 'rag') {
            if (parts.length === 2 || (parts.length === 3 && !currentLine.endsWith(' '))) {
              const prefix = parts[2] || '';
              const matches = ragSubcommands.filter(s => s.startsWith(prefix));
              if (matches.length === 1) {
                const toAdd = matches[0].slice(prefix.length);
                currentLine += toAdd + ' ';
                term.write(toAdd + ' ');
              } else if (matches.length > 1) {
                term.write('\r\n' + matches.join('  ') + '\r\n$ ' + currentLine);
              }
            }
          } else if (parts[1] === 'skill') {
            if (parts.length === 2 || (parts.length === 3 && !currentLine.endsWith(' '))) {
              const prefix = parts[2] || '';
              const matches = skillSubcommands.filter(s => s.startsWith(prefix));
              if (matches.length === 1) {
                const toAdd = matches[0].slice(prefix.length);
                currentLine += toAdd + ' ';
                term.write(toAdd + ' ');
              } else if (matches.length > 1) {
                term.write('\r\n' + matches.join('  ') + '\r\n$ ' + currentLine);
              }
            }
          }
        }
      } else {
        currentLine += data;
        term.write(data);
      }
    });

    return () => {
      term.dispose();
      xtermRef.current = null;
    };
  }, [activeTab]);

  const executeCommand = async (cmd: string) => {
    if (!xtermRef.current) return;
    const term = xtermRef.current;

    try {
      // Auto-checkpoint
      await axios.post('/api/checkpoints');

      // Prevent interactive commands in web terminal
      const interactiveCommands = ['chat', 'agents run', 'agents create'];
      if (interactiveCommands.some(c => cmd.includes(c)) && !cmd.includes('-y') && !cmd.includes('--interactive')) {
        // We'll allow them but warn that they might be limited
      }

      let loadingInterval: any;
      let dots = 0;
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      
      term.write('\r\n\x1b[1;36m┌─ Mimocode CLI ───────────────────────────────────────────────────────────────┐\x1b[0m');
      term.write(`\r\n\x1b[1;36m│\x1b[0m \x1b[1;33mExecuting:\x1b[0m ${cmd}`);
      term.write('\r\n\x1b[1;36m└──────────────────────────────────────────────────────────────────────────────┘\x1b[0m');
      term.write('\r\n');

      loadingInterval = setInterval(() => {
        dots = (dots + 1) % spinner.length;
        term.write('\r\x1b[1;33m  ' + spinner[dots] + ' Processing...\x1b[0m');
      }, 80);

      const apiKey = import.meta.env.VITE_MIMOCODE_API_KEY;
      const response = await axios.post('/api/exec', { command: cmd, apiKey });
      
      clearInterval(loadingInterval);
      // Clear "Processing..." line
      term.write('\r\x1b[K');

      const { stdout, stderr, exitCode } = response.data;

      if (stdout) {
        // Simple structured output for large results or code blocks
        if (stdout.includes('```') || stdout.includes('---') || stdout.length > 500) {
          term.write('\r\n' + stdout.replace(/\n/g, '\r\n'));
          setRichOutput(stdout);
        } else {
          term.write('\r\n' + stdout.replace(/\n/g, '\r\n'));
        }
      }
      if (stderr) term.write('\r\n\x1b[1;31m' + stderr.replace(/\n/g, '\r\n') + '\x1b[0m');
      if (exitCode !== 0) term.writeln(`\r\n\x1b[1;31mCommand exited with code ${exitCode}\x1b[0m`);
      
      // Refresh data if agents or history might have changed
      fetchAgents();
      fetchHistory();
      fetchSkills();
      fetchFileTree();
      fetchFiles(currentPath);
      term.write('\r\n$ ');
    } catch (error: any) {
      term.writeln('\r\n\x1b[1;31mExecution Error: ' + error.message + '\x1b[0m');
      term.write('\r\n$ ');
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/agents', newAgent);
      setIsCreatingAgent(false);
      setNewAgent({ name: '', description: '', systemInstruction: '', tags: [] });
      fetchAgents();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAgent = async (name: string) => {
    try {
      await axios.delete(`/api/agents/${name}`);
      setConfirmDelete(null);
      fetchAgents();
    } catch (e) { console.error(e); }
  };

  const handleRunAgent = (name: string) => {
    setActiveTab('terminal');
    // Wait for terminal to mount
    setTimeout(() => {
      if (xtermRef.current) {
        xtermRef.current.focus();
        const cmd = `mimocode agents run ${name}`;
        xtermRef.current.write(cmd);
        executeCommand(cmd);
      }
    }, 100);
  };

  const handleExportAgent = (agent: Agent) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(agent, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${agent.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const agent = JSON.parse(event.target?.result as string);
        await axios.post('/api/agents', agent);
        fetchAgents();
      } catch (e) { console.error(e); }
    };
    reader.readAsText(file);
  };

  const fetchGitStatus = async () => {
    try {
      const res = await axios.get('/api/git/status');
      setGitStatus(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchGitBranches = async () => {
    try {
      const res = await axios.get('/api/git/branches');
      setGitBranches(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCheckout = async (branch: string) => {
    try {
      await axios.post('/api/git/checkout', { branch });
      fetchGitStatus();
      fetchGitBranches();
    } catch (e) { console.error(e); }
  };

  const fetchSecrets = async () => {
    setIsSecretsLoading(true);
    try {
      const res = await axios.get('/api/secrets');
      setSecrets(res.data);
    } catch (e) { console.error(e); }
    finally { setIsSecretsLoading(false); }
  };

  const handleSaveSecret = async (key: string, value: string) => {
    try {
      await axios.post('/api/secrets', { key, value });
      fetchSecrets();
    } catch (e) { console.error(e); }
  };

  const fetchPluginStore = async () => {
    try {
      const res = await axios.get('/api/plugins/store');
      setPluginStore(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchMcpCatalog = async () => {
    try {
      const res = await axios.get('/api/mcp/catalog');
      setMcpCatalog(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchGitDiff = async (filePath?: string) => {
    try {
      const res = await axios.get(`/api/git/diff${filePath ? `?filePath=${filePath}` : ''}`);
      setGitDiff(res.data.diff);
    } catch (e) { console.error(e); }
  };

  const handleCommit = async () => {
    if (!commitMessage) return;
    setIsCommitting(true);
    try {
      await axios.post('/api/git/commit', { message: commitMessage });
      await axios.post('/api/git/push');

      setCommitMessage('');
      fetchGitStatus();
      setGitDiff(null);
    } catch (e: any) { 
      console.error(e); 
    }
    finally { setIsCommitting(false); }
  };

  const handleCreateSecret = async (key: string, value: string) => {
    try {
      await axios.post('/api/secrets', { key, value });
      fetchSecrets();
      setIsCreatingSecret(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteSecret = async (key: string) => {
    if (!confirm(`Are you sure you want to delete secret ${key}?`)) return;
    try {
      await axios.delete(`/api/secrets/${key}`);
      fetchSecrets();
    } catch (e) { console.error(e); }
  };

  const [isCreatingSecret, setIsCreatingSecret] = useState(false);
  const [newSecret, setNewSecret] = useState({ key: '', value: '' });

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/skills', newSkill);
      setIsCreatingSkill(false);
      setNewSkill({ name: '', description: '', prompt: '', tags: [] });
      fetchSkills();
    } catch (e) { console.error(e); }
  };

  const handleDeleteSkill = async (name: string) => {
    try {
      await axios.delete(`/api/skills/${name}`);
      setConfirmDeleteSkill(null);
      fetchSkills();
    } catch (e) { console.error(e); }
  };

  const handleHealSystem = async () => {
    setIsSystemActionLoading(true);
    try {
      const res = await axios.post('/api/exec', { command: 'mimocode heal --fix', apiKey: import.meta.env.VITE_MIMOCODE_API_KEY });
      setRichOutput(res.data.stdout);
      setIsHealConfirmOpen(false);
    } catch (e) { console.error(e); }
    finally { setIsSystemActionLoading(false); }
  };

  const handleImproveSystem = async () => {
    setIsSystemActionLoading(true);
    try {
      const res = await axios.post('/api/exec', { command: 'mimocode improve --apply', apiKey: import.meta.env.VITE_MIMOCODE_API_KEY });
      setRichOutput(res.data.stdout);
      setIsImproveConfirmOpen(false);
    } catch (e) { console.error(e); }
    finally { setIsSystemActionLoading(false); }
  };

  const handleRestoreLatest = async () => {
    setIsSystemActionLoading(true);
    try {
      const res = await axios.post('/api/exec', { command: 'mimocode restore --latest', apiKey: import.meta.env.VITE_MIMOCODE_API_KEY });
      setRichOutput(res.data.stdout);
      setIsRestoreConfirmOpen(false);
    } catch (e) { console.error(e); }
    finally { setIsSystemActionLoading(false); }
  };

  const handleRagClear = async () => {
    setIsSystemActionLoading(true);
    try {
      const res = await axios.post('/api/exec', { command: 'mimocode rag clear', apiKey: import.meta.env.VITE_MIMOCODE_API_KEY });
      setRichOutput(res.data.stdout);
      setIsRagClearConfirmOpen(false);
    } catch (e) { console.error(e); }
    finally { setIsSystemActionLoading(false); }
  };

  const handleVSCodeSetup = async () => {
    setIsSystemActionLoading(true);
    try {
      const res = await axios.post('/api/vscode/setup');
      alert(res.data.result);
    } catch (e) { 
      console.error(e);
      alert('Failed to setup VS Code integration.');
    } finally {
      setIsSystemActionLoading(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await axios.post('/api/deploy', { platform: 'cloudrun' });
    } catch (e) {
      console.error(e);
      setIsDeploying(false);
    }
  };

  const handleInstallPlugin = async (id: string) => {
    try {
      await axios.post('/api/plugins/install', { id });
      fetchPluginStore();
    } catch (e) { console.error(e); }
  };

  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(agentSearchTerm.toLowerCase()) || 
                         a.description.toLowerCase().includes(agentSearchTerm.toLowerCase());
    const matchesTag = !selectedTag || a.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(agents.flatMap(a => a.tags || [])));

  const filteredHistory = execHistory.filter(h => 
    h.agentName.toLowerCase().includes(historySearchTerm.toLowerCase()) || 
    h.input.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    h.output.toLowerCase().includes(historySearchTerm.toLowerCase())
  );

  const getFileIcon = (name: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder size={14} className="text-indigo-500" />;
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode size={14} className="text-blue-400" />;
      case 'json':
        return <FileJson size={14} className="text-yellow-400" />;
      case 'css':
        return <Code size={14} className="text-pink-400" />;
      case 'md':
        return <Info size={14} className="text-zinc-400" />;
      default:
        return <File size={14} className="text-zinc-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 overflow-hidden relative" style={{ fontFamily: config?.theme?.web?.fontFamily || 'Inter, sans-serif' }}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:flex shrink-0`}>
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          config={config}
          fetchAgents={fetchAgents}
          fetchHistory={fetchHistory}
          fetchSkills={fetchSkills}
          fetchFiles={fetchFiles}
          fetchMcpData={fetchMcpData}
          fetchGitStatus={fetchGitStatus}
          fetchSecrets={fetchSecrets}
          fetchPluginStore={fetchPluginStore}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        <Header 
          activeTab={activeTab}
          theme={theme}
          setTheme={setTheme}
          isDeploying={isDeploying}
          deployStatus={deployStatus}
          handleDeploy={handleDeploy}
          setIsCreatingAgent={setIsCreatingAgent}
          handleImportAgent={handleImportAgent}
          setIsCreatingSkill={setIsCreatingSkill}
          setIsSettingsOpen={setIsSettingsOpen}
          config={config}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main className="flex-1 min-w-0 bg-zinc-950 overflow-y-auto custom-scrollbar relative">
          <SystemStatusBar 
            config={config}
            agents={agents}
          />
          <div className="h-full">
            <AnimatePresence mode="wait">
            {activeTab === 'terminal' && (
              <TerminalPage 
                viewMode={viewMode}
                setViewMode={setViewMode}
                terminalRef={terminalRef}
                richOutput={richOutput}
                setRichOutput={setRichOutput}
              />
            )}

            {activeTab === 'agents' && (
              <AgentsPage 
                agentSearchTerm={agentSearchTerm}
                setAgentSearchTerm={setAgentSearchTerm}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                allTags={allTags}
                filteredAgents={filteredAgents}
                setEditingAgent={setEditingAgent}
                handleExportAgent={handleExportAgent}
                setConfirmDelete={setConfirmDelete}
                handleRunAgent={handleRunAgent}
                config={config}
              />
            )}

            {activeTab === 'files' && (
              <FilesPage 
                currentPath={currentPath}
                fetchFiles={fetchFiles}
                readFile={readFile}
                activeFile={activeFile}
                setActiveFile={setActiveFile}
                fileTree={fileTree}
                isCreatingFile={isCreatingFile}
                setIsCreatingFile={setIsCreatingFile}
                isCreatingDir={isCreatingDir}
                setIsCreatingDir={setIsCreatingDir}
                newItemName={newItemName}
                setNewItemName={setNewItemName}
                handleCreateItem={handleCreateItem}
                fileSearchTerm={fileSearchTerm}
                searchFiles={searchFiles}
                openFiles={openFiles}
                closeFile={closeFile}
                hasUnsavedChanges={hasUnsavedChanges}
                showEditorSearch={showEditorSearch}
                setShowEditorSearch={setShowEditorSearch}
                showDiff={showDiff}
                setShowDiff={setShowDiff}
                saveFile={saveFile}
                isSaving={isSaving}
                fileContent={fileContent}
                setFileContent={setFileContent}
                setHasUnsavedChanges={setHasUnsavedChanges}
                setOpenFiles={setOpenFiles}
                theme={theme}
                originalContent={originalContent}
                editorSearchTerm={editorSearchTerm}
                setEditorSearchTerm={setEditorSearchTerm}
                editorReplaceTerm={editorReplaceTerm}
                setEditorReplaceTerm={setEditorReplaceTerm}
                handleReplace={handleReplace}
                getFileIcon={getFileIcon}
              />
            )}

            {activeTab === 'search' && (
              <SearchPage 
                globalSearchTerm={globalSearchTerm}
                setGlobalSearchTerm={setGlobalSearchTerm}
                handleGlobalSearch={handleGlobalSearch}
                searchResults={searchResults}
                isSearching={isSearching}
                readFile={readFile}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'orchestration' && (
              <OrchestrationPage 
                orchestrationNodes={orchestrationNodes}
                orchestrationEdges={orchestrationEdges}
                orchestrationLogs={orchestrationLogs}
                setOrchestrationNodes={setOrchestrationNodes}
                setOrchestrationEdges={setOrchestrationEdges}
                setOrchestrationLogs={setOrchestrationLogs}
                mcpTools={mcpTools}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelinePage 
                events={events}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'roadmap' && (
              <RoadmapPage 
                roadmapPhases={roadmapPhases}
              />
            )}
            {activeTab === 'dashboard' && (
              <DashboardPage 
                dashboardMetrics={dashboardMetrics}
                agentPerformance={agentPerformance}
                execHistory={execHistory}
                agents={agents}
                skills={skills}
              />
            )}

            {activeTab === 'deploy' && (
              <DeployPage 
                handleDeploy={handleDeploy}
                isDeploying={isDeploying}
                deployStatus={deployStatus}
                config={config}
              />
            )}

            {activeTab === 'preview' && (
              <PreviewPage 
                windowLocationOrigin={window.location.origin}
              />
            )}

            {activeTab === 'history' && (
              <HistoryPage 
                historySearchTerm={historySearchTerm}
                setHistorySearchTerm={setHistorySearchTerm}
                filteredHistory={filteredHistory}
                setSelectedHistoryEntry={setSelectedHistoryEntry}
                expandedHistoryIndex={expandedHistoryIndex}
                setExpandedHistoryIndex={setExpandedHistoryIndex}
              />
            )}

            {activeTab === 'chat' && (
              <ChatHistoryPage 
                fetchChatHistory={fetchChatHistory}
                isChatLoading={isChatLoading}
                chatHistory={chatHistory}
              />
            )}

            {activeTab === 'secrets' && (
              <SecretsPage 
                secrets={Object.entries(secrets).map(([name, value]) => ({ name, value }))}
                fetchSecrets={fetchSecrets}
                isSecretsLoading={isSecretsLoading}
                handleDeleteSecret={handleDeleteSecret}
                setIsCreatingSecret={setIsCreatingSecret}
              />
            )}

            {activeTab === 'plugins' && (
              <PluginsPage 
                plugins={pluginStore}
                fetchPluginStore={fetchPluginStore}
                isPluginsLoading={false}
                handleInstallPlugin={handleInstallPlugin}
              />
            )}

            {activeTab === 'git' && (
              <GitPage 
                fetchGitStatus={fetchGitStatus}
                fetchGitBranches={fetchGitBranches}
                gitBranches={gitBranches}
                handleCheckout={handleCheckout}
                gitStatus={gitStatus}
                fetchGitDiff={fetchGitDiff}
                commitMessage={commitMessage}
                setCommitMessage={setCommitMessage}
                handleCommit={handleCommit}
                isCommitting={isCommitting}
                gitDiff={gitDiff || ''}
                isGitLoading={isGitLoading}
              />
            )}

            {activeTab === 'mcp' && (
              <MCPPage 
                mcpServers={config?.mcpServers || []}
                mcpTools={mcpTools}
                fetchMCPServers={fetchMcpData}
                isMCPLoading={false}
                setIsCreatingMCPServer={() => setIsAddMCPModalOpen(true)}
                setEditingMCP={(server) => {
                  setEditingMCP(server);
                  setIsEditMCPModalOpen(true);
                }}
                handleDeleteMCP={handleDeleteMCP}
              />
            )}

            {activeTab === 'skills' && (
              <SkillsPage 
                skillSearchTerm={skillSearchTerm}
                setSkillSearchTerm={setSkillSearchTerm}
                skills={skills}
                setConfirmDeleteSkill={setConfirmDeleteSkill}
                handleRunSkill={handleRunSkill}
                fetchSkills={fetchSkills}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage 
                config={config}
                setConfig={setConfig}
                saveConfig={saveConfig}
                isSaving={isSaving}
                handleHealSystem={handleHealSystem}
                handleImproveSystem={handleImproveSystem}
                handleRestoreLatest={handleRestoreLatest}
                handleRagClear={handleRagClear}
                handleVSCodeSetup={handleVSCodeSetup}
                isSystemActionLoading={isSystemActionLoading}
                workspace={workspace}
                updateWorkspace={updateWorkspace}
              />
            )}
          </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modals */}
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
                    onChange={(e) => setEditingAgent({...editingAgent, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
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
                        onChange={(e) => setNewMCP({ ...newMCP, args: e.target.value.split(',').map(s => s.trim()) })}
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
                        onChange={(e) => setEditingMCP({ ...editingMCP, args: e.target.value.split(',').map(s => s.trim()) })}
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
                            axios.post('/api/mcp/clone', { name: item.name, repoUrl: `https://github.com/modelcontextprotocol/servers/tree/main/src/${item.name}` })
                              .then(() => alert(`Successfully cloned ${item.name} to mcp-servers/${item.name}`));
                          }}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2"
                        >
                          <Download size={12} /> Clone Source
                        </button>
                        <button 
                          onClick={() => {
                            const newMcp = { name: item.name, type: item.type, command: item.command, args: item.args };
                            const updatedMcpServers = [...(config.mcpServers || []), newMcp];
                            axios.post('/api/config', { ...config, mcpServers: updatedMcpServers }).then(() => {
                              setConfig({ ...config, mcpServers: updatedMcpServers });
                              setIsMcpCatalogOpen(false);
                            });
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
      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setContextMenu(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-[70] w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-md"
            >
              <button 
                onClick={() => {
                  setRenameValue(contextMenu.item.name);
                  setIsRenaming(contextMenu.item.path);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Code size={14} /> Rename
              </button>
              <button 
                onClick={() => {
                  deleteFile(contextMenu.item.path);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

