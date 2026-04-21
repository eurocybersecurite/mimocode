#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import os from 'os';
import readline from 'readline';
import inquirer from 'inquirer';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// Import from Core
import { engine } from '../core/engine';
import { Config, loadConfig } from '../core/config';
import { getOrCreateSession, clearSessionMessages } from '../core/db';

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

const HISTORY_FILE = path.join(os.homedir(), '.mimocode', 'cli_history.json');
let messageHistory: string[] = [];
let historyIndex = -1;

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

function renderHeader(config: any) {
  const version = 'v0.36.4';
  const totalMem = os.totalmem() / (1024 * 1024 * 1024);
  const freeMem = os.freemem() / (1024 * 1024 * 1024);
  const usedMem = totalMem - freeMem;
  const load = os.loadavg()[0];
  const cols = process.stdout.columns || 80;

  console.log(`\n${chalk.bold.hex('#6366f1')('Mimocode ATC Agent')} ${chalk.dim(version)}`);
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
  console.log(chalk.bold('Workspace: ') + chalk.dim(process.cwd()));
  console.log(chalk.dim('─'.repeat(cols)));
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
        { name: 'Run Setup', value: 'setup' },
        { name: 'Exit', value: 'exit' }
      ]
    }]);
    action = res.action;
  }

  if (action === 'exit') process.exit(0);
  if (action === 'setup') {
    const { runSetup } = await import('../core/config');
    await runSetup(config);
    return startMimocodeChat(config);
  }
  if (action === 'clear') {
    const sessionId = await getOrCreateSession(process.cwd());
    await clearSessionMessages(sessionId);
    messageHistory = [];
    await saveCLIHistory();
    console.log(chalk.dim('History cleared.'));
    return startMimocodeChat(config);
  }

  await engine.init(process.cwd());
  console.clear();
  renderHeader(config);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.bold.hex('#6366f1')('> ')
  });

  return new Promise((resolve) => {
    let isProcessing = false;
    let abortController = new AbortController();

    const ask = () => { 
      if (!isProcessing) {
        rl.prompt(); 
      }
    };

    rl.on('line', async (line) => {
      if (isProcessing) return;
      const input = line.trim();
      if (!input) { ask(); return; }
      if (input === '/exit' || input === '/quit') {
        rl.close();
        process.exit(0);
      }

      isProcessing = true;
      abortController = new AbortController();

      if (messageHistory[messageHistory.length - 1] !== input) {
        messageHistory.push(input);
        await saveCLIHistory();
        historyIndex = messageHistory.length;
      }

      const spinner = ora({ text: chalk.cyan('Thinking...'), spinner: 'dots' }).start();
      
      try {
        process.stdout.write(`\n${chalk.hex('#6366f1')('✦')} `);
        let streamedOutput = '';
        let isFirstChunk = true;

        const response = await engine.process(input, (name, args, result) => {
          if (isFirstChunk) { spinner.stop(); isFirstChunk = false; }
          if (result && (result.startsWith('✓') || result.includes('→'))) {
            process.stdout.write(`\r\x1b[K  ${chalk.dim(result)}\n`);
          }
        }, abortController.signal, (chunk) => {
          if (isFirstChunk) {
            spinner.stop();
            isFirstChunk = false;
          }
          process.stdout.write(chunk);
          streamedOutput += chunk;
        });

        spinner.stop();
        if (!streamedOutput && response.content) {
          process.stdout.write(await marked.parse(response.content));
        } else {
          process.stdout.write('\n');
        }
      } catch (e: any) {
        spinner.stop();
        console.log(chalk.red(`\nError: ${e.message}`));
      } finally {
        isProcessing = false;
        ask();
      }
    });

    const onKeyPress = (str: string, key: any) => {
      if (!key) return;
      if (key.ctrl && key.name === 'c') {
        if (isProcessing) {
          abortController.abort();
          isProcessing = false;
          console.log(chalk.yellow('\nCancelled.'));
          ask();
        } else {
          rl.close();
          process.exit(0);
        }
      }
      if (key.name === 'up' && historyIndex > 0 && !isProcessing) {
        historyIndex--;
        (rl as any).line = messageHistory[historyIndex];
        (rl as any).cursor = (rl as any).line.length;
        (rl as any)._refreshLine();
      }
      if (key.name === 'down' && !isProcessing) {
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
    };

    process.stdin.on('keypress', onKeyPress);

    rl.on('close', () => {
      process.stdin.removeListener('keypress', onKeyPress);
      resolve();
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
        let streamedOutput = '';
        let isFirstChunk = true;

        const response = await engine.process(cmd, (name, args, result) => {
          if (isFirstChunk) { spinner.stop(); isFirstChunk = false; }
          if (result && (result.startsWith('✓') || result.includes('→'))) {
            process.stdout.write(`\r\x1b[K  ${chalk.dim(result)}\n`);
          }
        }, undefined, (chunk) => {
          if (isFirstChunk) {
            spinner.stop();
            isFirstChunk = false;
          }
          process.stdout.write(chunk);
          streamedOutput += chunk;
        });
        spinner.stop();
        if (!streamedOutput && response.content) {
          process.stdout.write(await marked.parse(response.content));
        } else {
          process.stdout.write('\n');
        }
      } catch (e: any) {
        spinner.stop();
        console.error(chalk.red(`\nError: ${e.message}`));
      }
      
      // Always stay in interactive mode
      await startMimocodeChat(config, true);
    } else {
      await startMimocodeChat(config);
    }
  });

program.parse(process.argv);
