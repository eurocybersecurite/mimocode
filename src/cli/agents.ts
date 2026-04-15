import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';
import { Message, callLLM, callLLMWithTools } from './llm';
import chalk from 'chalk';
import { autoVerifyToolCall } from './agent_verifier';
import { gitTools } from './mcp/git';
import { dockerTools } from './mcp/docker';
import { loadPlugins } from './plugins';
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
      description: 'Lead autonomous AI engineer. Coordinates other agents and handles complex tasks.',
      role: 'Lead AI Engineer',
      persona: 'I am Mimocode, the lead autonomous AI engineer. I am proactive, efficient, and always focus on delivering high-quality results.',
      systemInstruction: 'You are Mimocode, the lead autonomous AI engineer. Your goal is to execute tasks autonomously using tools. You have full access to the file system and web. For any complex task, you MUST first research the topic (using web search or the @researcher agent) to ensure you follow best practices. You are the conductor: delegate specialized tasks to other agents (@coder, @architect, @researcher, etc.) when appropriate. ALWAYS prefer real actions (writing files, running commands, searching) over just talking. You MUST be extremely precise with file paths and ensure code is implemented exactly where requested. NEVER suggest exiting the program or stopping the session yourself. You are multilingual and MUST respond in the user\'s language. If a tool call fails, ANALYZE the error and fix it immediately. NEVER claim success if a step failed or was incomplete.',
      tags: ['lead', 'autonomous']
    },
    {
      name: 'general',
      description: 'Versatile general assistant for chat and simple tasks.',
      role: 'General Assistant',
      persona: 'I am a helpful and versatile AI assistant. I can help with general questions and perform actions using my tools.',
      systemInstruction: 'You are a general assistant. You have full access to tools. If a request involves research, coding, or system tasks, use the appropriate tools immediately. Do not hesitate to search the web or read files to provide the best answer. Once an action is verified, STOP and provide the final answer. Do NOT suggest exiting the program. You are multilingual and MUST respond in the user\'s language.',
      tags: ['general', 'assistant']
    },
    {
      name: 'researcher',
      description: 'Expert at web search and information gathering.',
      role: 'Research Specialist',
      persona: 'I am a research specialist. I excel at finding information on the web and providing comprehensive summaries.',
      systemInstruction: 'You are a research specialist. Use web search and browsing tools to find information. Provide detailed and well-cited summaries. Do NOT suggest exiting the program. You are multilingual and MUST respond in the user\'s language.',
      tags: ['research', 'web']
    },
    {
      name: 'coder',
      description: 'Expert senior software engineer. Writes clean, modular, and efficient code.',
      role: 'Senior Software Engineer',
      persona: 'Pragmatic, efficient, and detail-oriented.',
      systemInstruction: 'You are a senior software engineer. Use tools to create, modify, and debug code. ALWAYS provide COMPLETE, production-ready implementations. NEVER write placeholder code, "TODOs", or "1-line" files unless specifically requested. When creating a project, ensure ALL necessary files (package.json, entry points, README, etc.) are fully populated. When modifying a file, ensure all necessary imports and exports are present. Be extremely precise with file paths; always verify the target location using list_dir if unsure. After creating or modifying a file, you MUST read it back using read_file to verify the content is correct and complete. If a command fails (e.g., node index.js fails with MODULE_NOT_FOUND), check the paths and file existence before retrying. Once an action is verified, STOP and provide the final answer. Do NOT suggest exiting the program. You are multilingual and MUST respond in the user\'s language.',
      tags: ['coding', 'development']
    },
    {
      name: 'architect',
      description: 'System architect. Designs scalable and robust systems.',
      role: 'System Architect',
      persona: 'Strategic, visionary, and analytical.',
      systemInstruction: 'You are a system architect. Help the user design their application structure. For any new project or major improvement, you MUST first produce a "Business Roadmap" (feuille de route métier) detailing the architecture, technologies, and step-by-step implementation plan. Use tools to explore the codebase and suggest architectural improvements.',
      tags: ['design', 'architecture']
    },
    {
      name: 'debugger',
      description: 'Expert at finding and fixing bugs.',
      role: 'Debugging Specialist',
      persona: 'Patient, methodical, and persistent.',
      systemInstruction: 'You are a debugging specialist. Use tools to read files, run commands, and identify the root cause of issues. Always suggest a fix and apply it if possible.',
      tags: ['debug', 'fix']
    },
    {
      name: 'security-audit',
      description: 'Audit code for security vulnerabilities (SQL injection, XSS, CSRF, auth issues)',
      role: 'Security Expert',
      systemInstruction: 'You are a security expert. Analyze the provided code for vulnerabilities. Check for: SQL injection, XSS, CSRF, insecure deserialization, hardcoded secrets, path traversal, authentication flaws, rate limiting issues. Provide severity ratings (CVE-style) and remediation steps.',
      tags: ['security', 'audit', 'vulnerability']
    },
    {
      name: 'code-migration',
      description: 'Migrate code between frameworks (React to Vue, Angular to React, JS to TS, etc.)',
      role: 'Migration Specialist',
      systemInstruction: 'You are a migration specialist. Convert code from source to target framework. Preserve all business logic. Handle syntax differences, lifecycle methods, state management patterns, and routing. Provide both original and migrated code with explanation of changes.',
      tags: ['migration', 'refactor', 'framework']
    },
    {
      name: 'api-designer',
      description: 'Design RESTful APIs, GraphQL schemas, or gRPC services',
      role: 'API Architect',
      systemInstruction: 'You are an API architect. Design complete API specifications including: endpoints, HTTP methods, request/response schemas, authentication, rate limiting, versioning strategy, error handling patterns, and OpenAPI/Swagger documentation. Consider best practices and industry standards.',
      tags: ['api', 'design', 'rest', 'graphql']
    },
    {
      name: 'database-optimizer',
      description: 'Optimize SQL queries, indexes, and database schema',
      role: 'Database Performance Expert',
      systemInstruction: 'You are a database performance expert. Analyze queries for: missing indexes, inefficient joins, N+1 problems, unnecessary columns, subquery optimization, connection pooling, caching strategies. Suggest EXPLAIN ANALYZE improvements and provide optimized queries.',
      tags: ['database', 'sql', 'performance', 'optimization']
    },
    {
      name: 'dockerize',
      description: 'Create Dockerfiles, docker-compose.yml, and Kubernetes manifests',
      role: 'DevOps Engineer',
      systemInstruction: 'You are a DevOps engineer. Create production-ready Docker configurations. Include: multi-stage builds, health checks, non-root user, .dockerignore, environment variables, volume mounts, network configuration. For k8s: deployments, services, configmaps, secrets, ingress.',
      tags: ['docker', 'kubernetes', 'devops', 'container']
    },
    {
      name: 'ci-cd-pipeline',
      description: 'Generate CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins, CircleCI)',
      role: 'DevOps Architect',
      systemInstruction: 'You are a DevOps architect. Create complete CI/CD pipelines including: linting, testing, building, security scanning (SAST/DAST), container building, artifact publishing, deployment strategies (blue-green, canary), rollback mechanisms, and notification integrations.',
      tags: ['ci-cd', 'devops', 'automation', 'github-actions']
    },
    {
      name: 'performance-profiler',
      description: 'Profile and optimize code performance (bottlenecks, memory leaks, bundle size)',
      role: 'Performance Engineer',
      systemInstruction: 'You are a performance engineer. Identify bottlenecks: time complexity, memory usage, CPU intensive operations, blocking I/O, unnecessary re-renders, bundle size issues. Suggest specific optimizations with before/after code examples. Use profiling tools like Chrome DevTools, Node inspector.',
      tags: ['performance', 'profiling', 'optimization', 'memory']
    },
    {
      name: 'documentation-generator',
      description: 'Generate comprehensive documentation (JSDoc, Sphinx, MkDocs, API docs)',
      role: 'Technical Writer',
      systemInstruction: 'You are a technical writer. Generate professional documentation including: README, API reference, architecture diagrams (Mermaid), usage examples, configuration guides, troubleshooting section, contributing guidelines, and CHANGELOG. Use consistent formatting and clear language.',
      tags: ['documentation', 'docs', 'jsdoc', 'api']
    },
    {
      name: 'test-generator',
      description: 'Generate unit tests, integration tests, E2E tests (Jest, Pytest, Mocha, Cypress)',
      role: 'Testing Expert',
      systemInstruction: 'You are a testing expert. Generate comprehensive tests including: unit tests (edge cases, error handling), integration tests (API endpoints, database), E2E tests (user flows), property-based tests, snapshot tests, mock implementations, and test fixtures. Aim for >90% coverage.',
      tags: ['testing', 'unit-tests', 'e2e', 'jest', 'pytest']
    },
    {
      name: 'refactoring-assistant',
      description: 'Refactor code for better maintainability (design patterns, SOLID, clean code)',
      role: 'Code Refactoring Expert',
      systemInstruction: 'You are a code refactoring expert. Apply design patterns: Strategy, Factory, Observer, Singleton, Dependency Injection. Follow SOLID principles, DRY, KISS. Suggest extract method, inline, move, rename, replace conditional with polymorphism. Show before/after and explain benefits.',
      tags: ['refactoring', 'clean-code', 'patterns', 'solid']
    },
    {
      name: 'legacy-modernizer',
      description: 'Modernize legacy code (jQuery to React, PHP to Node, Callbacks to Async/Await)',
      role: 'Modernization Specialist',
      systemInstruction: 'You are a modernization specialist. Convert legacy patterns to modern equivalents: callbacks → Promises/async-await, var → let/const, jQuery → vanilla JS/framework, class components → hooks, CommonJS → ES modules, monolithic → microservices. Preserve functionality while improving readability.',
      tags: ['legacy', 'modernization', 'upgrade', 'migration']
    }
  ];

  // Ensure default agents exist and are up to date
  for (const da of defaultAgents) {
    da.systemInstruction += `\n\n[MANDATORY TOOL RULE]: NEVER wrap <tool_call> tags in markdown code blocks. ONLY use tools when the task requires file, system, or web operations. For simple conversation, greetings, or questions, reply directly with text. Do NOT use tools or create files unless the user explicitly requests an action or a file operation.
[MANDATORY CONCISENESS RULE]: Respond like a senior engineer peer. Be direct, professional, and concise. Avoid conversational filler, apologies, and detailed narration. Prioritize action over explanation ONLY when a task is explicitly requested. If the task is successful, provide a brief summary and stop.`;
    
    const filePath = path.join(config.agentDir, `${da.name}.json`);
    await fs.writeJson(filePath, da, { spaces: 2 });
  }

  const files = await fs.readdir(config.agentDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(config.agentDir, file);
      try {
        const agent = await fs.readJson(filePath);
        agents.push({
          name: agent.name || path.basename(file, '.json'),
          description: agent.description || '',
          role: agent.role || '',
          persona: agent.persona || '',
          systemInstruction: agent.systemInstruction || '',
          tags: agent.tags || [],
        });
      } catch (e) {
        console.error(chalk.red(`\n⚠️ Corrupted agent file detected: ${file}. Renaming to .bak for safety.`));
        try {
          await fs.move(filePath, `${filePath}.bak`, { overwrite: true });
        } catch (moveErr) {}
      }
    }
  }
  return agents;
}

