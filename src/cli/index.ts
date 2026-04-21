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
    case 'cd':
      if (args[0]) {
        const newPath = path.resolve(process.cwd(), args[0]);
        if (fs.existsSync(newPath)) {
          process.chdir(newPath);
          currentWorkspace = newPath;
          console.log(chalk.green(`\n✓ Directory changed to: ${newPath}\n`));
        }
      }
      break;
  }
  return null;
}

async function startMimocodeChat(config: Config, skipMenu = false): Promise<void> {
  await loadCLIHistory();

  let action = 'chat';
  if (!skipMenu) {
    const res = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Mimocode ready. What would you like to do?',
      choices: [
        { name: 'Start Chatting', value: 'chat' },
        { name: 'Clear History', value: 'clear' },
        { name: 'Exit', value: 'exit' }
      ]
    }]);
    action = res.action;
  }

  if (action === 'exit') process.exit(0);
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

  return new Promise((resolve) => {
    let isProcessing = false;
    let abortController = new AbortController();

    const ask = () => { if (!isProcessing) rl.prompt(); };

    rl.on('line', async (line) => {
      if (isProcessing) return;
      const input = line.trim();
      if (!input) { ask(); return; }

      if (input.startsWith('/')) {
        await handleSlashCommand(input, config);
        ask();
        return;
      }

      isProcessing = true;
      abortController = new AbortController();
      
      const spinner = ora({ text: chalk.cyan('Thinking...'), spinner: 'dots' }).start();

      try {
        process.stdout.write(`\n${chalk.hex('#6366f1')('✦')} `);
        let streamed = '';
        let isFirst = true;

        await engine.process(input, (name, args, result) => {
          if (isFirst) { spinner.stop(); isFirst = false; }
          if (result && (result.startsWith('✓') || result.includes('→'))) {
            process.stdout.write(`\r\x1b[K  ${chalk.dim(result)}\n`);
          }
        }, abortController.signal, (chunk) => {
          if (isFirst) { spinner.stop(); isFirst = false; }
          process.stdout.write(chunk);
          streamed += chunk;
        });

        if (!streamed) spinner.stop();
        process.stdout.write('\n');
      } catch (e: any) {
        spinner.stop();
        console.log(chalk.red(`\nError: ${e.message}`));
      } finally {
        isProcessing = false;
        ask();
      }
    });

    rl.on('SIGINT', () => {
      if (isProcessing) {
        abortController.abort();
        isProcessing = false;
        console.log(chalk.yellow('\nCancelled.'));
        ask();
      } else {
        process.exit(0);
      }
    });

    ask();
  });
}

const program = new Command();
program
  .name('mimocode')
  .argument('[command...]', 'Command to execute')
  .action(async (commandArgs: string[]) => {
    const config = await loadConfig();
    if (commandArgs && commandArgs.length > 0) {
      const cmd = commandArgs.join(' ');
      await engine.init(process.cwd());
      console.clear();
      renderHeader(config);
      
      const spinner = ora({ text: chalk.cyan(`Executing: ${cmd}...`), spinner: 'dots' }).start();
      try {
        process.stdout.write(`\n${chalk.hex('#6366f1')('✦')} Result:\n`);
        let isFirst = true;
        await engine.process(cmd, (name, args, result) => {
          if (isFirst) { spinner.stop(); isFirst = false; }
          if (result && (result.startsWith('✓') || result.includes('→'))) {
            process.stdout.write(`\r\x1b[K  ${chalk.dim(result)}\n`);
          }
        }, undefined, (chunk) => {
          if (isFirst) { spinner.stop(); isFirst = false; }
          process.stdout.write(chunk);
        });
        spinner.stop();
        process.stdout.write('\n');
        await startMimocodeChat(config, true);
      } catch (e: any) {
        spinner.stop();
        process.exit(1);
      }
    } else {
      await startMimocodeChat(config);
    }
  });

program.parse(process.argv);
