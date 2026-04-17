import { Config } from './config';
import { Message, callLLM } from './llm';
import { Agent, executeAgentWithVerification, loadAgents } from './agents';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { generatePlan, executePlan, PlanStep } from './planner';
import { reportEvent } from './events';

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
  signal?: AbortSignal
): Promise<string> {
  const trimmedInput = userInput.trim().toLowerCase();
  
  // 1. FAST PATH: Simple greetings or very short messages
  const simpleMessages = ['hi', 'hello', 'salut', 'bonjour', 'hey', 'ça va', 'test', 'test?'];
  if (simpleMessages.includes(trimmedInput) || userInput.length < 3) {
    return await callLLM(config, [{ role: 'user', content: userInput }]);
  }

  // 2. Analysis
  const analysis = await analyzeComplexity(config, userInput);
  const agents = await loadAgents(config);
  const agentName = analysis.suggestedAgent || 'general';
  const agent = agents.find(a => a.name === agentName) || agents.find(a => a.name === 'mimocode') || agents[0];

  // 3. Complex Task: Plan & Execute
  if (analysis.complexity === 'complex' || userInput.toLowerCase().includes('improve') || userInput.toLowerCase().includes('améglioré')) {
    let enhancedInput = userInput;
    if (userInput.toLowerCase().includes('improve') || userInput.toLowerCase().includes('améglioré')) {
      enhancedInput = `Scan project structure and key files first. Then: ${userInput}`;
    }

    const steps = await generatePlan(config, enhancedInput);
    
    for (const step of steps) {
      if (signal?.aborted) throw new Error('Operation aborted by user');
      
      const stepAnalysis = await analyzeComplexity(config, step.description);
      const stepAgent = agents.find(a => a.name === stepAnalysis.suggestedAgent) || agent;
      
      const stepPrompt = `Task: ${userInput}\nStep: ${step.description}\nResults: ${JSON.stringify(steps.filter(s => s.status === 'completed').map(s => s.result))}`;

      const stepResult = await executeAgentWithVerification(config, stepAgent, [{ role: 'user', content: stepPrompt }], onToolCall, [], 2, signal);
      step.status = 'completed';
      step.result = stepResult;
    }

    return "Complex task completed successfully.";
  }

  // 4. Normal Path: Single Agent
  const agentMdPath = path.join(config.agentDir, `${agent.name}.md`);
  let agentDocs = '';
  if (await fs.pathExists(agentMdPath)) {
    agentDocs = `\n\nContext:\n${await fs.readFile(agentMdPath, 'utf-8')}`;
  }

  const enhancedInput = `Workspace: ${process.cwd()}\nTask: ${userInput}${agentDocs}`;
  return await executeAgentWithVerification(config, agent, [{ role: 'user', content: enhancedInput }], onToolCall, [], 2, signal);
}
