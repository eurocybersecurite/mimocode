import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export interface Config {
  runtime: 'ollama' | 'lmstudio' | 'llama-cpp' | 'mlx';
  endpoint: string;
  model: string;
  sessionDir: string;
  agentDir: string;
  historyFile: string;
  chatHistoryFile: string;
  mode: 'local' | 'remote';
  remoteServer?: string;
  apiKey?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  vscodePrompt?: boolean;
  mcpServers?: Array<{
    name: string;
    type: 'stdio' | 'http';
    command: string;
    args?: string[];
    url?: string;
  }>;
  theme?: {
    terminal?: {
      background?: string;
      foreground?: string;
      cursor?: string;
      borderStyle?: string;
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

const CONFIG_PATH = path.join(os.homedir(), '.mimocode', 'config.json');

export const DEFAULT_CONFIG: Config = {
  runtime: 'ollama',
  endpoint: 'http://localhost:11434',
  model: 'llama3.1:8b',
  sessionDir: path.join(os.homedir(), '.mimocode', 'sessions'),
  agentDir: path.join(os.homedir(), '.mimocode', 'agents'),
  historyFile: path.join(os.homedir(), '.mimocode', 'history.json'),
  chatHistoryFile: path.join(os.homedir(), '.mimocode', 'chat_history.json'),
  mode: 'local',
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  mcpServers: [
    {
      "name": "filesystem",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    {
      "name": "github",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    {
      "name": "sqlite",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite"]
    },
    {
      "name": "puppeteer",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    {
      "name": "brave-search",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"]
    },
    {
      "name": "postgres",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"]
    }
  ],
  theme: {
    terminal: {
      background: '#09090b',
      foreground: '#e4e4e7',
      cursor: '#6366f1',
      borderStyle: 'double',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
    },
    web: {
      primaryColor: '#6366f1',
      sidebarBackground: '#09090b',
      fontFamily: 'Inter, sans-serif',
    },
  },
};

export async function loadConfig(): Promise<Config> {
  let config: Config;
  if (await fs.pathExists(CONFIG_PATH)) {
    config = await fs.readJson(CONFIG_PATH);
  } else {
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    await fs.writeJson(CONFIG_PATH, DEFAULT_CONFIG, { spaces: 2 });
    config = DEFAULT_CONFIG;
  }
  
  // Ensure critical directories exist
  await fs.ensureDir(config.agentDir);
  await fs.ensureDir(config.sessionDir);
  await fs.ensureDir(path.dirname(config.historyFile));
  
  return config;
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.ensureDir(path.dirname(CONFIG_PATH));
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}
