import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';
import { Message, callLLM, callLLMWithTools } from './llm';
import chalk from 'chalk';
import { autoVerifyToolCall } from './agent_verifier';
import { gitTools } from './mcp/git';
import { dockerTools } from './mcp/docker';
import { loadPlugins } from '../cli/plugins';
import { getSkillTools, createSkill } from './skills';
import { getMemory, getAllMemory } from './memory';
import inquirer from 'inquirer';

export interface Agent {
  name: string;
  description: string;
  role?: string;
  persona?: string;
  systemInstruction: string;
  tags?: string[];
}

export interface AgentHistoryEntry {
  agentName: string;
  input: string;
  output: string;
  timestamp: string;
}

export async function loadAgents(config: Config): Promise<Agent[]> {
  const agents: Agent[] = [];
  await fs.ensureDir(config.agentDir);
  
  const defaultAgents: Agent[] = [
    {
      name: 'mimocode',
      description: 'Lead autonomous engineer. Focuses on planning and high-level orchestration.',
      role: 'Lead AI Engineer',
      systemInstruction: 'You are Mimocode, an autonomous engineer. Take control of the project. Research, plan, and then execute. Be direct and fearless. Use tools for everything.',
      tags: ['lead']
    },
    {
      name: 'coder',
      description: 'Senior Software Engineer. Expert at implementation and problem solving.',
      role: 'Senior Coder',
      systemInstruction: 'You are an elite software engineer. You work autonomously to deliver perfect code. \n\nRULES:\n1. If a command fails (e.g., Missing script), ANALYZE the project (read package.json) and fix it. \n2. For React, use Vite template (npm create vite@latest). \n3. Communicate ONLY progress. NEVER say "Thank you for the tool results". \n4. NEVER stop until the application is ACTUALLY running and verified. \n5. If you hit an error, you must fix it immediately. Do not ask for permission again if session trust is granted.',
      tags: ['coding']
    },
    {
      name: 'general',
      description: 'General assistant for reasoning and chatting.',
      role: 'Assistant',
      systemInstruction: 'You are a general assistant. Be concise and helpful.',
      tags: ['general']
    }
  ];

  // Ensure default agents exist and are up to date
  for (const da of defaultAgents) {
    const filePath = path.join(config.agentDir, `${da.name}.json`);
    // On écrase toujours les agents par défaut pour s'assurer que les instructions sont à jour
    await fs.writeJson(filePath, da, { spaces: 2 });
  }

  const files = await fs.readdir(config.agentDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const agent = await fs.readJson(path.join(config.agentDir, file));
      agents.push({
        name: agent.name || path.basename(file, '.json'),
        description: agent.description || '',
        role: agent.role || '',
        persona: agent.persona || '',
        systemInstruction: agent.systemInstruction || '',
        tags: agent.tags || [],
      });
    }
  }
  return agents;
}

export async function createAgent(config: Config, agent: Agent): Promise<void> {
  if (!agent.name || agent.name.trim().length === 0) {
    throw new Error("Agent name is required.");
  }
  if (!agent.systemInstruction || agent.systemInstruction.trim().length < 10) {
    throw new Error("System instruction must be at least 10 characters long.");
  }

  await fs.ensureDir(config.agentDir);
  const filePath = path.join(config.agentDir, `${agent.name}.json`);

  await fs.writeJson(filePath, agent, { spaces: 2 });
}

export async function deleteAgent(config: Config, name: string): Promise<boolean> {
  const filePath = path.join(config.agentDir, `${name}.json`);
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
    return true;
  }
  return false;
}

export async function updateAgent(config: Config, name: string, updates: Partial<Agent>): Promise<boolean> {
  if (updates.systemInstruction !== undefined && updates.systemInstruction.trim().length < 10) {
    throw new Error("System instruction must be at least 10 characters long.");
  }

  const filePath = path.join(config.agentDir, `${name}.json`);
  if (await fs.pathExists(filePath)) {
    const agent = await fs.readJson(filePath);
    const updatedAgent = { ...agent, ...updates };
    await fs.writeJson(filePath, updatedAgent, { spaces: 2 });
    return true;
  }
  return false;
}

