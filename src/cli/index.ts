#!/usr/bin/env npx tsx
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { loadConfig, saveConfig, Config, DEFAULT_CONFIG } from './config';
import { callLLM, callLLMStream, callLLMWithTools, Message, setPaused } from './llm';
import { mcpTools } from './mcp';
import { loadAgents, executeAgent, createAgent, deleteAgent, updateAgent, renameAgent, loadHistory, exportAgent, importAgent, Agent, recordHistory, collaborate } from './agents';
import { healFile, applyFix, healSystem } from './heal';
import { indexDirectory, queryIndex, clearIndex } from './rag';
import { loadSkills, createSkill, runSkill } from './skills';
import { createCheckpoint, restoreLatest } from './checkpoints';
import { improveSelf, learnHabits } from './improve';
import { generatePlan, executePlan } from './planner';
import { runInSandbox } from './sandbox';
import { setupVSCode, attachVSCode } from './vscode';
import { ciBuild, ciTest, ciDeploy } from './ci';
import { addMemory, searchMemory, exportMemory } from './memory';
import { scheduleTask, listScheduledTasks, cancelScheduledTask } from './scheduler';
import { initPermissions } from './permissions';
import { processUserInput } from './orchestrator';
import { routeToSkill } from './skill_router';
import { getOrCreateSession, saveMessage, getSessionMessages, updateProjectContext, getProjectContext } from './db';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import os from 'os';
import readline from 'readline';
import boxen from 'boxen';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { reportEvent } from './events';

marked.setOptions({
  renderer: new TerminalRenderer({
    codespan: chalk.hex('#facc15'), // Yellow-400
    code: chalk.hex('#e2e8f0'),     // Slate-200
    heading: chalk.bold.hex('#6366f1'),
    link: chalk.cyan,
    strong: chalk.bold,
    em: chalk.italic,
    listitem: (text: string) => chalk.dim(' • ') + text + '\n',
    hr: () => chalk.dim('─'.repeat(process.stdout.columns || 40)) + '\n'
  }) as any
});

// ============================================
// GEMINI-STYLE INTERFACE STATE & COMPONENTS
// ============================================

let currentWorkspace = process.cwd();
let sandboxMode = false;
let messageHistory: string[] = [];
let historyIndex = -1;
const HISTORY_FILE = path.join(os.homedir(), '.mimocode', 'cli_history.json');

async function loadCLIHistory() {
  if (await fs.pathExists(HISTORY_FILE)) {
    try {
      messageHistory = await fs.readJson(HISTORY_FILE);
      historyIndex = messageHistory.length;
    } catch (e) {
      messageHistory = [];
    }
  }
}

async function saveCLIHistory() {
  await fs.ensureDir(path.dirname(HISTORY_FILE));
  await fs.writeJson(HISTORY_FILE, messageHistory.slice(-100), { spaces: 2 });
}

const slashCommands = [
  { name: 'help', alias: 'h', category: 'General', description: 'Show this help menu' },
  { name: 'edit', category: 'File & Workspace Management', description: 'Open file in default editor' },
  { name: 'mcp', category: 'File & Workspace Management', description: 'MCP operations (list)' },
  { name: 'rag', category: 'File & Workspace Management', description: 'RAG operations (index, query, clear)' },
  { name: 'history', category: 'File & Workspace Management', description: 'View recent action history' },
  { name: 'status', category: 'File & Workspace Management', description: 'Check system & agent status' },
  { name: 'cd', category: 'File & Workspace Management', description: 'Change workspace directory' },
  { name: 'read', category: 'File & Workspace Management', description: 'Read PDF/Word/Excel documents as Markdown' },
  { name: 'search', category: 'File & Workspace Management', description: 'Search the web or local documents' },
  { name: 'watch', category: 'File & Workspace Management', description: 'Watch a directory for changes and auto-analyze' },
  { name: 'copy', category: 'General', description: 'Copy last response to clipboard' },
  
  { name: 'plan', alias: 'p', category: 'AI & Agent Orchestration', description: 'Generate & execute a multi-step plan' },
  { name: 'collaborate', alias: 'co', category: 'AI & Agent Orchestration', description: 'Multi-agent collaborative session' },
  { name: 'agents', alias: 'a', category: 'AI & Agent Orchestration', description: 'List all specialized experts' },
  { name: 'skills', alias: 's', category: 'AI & Agent Orchestration', description: 'List available specialized skills' },
  { name: 'memory', category: 'AI & Agent Orchestration', description: 'Store info in long-term memory (add, search)' },
  
  { name: 'heal', category: 'Code Quality & Repair', description: 'Auto-repair detected system issues' },
  { name: 'improve', category: 'Code Quality & Repair', description: 'Apply AI optimizations to codebase' },
  { name: 'restore', category: 'Code Quality & Repair', description: 'Revert to last stable checkpoint' },
  { name: 'sandbox', alias: 'sb', category: 'Code Quality & Repair', description: 'Toggle sandbox mode' },
  
  { name: 'model', alias: 'm', category: 'System & Configuration', description: 'Switch between local LLM models' },
  { name: 'models', category: 'System & Configuration', description: 'List available models' },
  { name: 'set', category: 'System & Configuration', description: 'Adjust LLM parameters (temp, topP, topK)' },
  { name: 'setup', category: 'System & Configuration', description: 'Run interactive setup' },
  { name: 'vscode', category: 'System & Configuration', description: 'VS Code integration (setup)' },
  { name: 'clear', alias: 'c', category: 'System & Configuration', description: 'Flush current chat history' },
  { name: 'exit', category: 'System & Configuration', description: 'Terminate session' }
];

