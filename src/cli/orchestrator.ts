import { Config } from './config';
import { Message, callLLM } from './llm';
import { Agent, executeAgentWithVerification, loadAgents } from './agents';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
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
- simple: general chat, greetings, or a SINGLE small action (like creating ONE file).
- medium: multiple actions, creating 2-5 files, implementing features.
- complex: new projects, major refactoring, architecture changes, or tasks requiring significant research.

Agent Selection:
- researcher: Use for ANY task that requires gathering information from the web, GitHub, documentation, or searching for best practices.
- architect: Use for designing system structure, choosing technologies, or high-level planning.
- coder: Use for actual implementation, writing code, and creating files.
- general: Use for simple chat or when no specialized agent fits.`;

  const response = await callLLM(config, [{ role: 'user', content: prompt }]);
  try {
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
  const analysis = await analyzeComplexity(config, userInput);
  const agents = await loadAgents(config);

  console.log(chalk.dim(`[Orchestrator] Complexity: ${analysis.complexity}, Suggested Agent: ${analysis.suggestedAgent}`));

  // Always use an agent to ensure tools are available
  const agentName = analysis.suggestedAgent || 'general';
  const agent = agents.find(a => a.name === agentName) || agents.find(a => a.name === 'mimocode') || agents[0];
  
  if (analysis.complexity === 'complex' || userInput.toLowerCase().includes('améglioré') || userInput.toLowerCase().includes('improve')) {
    console.log(chalk.magenta(`\n🏗️  Complex task or improvement requested. Starting architecture planning and audit...`));
    
    // Force a scan if it's an improvement request
    let enhancedInput = userInput;
    if (userInput.toLowerCase().includes('améglioré') || userInput.toLowerCase().includes('improve')) {
      enhancedInput = `First, perform a complete scan of the project structure and key files to understand the current implementation. Then, ${userInput}`;
    }

    const steps = await generatePlan(config, enhancedInput);
    console.log(chalk.green(`\n📋 Plan generated with ${steps.length} steps.`));
    
    // Report plan generation
    await reportEvent('plan_generated', { steps });
    
    // Execute the plan using specialized agents for each step if possible
    for (const step of steps) {
      if (signal?.aborted) throw new Error('Operation aborted by user');
      console.log(chalk.yellow(`\n▶ Executing Step ${step.id}: ${step.description}`));
      
      // Report step start
      await reportEvent('step_start', { stepId: step.id, description: step.description });
      const stepAnalysis = await analyzeComplexity(config, step.description);
      const stepAgent = agents.find(a => a.name === stepAnalysis.suggestedAgent) || agent;
      
      console.log(chalk.dim(`  └─ Delegating step to @${stepAgent.name}...`));

      // Skill-Aware: Inject agent-specific documentation if it exists
      let agentDocs = '';
      const agentMdPath = path.join(config.agentDir, `${stepAgent.name}.md`);
      if (fs.existsSync(agentMdPath)) {
        agentDocs = `\n\n# AGENT SPECIFIC KNOWLEDGE (@${stepAgent.name}):\n${fs.readFileSync(agentMdPath, 'utf-8')}`;
      }
      
      const stepPrompt = `Task: ${userInput}
Current Directory: ${process.cwd()}
Current Step: ${step.description}
${step.tool ? `Suggested Tool: ${step.tool}` : ''}
${step.args ? `Suggested Args: ${JSON.stringify(step.args)}` : ''}
${agentDocs}

Previous steps results: ${JSON.stringify(steps.filter(s => s.status === 'completed').map(s => ({ id: s.id, desc: s.description, result: s.result })))}

Please execute this step. If a tool was suggested, use it if it makes sense, or use any other tool you need.`;

      try {
        const stepResult = await executeAgentWithVerification(
          config, 
          stepAgent, 
          [{ role: 'user', content: stepPrompt }], 
          onToolCall,
          [],
          3,
          signal
        );
        
        step.status = 'completed';
        step.result = stepResult;

        // Report step completion
        await reportEvent('step_completed', { stepId: step.id, result: stepResult });
      } catch (e: any) {
        if (e.message === 'Operation aborted by user') throw e;
        console.log(chalk.red(`  └─ Step ${step.id} failed: ${e.message}. Attempting self-healing...`));
        
        const healerPrompt = `The following step failed: ${step.description}
Error: ${e.message}
Previous steps results: ${JSON.stringify(steps.filter(s => s.status === 'completed').map(s => ({ id: s.id, desc: s.description, result: s.result })))}

Please analyze the error and provide a fix. You can use any tool to repair the situation (e.g., fix syntax, install missing package, etc.).`;

        try {
          const healedResult = await executeAgentWithVerification(
            config, 
            agents.find(a => a.name === 'mimocode') || agent, 
            [{ role: 'user', content: healerPrompt }], 
            onToolCall,
            [],
            3,
            signal
          );
          
          step.status = 'completed';
          step.result = `[HEALED] ${healedResult}`;
          console.log(chalk.green(`  └─ Step ${step.id} successfully healed.`));
        } catch (healError: any) {
          if (healError.message === 'Operation aborted by user') throw healError;
          console.log(chalk.red(`  └─ Self-healing failed: ${healError.message}`));
          step.status = 'failed';
          step.result = e.message;
          throw new Error(`Plan execution failed at step ${step.id}: ${e.message}`);
        }
      }
    }

    return "Complex task completed successfully according to the plan.";
  }

  console.log(chalk.cyan(`\n🤖 Delegating task to @${agent.name}...`));

  // Skill-Aware: Inject agent-specific documentation if it exists
  let agentDocs = '';
  const agentMdPath = path.join(config.agentDir, `${agent.name}.md`);
  if (fs.existsSync(agentMdPath)) {
    agentDocs = `\n\n# AGENT SPECIFIC KNOWLEDGE (@${agent.name}):\n${fs.readFileSync(agentMdPath, 'utf-8')}`;
  }

  const enhancedInput = `Current Directory: ${process.cwd()}\nTask: ${userInput}${agentDocs}`;
  return await executeAgentWithVerification(config, agent, [{ role: 'user', content: enhancedInput }], onToolCall, [], 3, signal);
}

async function normalConversation(config: Config, userInput: string): Promise<string> {
  return await callLLM(config, [{ role: 'user', content: userInput }]);
}
