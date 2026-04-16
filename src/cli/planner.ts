import { Config } from './config';
import { callLLM, Message } from './llm';
import { mcpTools } from './mcp';

export interface PlanStep {
  id: number;
  description: string;
  tool?: string;
  args?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

export async function generatePlan(config: Config, task: string): Promise<PlanStep[]> {
  const messages: Message[] = [
    { role: 'system', content: `You are a master task planner. Break down the user's task into a sequence of logical, actionable steps. 
    
    Guidelines:
    1. Research First: If the task involves a specific technology, library, or external service (like Mimocode API, GitHub, etc.), the FIRST step should ALWAYS be to research its documentation or best practices using the 'web_search' or 'researcher' agent.
    2. Architecture: For complex tasks, include a step for designing the file structure and architecture.
    3. Implementation: Break down implementation into logical chunks (e.g., core logic, UI, integration). Ensure each step produces COMPLETE, functional code.
    4. Verification: Include steps to verify the implementation (e.g., running the code, checking files). If a command is expected to be run in a specific directory, explicitly state the directory.
    5. Path Awareness: ALWAYS use absolute paths or paths relative to the workspace root. If creating a project in a specific directory, ensure all subsequent steps use that directory.
    6. Cleaning: If the user asks to "clean" or "start fresh", include a step to delete existing files in the workspace (be careful not to delete hidden system files or the .mimocode folder).

    You can use tools like: ${mcpTools.map(t => t.name).join(', ')}.
    Return ONLY a raw JSON array of steps. Do NOT include any conversational text, markdown code blocks, or explanations.
    Format: [ { "id": number, "description": string, "tool": string, "args": object } ]` },
    { role: 'user', content: task }
  ];

  const response = await callLLM(config, messages, { responseMimeType: 'application/json' });
  try {
    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    const steps = JSON.parse(jsonStr);
    return steps.map((s: any) => ({ ...s, status: 'pending' }));
  } catch (e) {
    throw new Error("Failed to parse plan: " + response);
  }
}

export async function executePlan(config: Config, steps: PlanStep[]) {
  for (const step of steps) {
    console.log(`\x1b[33mStep ${step.id}: ${step.description}...\x1b[0m`);
    step.status = 'running';
    
    if (step.tool) {
      const tool = mcpTools.find(t => t.name === step.tool);
      if (tool) {
        try {
          // Normalize args: if it's an array, take the first element (common LLM mistake)
          let normalizedArgs = step.args || {};
          if (Array.isArray(normalizedArgs)) {
            if (step.tool === 'run_command') normalizedArgs = { command: normalizedArgs[0] };
            else if (step.tool === 'create_directory') normalizedArgs = { dirPath: normalizedArgs[0] };
            else if (step.tool === 'delete_file') normalizedArgs = { filePath: normalizedArgs[0] };
          }
          
          const result = await tool.execute(normalizedArgs);
          step.result = result;
          step.status = 'completed';
          console.log(`\x1b[32m✓ Step ${step.id} completed.\x1b[0m`);
        } catch (e: any) {
          console.log(`\x1b[31m! Step ${step.id} failed: ${e.message}. Attempting self-correction...\x1b[0m`);
          
          // Self-correction attempt
          const correctionMessages: Message[] = [
            { role: 'system', content: `The following step failed: ${step.description}. 
            Tool: ${step.tool}, Args: ${JSON.stringify(step.args)}. 
            Error: ${e.message}. 
            Suggest a fix (new tool or new args) in JSON format: { tool, args }.` }
          ];
          
          try {
            const fixResponse = await callLLM(config, correctionMessages, { responseMimeType: 'application/json' });
            const jsonStr = fixResponse.match(/\{[\s\S]*\}/)?.[0] || fixResponse;
            const fix = JSON.parse(jsonStr);
            console.log(`\x1b[34mTrying fix: ${fix.tool} with ${JSON.stringify(fix.args)}\x1b[0m`);
            
            const retryTool = mcpTools.find(t => t.name === fix.tool);
            if (retryTool) {
              const retryResult = await retryTool.execute(fix.args || {});
              step.result = retryResult;
              step.status = 'completed';
              console.log(`\x1b[32m✓ Step ${step.id} fixed and completed.\x1b[0m`);
            } else {
              throw new Error(`Correction tool ${fix.tool} not found.`);
            }
          } catch (fixError: any) {
            step.result = `Original error: ${e.message}. Fix failed: ${fixError.message}`;
            step.status = 'failed';
            console.log(`\x1b[31m✗ Step ${step.id} correction failed: ${fixError.message}\x1b[0m`);
            break;
          }
        }
      } else {
        step.status = 'failed';
        step.result = `Tool ${step.tool} not found.`;
        break;
      }
    } else {
      // Manual/AI step
      const messages: Message[] = [
        { role: 'system', content: `Execute this step: ${step.description}. Previous context: ${JSON.stringify(steps.filter(s => s.status === 'completed'))}` }
      ];
      const response = await callLLM(config, messages);
      step.result = response;
      step.status = 'completed';
      console.log(`\x1b[32m✓ Step ${step.id} completed (AI).\x1b[0m`);
    }
  }
  return steps;
}
