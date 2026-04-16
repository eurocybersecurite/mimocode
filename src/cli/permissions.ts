import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';

import boxen from 'boxen';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

marked.setOptions({
  renderer: new TerminalRenderer() as any
});

const CONFIG_DIR = path.join(os.homedir(), '.mimocode');
const BLOCKED_FILE = path.join(CONFIG_DIR, 'blocked_commands.json');

interface BlockedConfig {
  blocked: string[];
  instructions: Record<string, string>;
}

let sessionAllowed = new Set<string>();
let sessionFileOperationsAllowed = false;
let blockedConfig: BlockedConfig = { blocked: [], instructions: {} };

export async function initPermissions() {
  await fs.ensureDir(CONFIG_DIR);
  if (await fs.pathExists(BLOCKED_FILE)) {
    blockedConfig = await fs.readJson(BLOCKED_FILE);
  }
}

async function saveBlocked() {
  await fs.writeJson(BLOCKED_FILE, blockedConfig, { spaces: 2 });
}

export function isSensitive(command: string): boolean {
  const sensitivePatterns = [
    /\brm\b/,
    /\bsudo\b/,
    /\bchmod\b\s+777\b/,
    /\bdd\b/,
    /\bkill\b/,
    /\bformat\b/,
    /\bmkfs\b/,
    /\bshred\b/
  ];
  return sensitivePatterns.some(pattern => pattern.test(command));
}

export async function checkPermission(command: string, details?: string): Promise<{ allowed: boolean; instruction?: string }> {
  // Check permanent blocks
  if (blockedConfig.blocked.some(b => command.includes(b))) {
    console.log(chalk.red(`🚫 Command blocked permanently: ${command}`));
    return { allowed: false };
  }

  // Check session allowed
  if (sessionAllowed.has(command)) {
    return { allowed: true, instruction: blockedConfig.instructions[command] };
  }

  // Check session-wide file operations
  const isFileOp = command.startsWith('write ') || command.startsWith('rm ') || command.startsWith('read ');
  if (isFileOp && sessionFileOperationsAllowed) {
    return { allowed: true };
  }

  // If not sensitive, allow directly
  if (!isSensitive(command) && !details) {
    return { allowed: true };
  }

  // If non-interactive (e.g. Web UI), auto-allow but log
  if (process.env.MIMOCODE_NON_INTERACTIVE === 'true') {
    console.log(chalk.yellow(`[Permissions] Auto-allowing sensitive command in non-interactive mode: ${command}`));
    return { allowed: true };
  }

  // Sensitive command or explicit details - ask user
  let boxContent = details || `The agent wants to execute: \`${command}\``;
  
  // If details contains a diff (detected by our custom box characters), 
  // we split it to render markdown only on the text part
  if (boxContent.includes('┌') && boxContent.includes('📝 Changes in')) {
    const parts = boxContent.split('📝 Changes in');
    const textPart = await marked.parse(parts[0]);
    boxContent = textPart + '\n📝 Changes in' + parts[1];
  } else {
    boxContent = await marked.parse(boxContent);
  }
  
  console.log('\n' + boxen(boxContent, {
    title: chalk.bold.yellow(' Action Required '),
    titleAlignment: 'left',
    padding: 1,
    borderStyle: 'round',
    borderColor: 'yellow',
    width: Math.min(process.stdout.columns || 80, 100)
  }));
  
  const { choice } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Apply this change?',
    choices: [
      { name: '✅ Allow once', value: 'once' },
      { name: '🔓 Allow for this session', value: 'session' },
      { name: '⏭️  Skip', value: 'skip' },
      { name: '📝 Allow with instruction', value: 'instruction' },
      { name: '🚫 Block permanently', value: 'permanent' }
    ]
  }]);

  switch (choice) {
    case 'once':
      return { allowed: true };
    case 'session':
      if (isFileOp) {
        sessionFileOperationsAllowed = true;
      } else {
        sessionAllowed.add(command);
      }
      return { allowed: true };
    case 'skip':
      return { allowed: false };
    case 'instruction':
      const { instruction } = await inquirer.prompt([{
        type: 'input',
        name: 'instruction',
        message: 'Enter special instruction for this command:'
      }]);
      blockedConfig.instructions[command] = instruction;
      sessionAllowed.add(command);
      await saveBlocked();
      return { allowed: true, instruction };
    case 'permanent':
      blockedConfig.blocked.push(command);
      await saveBlocked();
      return { allowed: false };
    default:
      return { allowed: false };
  }
}
