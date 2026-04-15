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
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { CodeEditor } from './components/CodeEditor';
interface Agent {
  name: string;
  description: string;
  systemInstruction: string;
  role?: string;
  tags?: string[];
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
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('mimocode_terminal_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mimocode_terminal_history', JSON.stringify(history));
  }, [history]);
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
  const [openFiles, setOpenFiles] = useState<{ path: string, content: string, originalContent: string, isDirty: boolean }[]>([]);
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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
    };
    return () => eventSource.close();
  }, [currentPath]);

  // Skills Management
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', prompt: '', tags: [] });
  const [confirmDeleteSkill, setConfirmDeleteSkill] = useState<string | null>(null);
  const [pendingSkills, setPendingSkills] = useState<any[]>([]);
  const fetchPendingSkills = async () => {
    try {
      const res = await axios.get('/api/skills/pending');
      setPendingSkills(res.data);
    } catch (e) { console.error(e); }
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
    term.writeln('\x1b[1;34m│   \x1b[1;32mType "help" to see available commands.\x1b[1;34m                                       │\x1b[0m');
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

      // Detect long paste and display summary
      if (data.length > 50 || (data.length > 5 && (data.includes('\r') || data.includes('\n')))) {
        const lines = data.split(/[\r\n]+/).filter(l => l.length > 0);
        const lineCount = lines.length || 1;
        currentLine += data;
        term.write(`\x1b[36m[Pasted Text: ${lineCount} lines]\x1b[0m`);

        // If the paste ends with a carriage return, trigger execution
        if (data.endsWith('\r') || data.endsWith('\n')) {
          if (currentLine.trim()) {
            executeCommand(currentLine);
            setHistory(prev => [...prev, currentLine]);
            currentLine = '';
          }
        }
        return;
      }

      if (code === 13) { // Enter
        if (currentLine.trim()) {
          executeCommand(currentLine);
          setHistory(prev => {
            const newHistory = [...prev, currentLine];
            localStorage.setItem('mimocode_terminal_history', JSON.stringify(newHistory));
            return newHistory;
          });
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
              } catch (e) { }
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
        // Detect long paste and display summary instead of raw text
        if (data.length > 50 || (data.length > 5 && (data.includes('\r') || data.includes('\n')))) {
          const lines = data.split(/[\r\n]+/).filter(l => l.length > 0);
          const lineCount = lines.length || 1;
          currentLine += data;
          term.write(`\x1b[36m[Pasted Text: ${lineCount} lines]\x1b[0m`);
        } else {
          currentLine += data;
          term.write(data);
        }
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

    let cleanCmd = cmd.trim();
    if (cleanCmd === 'help' || cleanCmd === 'h') {
      cleanCmd = 'mimocode --help';
    } else if (!cleanCmd.startsWith('mimocode')) {
      cleanCmd = `mimocode ${cleanCmd}`;
    }

    try {
      // Auto-checkpoint
      await axios.post('/api/checkpoints');

      // Prevent interactive commands in web terminal
      const interactiveCommands = ['chat', 'agents run', 'agents create'];
      if (interactiveCommands.some(c => cleanCmd.includes(c)) && !cleanCmd.includes('-y') && !cleanCmd.includes('--interactive')) {
        // We'll allow them but warn that they might be limited
      }

      let loadingInterval: any;
      let dots = 0;
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

      term.write('\r\n\x1b[1;36m┌─ Mimocode CLI ───────────────────────────────────────────────────────────────┐\x1b[0m');
      term.write(`\r\n\x1b[1;36m│\x1b[0m \x1b[1;33mExecuting:\x1b[0m ${cleanCmd}`);
      term.write('\r\n\x1b[1;36m└──────────────────────────────────────────────────────────────────────────────┘\x1b[0m');
      term.write('\r\n');

      loadingInterval = setInterval(() => {
        dots = (dots + 1) % spinner.length;
        term.write('\r\x1b[1;33m  ' + spinner[dots] + ' Processing...\x1b[0m');
      }, 80);

      const apiKey = import.meta.env.VITE_MIMOCODE_API_KEY;
      const response = await axios.post('/api/exec', { command: cleanCmd, apiKey });

      clearInterval(loadingInterval);
      // Clear "Processing..." line
      term.write('\r\x1b[K');

      const { stdout, stderr, exitCode } = response.data;

      if (stdout) {
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
      const branchRes = await axios.get('/api/git/branches');
      setGitBranches(branchRes.data);
    } catch (e) { console.error(e); }
  };

  const handleCheckout = async (branch: string) => {
    try {
      await axios.post('/api/git/checkout', { branch });
      fetchGitStatus();
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
      // Stage all changes (including package.json)
      await axios.post('/api/git/add', { files: '.' });
      // Perform commit and push
      await axios.post('/api/git/commit', { message: commitMessage });
      await axios.post('/api/git/push');

      setCommitMessage('');
      fetchGitStatus();
      setGitDiff(null);
      alert('Commit et Push réussis !');
    } catch (e: any) { 
      alert('Erreur lors du commit/push : ' + e.message);
      console.error(e); 
    }
    finally { setIsCommitting(false); }
  };
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

  const FileTree = ({ items, depth = 0 }: { items: any[], depth?: number }) => {
    return (
      <div className="space-y-0.5">
        {items.map((item) => (
          <div key={item.path}>
            <button
              onClick={() => item.isDirectory ? fetchFiles(item.path) : readFile(item.path)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, item });
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-all group ${activeFile === item.path ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'}`}
              style={{ paddingLeft: `${(depth + 1) * 12}px` }}
            >
              <div className="shrink-0">
                {getFileIcon(item.name, item.isDirectory)}
              </div>
              {isRenaming === item.path ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => setIsRenaming(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameFile(item.path, renameValue);
                    if (e.key === 'Escape') setIsRenaming(null);
                  }}
                  className="flex-1 bg-zinc-950 border border-indigo-500/50 rounded px-1 py-0.5 text-[10px] focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate flex-1 text-left font-medium">{item.name}</span>
              )}
              {item.isDirectory && (
                <ChevronRight size={12} className="text-zinc-600 group-hover:text-zinc-400 transition-transform" />
              )}
            </button>
            {item.isDirectory && item.children && item.children.length > 0 && (
              <FileTree items={item.children} depth={depth + 1} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const Timeline = () => {
    return (
      <div className="h-full overflow-y-auto p-8 space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Action Timeline</h2>
            <p className="text-zinc-400 text-sm">Real-time history of agent activities and deployments</p>
          </div>
          <button
            onClick={() => setActiveTab('deploy')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Globe size={18} />
            Deploy App
          </button>
        </div>

        <div className="space-y-6">
          {events.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl">
              <Activity size={48} className="mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-500">No events recorded yet. Start interacting with Mimocode!</p>
            </div>
          ) : (
            events.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-6 relative group"
              >
                {i !== events.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg ${event.type.includes('success') || event.type === 'deploy_success' ? 'bg-green-500 text-white' :
                    event.type.includes('error') || event.type === 'deploy_error' ? 'bg-red-500 text-white' :
                      event.type.includes('deploy') ? 'bg-amber-500 text-white' :
                        'bg-indigo-500 text-white'
                  }`}>
                  {event.type.includes('chat') ? <TerminalIcon size={14} /> :
                    event.type.includes('tool') ? <Zap size={14} /> :
                      event.type.includes('deploy') ? <Globe size={14} /> :
                        <Activity size={14} />}
                </div>
                <div className="flex-1 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition-all backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {event.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-200">
                    {event.type === 'tool_start' && (
                      <p>Executing tool <code className="text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">{event.data.name}</code></p>
                    )}
                    {event.type === 'tool_success' && (
                      <p>Successfully executed <code className="text-green-400 font-mono bg-green-500/10 px-1.5 py-0.5 rounded">{event.data.name}</code></p>
                    )}
                    {event.type === 'deploy_progress' && (
                      <div className="space-y-3">
                        <p className="font-medium">{event.data.step}</p>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-500"
                            style={{ width: `${event.data.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {event.type === 'deploy_success' && (
                      <div className="space-y-2">
                        <p className="text-green-400 font-bold">Deployment Successful!</p>
                        <p className="text-xs text-zinc-400">Your application is live at:</p>
                        <a href={event.data.url} target="_blank" className="text-indigo-400 underline break-all">{event.data.url}</a>
                      </div>
                    )}
                    {event.type === 'chat_start' && (
                      <p className="italic text-zinc-400 border-l-2 border-zinc-700 pl-3">"{event.data.input}"</p>
                    )}
                    {typeof event.data === 'string' ? <p>{event.data}</p> : null}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };

  const DeployView = () => {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <Globe size={40} className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">Deploy Your Application</h2>
          <p className="text-zinc-400">Version-checked deployment to GitHub.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <button
            onClick={() => handleDeploy()}
            disabled={isDeploying}
            className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${isDeploying ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                <Globe size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-zinc-100">GitHub Deployment</h3>
                <p className="text-sm text-zinc-500">eurocybersecurite/mimocode.git</p>
              </div>
            </div>
            {isDeploying ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
            ) : (
              <ChevronRight className="text-zinc-600" />
            )}
          </button>
        </div>

        {isDeploying && deployStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-zinc-200">Deployment in Progress</h4>
              <span className="text-indigo-400 font-mono text-sm">{deployStatus.progress}%</span>
            </div>

            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-8">
              <motion.div
                className="h-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${deployStatus.progress}%` }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <CheckCircle2 size={16} className={deployStatus.progress >= 10 ? 'text-green-500' : 'text-zinc-700'} />
                <span className={deployStatus.progress >= 10 ? 'text-zinc-200' : ''}>Checking version compatibility...</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <CheckCircle2 size={16} className={deployStatus.progress >= 30 ? 'text-green-500' : 'text-zinc-700'} />
                <span className={deployStatus.progress >= 30 ? 'text-zinc-200' : ''}>Preparing local changes (git add)...</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <CheckCircle2 size={16} className={deployStatus.progress >= 50 ? 'text-green-500' : 'text-zinc-700'} />
                <span className={deployStatus.progress >= 50 ? 'text-zinc-200' : ''}>Creating release commit...</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <CheckCircle2 size={16} className={deployStatus.progress >= 80 ? 'text-green-500' : 'text-zinc-700'} />
                <span className={deployStatus.progress >= 80 ? 'text-zinc-200' : ''}>Pushing to GitHub repository...</span>
              </div>
            </div>
          </motion.div>
        )}

        {deployStatus?.url && !isDeploying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-green-500/20">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Success!</h3>
            <p className="text-zinc-400 mb-6">Your application is live and ready to use.</p>
            <a
              href={deployStatus.url}
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all"
            >
              Open Application
              <ChevronRight size={18} />
            </a>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 overflow-hidden" style={{ fontFamily: config?.theme?.web?.fontFamily || 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col" style={{ backgroundColor: config?.theme?.web?.sidebarBackground || '#09090b' }}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: config?.theme?.web?.primaryColor || '#6366f1', boxShadow: `0 10px 15px -3px ${(config?.theme?.web?.primaryColor || '#6366f1')}33` }}>
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">mimocode</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'terminal' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'terminal' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <TerminalIcon size={18} /> Terminal
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'agents' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'agents' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Users size={18} /> Agents
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'history' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <HistoryIcon size={18} /> History
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'chat' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Users size={18} /> Chat History
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'skills' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'skills' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Code size={18} /> Skills
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'files' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'files' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Folder size={18} /> Files
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'preview' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Globe size={18} /> Preview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'timeline' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'timeline' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Activity size={18} /> Timeline
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'dashboard' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Layout size={18} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'search' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'search' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Search size={18} /> Global Search
          </button>
          <button
            onClick={() => setActiveTab('orchestration')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'orchestration' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'orchestration' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Share2 size={18} /> Orchestration
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'roadmap' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'roadmap' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <MapIcon size={18} /> Roadmap
          </button>
          <button
            onClick={() => {
              setActiveTab('git');
              fetchGitStatus();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'git' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'git' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <GitBranch size={18} /> Git Source
          </button>
          <button
            onClick={() => {
              setActiveTab('secrets');
              fetchSecrets();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'secrets' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'secrets' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <LockIcon size={18} /> Secrets Manager
          </button>
          <button
            onClick={() => {
              setActiveTab('plugins');
              fetchPluginStore();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'plugins' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'plugins' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Zap size={18} /> Plugin Store
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'mcp' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'mcp' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Zap size={18} /> MCP Protocol
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            style={activeTab === 'settings' ? { color: config?.theme?.web?.primaryColor || '#6366f1', borderColor: (config?.theme?.web?.primaryColor || '#6366f1') + '33', backgroundColor: (config?.theme?.web?.primaryColor || '#6366f1') + '11' } : {}}
          >
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Local Active
          </div>
          <div className="text-[10px] text-zinc-600 font-mono">v0.36.3-local</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
                  style={{ backgroundColor: config?.theme?.web?.primaryColor || '#6366f1', boxShadow: `0 10px 15px -3px ${(config?.theme?.web?.primaryColor || '#6366f1')}33` }}
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
                style={{ backgroundColor: config?.theme?.web?.primaryColor || '#6366f1', boxShadow: `0 10px 15px -3px ${(config?.theme?.web?.primaryColor || '#6366f1')}33` }}
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

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'terminal' && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col p-6"
              >
                <div className="flex-1 flex gap-6 overflow-hidden">
                  {/* Terminal Section */}
                  <div className={`flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${viewMode === 'rich' ? 'hidden' : 'flex'}`}>
                    <div className="h-10 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/80 justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <TerminalIcon size={14} /> Terminal
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex bg-zinc-800/50 p-0.5 rounded-md">
                          <button onClick={() => setViewMode('terminal')} className={`p-1 rounded ${viewMode === 'terminal' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><TerminalIcon size={12} /></button>
                          <button onClick={() => setViewMode('split')} className={`p-1 rounded ${viewMode === 'split' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Layout size={12} /></button>
                          <button onClick={() => setViewMode('rich')} className={`p-1 rounded ${viewMode === 'rich' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Code size={12} /></button>
                        </div>
                      </div>
                    </div>
                    <div ref={terminalRef} className="flex-1 p-4" />
                  </div>

                  {/* Rich Output Section */}
                  <div className={`flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${viewMode === 'terminal' ? 'hidden' : 'flex'}`}>
                    <div className="h-10 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/80 justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <Code size={14} /> Rich Output
                      </div>
                      <button onClick={() => setRichOutput(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest">Clear</button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto prose prose-invert prose-sm max-w-none">
                      {richOutput ? (
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
                          {richOutput}
                        </ReactMarkdown>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                          <Code size={48} className="opacity-20" />
                          <p className="text-sm font-medium">Rich output will appear here</p>
                          <p className="text-xs opacity-50">Try running an agent or a search command</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 overflow-y-auto"
              >
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
              </motion.div>
            )}

            {activeTab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex overflow-hidden"
              >
                {/* File Explorer */}
                <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-950/30">
                  <div className="p-4 border-b border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Explorer</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsCreatingFile(true)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                          title="New File"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => setIsCreatingDir(true)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                          title="New Folder"
                        >
                          <Folder size={14} />
                        </button>
                        <button
                          onClick={() => fetchFiles(currentPath)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                          title="Refresh"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                      <button
                        onClick={() => fetchFiles('.')}
                        className="text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors whitespace-nowrap"
                      >
                        root
                      </button>
                      {currentPath !== '.' && currentPath.split('/').map((part, i, arr) => (
                        <Fragment key={i}>
                          <ChevronRight size={10} className="text-zinc-700 shrink-0" />
                          <button
                            onClick={() => fetchFiles(arr.slice(0, i + 1).join('/'))}
                            className={`text-[10px] whitespace-nowrap transition-colors ${i === arr.length - 1 ? 'text-indigo-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {part}
                          </button>
                        </Fragment>
                      ))}
                    </div>

                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={fileSearchTerm}
                        onChange={(e) => searchFiles(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-[10px] focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {(isCreatingFile || isCreatingDir) && (
                      <div className="px-2 py-1.5 mb-2 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="flex items-center gap-2 mb-2">
                          {isCreatingDir ? <Folder size={12} className="text-indigo-500" /> : <File size={12} className="text-zinc-500" />}
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            New {isCreatingDir ? 'Folder' : 'File'}
                          </span>
                        </div>
                        <input
                          autoFocus
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateItem(isCreatingDir);
                            if (e.key === 'Escape') {
                              setIsCreatingFile(false);
                              setIsCreatingDir(false);
                              setNewItemName('');
                            }
                          }}
                          placeholder="Name..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleCreateItem(isCreatingDir)}
                            className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded"
                          >
                            Create
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingFile(false);
                              setIsCreatingDir(false);
                              setNewItemName('');
                            }}
                            className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {currentPath !== '.' && !fileSearchTerm && (
                      <button
                        onClick={() => fetchFiles(currentPath.split('/').slice(0, -1).join('/') || '.')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 rounded-lg transition-colors"
                      >
                        <ChevronRight size={14} className="rotate-180" /> ..
                      </button>
                    )}
                    <FileTree items={fileTree} />
                    {fileTree.length === 0 && (
                      <div className="py-8 text-center text-zinc-600">
                        <p className="text-[10px] font-medium">No files found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col bg-zinc-900/20">
                  {activeFile ? (
                    <>
                      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center overflow-x-auto no-scrollbar">
                        {openFiles.map(file => (
                          <div
                            key={file.path}
                            onClick={() => readFile(file.path)}
                            className={`h-full px-4 flex items-center gap-2 border-r border-zinc-800 cursor-pointer transition-all min-w-[120px] max-w-[200px] group ${activeFile === file.path ? 'bg-zinc-950 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
                          >
                            <FileCode size={14} className={activeFile === file.path ? 'text-indigo-400' : 'text-zinc-600'} />
                            <span className="text-xs font-medium truncate flex-1">{file.path.split('/').pop()}</span>
                            {file.isDirty && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                closeFile(file.path);
                              }}
                              className="p-1 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            {getFileIcon(activeFile.split('/').pop() || '', false)}
                            {activeFile}
                          </div>
                          {hasUnsavedChanges && (
                            <div className="flex items-center gap-1.5 text-[9px] text-yellow-500 font-bold uppercase tracking-widest">
                              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                              Unsaved
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-zinc-600 font-mono italic mr-2">Auto-saves every 2s</span>
                          <button
                            onClick={() => setShowEditorSearch(!showEditorSearch)}
                            className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${showEditorSearch ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                          >
                            <Search size={12} /> {showEditorSearch ? 'Hide Search' : 'Search & Replace'}
                          </button>
                          <button
                            onClick={() => setShowDiff(!showDiff)}
                            className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${showDiff ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                          >
                            <Layout size={12} /> {showDiff ? 'Hide Diff' : 'Show Diff'}
                          </button>
                          <button
                            onClick={saveFile}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white text-[10px] font-bold uppercase rounded transition-colors"
                          >
                            <Save size={12} /> {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden flex flex-col">
                        {showEditorSearch && (
                          <div className="bg-zinc-900 border-b border-zinc-800 p-2 flex items-center gap-2 animate-in slide-in-from-top duration-200">
                            <div className="flex-1 flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input
                                  type="text"
                                  placeholder="Find..."
                                  value={editorSearchTerm}
                                  onChange={(e) => setEditorSearchTerm(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-[10px] text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                                />
                              </div>
                              <div className="relative flex-1">
                                <Activity size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input
                                  type="text"
                                  placeholder="Replace with..."
                                  value={editorReplaceTerm}
                                  onChange={(e) => setEditorReplaceTerm(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-[10px] text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                                />
                              </div>
                            </div>
                            <button
                              onClick={handleReplace}
                              className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase rounded transition-colors"
                            >
                              Replace All
                            </button>
                            <button
                              onClick={() => setShowEditorSearch(false)}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        {showDiff ? (
                          <div className="flex-1 overflow-auto bg-zinc-950">
                            <ReactDiffViewer
                              oldValue={originalContent}
                              newValue={fileContent}
                              splitView={true}
                              useDarkTheme={theme === 'dark'}
                              styles={{
                                variables: {
                                  dark: {
                                    diffViewerBackground: '#09090b',
                                    diffViewerColor: '#d4d4d8',
                                    addedBackground: '#064e3b',
                                    addedColor: '#34d399',
                                    removedBackground: '#7f1d1d',
                                    removedColor: '#f87171',
                                    wordAddedBackground: '#065f46',
                                    wordRemovedBackground: '#991b1b',
                                    addedGutterBackground: '#064e3b',
                                    removedGutterBackground: '#7f1d1d',
                                    gutterColor: '#52525b',
                                    codeFoldGutterBackground: '#18181b',
                                    codeFoldBackground: '#18181b',
                                    codeFoldContentColor: '#71717a',
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <CodeEditor
                            filePath={activeFile || 'file.txt'}
                            content={fileContent}
                            theme={theme}
                            onChange={(value) => {
                              const newContent = value || '';
                              setFileContent(newContent);
                              setHasUnsavedChanges(true);
                              setOpenFiles(prev => prev.map(f => f.path === activeFile ? {
                                ...f, content: newContent, isDirty:
                                  true
                              } : f));
                            }}
                            onSave={handleCommit}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                      <FileCode size={64} className="opacity-10" />
                      <p className="text-sm font-medium">Select a file to edit</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                  <h3 className="text-xl font-bold text-zinc-100 mb-4">Global Project Search</h3>
                  <form onSubmit={handleGlobalSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search for text in all files..."
                      value={globalSearchTerm}
                      onChange={(e) => setGlobalSearchTerm(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => readFile(result.filePath)}
                      className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileCode size={14} className="text-indigo-400" />
                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{result.filePath}</span>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 font-mono text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors overflow-hidden text-ellipsis whitespace-nowrap">
                        {result.content}
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && !isSearching && globalSearchTerm && (
                    <div className="h-64 flex flex-col items-center justify-center text-zinc-600">
                      <Search size={48} className="opacity-10 mb-4" />
                      <p className="text-sm font-medium">No results found for "{globalSearchTerm}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'orchestration' && (
              <motion.div
                key="orchestration"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100">Agent Orchestration</h3>
                    <p className="text-xs text-zinc-500">Visualize agent delegation and tool usage</p>
                  </div>
                  <button
                    onClick={() => {
                      setOrchestrationNodes([]);
                      setOrchestrationEdges([]);
                      setOrchestrationLogs([]);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                  >
                    <RotateCcw size={14} /> Reset View
                  </button>
                </div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                  <div className="relative w-full max-w-3xl aspect-video bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-inner">
                    <div className="absolute inset-0 p-12">
                      {/* Dynamic Nodes */}
                      {orchestrationNodes.map((node) => (
                        <motion.div
                          key={node.id}
                          layoutId={node.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                            position: 'absolute',
                            left: `${node.pos.x}%`,
                            top: `${node.pos.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 shadow-2xl transition-all z-10 ${node.status === 'active' ? 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/20' :
                              node.status === 'error' ? 'bg-red-600/20 border-red-500 shadow-red-500/20' :
                                'bg-zinc-800 border-zinc-700 shadow-black/50'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${node.status === 'active' ? 'text-indigo-400' : 'text-zinc-500'}`}>
                            {node.type === 'lead' ? <Share2 size={24} /> : <Code size={20} />}
                          </div>
                          <div className="text-center">
                            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{node.type}</div>
                            <div className="text-[11px] font-bold text-zinc-200 truncate px-2">{node.name}</div>
                          </div>
                          {node.status === 'active' && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
                          )}
                        </motion.div>
                      ))}

                      {/* Dynamic Edges (SVG) */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orientation="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#3f3f46" />
                          </marker>
                        </defs>
                        {orchestrationEdges.map((edge, i) => {
                          const from = orchestrationNodes.find(n => n.id === edge.from);
                          const to = orchestrationNodes.find(n => n.id === edge.to);
                          if (!from || !to) return null;
                          return (
                            <motion.line
                              key={i}
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              x1={`${from.pos.x}%`}
                              y1={`${from.pos.y}%`}
                              x2={`${to.pos.x}%`}
                              y2={`${to.pos.y}%`}
                              stroke={edge.status === 'active' ? '#6366f1' : '#3f3f46'}
                              strokeWidth={edge.status === 'active' ? '2' : '1'}
                              strokeDasharray={edge.status === 'active' ? '0' : '4 4'}
                              markerEnd="url(#arrowhead)"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                  <div className="mt-8 w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} /> Live Activity Log
                      </h4>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 h-56 overflow-y-auto font-mono text-[10px] space-y-2 shadow-inner">
                        {orchestrationLogs.length === 0 && <div className="text-zinc-700 italic">Waiting for agent activity...</div>}
                        {orchestrationLogs.map((log, i) => (
                          <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left duration-300">
                            <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                            <span className={`font-bold ${log.type === 'delegate' ? 'text-indigo-400' :
                                log.type === 'tool' ? 'text-yellow-400' :
                                  'text-zinc-400'
                              }`}>{log.type}</span>
                            <span className="text-zinc-300">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} /> Active Tool Usage
                      </h4>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 h-56 overflow-y-auto space-y-3 shadow-inner">
                        {mcpTools.slice(0, 5).map(tool => (
                          <div key={tool.name} className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center text-zinc-500">
                                <Code size={14} />
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-zinc-200">{tool.name}</div>
                                <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Active</div>
                              </div>
                            </div>
                            <div className="text-[10px] font-mono text-indigo-400">12 calls</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-hidden"
              >
                <Timeline />
              </motion.div>
            )}

            {activeTab === 'roadmap' && (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 p-8 overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold mb-2">Business Roadmap</h2>
                  <p className="text-zinc-400 mb-8 text-sm">Strategic milestones and development progress</p>

                  <div className="space-y-12">
                    {[
                      { title: 'MVP Launch', date: 'Q1 2026', status: 'completed', desc: 'Initial release with core agent orchestration and terminal interface.' },
                      { title: 'Expert Marketplace', date: 'Q2 2026', status: 'in-progress', desc: 'Community-driven agent sharing and skill discovery system.' },
                      { title: 'Enterprise MCP', date: 'Q3 2026', status: 'planned', desc: 'Advanced MCP server management and secure data connectors.' },
                      { title: 'Autonomous DevOps', date: 'Q4 2026', status: 'planned', desc: 'Self-healing deployments and automated CI/CD pipeline optimization.' }
                    ].map((step, i) => (
                      <div key={i} className="relative pl-10 border-l-2 border-zinc-800 pb-12 last:pb-0">
                        <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-zinc-950 ${step.status === 'completed' ? 'bg-green-500' : step.status === 'in-progress' ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-800'}`} />
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{step.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${step.status === 'completed' ? 'bg-green-500/10 text-green-500' : step.status === 'in-progress' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            {step.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-100 mb-2">{step.title}</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 p-8 overflow-y-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">
                      <Zap size={14} className="text-indigo-500" />
                      Total Actions
                    </div>
                    <div className="text-4xl font-bold">{execHistory.length}</div>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">
                      <Users size={14} className="text-green-500" />
                      Active Agents
                    </div>
                    <div className="text-4xl font-bold">{agents.length}</div>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">
                      <Code size={14} className="text-yellow-500" />
                      Skills Learned
                    </div>
                    <div className="text-4xl font-bold">{skills.length}</div>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-6">Agent Performance</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/30">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Agent</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Tasks</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map(agent => {
                        const tasks = execHistory.filter(h => h.agentName === agent.name).length;
                        return (
                          <tr key={agent.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-zinc-200">{agent.name}</div>
                              <div className="text-xs text-zinc-500">{agent.role}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-zinc-400">{tasks}</td>
                            <td className="px-6 py-4">
                              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full" style={{ width: '92%' }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'deploy' && (
              <motion.div
                key="deploy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 overflow-y-auto"
              >
                <DeployView />
              </motion.div>
            )}

            {activeTab === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden"
              >
                <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-400">{window.location.origin}</span>
                  </div>
                  <button
                    onClick={() => {
                      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                      if (iframe) iframe.src = iframe.src;
                    }}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                    title="Reload Preview"
                  >
                    <Activity size={14} />
                  </button>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    id="preview-iframe"
                    src={window.location.origin}
                    className="w-full h-full border-none"
                    title="App Preview"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 overflow-hidden flex flex-col"
              >
                <div className="mb-6 relative w-full md:w-96">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search history..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                  {historySearchTerm && (
                    <button
                      onClick={() => setHistorySearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/80">
                          <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Input</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {filteredHistory.reverse().map((entry, i) => (
                          <tr key={i} className="hover:bg-zinc-800/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-600/10 rounded-md flex items-center justify-center text-indigo-500">
                                  <Users size={12} />
                                </div>
                                <span className="text-xs font-medium text-zinc-300">@{entry.agentName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-zinc-500 truncate max-w-md">{entry.input}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] text-zinc-600 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedHistoryEntry(entry)}
                                  className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-400"
                                >
                                  View Output
                                </button>
                                <button
                                  onClick={() => setExpandedHistoryIndex(expandedHistoryIndex === i ? null : i)}
                                  className="text-zinc-500 hover:text-zinc-300"
                                >
                                  {expandedHistoryIndex === i ? <ChevronRight size={14} className="rotate-90" /> : <ChevronRight size={14} />}
                                </button>
                              </div>
                              {expandedHistoryIndex === i && (
                                <div className="mt-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800 overflow-x-auto max-h-96">
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
                                    {entry.output}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredHistory.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                      <HistoryIcon size={48} className="opacity-20 mb-4" />
                      <p className="text-sm font-medium">No history entries found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 overflow-y-auto space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-100">Full Conversation History</h3>
                  <button
                    onClick={fetchChatHistory}
                    className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
                    disabled={isChatLoading}
                  >
                    <Activity size={18} className={isChatLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {chatHistory.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-600">
                    <Users size={48} className="opacity-20 mb-4" />
                    <p className="text-sm font-medium">No chat history found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl border ${msg.role === 'user'
                            ? 'bg-indigo-600/10 border-indigo-500/30 text-zinc-200'
                            : msg.role === 'system'
                              ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500 text-xs italic'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{msg.role}</span>
                          </div>
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
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'secrets' && (
              <motion.div
                key="secrets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col p-6 overflow-y-auto"
              >
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-zinc-100">Secrets Manager</h3>
                  <p className="text-xs text-zinc-500">Manage environment variables and API keys safely</p>
                </div>

                <div className="grid grid-cols-1 gap-4 max-w-3xl">
                  {Object.entries(secrets).map(([key, value]) => (
                    <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                        <LockIcon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{key}</div>
                        <input
                          type="password"
                          value={value}
                          onChange={(e) => setSecrets(prev => ({ ...prev, [key]: e.target.value }))}
                          onBlur={() => handleSaveSecret(key, value)}
                          className="w-full bg-transparent border-none p-0 text-sm text-zinc-200 focus:ring-0"
                        />
                      </div>
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => {
                          if (confirm(`Delete secret ${key}?`)) {
                            axios.delete(`/api/secrets/${key}`).then(() => fetchSecrets());
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const key = prompt('Enter secret key (e.g. STRIPE_API_KEY):');
                      if (key) handleSaveSecret(key, '');
                    }}
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all"
                  >
                    <Plus size={16} /> Add New Secret
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'plugins' && (
              <motion.div
                key="plugins"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col p-6 overflow-y-auto"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100">Plugin Store</h3>
                    <p className="text-xs text-zinc-500">Extend Mimocode with community and official plugins</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <Search size={14} className="text-zinc-500" />
                    <input type="text" placeholder="Search plugins..." className="bg-transparent border-none p-0 text-xs text-zinc-300 focus:ring-0 w-48" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pluginStore.map(plugin => (
                    <div key={plugin.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-zinc-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                          <Zap size={20} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800 uppercase tracking-widest">{plugin.version}</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100 mb-1">{plugin.name}</h4>
                      <p className="text-[11px] text-zinc-500 mb-4 line-clamp-2">{plugin.description}</p>
                      <div className="mt-auto pt-4 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-600 font-medium tracking-wide">@{plugin.author}</span>
                        <button
                          onClick={() => axios.post('/api/plugins/install', { url: plugin.url })}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                          Install
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'git' && (
              <motion.div
                key="git"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100">Git Source Control</h3>
                    <p className="text-xs text-zinc-500">Manage changes and commits</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {gitBranches.length === 0 && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.post('/api/exec', { command: 'git init && git add . && git commit -m "Initial commit"' });
                            fetchGitStatus();
                          } catch (e) { console.error(e); }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        <GitBranch size={14} /> Initialize Repository
                      </button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                      <select id="versionBump" className="bg-transparent text-[10px] text-zinc-400 focus:outline-none cursor-pointer">
                        <option value="patch">Patch</option>
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                      </select>
                      <button
                        onClick={async () => {
                          const type = (document.getElementById('versionBump') as HTMLSelectElement).value;
                          await axios.post('/api/git/version/bump', { type });
                          fetchGitStatus();
                        }}
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded shadow-sm transition-colors"
                      >
                        Bump
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        axios.post('/api/git/pull')
                          .then(() => { fetchGitStatus(); alert('Pull réussi !'); })
                          .catch((err) => alert('Erreur lors du pull : ' + err.message));
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs font-medium transition-colors"
                      title="Pull changes"
                    >
                      <ArrowDown size={14} /> Pull
                    </button>
                    <button 
                      onClick={() => {
                        axios.post('/api/git/push')
                          .then(() => { fetchGitStatus(); alert('Push réussi !'); })
                          .catch((err) => alert('Erreur lors du push : ' + err.message));
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs font-medium transition-colors"
                      title="Push changes"
                    >
                      <ArrowUp size={14} /> Push
                    </button>                    <button
                      onClick={fetchGitStatus}
                      className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
                      title="Refresh Status"
                    >
                      <Activity size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Changes List */}
                  <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/20">
                    <div className="p-4 border-b border-zinc-800">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Branches</span>
                        <button
                          onClick={() => {
                            const name = prompt('New branch name:');
                            if (name) {
                              axios.post('/api/git/branch/create', { name })
                                .then(() => fetchGitStatus())
                                .catch(err => alert(`Failed to create branch: ${err.response?.data?.error || err.message}`));
                            }
                          }}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-indigo-400 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {gitBranches.map((branch: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => handleCheckout(branch.name)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${branch.isCurrent ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-transparent'}`}
                          >
                            <GitBranch size={12} className={branch.isCurrent ? 'text-indigo-400' : 'text-zinc-600'} />
                            <span className="truncate">{branch.name}</span>
                            {branch.isCurrent && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                          </button>
                        ))}
                        {gitBranches.length === 0 && (
                          <p className="text-[10px] text-zinc-600 italic py-2 text-center">No branches found</p>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Changes ({gitStatus.length})</span>
                        {gitStatus.length > 0 && (
                          <button
                            onClick={async () => {
                              const msg = window.prompt('Commit message:');
                              if (msg) {
                                await axios.post('/api/exec', { command: `git add . && git commit -m "${msg}"` });
                                fetchGitStatus();
                              }
                            }}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            Commit All
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-left">
                        {gitStatus.map((item: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => fetchGitDiff(item.filePath)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800/50 transition-all group border border-transparent hover:border-zinc-700/50"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm ${item.code.includes('M') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                item.code.includes('A') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                  item.code.includes('D') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                    'bg-zinc-700/10 text-zinc-400 border border-zinc-700/20'
                              }`}>
                              {item.code.trim() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-zinc-300 truncate group-hover:text-white transition-colors font-medium">{item.filePath.split('/').pop()}</div>
                              <div className="text-[9px] text-zinc-500 truncate font-mono opacity-60">{item.filePath}</div>
                            </div>
                          </button>
                        ))}
                        {gitStatus.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center py-12 opacity-40">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
                              <Check size={20} className="text-zinc-500" />
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Workspace Clean</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto p-4 bg-zinc-950/50 border-t border-zinc-800">
                      <textarea
                        placeholder="Commit message..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none mb-3"
                      />
                      <button
                        onClick={handleCommit}
                        disabled={isCommitting || !commitMessage || gitStatus.length === 0}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                      >
                        {isCommitting ? <Activity size={14} className="animate-spin" /> : <GitCommit size={14} />}
                        Commit & Push
                      </button>
                    </div>
                  </div>

                  {/* Diff View */}
                  <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden relative border-l border-zinc-800">
                    {gitDiff ? (
                      <div className="flex-1 overflow-auto p-6 font-mono text-[11px] custom-scrollbar text-left">
                        <pre className="whitespace-pre-wrap leading-relaxed">
                          {gitDiff.split('\n').map((line: string, i: number) => (
                            <div
                              key={i}
                              className={`px-2 py-0.5 rounded-sm ${line.startsWith('+') && !line.startsWith('+++') ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' :
                                  line.startsWith('-') && !line.startsWith('---') ? 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500' :
                                    line.startsWith('@@') ? 'bg-indigo-500/5 text-indigo-400/60 my-2 italic' :
                                      'text-zinc-500 opacity-80'
                                }`}
                            >
                              {line}
                            </div>
                          ))}
                        </pre>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
                          <GitBranch size={32} className="text-zinc-700" />
                        </div>
                        <h4 className="text-zinc-400 font-bold text-sm mb-2">No File Selected</h4>
                        <p className="text-zinc-600 text-xs max-w-xs text-center leading-relaxed">Select a modified file from the list on the left to visualize the diff.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'mcp' && (
              <motion.div
                key="mcp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100">Model Context Protocol</h3>
                    <p className="text-xs text-zinc-500">Manage external tools and server connections</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        fetchConfig();
                        fetchMcpData();
                      }}
                      className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all"
                      title="Refresh"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setIsMcpCatalogOpen(true);
                        fetchMcpCatalog();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                    >
                      <Globe size={14} /> Browse Catalog
                    </button>
                    <button
                      onClick={() => setIsAddMCPModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Plus size={14} /> Add MCP Server
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Connected Servers</div>
                        <div className="text-2xl font-bold text-zinc-100">{mcpStats.connectedServers}</div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Tools</div>
                        <div className="text-2xl font-bold text-zinc-100">{mcpTools.length}</div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">System Status</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-bold text-green-500">{mcpStats.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Server List */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Configured Servers</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {(config.mcpServers || []).map((server: any) => (
                          <div key={server.name} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-700 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                                <Globe size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-zinc-100">{server.name}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{server.type} • {server.command || server.url}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-lg">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingMCP(server);
                                    setIsEditMCPModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300"
                                  title="Configure"
                                >
                                  <Settings size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete MCP server ${server.name}?`)) {
                                      axios.delete(`/api/mcp/servers/${server.name}`).then(() => fetchConfig());
                                    }
                                  }}
                                  className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tools Sidebar */}
                  <div className="w-80 border-l border-zinc-800 bg-zinc-900/20 p-6 overflow-y-auto">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Zap size={14} /> Active Tools ({mcpTools.length})
                    </h4>
                    <div className="space-y-3">
                      {mcpTools.map(tool => (
                        <div key={tool.name} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-indigo-500/30 transition-all cursor-help group">
                          <div className="text-xs font-bold text-zinc-200 mb-1 group-hover:text-indigo-400 transition-colors">{tool.name}</div>
                          <div className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{tool.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 overflow-y-auto"
              >
                {pendingSkills.length > 0 && (
                  <div className="mb-8 border border-indigo-500/30 rounded-2xl p-6 bg-indigo-950/10">
                    <h3 className="text-sm font-bold text-indigo-400 mb-4 uppercase tracking-widest">
                      Pending Skill Suggestions
                    </h3>
                    {pendingSkills.map((skill, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl mb-2 border border-zinc-800">
                        <div>
                          <p className="text-zinc-200 font-bold">{skill.name}</p>
                          <p className="text-zinc-500 text-xs">{skill.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              await axios.post('/api/skills', skill);
                              await axios.delete(`/api/skills/pending/${skill.name}`);
                              fetchSkills();
                              fetchPendingSkills();
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={async () => {
                              await axios.delete(`/api/skills/pending/${skill.name}`);
                              fetchPendingSkills();
                            }}
                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs font-bold transition-all"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {skills.map((skill) => (
                    <div key={skill.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-zinc-700 transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-500">
                          <Code size={20} />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfirmDeleteSkill(skill.name)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-zinc-100 mb-1">{skill.name}</h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-6 flex-1">{skill.description || 'No description provided.'}</p>
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 mb-4">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Prompt Preview</div>
                        <p className="text-[10px] text-zinc-500 line-clamp-3 italic">"{skill.prompt}"</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('terminal');
                          setTimeout(() => {
                            if (xtermRef.current) {
                              const cmd = `mimocode skill run ${skill.name} "your input here"`;
                              xtermRef.current.write(cmd);
                            }
                          }, 100);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-indigo-600 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all"
                      >
                        <Play size={12} /> Use Skill
                      </button>
                    </div>
                  ))}

                  {skills.length === 0 && pendingSkills.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-600">
                      <Code size={48} className="opacity-20 mb-4" />
                      <p className="text-sm font-medium">No skills found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}



            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-8 overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-zinc-100 mb-2">Settings</h3>
                      <p className="text-sm text-zinc-500">Configure your Mimocode environment and preferences</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Version</span>
                      <span className="text-xs font-mono text-indigo-400">v0.37.1</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Zap size={14} /> Appearance
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Primary Theme Color</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={config?.theme?.web?.primaryColor || '#6366f1'}
                                onChange={(e) => {
                                  const newConfig = { ...config, theme: { ...config.theme, web: { ...config.theme?.web, primaryColor: e.target.value } } };
                                  axios.post('/api/config', newConfig).then(() => setConfig(newConfig));
                                }}
                                className="w-8 h-8 bg-transparent border-none cursor-pointer rounded"
                              />
                              <span className="text-xs font-mono text-zinc-400">{config?.theme?.web?.primaryColor || '#6366f1'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Activity size={14} /> System Parameters
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-zinc-200">Auto-Healing</div>
                              <div className="text-[10px] text-zinc-500">Automatically attempt to fix errors</div>
                            </div>
                            <button
                              onClick={() => {
                                const newConfig = { ...config, autoHealing: !config.autoHealing };
                                axios.post('/api/config', newConfig).then(() => setConfig(newConfig));
                              }}
                              className={`w-10 h-5 rounded-full transition-colors relative ${config.autoHealing ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.autoHealing ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-zinc-200">Performance Mode</div>
                              <div className="text-[10px] text-zinc-500">Optimize for speed over detail</div>
                            </div>
                            <button
                              onClick={() => {
                                const newConfig = { ...config, performanceMode: !config.performanceMode };
                                axios.post('/api/config', newConfig).then(() => setConfig(newConfig));
                              }}
                              className={`w-10 h-5 rounded-full transition-colors relative ${config.performanceMode ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.performanceMode ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Share2 size={14} /> Orchestration Settings
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Max Concurrent Agents</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={config?.maxConcurrentAgents || 3}
                              onChange={(e) => {
                                const newConfig = { ...config, maxConcurrentAgents: parseInt(e.target.value) };
                                axios.post('/api/config', newConfig).then(() => setConfig(newConfig));
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Trash2 size={14} /> Danger Zone
                        </h4>
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to reset all configurations? This cannot be undone.')) {
                                axios.post('/api/config/reset').then(() => window.location.reload());
                              }
                            }}
                            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold text-red-500 transition-all"
                          >
                            Reset All Configuration
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                    onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">System Instructions</label>
                  <textarea
                    rows={8}
                    value={editingAgent.systemInstruction}
                    onChange={(e) => setEditingAgent({ ...editingAgent, systemInstruction: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingAgent.tags?.join(', ')}
                    onChange={(e) => setEditingAgent({ ...editingAgent, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
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
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
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
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
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
                    onChange={(e) => setNewSkill({ ...newSkill, prompt: e.target.value })}
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
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Search API Key (SerpApi/Google)</label>
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
