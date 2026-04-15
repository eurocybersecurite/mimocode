import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PLUGINS_DIR = path.join(os.homedir(), '.mimocode', 'plugins');

export interface Plugin {
  name: string;
  version: string;
  description: string;
  tools: any[];
}

export async function initPlugins() {
  await fs.ensureDir(PLUGINS_DIR);
}

export async function loadPlugins(): Promise<Plugin[]> {
  const plugins: Plugin[] = [];
  if (!(await fs.pathExists(PLUGINS_DIR))) return plugins;

  const dirs = await fs.readdir(PLUGINS_DIR);
  for (const dir of dirs) {
    const pluginPath = path.join(PLUGINS_DIR, dir);
    const manifestPath = path.join(pluginPath, 'plugin.json');
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath);
      plugins.push(manifest);
    }
  }
  return plugins;
}

export async function installPlugin(pluginUrl: string) {
  const pluginName = path.basename(pluginUrl, '.git');
  const targetDir = path.join(PLUGINS_DIR, pluginName);
  
  if (await fs.pathExists(targetDir)) {
    throw new Error(`Plugin ${pluginName} is already installed.`);
  }

  console.log(`Installing plugin ${pluginName} from ${pluginUrl}...`);
  await execAsync(`git clone ${pluginUrl} ${targetDir}`);
  
  // Check for manifest
  const manifestPath = path.join(targetDir, 'plugin.json');
  if (!(await fs.pathExists(manifestPath))) {
    // Cleanup if invalid
    await fs.remove(targetDir);
    throw new Error('Invalid plugin: Missing plugin.json manifest.');
  }

  // Install dependencies if package.json exists
  if (await fs.pathExists(path.join(targetDir, 'package.json'))) {
    await execAsync('npm install', { cwd: targetDir });
  }
}