export async function renameAgent(config: Config, oldName: string, newName: string): Promise<boolean> {
  const oldPath = path.join(config.agentDir, `${oldName}.json`);
  const newPath = path.join(config.agentDir, `${newName}.json`);

  if (await fs.pathExists(newPath)) {
    throw new Error(`Agent with name "@${newName}" already exists.`);
  }

  if (await fs.pathExists(oldPath)) {
    const agent = await fs.readJson(oldPath);
    agent.name = newName;
    await fs.writeJson(newPath, agent, { spaces: 2 });
    await fs.remove(oldPath);
    return true;
  }
  return false;
}

export async function exportAgent(config: Config, name: string, targetPath: string): Promise<boolean> {
  const sourcePath = path.join(config.agentDir, `${name}.json`);
  if (await fs.pathExists(sourcePath)) {
    await fs.copy(sourcePath, targetPath);
    return true;
  }
  return false;
}

export async function importAgent(config: Config, sourcePath: string): Promise<Agent> {
  const agent: Agent = await fs.readJson(sourcePath);
  if (!agent.name) {
    agent.name = path.basename(sourcePath, '.json');
  }
  await createAgent(config, agent);
  return agent;
}

export async function executeAgent(
  config: Config, 
  agent: Agent, 
  messages: Message[], 
  onToolCall?: (name: string, args: any, result: string, error?: string) => Promise<void> | void,
  extraTools: any[] = [],
  signal?: AbortSignal
): Promise<string> {
  let fullSystemInstruction = agent.systemInstruction;
  
  // Add Long-term Memory to context
  const memory = await getAllMemory();
  if (Object.keys(memory).length > 0) {
    fullSystemInstruction += `\n\n# LONG-TERM MEMORY (User Preferences & Context):\n${JSON.stringify(memory, null, 2)}`;
  }

  if (agent.role || agent.persona) {
    fullSystemInstruction = `Role: ${agent.role || 'General Assistant'}\nPersona: ${agent.persona || 'Helpful and professional'}\n\n${fullSystemInstruction}`;
  }

  const plugins = await loadPlugins();
  const skillTools = await getSkillTools(config);
  const allExtraTools = [...extraTools, ...gitTools, ...dockerTools, ...skillTools, ...plugins.flatMap(p => p.tools)];

  const { fullResponse } = await callLLMWithTools(config, messages, { systemInstruction: fullSystemInstruction }, onToolCall, undefined, allExtraTools, undefined, signal);
  const result = fullResponse;
  
  await recordHistory(config, {
    agentName: agent.name,
    input: messages.map(m => m.content).join('\n'),
    output: result,
    timestamp: new Date().toISOString(),
  });

  return result;
}

export async function executeAgentWithVerification(
  config: Config,
  agent: Agent,
  messages: Message[],
  onToolCall?: (name: string, args: any, result: string, error?: string) => Promise<void> | void,
  extraTools: any[] = [],
  maxRetries = 3,
  signal?: AbortSignal,
  onTextChunk?: (chunk: string) => void
): Promise<string> {
  let retryCount = 0;
  let currentMessages = [...messages];
  let finalResponse = '';
  let toolsCalled = false;

  while (retryCount < maxRetries) {
    if (signal?.aborted) throw new Error('Operation aborted by user');

    const wrappedOnToolCall = async (name: string, args: any, result: string, error?: string) => {
      toolsCalled = true;
      // Call original onToolCall if provided
      await onToolCall?.(name, args, result, error);

      // Perform automatic verification
      if (!error) {
        const verification = await autoVerifyToolCall(name, args, result);
        if (!verification.success) {
          console.log(chalk.red(`\n⚠️ Verification Failed for ${name}: ${verification.message}`));
          throw new Error(`Verification failed for ${name}: ${verification.message}`);
        }
        // Success logs removed for ATC-style clean output
      }
    };

    try {
      let fullSystemInstruction = agent.systemInstruction;
      if (agent.role || agent.persona) {
        fullSystemInstruction = `Role: ${agent.role || 'General Assistant'}\nPersona: ${agent.persona || 'Helpful and professional'}\n\n${agent.systemInstruction}`;
      }

      // Proactive Auto-Correction Instruction
      if (retryCount > 0) {
        fullSystemInstruction += `\n\n# SELF-HEAL MODE ACTIVE:
1. You previously encountered an error. 
2. Your task NOW is to DIAGNOSE why it failed (use read_file, list_dir, or check_environment).
3. Then, FIX the issue autonomously.
4. Finally, retry the original task.
DO NOT apologize. Focus 100% on the technical fix.`;
      }

      const plugins = await loadPlugins();
      const skillTools = await getSkillTools(config);
      const allExtraTools = [...extraTools, ...gitTools, ...dockerTools, ...skillTools, ...plugins.flatMap(p => p.tools)];

      const { fullResponse } = await callLLMWithTools(
        config, 
        currentMessages, 
        { systemInstruction: fullSystemInstruction }, 
        wrappedOnToolCall, 
        onTextChunk, 
        allExtraTools,
        undefined,
        signal
      );
      
      finalResponse = fullResponse;
      break; // Success!
    } catch (error: any) {
      retryCount++;

      // Add error message to context for the next attempt
      currentMessages.push({
        role: 'user',
        content: `An error occurred during execution: ${error.message}. Please fix it and try again.`
      });

      if (retryCount >= maxRetries) {
        throw error;
      }
    }

  }

  await recordHistory(config, {
    agentName: agent.name,
    input: messages.map(m => m.content).join('\n'),
    output: finalResponse,
    timestamp: new Date().toISOString(),
  });

  // Skill Discovery: Ask if this should be a new skill
  // Only suggest if tools were called and it's a substantial response
  // if (toolsCalled && finalResponse.length > 500 && !agent.name.includes('skill')) {
  //   await discoverNewSkill(config, messages, finalResponse);
  // }

  return finalResponse;
}

