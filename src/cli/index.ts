#!/usr/bin/env node
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import ora from 'ora';
import os from 'os';
import readline from 'readline';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// Import from Core
import { engine } from '../core/engine';
import { Config, loadConfig } from '../core/config';
import { Agent } from '../core/agents';
import { getOrCreateSession, clearSessionMessages } from '../core/db';
import { mcpTools } from '../core/mcp';

marked.setOptions({
  renderer: new TerminalRenderer({
    codespan: chalk.hex('#eab308'),
    code: chalk.bgHex('#18181b').hex('#f8fafc'),
    heading: chalk.bold.hex('#6366f1'),
    link: chalk.cyan.underline,
    strong: chalk.bold.white,
    em: chalk.italic.gray,
    listitem: (text: string) => chalk.dim(' ◦ ') + text + '\n',
    hr: () => chalk.dim('\n' + '─'.repeat(process.stdout.columns || 40) + '\n')
  }) as any
});

let currentWorkspace = process.cwd();
let messageHistory: string[] = [];
let historyIndex = -1;
let escCount = 0;
let multiLineBuffer = '';
const HISTORY_FILE = path.join(os.homedir(), '.mimocode', 'cli_history.json');

async function loadCLIHistory() {
  if (await fs.pathExists(HISTORY_FILE)) {
    try {
      messageHistory = await fs.readJson(HISTORY_FILE);
      historyIndex = messageHistory.length;
    } catch (e) { messageHistory = []; }
  }
}

async function saveCLIHistory() {
  await fs.ensureDir(path.dirname(HISTORY_FILE));
  await fs.writeJson(HISTORY_FILE, messageHistory.slice(-100), { spaces: 2 });
}

const slashCommands = [
  { name: 'help', alias: 'h', category: 'General', description: 'Show this structured help menu' },
  { name: 'status', category: 'General', description: 'Check system, CPU and RAM status' },
  { name: 'clear', alias: 'c', category: 'General', description: 'Flush current chat history' },
  { name: 'exit', category: 'General', description: 'Terminate the session' },
  { name: 'edit', category: 'Files', description: 'Open a file in your default editor' },
  { name: 'cd', category: 'Files', description: 'Change current workspace directory' },
  { name: 'rag', category: 'Files', description: 'RAG operations (index, query, clear)' },
  { name: 'agents', alias: 'a', category: 'Agents', description: 'List all active specialized agents' },
  { name: 'skills', alias: 's', category: 'Agents', description: 'List learned procedures and skills' },
  { name: 'plan', alias: 'p', category: 'Agents', description: 'Generate and execute a multi-step plan' },
  { name: 'mcp', category: 'Systems', description: 'List and manage MCP tool connectors' },
  { name: 'heal', category: 'Systems', description: 'Auto-repair detected codebase issues' },
  { name: 'model', category: 'Systems', description: 'Switch between local LLM models' }
];

function renderHeader(config: Config) {
  const version = 'v0.36.4';
  const totalMem = os.totalmem() / (1024 * 1024 * 1024);
  const freeMem = os.freemem() / (1024 * 1024 * 1024);
  const usedMem = totalMem - freeMem;
  const load = os.loadavg()[0];
  const cols = process.stdout.columns || 80;
  
  console.log(`\n${chalk.bold.hex('#6366f1')('Mimocode')} ${chalk.dim(version)}`);
  console.log(chalk.dim('─'.repeat(cols)));
  
  const statusLine = [
    chalk.bold('Backend: ') + chalk.cyan(config.runtime),
    chalk.bold('Model: ') + chalk.cyan(config.model),
    chalk.bold('Mode: ') + chalk.green('Full Access')
  ].join(chalk.dim(' | '));
  
  const statsLine = [
    chalk.bold('CPU Load: ') + chalk.yellow(`${load.toFixed(2)}`),
    chalk.bold('RAM: ') + chalk.yellow(`${usedMem.toFixed(1)}GB / ${totalMem.toFixed(1)}GB`)
  ].join(chalk.dim(' | '));

  console.log(statusLine);
  console.log(statsLine);
  console.log(chalk.bold('Workspace: ') + chalk.dim(currentWorkspace));
  console.log(chalk.dim('─'.repeat(cols)));
}

