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

import { Modals } from './components/Modals';

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

  useEffect(() => {
    fetchConfig();
    fetchAgents();
    fetchHistory();
    fetchSkills();
    fetchFiles();
    fetchMcpData();
    fetchGitStatus();
    fetchSecrets();
    fetchPluginStore();
    fetchDashboardMetrics();
    fetchTerminalHistory();
    fetchTimeline();
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
          fetchFiles(currentPath);
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
  }, [currentPath]);
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
    } catch (e) {
      console.error(e);
      setIsSaving(false);
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
      const res = await axios.get(`/api/chat/history?workspace=${encodeURIComponent(currentPath)}`);
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
    fetchAgents();
    fetchHistory();
    fetchConfig();
    fetchSkills();
    fetchPendingSkills();
    fetchFiles();
    fetchMcpData();
    fetchGitStatus();
    fetchGitBranches();
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

    term.writeln('\x1b[1;34m┌──────────────────────────────────────────────────────────────────────────────┐\x1b[0m');
    term.writeln('\x1b[1;34m│                                                                              │\x1b[0m');
    term.writeln('\x1b[1;34m│   \x1b[1;37mWelcome to \x1b[1;35mMimocode CLI v0.36.4\x1b[1;34m                                            │\x1b[0m');
    term.writeln('\x1b[1;34m│   \x1b[1;32mType "mimocode help" to see available commands.\x1b[1;34m                            │\x1b[0m');
    term.writeln('\x1b[1;34m│                                                                              │\x1b[0m');
    term.writeln('\x1b[1;34m└──────────────────────────────────────────────────────────────────────────────┘\x1b[0m');
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

      // Intercepter les commandes Mimocode et les préfixer
      let commandToExecute = cmd;
      if (cmd.startsWith('skill ') || cmd.startsWith('agents ') || cmd.startsWith('plan ')) {
        commandToExecute = `mimocode ${cmd}`;
      }

      let loadingInterval: any;
      let dots = 0;
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      
      term.write('\r\n\x1b[1;36m┌─ Mimocode CLI ───────────────────────────────────────────────────────────────┐\x1b[0m');
      term.write(`\r\n\x1b[1;36m│\x1b[0m \x1b[1;33mExecuting:\x1b[0m ${commandToExecute}`);
      term.write('\r\n\x1b[1;36m└──────────────────────────────────────────────────────────────────────────────┘\x1b[0m');
      term.write('\r\n');

      loadingInterval = setInterval(() => {
        dots = (dots + 1) % spinner.length;
        term.write('\r\x1b[1;33m  ' + spinner[dots] + ' Processing...\x1b[0m');
      }, 80);

      const apiKey = import.meta.env.VITE_MIMOCODE_API_KEY;
      const response = await axios.post('/api/exec', { command: commandToExecute, apiKey });
      
      clearInterval(loadingInterval);
      // Clear "Processing..." line
      term.write('\r\x1b[K');

      const { stdout, stderr, exitCode } = response.data;

      if (stdout) {
        // Simple structured output for large results or code blocks
        if (stdout.includes('```') || stdout.includes('---') || stdout.length > 500) {
          term.write('\r\n\x1b[1;34m┌──────────────────────────────────────────────────────────────────────────────┐\x1b[0m');
          term.write('\r\n' + stdout.replace(/\n/g, '\r\n'));
          term.write('\r\n\x1b[1;34m└──────────────────────────────────────────────────────────────────────────────┘\x1b[0m');
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
                handleHealSystem={() => {}}
                handleImproveSystem={() => {}}
                handleRestoreLatest={() => {}}
                handleRagClear={() => {}}
                handleVSCodeSetup={() => {}}
                isSystemActionLoading={isSystemActionLoading}
              />
            )}
          </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modals */}
      <Modals 
        editingAgent={editingAgent}
        setEditingAgent={setEditingAgent}
        isAddMCPModalOpen={isAddMCPModalOpen}
        setIsAddMCPModalOpen={setIsAddMCPModalOpen}
        newMCP={newMCP}
        setNewMCP={setNewMCP}
        handleAddMCP={handleAddMCP}
        isEditMCPModalOpen={isEditMCPModalOpen}
        setIsEditMCPModalOpen={setIsEditMCPModalOpen}
        editingMCP={editingMCP}
        setEditingMCP={setEditingMCP}
        handleUpdateMCP={handleUpdateMCP}
        isCreatingAgent={isCreatingAgent}
        setIsCreatingAgent={setIsCreatingAgent}
        newAgent={newAgent}
        setNewAgent={setNewAgent}
        handleCreateAgent={handleCreateAgent}
        isCreatingSkill={isCreatingSkill}
        setIsCreatingSkill={setIsCreatingSkill}
        newSkill={newSkill}
        setNewSkill={setNewSkill}
        handleCreateSkill={handleCreateSkill}
        isCreatingSecret={isCreatingSecret}
        setIsCreatingSecret={setIsCreatingSecret}
        newSecret={newSecret}
        setNewSecret={setNewSecret}
        handleCreateSecret={handleCreateSecret}
        confirmDeleteSkill={confirmDeleteSkill}
        setConfirmDeleteSkill={setConfirmDeleteSkill}
        handleDeleteSkill={handleDeleteSkill}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        handleDeleteAgent={handleDeleteAgent}
        isMcpCatalogOpen={isMcpCatalogOpen}
        setIsMcpCatalogOpen={setIsMcpCatalogOpen}
        mcpCatalog={mcpCatalog}
        config={config}
        setConfig={setConfig}
        isHealConfirmOpen={isHealConfirmOpen}
        setIsHealConfirmOpen={setIsHealConfirmOpen}
        isImproveConfirmOpen={isImproveConfirmOpen}
        setIsImproveConfirmOpen={setIsImproveConfirmOpen}
        isRestoreConfirmOpen={isRestoreConfirmOpen}
        setIsRestoreConfirmOpen={setIsRestoreConfirmOpen}
        isRagClearConfirmOpen={isRagClearConfirmOpen}
        setIsRagClearConfirmOpen={setIsRagClearConfirmOpen}
        handleHealSystem={handleHealSystem}
        handleImproveSystem={handleImproveSystem}
        handleRestoreLatest={handleRestoreLatest}
        handleRagClear={handleRagClear}
        isSystemActionLoading={isSystemActionLoading}
        selectedHistoryEntry={selectedHistoryEntry}
        setSelectedHistoryEntry={setSelectedHistoryEntry}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        updateConfig={updateConfig}
        availableModels={availableModels}
        isModelsLoading={isModelsLoading}
        handleVSCodeSetup={handleVSCodeSetup}
      />
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
