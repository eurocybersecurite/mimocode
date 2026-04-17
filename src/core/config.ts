import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';
import ora from 'ora';
import boxen from 'boxen';
import { setupVSCode } from './vscode';

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

export async function runSetup(config: Config) {
  console.log(boxen(chalk.bold.magenta('Mimocode Setup 🚀\n') + chalk.white('Configure your local AI environment.'), { padding: 1, borderStyle: 'round', borderColor: 'magenta' }));
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'runtime',
      message: 'Choose your local backend:',
      default: config.runtime || 'ollama',
      choices: [
        { name: 'Ollama (Recommended)', value: 'ollama' },
        { name: 'LM-Studio', value: 'lmstudio' },
        { name: 'Llama-cpp', value: 'llama-cpp' },
        { name: 'MLX (Apple Silicon)', value: 'mlx' }
      ]
    },
    {
      type: 'input',
      name: 'endpoint',
      message: 'Backend Endpoint URL:',
      default: (answers: any) => {
        if (answers.runtime === 'ollama') return 'http://localhost:11434';
        if (answers.runtime === 'lmstudio') return 'http://localhost:1234';
        if (answers.runtime === 'llama-cpp') return 'http://localhost:8080';
        return config.endpoint || 'http://localhost:11434';
      }
    }
  ]);

  config.runtime = answers.runtime;
  config.endpoint = answers.endpoint;

  // Try to fetch models
  const spinner = ora('Fetching available models...').start();
  try {
    let models: string[] = [];
    if (config.runtime === 'ollama') {
      const res = await axios.get(`${config.endpoint}/api/tags`);
      models = res.data.models.map((m: any) => m.name);
    } else {
      const res = await axios.get(`${config.endpoint}/v1/models`);
      models = res.data.data.map((m: any) => m.id);
    }
    spinner.succeed(`Found ${models.length} models.`);

    if (models.length > 0) {
      const { model } = await inquirer.prompt([{
        type: 'list',
        name: 'model',
        message: 'Select your default model:',
        choices: models,
        default: config.model
      }]);
      config.model = model;
    }
  } catch (e) {
    spinner.warn('Could not fetch models automatically. Please enter manually.');
    const { model } = await inquirer.prompt([{
      type: 'input',
      name: 'model',
      message: 'Enter model name:',
      default: config.model || 'llama3.1:8b'
    }]);
    config.model = model;
  }

  const { setupVSCode: doVSCode } = await inquirer.prompt([{
    type: 'confirm',
    name: 'setupVSCode',
    message: 'Setup VS Code integration (generate .vscode config)?',
    default: true
  }]);

  if (doVSCode) {
    await setupVSCode();
    console.log(chalk.green('✓ VS Code integration ready.'));
  }

  await saveConfig(config);
  console.log(chalk.green('\n✅ Configuration saved successfully!\n'));
}