async function handleSlashCommand(input: string, config: Config) {
  const parts = input.slice(1).split(' ');
  const rawCommand = parts[0].toLowerCase();
  const args = parts.slice(1);

  const cmdDef = slashCommands.find(c => c.name === rawCommand || c.alias === rawCommand);
  const command = cmdDef ? cmdDef.name : rawCommand;

  switch (command) {
    case 'help':
      console.log(chalk.bold.hex('#6366f1')('\n📚 Mimocode - Command Reference\n'));
      const categories = [...new Set(slashCommands.map(c => c.category))];
      categories.forEach(cat => {
        console.log(chalk.bold.white(`  ${cat}`));
        slashCommands.filter(c => c.category === cat).forEach(cmd => {
          const name = `/${cmd.name}${cmd.alias ? `, /${cmd.alias}` : ''}`;
          console.log(chalk.green(`    ${name.padEnd(25)}`) + chalk.dim(cmd.description));
        });
        console.log('');
      });
      console.log(chalk.bold.white('  Keyboard Shortcuts'));
      console.log(chalk.yellow('    ↑ / ↓                ') + chalk.dim('Navigate command history'));
      console.log(chalk.yellow('    Tab                  ') + chalk.dim('Autocomplete @agents or /commands'));
      console.log(chalk.yellow('    Ctrl + C             ') + chalk.dim('Interrupt or Exit'));
      console.log(chalk.yellow('    Ctrl + L             ') + chalk.dim('Clear screen'));
      console.log(chalk.yellow('    Esc                  ') + chalk.dim('1x: Interrupt | 2x: Cancel Request'));
      console.log(chalk.yellow('    \\ (at line end)      ') + chalk.dim('Multi-line input mode'));
      console.log('');
      break;
    case 'status':
      renderHeader(config);
      break;
    case 'clear':
      const sessionId = await getOrCreateSession(process.cwd());
      await clearSessionMessages(sessionId);
      console.log(chalk.green('\n✓ Chat history cleared\n'));
      break;
    case 'exit':
      process.exit(0);
      break;
    case 'cd':
      if (args[0]) {
        const newPath = path.resolve(process.cwd(), args[0]);
        if (fs.existsSync(newPath)) {
          process.chdir(newPath);
          currentWorkspace = newPath;
          console.log(chalk.green(`\n✓ Directory changed to: ${newPath}\n`));
        } else {
          console.log(chalk.red(`\n❌ Directory not found: ${args[0]}\n`));
        }
      }
      break;
    default:
      console.log(chalk.red(`\n❌ Unknown command: /${command}. Type /help for assistance.\n`));
  }
}

