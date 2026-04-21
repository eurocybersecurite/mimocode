import fs from 'fs-extra';
import path from 'path';
import { Config, saveConfig } from './config';
import { callLLM } from './llm';
import { loadAgents } from './agents';
import { execSync } from 'child_process';
import { mcpTools } from './mcp';

export async function healFile(config: Config, filePath: string, error: string): Promise<string> {
  const content = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf-8');
  const prompt = `The following file has an error: ${error}\n\nFile Content:\n${content}\n\nPlease fix the error and return the full corrected file content.`;
  const fixedContent = await callLLM(config, [{ role: 'user', content: prompt }]);
  return fixedContent;
}

export async function applyFix(filePath: string, fixedContent: string): Promise<void> {
  await fs.writeFile(path.resolve(process.cwd(), filePath), fixedContent, 'utf-8');
}

export async function healSystem(config: Config): Promise<string> {
  let report = "System-wide auto-repair report:\n";

  // 1. Check config and repair if needed
  try {
    let repaired = false;
    if (!config.endpoint) { config.endpoint = 'http://localhost:11434'; repaired = true; }
    if (!config.model) { config.model = 'llama3.1:8b'; repaired = true; }
    if (!config.runtime) { config.runtime = 'ollama'; repaired = true; }
    
    if (repaired) {
      report += "⚠️ Configuration: Missing critical fields. Repaired with defaults.\n";
    }
    await saveConfig(config);
    report += "✅ Configuration: Valid and saved.\n";
  } catch (e: any) {
    report += `❌ Configuration: Error saving - ${e.message}\n`;
  }

  // 2. Check agents integrity
  try {
    const agents = await loadAgents(config);
    report += `✅ Agents: ${agents.length} agents successfully loaded.\n`;
    for (const agent of agents) {
      if (!agent.name || !agent.systemInstruction) {
        report += `⚠️ Agent @${agent.name || 'unknown'} is missing required fields.\n`;
      }
    }
  } catch (e: any) {
    report += `❌ Agents: Error loading - ${e.message}\n`;
  }

  // 3. Check MCP Tools
  try {
    if (mcpTools && mcpTools.length > 0) {
      report += `✅ MCP Tools: ${mcpTools.length} tools available.\n`;
      for (const tool of mcpTools) {
        if (!tool.name || !tool.execute) {
          report += `⚠️ Tool ${tool.name || 'unknown'} is improperly defined.\n`;
        }
      }
    } else {
      report += "❌ MCP Tools: No tools found!\n";
    }
  } catch (e: any) {
    report += `❌ MCP Tools: Error checking - ${e.message}\n`;
  }

  // 4. Check history files
  try {
    if (await fs.pathExists(config.historyFile)) {
      await fs.readJson(config.historyFile);
      report += "✅ History: Agent history file is valid JSON.\n";
    }
    if (await fs.pathExists(config.chatHistoryFile)) {
      await fs.readJson(config.chatHistoryFile);
      report += "✅ History: Chat history file is valid JSON.\n";
    }
  } catch (e: any) {
    report += `❌ History: Corruption detected - ${e.message}. Attempting to backup and reset...\n`;
    try {
      const backupPath = `${config.historyFile}.bak.${Date.now()}`;
      await fs.move(config.historyFile, backupPath);
      await fs.writeJson(config.historyFile, [], { spaces: 2 });
      report += `✅ History: Reset complete. Backup saved to ${backupPath}\n`;
    } catch (resetErr: any) {
      report += `❌ History: Reset failed - ${resetErr.message}\n`;
    }
  }

  // 4. Check dependencies
  try {
    if (await fs.pathExists('package.json')) {
      report += "🔍 Checking dependencies...\n";
      execSync('npm list --depth=0', { stdio: 'ignore' });
      report += "✅ Dependencies: All present.\n";
    }
  } catch (e: any) {
    report += "❌ Dependencies: Missing or broken. Running 'npm install'...\n";
    try {
      execSync('npm install', { stdio: 'inherit' });
      report += "✅ Dependencies: Repaired with 'npm install'.\n";
    } catch (installErr: any) {
      report += `❌ Dependencies: 'npm install' failed - ${installErr.message}\n`;
    }
  }

  // 4. Check MCP servers (basic check)
  if (config.mcpServers?.length) {
    report += `🔍 Checking ${config.mcpServers.length} MCP servers...\n`;
    for (const server of config.mcpServers) {
      try {
        if (server.type === 'stdio') {
          const cmd = server.command.split(' ')[0];
          try {
            execSync(`which ${cmd}`, { stdio: 'ignore' });
            report += `✅ MCP Server (${server.name}): Command '${cmd}' is available.\n`;
          } catch (e) {
            report += `❌ MCP Server (${server.name}): Command '${cmd}' NOT FOUND in PATH.\n`;
          }
        } else {
          report += `✅ MCP Server (${server.name}): Configured.\n`;
        }
      } catch (e: any) {
        report += `❌ MCP Server (${server.name}): Check failed - ${e.message}\n`;
      }
    }
  }

  return report;
}
