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

  rl.prompt();

  rl.on('line', async (line) => {
    if (isProcessing) return;
    const input = line.trim();
    if (!input) { rl.prompt(); return; }

    if (input === '/exit') process.exit(0);
    if (input === '/help' || input === '/h') {
      console.log(chalk.bold('\nAvailable commands: /help, /clear, /status, /exit\n'));
      rl.prompt();
      return;
    }

    isProcessing = true;
    abortController = new AbortController();
    
    if (messageHistory[messageHistory.length - 1] !== input) {
      messageHistory.push(input);
      await saveCLIHistory();
    }

    const spinner = ora({ text: chalk.cyan('Thinking...'), spinner: 'dots' }).start();

    try {
      const response = await engine.process(input, (name) => {
        spinner.text = chalk.yellow(`Using ${name}...`);
      }, abortController.signal);
      
      spinner.stop();
      process.stdout.write(`\n${chalk.hex('#6366f1')('✦')} `);
      console.log(await marked.parse(response.content));
    } catch (e: any) {
      spinner.stop();
      console.log(chalk.red(`\nError: ${e.message}`));
    } finally {
      isProcessing = false;
      rl.prompt();
    }
  });

  process.stdin.on('keypress', (str, key) => {
    if (key && key.name === 'escape' && isProcessing) {
      abortController.abort();
      console.log(chalk.yellow('\nCancelled.'));
    }
  });
}

const program = new Command();
program.action(async () => {
  const config = await loadConfig();
  await startMimocodeChat(config);
});
program.parse(process.argv);