interface Suggestion {
  type: 'agent' | 'command' | 'skill';
  value: string;
  description: string;
}

function getSuggestions(input: string, agents: Agent[], skills: any[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  if (input.startsWith('@')) {
    const search = input.slice(1).toLowerCase();
    agents.forEach(agent => {
      if (agent.name.toLowerCase().includes(search)) {
        suggestions.push({ type: 'agent', value: `@${agent.name}`, description: agent.description });
      }
    });
  } else if (input.startsWith('/')) {
    const search = input.slice(1).toLowerCase();
    slashCommands.forEach(cmd => {
      if (cmd.name.includes(search) || cmd.alias?.includes(search)) {
        suggestions.push({ type: 'command', value: `/${cmd.name}`, description: cmd.description });
      }
    });
  }
  
  return suggestions.slice(0, 5);
}

function displaySuggestions(suggestions: Suggestion[]) {
  if (suggestions.length === 0) return;
  console.log('\n' + chalk.dim('Suggestions:'));
  suggestions.forEach(s => {
    console.log(chalk.dim(`  ${s.type === 'agent' ? '🤖' : '⚡'} ${chalk.cyan(s.value.padEnd(15))} - ${s.description.substring(0, 50)}`));
  });
  console.log('');
}

function renderGeminiHeader(config: Config) {
  const version = 'v0.36.4';
  const totalMem = os.totalmem() / (1024 * 1024 * 1024);
  const freeMem = os.freemem() / (1024 * 1024 * 1024);
  const usedMem = totalMem - freeMem;
  const load = os.loadavg()[0];
  
  console.log(chalk.bold.hex('#6366f1')(`Mimocode ${version}`));
  console.log(chalk.dim('─'.repeat(process.stdout.columns || 40)));
  
  const statusLine = [
    chalk.bold('Backend: ') + chalk.cyan(config.runtime),
    chalk.bold('Model: ') + chalk.cyan(config.model),
    chalk.bold('Mode: ') + (sandboxMode ? chalk.yellow('Sandbox') : chalk.green('Full Access'))
  ].join(chalk.dim(' | '));
  
  const statsLine = [
    chalk.bold('CPU Load: ') + chalk.yellow(`${load.toFixed(2)}`),
    chalk.bold('RAM: ') + chalk.yellow(`${usedMem.toFixed(1)}GB / ${totalMem.toFixed(1)}GB`)
  ].join(chalk.dim(' | '));

  console.log(statusLine);
  console.log(statsLine);
  console.log(chalk.bold('Workspace: ') + chalk.dim(currentWorkspace));
  console.log(chalk.dim('─'.repeat(process.stdout.columns || 40)));
  console.log(chalk.dim('Type your message or ') + chalk.cyan('@agent') + chalk.dim(' or ') + chalk.cyan('/command') + chalk.dim(' (type ? for help)'));
  console.log(chalk.dim('Use ') + chalk.yellow('\\') + chalk.dim(' at end of line for multi-line input.'));
  console.log('');
}

async function showShortcuts() {
  console.log(chalk.bold.hex('#6366f1')('\n⌨️  Mimocode Shortcuts\n'));
  console.log(chalk.cyan('Navigation:'));
  console.log(chalk.dim('  ↑/↓            ') + 'Navigate command history');
  console.log(chalk.dim('  Tab            ') + 'Auto-complete @agents or /commands');
  console.log(chalk.dim('  Ctrl+C         ') + 'Exit session');
  console.log(chalk.dim('  Ctrl+L         ') + 'Clear screen');
  console.log('');
  console.log(chalk.cyan('Special:'));
  console.log(chalk.dim('  @agent         ') + 'Directly call an agent');
  console.log(chalk.dim('  /command       ') + 'Execute a slash command');
  console.log(chalk.dim('  ?              ') + 'Show this help');
  console.log('');
  console.log(chalk.dim('Press Enter to return...'));
}

function displayToolCall(name: string, args: any, result: string, error?: string) {
  const icons: Record<string, string> = {
    read_file: '📖', write_file: '📝', list_dir: '📁', search_files: '🔍',
    find_files: '🔎', delete_file: '🗑️', run_command: '💻', create_project: '🚀',
    call_agent: '🤖', run_skill: '🧩', generate_plan: '🗺️', execute_plan: '🏁',
    move_file: '🚚', copy_file: '📋', create_directory: '📂'
  };
  const icon = icons[name] || '⚙️';
  const status = error ? chalk.red('✘') : chalk.green('✔');
  
  let argDisplay = '';
  if (name === 'read_file' || name === 'write_file' || name === 'delete_file') {
    argDisplay = chalk.cyan(args.filePath || args.path || '');
  } else if (name === 'run_command') {
    argDisplay = chalk.gray(`\`${(args.command || '').substring(0, 40)}${(args.command || '').length > 40 ? '...' : ''}\``);
  } else if (name === 'move_file' || name === 'copy_file') {
    argDisplay = chalk.cyan(`${args.source} -> ${args.destination}`);
  }
  
  process.stdout.write(`  ${status} ${icon} ${chalk.bold(name)} ${argDisplay}\n`);

  if (error) {
    process.stdout.write(chalk.red(`    └─ Error: ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}\n`));
  } else if (name === 'write_file' && args.content) {
    const lines = args.content.split('\n').length;
    process.stdout.write(chalk.dim(`    └─ Written ${lines} lines\n`));
  }
}

function showDiff(filePath: string, oldContent: string, newContent: string) {
  console.log(chalk.bold.blue(`\n📝 Diff for ${filePath}:`));
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  let i = 0, j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      if (oldLines.length < 20) console.log(chalk.dim(`  ${oldLines[i]}`));
      i++; j++;
    } else {
      if (i < oldLines.length) {
        console.log(chalk.red(`- ${oldLines[i]}`));
        i++;
      }
      if (j < newLines.length) {
        console.log(chalk.green(`+ ${newLines[j]}`));
        j++;
      }
    }
  }
  console.log('');
}