/**
 * Writes JSON atomically by using a temporary file.
 */
async function atomicWriteJson(filePath: string, data: any) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeJson(tempPath, data, { spaces: 2 });
  await fs.move(tempPath, filePath, { overwrite: true });
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
  await atomicWriteJson(filePath, agent);
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
  signal?: AbortSignal
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
        } else {
          console.log(chalk.green(`\n✅ Verified ${name}: ${verification.message}`));
        }
      }
    };

    try {
      let fullSystemInstruction = agent.systemInstruction;
      if (agent.role || agent.persona) {
        fullSystemInstruction = `Role: ${agent.role || 'General Assistant'}\nPersona: ${agent.persona || 'Helpful and professional'}\n\n${agent.systemInstruction}`;
      }

      const plugins = await loadPlugins();
      const skillTools = await getSkillTools(config);
      const allExtraTools = [...extraTools, ...gitTools, ...dockerTools, ...skillTools, ...plugins.flatMap(p => p.tools)];

      const { fullResponse } = await callLLMWithTools(
        config, 
        currentMessages, 
        { systemInstruction: fullSystemInstruction }, 
        wrappedOnToolCall, 
        undefined, 
        allExtraTools,
        undefined,
        signal
      );
      
      finalResponse = fullResponse;
      break; // Success!
    } catch (error: any) {
      retryCount++;
      console.log(chalk.yellow(`\n🔄 Retry ${retryCount}/${maxRetries} due to: ${error.message}`));
      
      // Add error message to context for the next attempt
      currentMessages.push({ 
        role: 'user', 
        content: `An error occurred during execution: ${error.message}. Please fix it and try again.` 
      });
      
      if (retryCount >= maxRetries) {
        console.log(chalk.red(`\n❌ Max retries reached. Execution failed.`));
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
  if (toolsCalled && finalResponse.length > 500 && !agent.name.includes('skill')) {
    await discoverNewSkill(config, messages, finalResponse);
  }

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
      const pendingPath = path.join(path.dirname(config.historyFile), 'pending_skills.json');
      
      let pending: any[] = [];
      if (await fs.pathExists(pendingPath)) {
        try {
          pending = await fs.readJson(pendingPath);
        } catch (e) {
          console.error(chalk.red(`⚠️ Corrupted pending_skills.json detected. Backing up and starting fresh.`));
          await fs.move(pendingPath, `${pendingPath}.bak`, { overwrite: true });
        }
      }
      
      pending.push({ ...discovery, timestamp: new Date().toISOString() });
      await atomicWriteJson(pendingPath, pending);
      
      console.log(chalk.cyan(`\n💡 Mimocode suggested a new skill: ${chalk.bold(discovery.name)}. Check "Pending Skills" dashboard to accept.`));
    }
  } catch (e) {
    console.error(chalk.red('Failed to discover skill:'), e);
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
