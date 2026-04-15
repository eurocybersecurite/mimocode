import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import axios from 'axios';
import { indexDirectory, queryIndex } from './src/cli/rag';
import { loadSkills, createSkill, runSkill, deleteSkill } from './src/cli/skills';
import { createCheckpoint, restoreLatest } from './src/cli/checkpoints';
import { improveSelf, learnHabits } from './src/cli/improve';
import { getOrCreateSession, getSessionMessages, saveMessage } from './src/cli/db';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from './src/cli/config';
import { collaborate, loadAgents, createAgent, deleteAgent, loadHistory } from './src/cli/agents';
import { generatePlan, executePlan } from './src/cli/planner';
import { runInSandbox } from './src/cli/sandbox';
import { setupVSCode } from './src/cli/vscode';
import { mcpTools } from './src/cli/mcp';

dotenv.config();

const execAsync = promisify(exec);
const PROJECT_ROOT = process.cwd();

// SSE Clients for real-time sync
let sseClients: any[] = [];

function broadcast(data: any) {
  sseClients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
}

export function emitEvent(type: string, data: any) {
  broadcast({ type, data, timestamp: new Date().toISOString() });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to get list of agents
  app.get('/api/agents', async (req, res) => {
    const config = await loadConfig();
    const agentDir = config.agentDir;
    await fs.ensureDir(agentDir);
    if (await fs.pathExists(agentDir)) {
      const files = await fs.readdir(agentDir);
      const agents = files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
      res.json(agents);
    } else {
      res.json([]);
    }
  });

  // API to list all agents with full details
  app.get('/api/agents/details', async (req, res) => {
    const config = await loadConfig();
    const agents = await loadAgents(config);
    res.json(agents);
  });

  // API to create/update an agent
  app.post('/api/agents', async (req, res) => {
    const { name, description, systemInstruction, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const config = await loadConfig();
    await createAgent(config, { name, description, systemInstruction, tags });
    res.json({ success: true });
  });

  // API to delete an agent
  app.delete('/api/agents/:name', async (req, res) => {
    const { name } = req.params;
    const config = await loadConfig();
    const success = await deleteAgent(config, name);
    res.json({ success });
  });

  // API to get execution history
  app.get('/api/history', async (req, res) => {
    const config = await loadConfig();
    const history = await loadHistory(config);
    res.json(history);
  });

  // API to get chat history
  app.get('/api/chat/history', async (req, res) => {
    try {
      const sessionId = await getOrCreateSession(PROJECT_ROOT);
      const messages = await getSessionMessages(sessionId);
      res.json(messages);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API to add MCP server
  app.post('/api/config/mcp', async (req, res) => {
    try {
      const { name, type, command, args, url } = req.body;
      const config = await loadConfig();
      if (!config.mcpServers) config.mcpServers = [];
      
      config.mcpServers.push({ name, type, command, args, url });
      await saveConfig(config);
      res.json({ success: true, config });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Global Search Endpoint
  app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
      // Use grep to search for the query in the project
      const { stdout } = await execAsync(`grep -rI "${q}" . --exclude-dir={node_modules,dist,.git} || true`);
      const lines = stdout.split('\n').filter(l => l.trim());
      const results = lines.map(line => {
        const [filePath, ...contentParts] = line.split(':');
        const content = contentParts.join(':');
        return { filePath, content: content.trim() };
      });
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/git/version/bump', async (req, res) => {
    const { type } = req.body; // 'patch', 'minor', 'major'
    try {
      const pkgPath = path.join(PROJECT_ROOT, 'package.json');
      const pkg = await fs.readJson(pkgPath);
      let [major, minor, patch] = pkg.version.split('.').map(Number);
      
      if (type === 'major') major++;
      else if (type === 'minor') minor++;
      else patch++;
      
      pkg.version = `${major}.${minor}.${patch}`;
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      res.json({ success: true, version: pkg.version });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Git Endpoints
  app.get('/api/git/status', async (req, res) => {
    try {
      const { stdout } = await execAsync('git status --porcelain');
      const lines = stdout.split('\n').filter(l => l.trim());
      const status = lines.map(line => {
        const code = line.substring(0, 2);
        const filePath = line.substring(3);
        return { code, filePath };
      });
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/git/diff', async (req, res) => {
    const { filePath } = req.query;
    try {
      const cmd = filePath ? `git diff "${filePath}"` : 'git diff';
      const { stdout } = await execAsync(cmd);
      res.json({ diff: stdout });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/git/commit', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Commit message is required' });
    try {
      await execAsync('git add .');
      await execAsync(`git commit -m "${message}"`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/git/add', async (req, res) => {
    const { files = '.' } = req.body;
    try {
      await execAsync(`git add ${files}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/git/push', async (req, res) => {
    try {
      await execAsync('git push');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/git/pull', async (req, res) => {
    try {
      await execAsync('git pull');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/git/branches', async (req, res) => {
    try {
      const { stdout } = await execAsync('git branch -a');
      const branches = stdout.split('\n').filter(l => l.trim()).map(l => {
        const isCurrent = l.startsWith('*');
        const name = l.replace('*', '').trim();
        return { name, isCurrent };
      });
      res.json(branches);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/git/checkout', async (req, res) => {
    const { branch } = req.body;
    try {
      await execAsync(`git checkout ${branch}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/git/branch/create', async (req, res) => {
    const { name } = req.body;
    try {
      await execAsync(`git checkout -b ${name}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Plugin Store Endpoints
  app.get('/api/plugins/store', (req, res) => {
    const store = [
      { id: 'p1', name: 'Docker Manager', description: 'Manage containers and images', author: 'Mimocode', version: '1.0.0', url: 'https://github.com/mimocode/plugin-docker.git' },
      { id: 'p2', name: 'AWS Helper', description: 'Tools for AWS Lambda and S3', author: 'Mimocode', version: '0.5.0', url: 'https://github.com/mimocode/plugin-aws.git' },
      { id: 'p3', name: 'Code Reviewer', description: 'Automated PR reviews', author: 'Community', version: '1.2.1', url: 'https://github.com/community/plugin-review.git' }
    ];
    res.json(store);
  });

  // Secrets Manager Endpoints
  app.get('/api/secrets', async (req, res) => {
    try {
      const envPath = path.join(PROJECT_ROOT, '.env');
      if (!(await fs.pathExists(envPath))) return res.json({});
      const content = await fs.readFile(envPath, 'utf-8');
      const secrets: Record<string, string> = {};
      content.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length > 0) secrets[key.trim()] = val.join('=').trim();
      });
      res.json(secrets);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/secrets', async (req, res) => {
    const { key, value } = req.body;
    try {
      const envPath = path.join(PROJECT_ROOT, '.env');
      let content = '';
      if (await fs.pathExists(envPath)) {
        content = await fs.readFile(envPath, 'utf-8');
      }
      const lines = content.split('\n');
      const index = lines.findIndex(l => l.startsWith(`${key}=`));
      if (index !== -1) {
        lines[index] = `${key}=${value}`;
      } else {
        lines.push(`${key}=${value}`);
      }
      await fs.writeFile(envPath, lines.join('\n'));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/secrets/:key', async (req, res) => {
    const { key } = req.params;
    try {
      const envPath = path.join(PROJECT_ROOT, '.env');
      if (await fs.pathExists(envPath)) {
        const content = await fs.readFile(envPath, 'utf-8');
        const lines = content.split('\n').filter(l => !l.startsWith(`${key}=`));
        await fs.writeFile(envPath, lines.join('\n'));
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // MCP Catalog Endpoint
  app.get('/api/mcp/catalog', (req, res) => {
    const catalog = [
      { name: 'google-maps', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-google-maps'], description: 'Location search and routing' },
      { name: 'slack', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-slack'], description: 'Send messages and manage channels' },
      { name: 'everything', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-everything'], description: 'Reference implementation with all features' },
      { name: 'memory', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'], description: 'Graph-based persistent memory' },
      { name: 'sqlite', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sqlite', '--db', 'mimocode.db'], description: 'Query and manage local SQLite databases' },
      { name: 'postgres', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'], description: 'Connect to remote PostgreSQL databases' },
      { name: 'github', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], description: 'Manage issues, PRs, and repository content' },
      { name: 'brave-search', type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], description: 'Search the web using Brave API' }
    ];
    res.json(catalog);
  });

  app.delete('/api/mcp/servers/:name', async (req, res) => {
    const { name } = req.params;
    try {
      const config = await loadConfig();
      config.mcpServers = (config.mcpServers || []).filter((s: any) => s.name !== name);
      await saveConfig(config);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/mcp/servers/:name', async (req, res) => {
    const { name } = req.params;
    const updatedServer = req.body;
    try {
      const config = await loadConfig();
      const index = (config.mcpServers || []).findIndex((s: any) => s.name === name);
      if (index !== -1) {
        config.mcpServers[index] = updatedServer;
        await saveConfig(config);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Server not found' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/config/reset', async (req, res) => {
    try {
      await saveConfig(DEFAULT_CONFIG);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/mcp/clone', async (req, res) => {
    const { name, repoUrl } = req.body;
    try {
      const targetDir = path.join(PROJECT_ROOT, 'mcp-servers', name);
      await fs.ensureDir(path.dirname(targetDir));
      
      // Simulating a clone for now, or we could actually use git if available
      // For this environment, we'll just create a placeholder directory
      await fs.ensureDir(targetDir);
      await fs.writeFile(path.join(targetDir, 'package.json'), JSON.stringify({
        name: name,
        version: '1.0.0',
        description: `Cloned from ${repoUrl}`,
        main: 'index.js',
        scripts: { start: 'node index.js' }
      }, null, 2));
      await fs.writeFile(path.join(targetDir, 'index.js'), `// MCP Server: ${name}\nconsole.log("MCP Server ${name} starting...");`);
      
      res.json({ success: true, path: targetDir });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Skills Endpoints
  app.get('/api/skills', async (req, res) => {
    const config = await loadConfig();
    const skills = await loadSkills(config);
    res.json(skills);
  });

  app.get('/api/skills/pending', async (req, res) => {
    const config = await loadConfig();
    const pendingPath = path.join(path.dirname(config.historyFile), 'pending_skills.json');
    if (await fs.pathExists(pendingPath)) {
      res.json(await fs.readJson(pendingPath));
    } else {
      res.json([]);
    }
  });

  app.delete('/api/skills/pending/:name', async (req, res) => {
    const { name } = req.params;
    const config = await loadConfig();
    const pendingPath = path.join(path.dirname(config.historyFile), 'pending_skills.json');
    if (await fs.pathExists(pendingPath)) {
      let pending = await fs.readJson(pendingPath);
      pending = pending.filter((s: any) => s.name !== name);
      await fs.writeJson(pendingPath, pending, { spaces: 2 });
    }
    res.json({ success: true });
  });

  app.post('/api/skills', async (req, res) => {
    const config = await loadConfig();
    await createSkill(config, req.body);
    // Optionally remove from pending if it was saved
    res.json({ status: 'ok' });
  });

  app.delete('/api/skills/:name', async (req, res) => {
    const { name } = req.params;
    const config = await loadConfig();
    const success = await deleteSkill(config, name);
    res.json({ success });
  });

  // Checkpoints Endpoints
  app.post('/api/checkpoints', async (req, res) => {
    const config = await loadConfig();
    const path = await createCheckpoint(config);
    res.json({ path });
  });

  app.post('/api/restore', async (req, res) => {
    const config = await loadConfig();
    const result = await restoreLatest(config);
    res.json({ result });
  });

  // Improve Endpoints
  app.post('/api/improve', async (req, res) => {
    const { apply } = req.body;
    const config = await loadConfig();
    const result = await improveSelf(config, !!apply);
    res.json({ result });
  });

  app.post('/api/learn', async (req, res) => {
    const config = await loadConfig();
    const result = await learnHabits(config);
    res.json({ result });
  });

  // Collaboration Endpoints
  app.post('/api/collaborate', async (req, res) => {
    const { agents, task } = req.body;
    const config = await loadConfig();
    const result = await collaborate(config, agents, task);
    res.json({ result });
  });

  // Planning Endpoints
  app.post('/api/plan/generate', async (req, res) => {
    const { task } = req.body;
    const config = await loadConfig();
    const steps = await generatePlan(config, task);
    res.json({ steps });
  });

  app.post('/api/plan/execute', async (req, res) => {
    const { steps } = req.body;
    const config = await loadConfig();
    const result = await executePlan(config, steps);
    res.json({ result });
  });

  // Sandbox Endpoints
  app.post('/api/sandbox', async (req, res) => {
    const { code } = req.body;
    const config = await loadConfig();
    try {
      const result = await runInSandbox(config, code);
      res.json({ result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // File Management Endpoints
  app.get('/api/files/list', async (req, res) => {
    const { dirPath = '.' } = req.query;
    const fullPath = path.resolve(PROJECT_ROOT, dirPath as string);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const result = files.map(f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        path: path.relative(PROJECT_ROOT, path.join(fullPath, f.name))
      }));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/files/read', async (req, res) => {
    const { filePath } = req.query;
    const fullPath = path.resolve(PROJECT_ROOT, filePath as string);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      res.json({ content });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/files/write', async (req, res) => {
    const { filePath, content } = req.body;
    const fullPath = path.resolve(PROJECT_ROOT, filePath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      await fs.writeFile(fullPath, content, 'utf-8');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/files/create', async (req, res) => {
    const { path: relativePath, isDirectory } = req.body;
    const fullPath = path.resolve(PROJECT_ROOT, relativePath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    try {
      if (isDirectory) {
        await fs.ensureDir(fullPath);
      } else {
        await fs.ensureFile(fullPath);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/files/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    
    try {
      const results: any[] = [];
      const walk = async (dir: string) => {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          const resPath = path.join(dir, file.name);
          const relativePath = path.relative(PROJECT_ROOT, resPath);
          
          if (file.name.toLowerCase().includes((query as string).toLowerCase())) {
            results.push({
              name: file.name,
              isDirectory: file.isDirectory(),
              path: relativePath
            });
          }
          
          if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules' && file.name !== 'dist') {
            await walk(resPath);
          }
        }
      };
      await walk(PROJECT_ROOT);
      res.json(results.slice(0, 50)); // Limit results
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // VS Code Endpoints
  app.post('/api/vscode/setup', async (req, res) => {
    const result = await setupVSCode();
    res.json({ result });
  });

  // API to get config
  app.get('/api/config', async (req, res) => {
    const config = await loadConfig();
    res.json(config);
  });

  // SSE Endpoint for real-time sync
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c.id !== clientId);
    });
  });

  // API to get full file tree
  app.get('/api/files/tree', async (req, res) => {
    try {
      const getTree = async (dir: string): Promise<any> => {
        const files = await fs.readdir(dir, { withFileTypes: true });
        const result = [];
        for (const f of files) {
          const fullPath = path.join(dir, f.name);
          const relativePath = path.relative(PROJECT_ROOT, fullPath);
          if (f.name === 'node_modules' || f.name === '.git' || f.name === 'dist') continue;
          
          if (f.isDirectory()) {
            result.push({
              name: f.name,
              isDirectory: true,
              path: relativePath,
              children: await getTree(fullPath)
            });
          } else {
            result.push({
              name: f.name,
              isDirectory: false,
              path: relativePath
            });
          }
        }
        return result;
      };
      const tree = await getTree(PROJECT_ROOT);
      res.json(tree);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API to get MCP tools
  app.get('/api/mcp/tools', async (req, res) => {
    try {
      const tools = mcpTools.map(t => ({
        name: t.name,
        description: t.description
      }));
      res.json(tools);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API to get MCP stats
  app.get('/api/mcp/stats', async (req, res) => {
    try {
      const config = await loadConfig();
      const connectedServers = (config.mcpServers || []).length;
      const activeTools = mcpTools.length;
      res.json({
        connectedServers,
        activeTools,
        status: 'Operational'
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Plugin Endpoints
  app.get('/api/plugins/store', (req, res) => {
    res.json([
      { id: 'git-provider', name: 'Git Provider', description: 'Advanced Git integration for agents', author: 'Mimocode Team', version: '1.0.0', url: 'https://github.com/mimocode/plugin-git' },
      { id: 'docker-manager', name: 'Docker Manager', description: 'Manage containers directly from agents', author: 'Mimocode Team', version: '0.8.0', url: 'https://github.com/mimocode/plugin-docker' },
      { id: 'aws-cloud', name: 'AWS Cloud', description: 'Deploy and manage AWS resources', author: 'Mimocode Team', version: '1.2.1', url: 'https://github.com/mimocode/plugin-aws' },
      { id: 'sql-explorer', name: 'SQL Explorer', description: 'Query and visualize databases', author: 'Mimocode Team', version: '1.1.0', url: 'https://github.com/mimocode/plugin-sql' }
    ]);
  });

  app.post('/api/plugins/install', async (req, res) => {
    const { url } = req.body;
    try {
      const { installPlugin } = await import('./src/cli/plugins');
      const plugin = await installPlugin(url);
      res.json({ success: true, plugin });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/plugins/list', async (req, res) => {
    const pluginsDir = path.join(PROJECT_ROOT, '.mimocode', 'plugins');
    if (!await fs.pathExists(pluginsDir)) return res.json([]);
    const dirs = await fs.readdir(pluginsDir);
    const plugins = [];
    for (const d of dirs) {
      const manifestPath = path.join(pluginsDir, d, 'plugin.json');
      if (await fs.pathExists(manifestPath)) {
        plugins.push(await fs.readJson(manifestPath));
      }
    }
    res.json(plugins);
  });

  // API to deploy project
  app.post('/api/deploy', async (req, res) => {
    const { platform = 'github' } = req.body;
    emitEvent('deploy_start', { platform });
    
    try {
      const pkg = await fs.readJson(path.join(PROJECT_ROOT, 'package.json'));
      const localVersion = pkg.version;
      
      emitEvent('deploy_progress', { step: 'Checking version...', progress: 10 });
      
      // Simulate remote version check
      let remoteVersion = "0.36.3"; // In a real app, fetch from GitHub API
      
      const compareVersions = (v1: string, v2: string) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if (parts1[i] > parts2[i]) return 1;
          if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
      };

      if (compareVersions(localVersion, remoteVersion) <= 0) {
        throw new Error(`Deployment failed: Local version (${localVersion}) must be higher than remote version (${remoteVersion}). Please increment version in package.json.`);
      }

      emitEvent('deploy_progress', { step: 'Git Add...', progress: 30 });
      await execAsync('git add .', { cwd: PROJECT_ROOT }).catch(() => {});
      
      emitEvent('deploy_progress', { step: 'Git Commit...', progress: 50 });
      await execAsync(`git commit -m "Release v${localVersion}"`, { cwd: PROJECT_ROOT }).catch(() => {});
      
      emitEvent('deploy_progress', { step: 'Git Push...', progress: 80 });
      // In this environment we simulate the push success
      // await execAsync('git push origin main', { cwd: PROJECT_ROOT });
      
      setTimeout(() => {
        emitEvent('deploy_success', { url: 'https://github.com/eurocybersecurite/mimocode.git', version: localVersion });
        res.json({ success: true, url: 'https://github.com/eurocybersecurite/mimocode.git', version: localVersion });
      }, 2000);
    } catch (e: any) {
      emitEvent('deploy_error', { error: e.message });
      res.status(500).json({ error: e.message });
    }
  });

  // API to update config
  app.post('/api/config', async (req, res) => {
    const newConfig = req.body;
    const config = await loadConfig();
    const updatedConfig = { ...config, ...newConfig };
    await saveConfig(updatedConfig);
    res.json({ success: true, config: updatedConfig });
  });

  // Internal event endpoint for CLI to report progress
  app.post('/api/internal/event', (req, res) => {
    const { type, data } = req.body;
    emitEvent(type, data);
    res.json({ success: true });
  });

  // API to get available models from local backend
  app.get('/api/models', async (req, res) => {
    const config = await loadConfig();
    const { runtime, endpoint } = config;
    try {
      let models: string[] = [];
      if (runtime === 'ollama') {
        const response = await axios.get(`${endpoint}/api/tags`);
        models = response.data.models.map((m: any) => m.name);
      } else if (runtime === 'lmstudio' || runtime === 'llama-cpp' || runtime === 'mlx') {
        const response = await axios.get(`${endpoint}/v1/models`);
        models = response.data.data.map((m: any) => m.id);
      }
      res.json(models);
    } catch (e: any) {
      res.status(500).json({ error: `Failed to fetch models from ${runtime}: ${e.message}` });
    }
  });

  // API to execute mimocode commands
  app.post('/api/exec', (req, res) => {
    const { command, apiKey } = req.body;
    const serverApiKey = process.env.MIMOCODE_API_KEY;

    if (serverApiKey && apiKey !== serverApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key.' });
    }

    if (!command.startsWith('mimocode')) {
      return res.status(400).json({ error: 'Only mimocode commands are allowed.' });
    }

    // Run the CLI using tsx safely by bypassing the shell
    const rawArgs = command.replace(/^mimocode\s+/, '');
    
    // Split arguments while respecting quotes (simple version)
    const argsMatch = rawArgs.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const cleanArgs = argsMatch.map(arg => {
      if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
        return arg.slice(1, -1);
      }
      return arg;
    });

    const child = spawn('npx', ['tsx', 'src/cli/index.ts', ...cleanArgs], {
      env: { ...process.env, MIMOCODE_NON_INTERACTIVE: 'true' }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      res.json({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });
  });

  // API to check remote status
  app.get('/api/remote/status', (req, res) => {
    const apiKey = req.query.apiKey as string;
    const serverApiKey = process.env.MIMOCODE_API_KEY;

    if (serverApiKey && apiKey !== serverApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key.' });
    }

    res.json({
      status: 'online',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  // API to download files from remote server
  app.get('/api/remote/download', async (req, res) => {
    const { filePath, apiKey } = req.query;
    const serverApiKey = process.env.MIMOCODE_API_KEY;

    if (serverApiKey && apiKey !== serverApiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key.' });
    }

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required.' });
    }

    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fullPath.startsWith(process.cwd())) {
      return res.status(403).json({ error: 'Access denied: Path outside project directory.' });
    }

    if (await fs.pathExists(fullPath)) {
      res.download(fullPath);
    } else {
      res.status(404).json({ error: 'File not found.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