async function runSetup(config: Config) {
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

async function saveChatHistory(config: Config, messages: Message[]) {
  await fs.ensureDir(path.dirname(config.chatHistoryFile));
  await fs.writeJson(config.chatHistoryFile, messages, { spaces: 2 });
}

async function loadChatHistory(config: Config): Promise<Message[]> {
  if (await fs.pathExists(config.chatHistoryFile)) {
    return await fs.readJson(config.chatHistoryFile);
  }
  return [];
}

async function handleSlashCommand(input: string, config: Config, agents: Agent[], skills: any[]) {
  const parts = input.slice(1).split(' ');
  const rawCommand = parts[0].toLowerCase();
  const args = parts.slice(1);

  const cmdDef = slashCommands.find(c => c.name === rawCommand || c.alias === rawCommand);
  const command = cmdDef ? cmdDef.name : rawCommand;

  switch (command) {
    case 'help':
      console.log(chalk.bold.hex('#6366f1')('\nMimocode CLI Help\n'));
      const categories = [...new Set(slashCommands.map(c => c.category))];
      categories.forEach(cat => {
        console.log(chalk.bold.white(`${cat}:`));
        slashCommands.filter(c => c.category === cat).forEach(cmd => {
          const name = `/${cmd.name}${cmd.alias ? `, /${cmd.alias}` : ''}`;
          console.log(chalk.green(`  ${name.padEnd(25)}`) + chalk.dim(`- ${cmd.description}`));
        });
        console.log('');
      });
      break;
    case 'edit':
      if (args[0]) {
        const fullPath = path.resolve(currentWorkspace, args[0]);
        const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
        console.log(chalk.cyan(`\nOpening ${args[0]} in ${editor}...\n`));
        spawn(editor, [fullPath], { stdio: 'inherit', shell: true });
      } else {
        console.log(chalk.red('\n❌ Usage: /edit <path>\n'));
      }
      break;
    case 'mcp':
      if (args[0] === 'list') {
        console.log(chalk.bold.blue('\n🛠️  Available MCP Tools:\n'));
        mcpTools.forEach(t => console.log(chalk.green(`  ${t.name.padEnd(20)}`) + chalk.dim(t.description)));
        console.log('');
      } else {
        console.log(chalk.dim('\nUsage: /mcp list\n'));
      }
      break;
    case 'history':
      const history = await loadHistory(config);
      console.log(chalk.bold.blue('\n📜 Recent Action History:\n'));
      history.slice(-10).forEach((h: any) => {
        console.log(chalk.dim(`[${h.timestamp}] `) + chalk.cyan(h.agentName) + `: ${h.input.substring(0, 50)}...`);
      });
      console.log('');
      break;
    case 'pause':
      setPaused(true);
      console.log(chalk.yellow('\n⏸️  Agent execution paused. Use /resume to continue.\n'));
      break;
    case 'resume':
      setPaused(false);
      console.log(chalk.green('\n▶️  Agent execution resumed.\n'));
      break;
    case 'memory':
      if (args[0] === 'add') {
        const text = args.slice(1).join(' ');
        if (!text) {
          console.log(chalk.red('\n❌ Usage: /memory add <text>\n'));
          break;
        }
        await addMemory(config, text);
        console.log(chalk.green('\n✓ Added to long-term memory\n'));
      } else if (args[0] === 'search') {
        const query = args.slice(1).join(' ');
        if (!query) {
          console.log(chalk.red('\n❌ Usage: /memory search <query>\n'));
          break;
        }
        const results = await searchMemory(config, query);
        console.log(chalk.bold.blue('\n🧠 Memory Search Results:\n'));
        results.forEach((r: any) => console.log(chalk.dim(`- ${r.content}`)));
        console.log('');
      } else {
        console.log(chalk.dim('\nUsage: /memory add <text> | /memory search <query>\n'));
      }
      break;
    case 'improve':
      const doApply = args.includes('-apply');
      console.log(chalk.cyan(`\n✨ Analyzing codebase for improvements${doApply ? ' and applying them' : ''}...\n`));
      try {
        const result = await improveSelf(config, doApply);
        if (typeof result === 'string') {
          console.log(chalk.gray(result) + '\n');
        } else {
          console.log(chalk.gray(result.fullResponse) + '\n');
        }
      } catch (e: any) {
        console.log(chalk.red(`Error: ${e.message}\n`));
      }
      break;
    case 'restore':
      if (args.includes('-latest')) {
        console.log(chalk.cyan('\n⏪ Restoring latest checkpoint...\n'));
        try {
          const result = await restoreLatest(config);
          console.log(chalk.green(result + '\n'));
        } catch (e: any) {
          console.log(chalk.red(`Error: ${e.message}\n`));
        }
      } else {
        console.log(chalk.dim('\nUsage: /restore -latest\n'));
      }
      break;
    case 'set':
      if (args.length >= 2) {
        const key = args[0] as keyof Config;
        const val = args[1];
        if (key === 'temperature' || key === 'topP' || key === 'topK') {
          (config as any)[key] = parseFloat(val);
          await saveConfig(config);
          console.log(chalk.green(`\n✓ ${key} set to ${val}\n`));
        } else {
          console.log(chalk.red(`\n❌ Invalid parameter: ${key}\n`));
        }
      } else {
        console.log(chalk.dim('\nUsage: /set <temperature|topP|topK> <value>\n'));
      }
      break;
    case 'vscode':
      if (args[0] === 'setup') {
        await setupVSCode();
        console.log(chalk.green('\n✓ VS Code integration initialized\n'));
      } else {
        console.log(chalk.dim('\nUsage: /vscode setup\n'));
      }
      break;
    case 'models':
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
        spinner.stop();
        console.log(chalk.bold.blue('\n🤖 Available Models:\n'));
        models.forEach(m => {
          const isCurrent = m === config.model;
          console.log(chalk.green(`  ${m.padEnd(25)}`) + (isCurrent ? chalk.yellow(' (current)') : ''));
        });
        console.log(chalk.dim('\nUse /model <name> to switch.\n'));
      } catch (e) {
        spinner.fail('Failed to fetch models.');
      }
      break;
    case 'agents':
      console.log(chalk.bold.blue('\n🤖 Available Agents:\n'));
      agents.forEach(a => console.log(chalk.green(`  @${a.name.padEnd(15)}`) + chalk.dim(a.description)));
      console.log('');
      break;
    case 'skills':
      console.log(chalk.bold.blue('\n✨ Available Skills:\n'));
      skills.forEach(s => console.log(chalk.green(`  ${s.name.padEnd(15)}`) + chalk.dim(s.description)));
      console.log('');
      break;
    case 'model':
      if (args[0]) {
        config.model = args[0];
        await saveConfig(config);
        console.log(chalk.green(`\n✓ Model switched to: ${config.model}\n`));
      } else {
        const spinner = ora('Fetching models...').start();
        try {
          let models: string[] = [];
          if (config.runtime === 'ollama') {
            const res = await axios.get(`${config.endpoint}/api/tags`);
            models = res.data.models.map((m: any) => m.name);
          } else {
            const res = await axios.get(`${config.endpoint}/v1/models`);
            models = res.data.data.map((m: any) => m.id);
          }
          spinner.stop();
          if (models.length > 0) {
            const { model } = await inquirer.prompt([{
              type: 'list',
              name: 'model',
              message: 'Select model:',
              choices: models,
              default: config.model
            }]);
            config.model = model;
            await saveConfig(config);
            console.log(chalk.green(`\n✓ Model switched to: ${config.model}\n`));
          }
        } catch (e) {
          spinner.fail('Failed to fetch models.');
        }
      }
      break;
    case 'setup':
      await runSetup(config);
      break;
    case 'sandbox':
      if (args.length > 0) {
        const code = args.join(' ');
        console.log(chalk.cyan(`\n🧪 Executing code in sandbox...\n`));
        try {
          const result = await runInSandbox(config, code);
          console.log(chalk.green(result + '\n'));
        } catch (e: any) {
          console.log(chalk.red(`Error: ${e.message}\n`));
        }
      } else {
        sandboxMode = !sandboxMode;
        console.log(chalk.green(`\n✓ Sandbox mode: ${sandboxMode ? 'ON' : 'OFF'}\n`));
      }
      break;
    case 'clear':
      await saveChatHistory(config, []);
      console.log(chalk.green('\n✓ Chat history cleared\n'));
      break;
    case 'plan':
      if (args.length === 0) {
        console.log(chalk.red('\n❌ Please provide a task: /plan <task>\n'));
        break;
      }
      const task = args.join(' ');
      console.log(chalk.cyan(`\n📋 Generating plan for: ${task}...\n`));
      try {
        const steps = await generatePlan(config, task);
        console.log(chalk.bold.yellow('Plan:'));
        steps.forEach(s => console.log(chalk.white(`  ${s.id}. ${s.description}`)));
        console.log('');
      } catch (e: any) {
        console.log(chalk.red(`Error: ${e.message}\n`));
      }
      break;
    case 'collaborate':
      if (args.length < 2) {
        console.log(chalk.red('\n❌ Usage: /collaborate <agent1,agent2> <task>\n'));
        break;
      }
      const agentNames = args[0].split(',').map(n => n.trim().replace('@', ''));
      const collabTask = args.slice(1).join(' ');
      console.log(chalk.blue(`\n🤝 Collaborating: ${agentNames.join(', ')}\n`));
      try {
        const result = await collaborate(config, agentNames, collabTask);
        console.log(chalk.green(result + '\n'));
      } catch (e: any) {
        console.log(chalk.red(`Error: ${e.message}\n`));
      }
      break;
    case 'rag':
      if (args[0] === 'index') {
        const dir = args[1] || '.';
        const spinner = ora(chalk.cyan(`Indexing ${dir}...`)).start();
        try {
          const result = await indexDirectory(config, dir);
          spinner.succeed(chalk.green('Indexing complete.'));
          console.log(chalk.dim(result) + '\n');
        } catch (e: any) {
          spinner.fail(chalk.red(`Indexing failed: ${e.message}`));
        }
      } else if (args[0] === 'query') {
        const query = args.slice(1).join(' ');
        if (!query) {
          console.log(chalk.red('\n❌ Usage: /rag query <question>\n'));
          break;
        }
        const spinner = ora(chalk.cyan(`Searching: ${query}...`)).start();
        try {
          const result = await queryIndex(config, query);
          spinner.stop();
          console.log('\n' + boxen(result, { padding: 1, borderStyle: 'round', borderColor: 'cyan', title: ' RAG Search Result ' }) + '\n');
        } catch (e: any) {
          spinner.fail(chalk.red(`Search failed: ${e.message}`));
        }
      } else if (args[0] === 'clear') {
        try {
          await clearIndex(config);
          console.log(chalk.green('\n✓ RAG index cleared\n'));
        } catch (e: any) {
          console.log(chalk.red(`\n❌ Failed to clear index: ${e.message}\n`));
        }
      } else {
        console.log(chalk.dim('\nUsage: /rag index <path> | /rag query <question> | /rag clear\n'));
      }
      break;
    case 'heal':
    case 'verify':
      const doFix = args.includes('-fix');
      console.log(chalk.cyan(`\n🔍 Starting system verification${doFix ? ' and auto-repair' : ''}...\n`));
      try {
        const report = await healSystem(config);
        console.log(chalk.gray(report) + '\n');
        if (doFix) {
          console.log(chalk.green('Auto-repair completed.\n'));
        }
      } catch (e: any) {
        console.log(chalk.red(`Error: ${e.message}\n`));
      }
      break;
    case 'status':
      console.log(chalk.bold.blue('\n📊 System Status\n'));
      console.log(`  Runtime:   ${config.runtime}`);
      console.log(`  Model:     ${config.model}`);
      console.log(`  Agents:    ${agents.length}`);
      console.log(`  Workspace: ${currentWorkspace}`);
      console.log('');
      break;
    case 'cd':
      if (args[0]) {
        const newPath = path.resolve(currentWorkspace, args[0]);
        if (await fs.pathExists(newPath)) {
          currentWorkspace = newPath;
          process.chdir(currentWorkspace);
          console.log(chalk.green(`\n✓ Workspace changed to: ${currentWorkspace}\n`));
        } else {
          console.log(chalk.red(`\n❌ Directory not found: ${args[0]}\n`));
        }
      } else {
        console.log(chalk.cyan(`\nCurrent workspace: ${currentWorkspace}\n`));
      }
      break;
    case 'copy':
      try {
        const clipboardy = (await import('clipboardy')).default;
        const lastMsg = messageHistory[messageHistory.length - 1];
        if (lastMsg) {
          clipboardy.writeSync(lastMsg);
          console.log(chalk.green('\n✓ Last input copied to clipboard!\n'));
        }
      } catch (e: any) {
        console.log(chalk.red(`\n❌ Failed to copy: ${e.message}\n`));
      }
      break;
    case 'watch':
      const watchPath = args[0] || '.';
      const fullWatchPath = path.resolve(currentWorkspace, watchPath);
      console.log(chalk.cyan(`\n👀 Watching ${watchPath} for changes...\n`));
      const chokidar = await import('chokidar');
      const watcher = chokidar.watch(fullWatchPath, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      watcher.on('change', async (p) => {
        console.log(chalk.yellow(`\n🔔 File changed: ${path.relative(currentWorkspace, p)}`));
        const notifier = (await import('node-notifier')).default;
        notifier.notify({
          title: 'Mimocode Watch',
          message: `File changed: ${path.basename(p)}`
        });
      });
      break;
    case 'search':
      const searchQuery = args.join(' ');
      if (!searchQuery) {
        console.log(chalk.red('\n❌ Usage: /search <query> [path]\n'));
        break;
      }
      const docPath = args.find(a => a.startsWith('./') || a.startsWith('/') || a.includes('.'));
      if (docPath && (await fs.pathExists(path.resolve(currentWorkspace, docPath)))) {
        const { searchInDocuments } = await import('./markitdown');
        const results = await searchInDocuments(docPath, searchQuery);
        if (results.length > 0) {
          console.log(chalk.green(`\n✓ Found matches in ${results.length} documents:\n`));
          results.forEach(r => console.log(chalk.cyan(`  - ${r}`)));
          console.log('');
        } else {
          console.log(chalk.yellow(`\nNo matches found for "${searchQuery}" in ${docPath}\n`));
        }
      } else {
        const searchSpinner = ora(chalk.cyan(`Searching the web for: ${searchQuery}...`)).start();
        try {
          const searchTool = mcpTools.find(t => t.name === 'web_search');
          if (searchTool) {
            const result = await searchTool.execute({ query: searchQuery });
            searchSpinner.stop();
            console.log('\n' + boxen(result, { padding: 1, borderStyle: 'round', borderColor: 'blue', title: ' Web Search Result ' }) + '\n');
          }
        } catch (e: any) {
          searchSpinner.fail(chalk.red(`Search failed: ${e.message}`));
        }
      }
      break;
    case 'read':
      const filePath = args[0];
      if (!filePath) {
        console.log(chalk.red('\n❌ Usage: /read <file_path>\n'));
        break;
      }
      try {
        const { convertDocument } = await import('./markitdown');
        const content = await convertDocument(filePath);
        console.log('\n' + boxen(content, { padding: 1, borderStyle: 'round', borderColor: 'green', title: ` Content of ${path.basename(filePath)} ` }) + '\n');
      } catch (e: any) {
        console.log(chalk.red(`\n❌ Failed to read document: ${e.message}\n`));
      }
      break;
    default:
      console.log(chalk.red(`\n❌ Unknown command: /${command}\n`));
  }
}

async function startGeminiChat(config: Config, initialInput?: string) {
  const isFirstLaunch = !await fs.pathExists(path.join(os.homedir(), '.mimocode', 'config.json'));
  await loadCLIHistory();

  if (isFirstLaunch) {
    await runSetup(config);
  } else {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Start Chatting', value: 'chat' },
        { name: 'Clear History & Start', value: 'clear' },
        { name: 'Run Setup', value: 'setup' },
        { name: 'Exit', value: 'exit' }
      ]
    }]);

    if (action === 'exit') process.exit(0);
    if (action === 'setup') await runSetup(config);
    if (action === 'clear') {
      await saveChatHistory(config, []);
      console.log(chalk.dim('History cleared.'));
    }
  }

  console.clear();
  const agents = await loadAgents(config);
  const skills = await loadSkills(config);
  const sessionId = await getOrCreateSession(currentWorkspace);
  let messages: Message[] = await getSessionMessages(sessionId);
  renderGeminiHeader(config);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  let isProcessing = false;
  let multiLineBuffer = '';
  let abortController = new AbortController();
  let pasteBuffer: string[] = [];
  let pasteTimeout: NodeJS.Timeout | null = null;

  const drawStyledPrompt = () => {
    if (isProcessing) return;
    const rows = process.stdout.rows || 24;
    const cols = process.stdout.columns || 80;
    const separator = chalk.yellow('─'.repeat(cols));
    const helpText = chalk.dim('auto-accept edits   Shift+Tab to plan');
    
    process.stdout.write(`\n\n\n`);
    process.stdout.write(`\x1b[3A`);
    process.stdout.write(`\x1b[0J`);
    
    process.stdout.write(`${helpText}\n${separator}\n${chalk.bold.hex('#6366f1')('> ')}`);
    rl.setPrompt('');
  };

  const handleInput = async (input: string) => {
    if (isProcessing) return;
    pasteBuffer.push(input);
    if (pasteTimeout) clearTimeout(pasteTimeout);
    pasteTimeout = setTimeout(async () => {
      const fullContent = pasteBuffer.join('\n');
      const lineCount = pasteBuffer.length;
      pasteBuffer = [];
      pasteTimeout = null;
      if (lineCount > 1 || fullContent.length > 100) {
        process.stdout.write(`\x1b[36m[Pasted Text: ${lineCount > 1 ? lineCount + ' lines' : fullContent.length + ' chars'}]\x1b[0m\n`);
      }
      await processInput(fullContent);
    }, 50);
  };

  const processInput = async (input: string) => {
    const trimmedInput = input.trim();
    if (trimmedInput.endsWith('\\')) {
      multiLineBuffer += trimmedInput.slice(0, -1) + '\n';
      return;
    }
    const fullInput = (multiLineBuffer + trimmedInput).trim();
    multiLineBuffer = '';
    if (!fullInput) { drawStyledPrompt(); return; }

    process.stdout.write(`\x1b[2A\x1b[0J`); 

    isProcessing = true;
    abortController = new AbortController();
    if (messageHistory[messageHistory.length - 1] !== fullInput) {
      messageHistory.push(fullInput);
      await saveCLIHistory();
    }
    historyIndex = messageHistory.length;

    if (fullInput === '?') { await showShortcuts(); isProcessing = false; drawStyledPrompt(); return; }
    if (fullInput.toLowerCase() === 'exit' || fullInput.toLowerCase() === '/exit') process.exit(0);

    const commandName = fullInput.startsWith('/') ? fullInput.slice(1).split(' ')[0] : fullInput.split(' ')[0];
    const isSlashCommand = slashCommands.some(c => c.name === commandName || c.alias === commandName);

    if (isSlashCommand) {
      const cmdToHandle = fullInput.startsWith('/') ? fullInput : `/${fullInput}`;
      await handleSlashCommand(cmdToHandle, config, agents, skills);
      isProcessing = false;
      drawStyledPrompt();
      return;
    }

    const skillResult = await routeToSkill(config, fullInput);
    let effectiveInput = fullInput;
    if (skillResult.used) {
      console.log(chalk.cyan(`\n🛠️  Skill '${skillResult.response}' detected. Delegating...`));
      effectiveInput = `Execute procedure for: ${fullInput}. Context: ${skillResult.response}`;
    }

    const startTime = Date.now();
    const spinner = ora({ text: chalk.dim('Thinking... (esc to cancel, 0s)'), spinner: 'dots' }).start();
    const timerInterval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      spinner.text = chalk.dim(`Thinking... (esc to cancel, ${seconds}s)`);
    }, 1000);

    try {
      await reportEvent('chat_start', { input: effectiveInput });
      const response = await processUserInput(config, effectiveInput, async (name, args, result, error) => {
        spinner.stop();
        displayToolCall(name, args, result, error);
        spinner.start();
      }, abortController.signal);
      
      clearInterval(timerInterval);
      spinner.stop();
      console.log('\n' + await marked.parse(response));
      messages.push({ role: 'user', content: fullInput });
      messages.push({ role: 'assistant', content: response });
      await saveMessage(sessionId, 'user', fullInput);
      await saveMessage(sessionId, 'assistant', response);
      await reportEvent('chat_end', { response });
    } catch (e: any) {
      spinner.stop();
      clearInterval(timerInterval);
      if (e.message === 'Operation aborted by user') {
        console.log(chalk.yellow('\n\nOperation cancelled.'));
      } else {
        spinner.fail(chalk.red(`Error: ${e.message}`));
      }
    } finally {
      isProcessing = false;
      drawStyledPrompt();
    }
  };

  rl.on('line', handleInput);
  process.stdin.on('keypress', (str, key) => {
    if (key && key.name === 'escape' && isProcessing) abortController.abort();
    if (key && key.name === 'tab' && key.shift) { (rl as any).line = '/improve '; (rl as any)._refreshLine(); }
    if (key && key.name === 'up' && historyIndex > 0) {
      historyIndex--;
      (rl as any).line = messageHistory[historyIndex];
      (rl as any).cursor = (rl as any).line.length;
      (rl as any)._refreshLine();
    }
    if (key && key.name === 'down') {
      if (historyIndex < messageHistory.length - 1) {
        historyIndex++;
        (rl as any).line = messageHistory[historyIndex];
        (rl as any).cursor = (rl as any).line.length;
        (rl as any)._refreshLine();
      } else {
        historyIndex = messageHistory.length;
        (rl as any).line = '';
        (rl as any).cursor = 0;
        (rl as any)._refreshLine();
      }
    }
  });

  drawStyledPrompt();
  if (initialInput) await processInput(initialInput);
}

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\nCRITICAL: Unhandled Rejection:'), reason);
});

process.on('uncaughtException', (err) => {
  console.error(chalk.red('\nCRITICAL: Uncaught Exception:'), err);
  setTimeout(() => process.exit(1), 1000);
});

const program = new Command();
program.name('mimocode').description('Mimocode - Autonomous AI Engineer').version('0.36.4');
program.command('chat')
  .description('Start interactive chat session')
  .action(async () => {
    const config = await loadConfig();
    await initPermissions();
    await startGeminiChat(config);
  });

program.action(async () => {
  const config = await loadConfig();
  await initPermissions();
  await startGeminiChat(config);
});

program.parse(process.argv);