async function startMimocodeChat(config: Config) {
  await loadCLIHistory();

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Mimocode ready. What would you like to do?',
    choices: [
      { name: 'Start Chatting', value: 'chat' },
      { name: 'Clear History', value: 'clear' },
      { name: 'Run Setup', value: 'setup' },
      { name: 'Exit', value: 'exit' }
    ]
  }]);

  if (action === 'exit') process.exit(0);
  if (action === 'setup') {
    const { runSetup } = await import('../core/config');
    await runSetup(config);
  }
  if (action === 'clear') {
    const sessionId = await getOrCreateSession(currentWorkspace);
    await clearSessionMessages(sessionId);
    messageHistory = [];
    await saveCLIHistory();
    console.log(chalk.dim('History cleared.'));
  }

  await engine.init(currentWorkspace);
  console.clear();
  renderHeader(config);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${chalk.bold.hex('#6366f1')('> ')}`
  });

  let isProcessing = false;
  let abortController = new AbortController();

  const askQuestion = () => {
    rl.prompt();
  };

  rl.on('line', async (line) => {
    if (isProcessing) return;
    
    const input = line.trim();
    
    if (input.endsWith('\\')) {
      multiLineBuffer += input.slice(0, -1) + '\n';
      rl.setPrompt(chalk.dim('... '));
      rl.prompt();
      return;
    }

    const fullInput = (multiLineBuffer + input).trim();
    multiLineBuffer = '';
    rl.setPrompt(`${chalk.bold.hex('#6366f1')('> ')}`);

    if (!fullInput) { askQuestion(); return; }

    if (fullInput.startsWith('/')) {
      await handleSlashCommand(fullInput, config);
      askQuestion();
      return;
    }

    isProcessing = true;
    abortController = new AbortController();
    escCount = 0;
    
    if (messageHistory[messageHistory.length - 1] !== fullInput) {
      messageHistory.push(fullInput);
      await saveCLIHistory();
      historyIndex = messageHistory.length;
    }

    const spinner = ora({ text: chalk.cyan('Thinking...'), spinner: 'dots' }).start();

    try {
      process.stdout.write(`\n${chalk.hex('#6366f1')('✦')} `);
      const response = await engine.process(fullInput, (name) => {
        spinner.text = chalk.yellow(`Using ${name}...`);
      }, abortController.signal, (chunk) => {
        spinner.stop();
        process.stdout.write(chunk);
      });
      
      spinner.stop();
      // On s'assure que le contenu final est bien formaté après le streaming
      // console.log(await marked.parse(response.content)); // Optionnel si on veut re-formater à la fin
    } catch (e: any) {
      spinner.stop();
      if (e.message === 'Operation aborted by user') {
        console.log(chalk.yellow('\n⏹️  Operation cancelled.'));
      } else {
        console.log(chalk.red(`\nError: ${e.message}`));
      }
    } finally {
      isProcessing = false;
      askQuestion();
    }
  });

  process.stdin.on('keypress', (str, key) => {
    if (!key) return;

    if (key.ctrl && key.name === 'l') {
      console.clear();
      renderHeader(config);
      rl.prompt();
    }

    if (key.ctrl && key.name === 'c') {
      if (isProcessing) {
        abortController.abort();
      } else {
        process.exit(0);
      }
    }

    if (key.name === 'escape') {
      escCount++;
      if (isProcessing) {
        if (escCount === 1) {
          console.log(chalk.yellow('\nInterruption (Esc again to cancel request)...'));
        } else if (escCount >= 2) {
          abortController.abort();
          escCount = 0;
        }
      } else {
        (rl as any).line = '';
        (rl as any).cursor = 0;
        (rl as any)._refreshLine();
        escCount = 0;
      }
    }

    if (key.name === 'up' && historyIndex > 0) {
      historyIndex--;
      (rl as any).line = messageHistory[historyIndex] || '';
      (rl as any).cursor = (rl as any).line.length;
      (rl as any)._refreshLine();
    }
    if (key.name === 'down') {
      if (historyIndex < messageHistory.length - 1) {
        historyIndex++;
        (rl as any).line = messageHistory[historyIndex] || '';
        (rl as any).cursor = (rl as any).line.length;
        (rl as any)._refreshLine();
      } else {
        historyIndex = messageHistory.length;
        (rl as any).line = '';
        (rl as any).cursor = 0;
        (rl as any)._refreshLine();
      }
    }

    if (key.name === 'tab') {
      const line = (rl as any).line;
      if (line.startsWith('/')) {
        const search = line.slice(1).toLowerCase();
        const found = slashCommands.find(c => c.name.startsWith(search));
        if (found) {
          (rl as any).line = `/${found.name}`;
          (rl as any).cursor = (rl as any).line.length;
          (rl as any)._refreshLine();
        }
      }
    }
  });

  askQuestion();
}

const program = new Command();

program
  .name('mimocode')
  .description('Mimocode CLI - Local AI Software Engineering Agent')
  .version('0.36.4')
  .argument('[command...]', 'Command to execute (e.g., skill run <name>)')
  .action(async (commandArgs: string[]) => {
    const config = await loadConfig();
    
    if (commandArgs && commandArgs.length > 0) {
      // Si des arguments sont présents, on les traite comme une commande unique
      const cmd = commandArgs.join(' ');
      
      // Initialisation de l'engine avant traitement
      await engine.init(process.cwd());
      
      const spinner = ora({ text: chalk.cyan(`Executing: ${cmd}...`), spinner: 'dots' }).start();
      
      try {
        process.stdout.write(`\n${chalk.hex('#6366f1')('✦')} Result:\n`);
        const response = await engine.process(cmd, (name) => {
          spinner.text = chalk.yellow(`Using ${name}...`);
        }, undefined, (chunk) => {
          spinner.stop();
          process.stdout.write(chunk);
        });
        
        spinner.stop();
        process.stdout.write('\n');
        
        // Au lieu de sortir immédiatement, demander si l'utilisateur veut continuer en chat
        const { stay } = await inquirer.prompt([{
          type: 'confirm',
          name: 'stay',
          message: 'Would you like to continue in interactive chat mode?',
          default: false
        }]);

        if (stay) {
          await startMimocodeChat(config);
        } else {
          process.exit(0);
        }
      } catch (e: any) {
        spinner.stop();
        console.error(chalk.red(`\nError: ${e.message}`));
        process.exit(1);
      }
    } else {
      // Sinon, lancer le mode interactif
      await startMimocodeChat(config);
    }
  });

program.parse(process.argv);
