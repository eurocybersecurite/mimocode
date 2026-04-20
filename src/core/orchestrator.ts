import { Config } from './config';
import { Message, callLLM } from './llm';
import { Agent, executeAgentWithVerification, loadAgents } from './agents';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { generatePlan, executePlan, PlanStep } from './planner';
import { reportEvent } from './events';
import { runSkill } from './skills';

export interface ComplexityAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  requiresArchitecture: boolean;
  estimatedFiles: number;
  suggestedAgent: string;
}

/**
 * Level 1: Analyze complexity of user input
 */
export async function analyzeComplexity(config: Config, userInput: string): Promise<ComplexityAnalysis> {
  const lowerInput = userInput.toLowerCase();
  
  // HEURISTIC FAST PATH: Avoid LLM call for obvious simple tasks
  const simpleKeywords = ['say', 'hello', 'hi', 'bonjour', 'salut', 'test', 'status', 'list', 'read', 'cat'];
  const isObviousSimple = (userInput.length < 100 && simpleKeywords.some(k => lowerInput.includes(k))) || userInput.length < 20;
  
  if (isObviousSimple && !lowerInput.includes('create') && !lowerInput.includes('fix') && !lowerInput.includes('implement')) {
    return { complexity: 'simple', requiresArchitecture: false, estimatedFiles: 0, suggestedAgent: 'general' };
  }

  const prompt = `Analyze the following user request: "${userInput}"
  Respond ONLY with a JSON object:
  {
    "complexity": "simple" | "medium" | "complex",
    "requiresArchitecture": boolean,
    "estimatedFiles": number,
    "suggestedAgent": "coder" | "architect" | "general" | "researcher" | "security-audit" | "code-migration" | "api-designer" | "database-optimizer" | "dockerize" | "ci-cd-pipeline" | "performance-profiler" | "documentation-generator" | "test-generator" | "refactoring-assistant" | "legacy-modernizer" | "frontend-expert" | "backend-expert"
  }`;

  try {
    const response = await callLLM(config, [{ role: 'user', content: prompt }]);
    const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || '{}';
    return JSON.parse(jsonStr);
  } catch (e) {
    return { complexity: 'medium', requiresArchitecture: false, estimatedFiles: 1, suggestedAgent: 'general' };
  }
}

/**
 * Level 2 & 3: Routing and Orchestration
 */
export async function processUserInput(
  config: Config, 
  userInput: string, 
  onToolCall?: (name: string, args: any, result: string, error?: string) => Promise<void> | void,
  signal?: AbortSignal,
  onTextChunk?: (chunk: string) => void
): Promise<string> {
  const trimmedInput = userInput.trim();
  const lowerInput = trimmedInput.toLowerCase();
  
  // 1. FAST PATH: Explicit Skill Execution (Direct Bypass)
  if (lowerInput.startsWith('skill run ')) {
    const skillName = trimmedInput.split(' ')[2];
    const skillInput = trimmedInput.split(' ').slice(3).join(' ') || 'Execute the skill';
    try {
      return await runSkill(config, skillName, skillInput);
    } catch (e: any) {
      return `Error running skill: ${e.message}`;
    }
  }

  // 2. FAST PATH: Explicit Agent Execution
  if (lowerInput.startsWith('agents run ')) {
    const agentName = trimmedInput.split(' ')[2];
    const agentInput = trimmedInput.split(' ').slice(3).join(' ') || 'Please assist me';
    const agents = await loadAgents(config);
    const targetAgent = agents.find(a => a.name === agentName) || agents[0];
    return await executeAgentWithVerification(config, targetAgent, [{ role: 'user', content: agentInput }], onToolCall, [], 2, signal, onTextChunk);
  }

  // 3. FAST PATH: Simple greetings and short inputs
  const simpleMessages = ['hi', 'hello', 'salut', 'bonjour', 'hey', 'ça va', 'test', 'test?'];
  if (simpleMessages.includes(lowerInput) || (userInput.length < 30 && !lowerInput.includes(' '))) {
    let fullResponse = '';
    if (onTextChunk) {
      const stream = await import('./llm').then(m => m.callLLMStream(config, [{ role: 'user', content: userInput }], {}, signal));
      for await (const chunk of stream) {
        onTextChunk(chunk);
        fullResponse += chunk;
      }
      return fullResponse;
    }
    fullResponse = await callLLM(config, [{ role: 'user', content: userInput }]);
    return fullResponse;
  }

  // 4. Analysis with heuristic skip
  let analysis: ComplexityAnalysis;
  if (userInput.length < 50 && (lowerInput.includes('show') || lowerInput.includes('list') || lowerInput.includes('read'))) {
    analysis = { complexity: 'simple', requiresArchitecture: false, estimatedFiles: 0, suggestedAgent: 'general' };
  } else {
    analysis = await analyzeComplexity(config, userInput);
  }
  
  const agents = await loadAgents(config);
  const agentName = analysis.suggestedAgent || 'general';
  const agent = agents.find(a => a.name === agentName) || agents.find(a => a.name === 'mimocode') || agents[0];

  // 5. Complex Task: Plan & Execute
  if (analysis.complexity === 'complex' || lowerInput.includes('improve') || lowerInput.includes('améglioré')) {
    let enhancedInput = userInput;
    if (lowerInput.includes('improve') || lowerInput.includes('améglioré')) {
      enhancedInput = `Scan project structure and key files first. Then: ${userInput}`;
    }

    const steps = await generatePlan(config, enhancedInput);
    
    for (const step of steps) {
      if (signal?.aborted) throw new Error('Operation aborted by user');
      
      const stepAnalysis = await analyzeComplexity(config, step.description);
      const stepAgent = agents.find(a => a.name === stepAnalysis.suggestedAgent) || agent;
      
      const stepPrompt = `Task: ${userInput}\nStep: ${step.description}\nResults: ${JSON.stringify(steps.filter(s => s.status === 'completed').map(s => s.result))}`;

      const stepResult = await executeAgentWithVerification(config, stepAgent, [{ role: 'user', content: stepPrompt }], onToolCall, [], 2, signal, onTextChunk);
      step.status = 'completed';
      step.result = stepResult;
    }

    return "Complex task completed successfully.";
  }

  // 6. Normal Path: Single Agent
  const agentMdPath = path.join(config.agentDir, `${agent.name}.md`);
  let agentDocs = '';
  if (await fs.pathExists(agentMdPath)) {
    agentDocs = `\n\nContext:\n${await fs.readFile(agentMdPath, 'utf-8')}`;
  }

  const enhancedInput = `Workspace: ${process.cwd()}\nTask: ${userInput}${agentDocs}`;
  return await executeAgentWithVerification(config, agent, [{ role: 'user', content: enhancedInput }], onToolCall, [], 2, signal, onTextChunk);
}
