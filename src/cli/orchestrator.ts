import { Config } from './config';
import { Message, callLLM } from './llm';
import { Agent, executeAgentWithVerification, loadAgents } from './agents';
import chalk from 'chalk';
import { generatePlan, executePlan, PlanStep } from './planner';
import axios from 'axios';

async function emitOrchestrationEvent(type: string, data: any) {
  try {
    await axios.post('http://localhost:3000/api/events', { type, data, timestamp: new Date().toISOString() });
  } catch (e) {}
}

export interface ComplexityAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  requiresArchitecture: boolean;
  estimatedFiles: number;
  suggestedAgent: string;
}

export async function analyzeComplexity(config: Config, userInput: string): Promise<ComplexityAnalysis> {
  const prompt = `Analyze the following user request and determine its complexity and the best expert agent to handle it:
"${userInput}"

Respond ONLY with a JSON object in this format:
{
  "complexity": "simple" | "medium" | "complex",
  "requiresArchitecture": boolean,
  "estimatedFiles": number,
  "suggestedAgent": "coder" | "architect" | "general" | "researcher" | "security-audit" | "code-migration" | "api-designer" | "database-optimizer" | "dockerize" | "ci-cd-pipeline" | "performance-profiler" | "documentation-generator" | "test-generator" | "refactoring-assistant" | "legacy-modernizer"
}

Guidelines:
- simple: general chat, greetings, or a SINGLE small action.
- medium: multiple actions, creating 2-5 files, implementing features.
- complex: new projects, major refactoring, architecture changes.`;

  const response = await callLLM(config, [{ role: 'user', content: prompt }]);
  try {
    const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || '{}';
    return JSON.parse(jsonStr);
  } catch (e) {
    return { complexity: 'medium', requiresArchitecture: false, estimatedFiles: 1, suggestedAgent: 'general' };
  }
}

export async function processUserInput(
  config: Config, 
  userInput: string, 
  onToolCall?: (name: string, args: any, result: string, error?: string) => Promise<void> | void,
  signal?: AbortSignal
): Promise<string> {
  const analysis = await analyzeComplexity(config, userInput);
  const agents = await loadAgents(config);

  const agentName = analysis.suggestedAgent || 'general';
  const agent = agents.find(a => a.name === agentName) || agents.find(a => a.name === 'mimocode') || agents[0];

  if (analysis.complexity === 'complex' || userInput.toLowerCase().includes('améglioré') || userInput.toLowerCase().includes('improve')) {
    
    let enhancedInput = userInput;
    if (userInput.toLowerCase().includes('améglioré') || userInput.toLowerCase().includes('improve')) {
      enhancedInput = `First, perform a complete scan of the project structure and key files to understand the current implementation. Then, ${userInput}`;
    }

    const steps = await generatePlan(config, enhancedInput);
    await emitOrchestrationEvent('orchestration_plan', { steps });

    for (const step of steps) {
      if (signal?.aborted) throw new Error('Operation aborted by user');

      const stepAnalysis = await analyzeComplexity(config, step.description);
      const stepAgent = agents.find(a => a.name === stepAnalysis.suggestedAgent) || agent;

      await emitOrchestrationEvent('orchestration_step', { step: step.description, agent: stepAgent.name });

      const fs = await import('fs-extra');
      const path = await import('path');
      const skillsDir = path.join(path.dirname(config.historyFile), 'skills');
      const skillMdPath = path.join(skillsDir, `${stepAgent.name}.md`);

      let skillContext = '';
      if (await fs.pathExists(skillMdPath)) {
        skillContext = `\n\n--- SKILL KNOWLEDGE: ${stepAgent.name.toUpperCase()} ---\n${await fs.readFile(skillMdPath, 'utf-8')}`;
      }

      const stepPrompt = `Task: ${userInput}
      Current Directory: ${process.cwd()}
      Current Step: ${step.description}
      ${skillContext}

      Please execute this step. If a tool was suggested, use it if it makes sense, or use any other tool you need.`;
      
      try {
        const stepResult = await executeAgentWithVerification(config, stepAgent, [{ role: 'user', content: stepPrompt }], onToolCall, [], 3, signal);
        step.status = 'completed';
        step.result = stepResult;
        await emitOrchestrationEvent('orchestration_success', { step: step.description });
      } catch (e: any) {
        if (e.message === 'Operation aborted by user') throw e;
        await emitOrchestrationEvent('orchestration_error', { step: step.description, error: e.message });
        const healerPrompt = `The following step failed: ${step.description}. Error: ${e.message}. Please fix it.`;
        try {
          const healedResult = await executeAgentWithVerification(config, agents.find(a => a.name === 'mimocode') || agent, [{ role: 'user', content: healerPrompt }], onToolCall, [], 3, signal);
          step.status = 'completed';
          step.result = `[HEALED] ${healedResult}`;
        } catch (healError: any) {
          throw new Error(`Plan execution failed at step ${step.id}: ${e.message}`);
        }
      }
    }
    return "Complex task completed successfully.";
  }

  const enhancedInput = `Current Directory: ${process.cwd()}\nTask: ${userInput}`;
  return await executeAgentWithVerification(config, agent, [{ role: 'user', content: enhancedInput }], onToolCall, [], 3, signal);
}

async function normalConversation(config: Config, userInput: string): Promise<string> {
  return await callLLM(config, [{ role: 'user', content: userInput }]);
}