async function discoverNewSkill(config: Config, messages: Message[], output: string) {
  const discoveryPrompt = `Analyze the following interaction and determine if it represents a repeatable "Business Skill" or "Workflow" that should be saved for future use.
  
  Interaction:
  User: ${messages[messages.length-1].content}
  Agent Output: ${output.substring(0, 1000)}...
  
  If this is a repeatable procedure, respond with a JSON object:
  {
    "shouldBeSkill": true,
    "name": "kebab-case-name",
    "description": "Short description",
    "prompt": "The system prompt for this skill",
    "workflow": ["step 1", "step 2", ...]
  }
  Otherwise respond with {"shouldBeSkill": false}`;

  try {
    const response = await callLLM(config, [{ role: 'user', content: discoveryPrompt }]);
    const discovery = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
    
    if (discovery.shouldBeSkill) {
      // Asynchronous saving to pending_skills.json instead of blocking prompt
      const pendingFile = path.join(path.dirname(config.historyFile), 'pending_skills.json');
      let pendingSkills = [];
      if (await fs.pathExists(pendingFile)) {
        try {
          pendingSkills = await fs.readJson(pendingFile);
        } catch (e) {
          pendingSkills = [];
        }
      }
      
      pendingSkills.push({
        ...discovery,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substring(7)
      });
      
      await fs.writeJson(pendingFile, pendingSkills, { spaces: 2 });
      console.log(chalk.dim(`\n💡 Skill suggestion recorded: ${discovery.name}`));
    }
  } catch (e) {
    // Silent fail for discovery
  }
}

export async function recordHistory(config: Config, entry: AgentHistoryEntry): Promise<void> {
  let history: AgentHistoryEntry[] = [];
  if (await fs.pathExists(config.historyFile)) {
    history = await fs.readJson(config.historyFile);
  }
  history.push(entry);
  await fs.ensureDir(path.dirname(config.historyFile));
  await fs.writeJson(config.historyFile, history, { spaces: 2 });
}

export async function loadHistory(config: Config): Promise<AgentHistoryEntry[]> {
  if (await fs.pathExists(config.historyFile)) {
    return await fs.readJson(config.historyFile);
  }
  return [];
}

export async function collaborate(config: Config, agentNames: string[], task: string) {
  const agents = await loadAgents(config);
  const selectedAgents = agents.filter(a => agentNames.includes(a.name));
  
  if (selectedAgents.length === 0) throw new Error("No valid agents found for collaboration.");

  let currentContext = `Task: ${task}\n\n`;
  const results: { agent: string; output: string }[] = [];

  for (const agent of selectedAgents) {
    console.log(`\x1b[33mAgent @${agent.name} is working...\x1b[0m`);
    const messages: Message[] = [
      { role: 'user', content: `Current context:\n${currentContext}\n\nPlease contribute to the task.` }
    ];
    const response = await executeAgent(config, agent, messages);
    results.push({ agent: agent.name, output: response });
    currentContext += `\n--- Contribution from @${agent.name} ---\n${response}\n`;
  }

  return currentContext;
}
