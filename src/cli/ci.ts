import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';
import { loadAgents, executeAgent, Agent } from './agents';
import axios from 'axios';
import chalk from 'chalk';

export async function ciBuild(config: Config): Promise<string> {
  const agents = await loadAgents(config);
  let report = `CI Build: Validating ${agents.length} agents...\n`;
  
  for (const agent of agents) {
    if (!agent.name || !agent.systemInstruction) {
      throw new Error(`Agent validation failed: Agent in ${agent.name} is missing name or systemInstruction.`);
    }
    report += `✅ Agent @${agent.name} is valid.\n`;
  }
  
  return report + "CI Build successful.";
}

export async function ciTest(config: Config): Promise<string> {
  const agents = await loadAgents(config);
  let report = `CI Test: Testing ${agents.length} agents...\n`;
  
  for (const agent of agents) {
    try {
      const response = await executeAgent(config, agent, [{ role: 'user', content: 'Hello, are you functional?' }]);
      if (response && response.length > 0) {
        report += `✅ Agent @${agent.name} responded correctly.\n`;
      } else {
        report += `❌ Agent @${agent.name} returned an empty response.\n`;
      }
    } catch (e: any) {
      report += `❌ Agent @${agent.name} failed: ${e.message}\n`;
    }
  }
  
  return report + "CI Test complete.";
}

export async function ciDeploy(config: Config, target: string): Promise<string> {
  const agents = await loadAgents(config);
  
  if (target === 'remote') {
    if (!config.remoteServer) throw new Error("Remote server not configured for deployment.");
    
    let report = `CI Deploy: Uploading ${agents.length} agents to ${config.remoteServer}...\n`;
    for (const agent of agents) {
      try {
        await axios.post(`${config.remoteServer}/api/agents/import`, {
          agent,
          apiKey: config.apiKey
        });
        report += `✅ Agent @${agent.name} deployed to remote.\n`;
      } catch (e: any) {
        report += `❌ Agent @${agent.name} deployment failed: ${e.message}\n`;
      }
    }
    return report + "CI Remote Deployment complete.";
  } else {
    const targetPath = path.resolve(process.cwd(), target);
    await fs.ensureDir(targetPath);
    
    let report = `CI Deploy: Exporting ${agents.length} agents to ${targetPath}...\n`;
    for (const agent of agents) {
      const filePath = path.join(config.agentDir, `${agent.name}.json`);
      const destPath = path.join(targetPath, `${agent.name}.json`);
      await fs.copy(filePath, destPath);
      report += `✅ Agent @${agent.name} exported to ${destPath}.\n`;
    }
    return report + "CI Local Deployment complete.";
  }
}
