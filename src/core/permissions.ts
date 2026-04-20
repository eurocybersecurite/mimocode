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

let fullSessionTrust = false;
let sessionAllowed = new Set<string>();
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

/**
 * Main permission checker - Proactive & Less noisy
 */
export async function checkPermission(command: string, details?: string): Promise<{ allowed: boolean; instruction?: string }> {
  // 1. Full session trust? (The user said: "Take control")
  if (fullSessionTrust) return { allowed: true };

  // 2. Permanent block check
  if (blockedConfig.blocked.some(b => command.includes(b))) {
    console.log(chalk.red(`🚫 Command blocked by user policy: ${command}`));
    return { allowed: false };
  }

  // 3. Specific session whitelist
  if (sessionAllowed.has(command)) return { allowed: true };

  // 4. Fast-allow for read-only or safe operations
  const safePatterns = [
    /git status/, /git diff/, /git log/, /ls /, /cat /, /grep /, /find /, 
    /npm test/, /npm run test/, /jest/, /vitest/, /mocha/,
    /pwd/, /whoami/, /date/, /echo /, /tree/
  ];
  if (safePatterns.some(p => p.test(command)) && !details) return { allowed: true };

  // 5. Check for already allowed directory patterns (Session persistence)
  for (const allowedPath of sessionAllowed) {
    if (command.includes(allowedPath)) return { allowed: true };
  }

  // 5. Non-interactive mode (Web / CI)
  if (process.env.MIMOCODE_NON_INTERACTIVE === 'true') return { allowed: true };

  // 6. User Decision Required
  let boxContent = details || `Mimocode wants to execute: \`${command}\``;
  boxContent = await marked.parse(boxContent);
  
  console.log('\n' + boxen(boxContent, {
    title: chalk.bold.yellow(' ⚡ Permission Required '),
    padding: 1,
    borderStyle: 'round',
    borderColor: 'yellow',
    width: Math.min(process.stdout.columns || 80, 100)
  }));
  
  const { choice } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Action selection:',
    choices: [
      { name: '✅ Allow once', value: 'once' },
      { name: '🔓 Allow for this session (Full Trust)', value: 'session' },
      { name: '⏭️  Skip this action', value: 'skip' },
      { name: '🚫 Block permanently', value: 'permanent' }
    ]
  }]);

  switch (choice) {
    case 'once':
      // If it's a cd or mkdir, trust that path for the session
      const pathMatch = command.match(/(?:cd|mkdir)\s+([^\s]+)/);
      if (pathMatch) {
        sessionAllowed.add(pathMatch[1]);
      }
      return { allowed: true };
    case 'session':
      fullSessionTrust = true;
      console.log(chalk.green('🔓 Full session trust enabled. Mimocode will now work autonomously.'));
      return { allowed: true };
    case 'skip':
      return { allowed: false };
    case 'permanent':
      blockedConfig.blocked.push(command);
      await saveBlocked();
      return { allowed: false };
    default:
      return { allowed: false };
  }
}
