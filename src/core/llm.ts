import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';
import { mcpTools, MCPTool } from './mcp';
import chalk from 'chalk';
import { checkPermission } from './permissions';
import { getDiff } from './diff';
import { reportEvent } from './events';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // Base64 strings or paths
}

export interface LLMResponse {
  fullResponse: string;
  newMessages: Message[];
}

/**
 * Extrait les appels d'outils de façon robuste.
 * Gère les formats variés et tente de réparer le JSON mal formé.
 */
function extractToolCallsRobust(text: string): Array<{name: string, args: any}> {
  const toolCalls: Array<{name: string, args: any}> = [];
  
  // Regex plus robuste pour trouver les balises <tool_call
  const toolCallRegex = /<tool_call\s+([\s\S]*?)(?:\/>|>([\s\S]*?)<\/tool_call>)/gi;
  
  let match;
  while ((match = toolCallRegex.exec(text)) !== null) {
    const attributesPart = match[1];
    const contentPart = match[2];
    
    let name = '';
    let args: any = {};
    
    // Extraire le nom
    const nameMatch = attributesPart.match(/name=["']([^"']+)["']/i);
    if (nameMatch) name = nameMatch[1];
    
    // Extraire les arguments
    let argsStr = '';
    const argsAttrMatch = attributesPart.match(/args\s*=\s*(?:(['"])([\s\S]*?)\1|(\{[\s\S]*?\}))/i);
    if (argsAttrMatch) {
      argsStr = argsAttrMatch[2] || argsAttrMatch[3];
    } else if (contentPart) {
      argsStr = contentPart.trim();
    }
    
    if (name) {
      try {
        // Tentative 1: JSON standard
        args = JSON.parse(argsStr);
      } catch (e) {
        try {
          // Tentative 2: Réparation (guillemets simples -> doubles pour les clés et valeurs)
          let fixed = argsStr
            .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // clés
            .replace(/:\s*'([\s\S]*?)'(\s*[,}])/g, ':"$1"$2'); // valeurs
          args = JSON.parse(fixed);
        } catch (e2) {
          // Tentative 3: Extraction par regex des champs connus
          const fields = ['type', 'name', 'filePath', 'path', 'content', 'command', 'dirPath', 'source', 'destination'];
          for (const field of fields) {
            const fieldRegex = new RegExp(`["']?${field}["']?\\s*[:=]\\s*(["'])([\\s\\S]*?)\\1`, 'i');
            const fieldMatch = argsStr.match(fieldRegex);
            if (fieldMatch) {
              args[field] = fieldMatch[2];
            }
          }
          
          // Cas spécifique pour write_file sans content
          if (name === 'write_file' && !args.content) {
             const pathMatch = argsStr.match(/["']?(?:filePath|path)["']?\s*[:=]\s*(["'])(.*?)\1/i);
             if (pathMatch) {
               const afterMatch = argsStr.split(pathMatch[0])[1];
               if (afterMatch) {
                 const contentMatch = afterMatch.match(/["']?content["']?\s*[:=]\s*(["'])([\\s\\S]*?)\1/i);
                 if (contentMatch) {
                   args.content = contentMatch[2];
                 } else {
                   args.content = afterMatch.replace(/^\s*,\s*|^\s*}/, '').trim();
                 }
               }
             }
          }
        }
      }
      toolCalls.push({ name, args });
    }
  }
  return toolCalls;
}

export let isPaused = false;
export function setPaused(paused: boolean) { isPaused = paused; }

export async function callLLMWithTools(
  config: Config, 
  messages: Message[], 
  options: any = {}, 
  onToolCall?: (name: string, args: any, result: string, error?: string) => Promise<void> | void,
  onTextChunk?: (chunk: string) => void,
  extraTools: MCPTool[] = [],
  onToolStart?: (name: string, args: any) => void,
  signal?: AbortSignal
): Promise<LLMResponse> {
  const cwd = process.cwd();
  const systemMessages = messages.filter(m => m.role === 'system');
  const userAssistantMessages = messages.filter(m => m.role !== 'system');
  const recentMessages = userAssistantMessages.slice(-30);
  const userQuery = recentMessages[recentMessages.length - 1]?.content.toLowerCase() || "";

  // DYNAMIC CONTEXT PRUNING: Only include relevant tools
  let activeTools = mcpTools;
  if (userQuery) {
    const isGitRelated = userQuery.includes('git') || userQuery.includes('commit') || userQuery.includes('branch');
    const isDockerRelated = userQuery.includes('docker') || userQuery.includes('container');
    const isWebRelated = userQuery.includes('http') || userQuery.includes('web') || userQuery.includes('search') || userQuery.includes('browse') || userQuery.includes('scrape') || userQuery.includes('net') || userQuery.includes('recherche') || userQuery.includes('cherche') || userQuery.includes('site');
    const isDbRelated = userQuery.includes('sql') || userQuery.includes('db') || userQuery.includes('database') || userQuery.includes('query');

    activeTools = mcpTools.filter(t => {
      // Always include core file/shell tools
      const coreTools = ['read_file', 'write_file', 'list_dir', 'run_command', 'delete_file', 'create_directory', 'list_files_recursive', 'fast_search'];
      if (coreTools.includes(t.name)) return true;
      
      if (!isGitRelated && (t.name.includes('git') || t.name.includes('history_analyzer'))) return false;
      if (!isDockerRelated && t.name.includes('docker')) return false;
      if (!isWebRelated && (t.name.startsWith('web_') || t.name.includes('search') || t.name.includes('puppeteer'))) return false;
      if (!isDbRelated && t.name.includes('database')) return false;
      
      return true;
    });
  }

  const allTools = [...activeTools, ...extraTools];
  
  // Load Scratchpad if exists
  let scratchpadContent = '';
  const scratchpadPath = path.join(cwd, '.mimocode', 'scratchpad.md');
  if (fs.existsSync(scratchpadPath)) {
    try {
      scratchpadContent = `\n\n# PROJECT SCRATCHPAD (Current Progress & Findings):\n${fs.readFileSync(scratchpadPath, 'utf-8')}`;
    } catch (e) {}
  }

  const baseSystemPrompt = `${options.systemInstruction || "You are a world-class autonomous engineer."}

CURRENT ENVIRONMENT:
- Working Directory: ${cwd}
- OS: ${process.platform}${scratchpadContent}

AVAILABLE TOOLS:
${allTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

IMPORTANT: You have FULL access to the file system and shell via tools. NEVER say you cannot perform actions.`;

  const toolSystemPrompt = `# CRITICAL RULES:
1. You are Mimocode, an autonomous AI engineer.
2. Your current workspace is: ${cwd}
3. TASK FIRST: Execute the user request immediately. Do not spend time confirming that you understand the rules or guides. ACT.
4. If a tool returns "Error: No changes detected", it means you failed to provide the new content. You MUST use 'read_file' to see the current state and then 'write_file' with the CORRECT and COMPLETE content.
5. DO NOT hallucinate success. If you didn't change the file, say so and fix it.

# HOW TO USE TOOLS:
When you need to perform an action, use this EXACT format:
<tool_call name="tool_name" args='{"arg1": "value1", "arg2": "value2"}' />

# CRITICAL RULES FOR JSON:
1. Use SINGLE QUOTES for the 'args' attribute: args='{...}'
2. Inside the JSON, use DOUBLE QUOTES for keys and values.
3. ALWAYS include all required arguments.
   - For write_file: "filePath" and "content" are REQUIRED.
   - For run_command: "command" is REQUIRED. You can also use "cwd" to specify the directory.
4. ESCAPE double quotes and newlines inside string values: "content": "line1\\nline2"
5. NEVER send an empty "content" for write_file.

# PATH & DIRECTORY RULES:
1. ALWAYS be aware of your current working directory: ${cwd}
2. If you create a project in a subdirectory (e.g., "my-app"), you MUST either:
   - Use paths relative to the workspace root (e.g., "my-app/src/index.js")
   - OR use the "cwd" argument in run_command to execute commands inside that directory.
3. NEVER assume you are inside a newly created directory unless you explicitly changed to it or used "cwd".

# SERVER RULES:
1. For long-running servers (like 'npm run dev', 'vite', etc.), use run_command with background: true:
   <tool_call name="run_command" args='{"command": "npm run dev", "background": true}' />
2. ALWAYS use port 3000 for web servers. This is the only port accessible in this environment.
3. If a project uses a different port by default, modify its configuration (e.g., vite.config.ts, package.json) to use port 3000.

# TOOL ARGUMENT RULES:
1. ALWAYS use the correct argument names.
   - For write_file: "filePath" and "content" are MANDATORY. NEVER send empty content.
   - For create_project: "name" (or "projectName") and "type" (or "language") are MANDATORY.
2. Inside the JSON, use DOUBLE QUOTES for keys and values.
3. ESCAPE double quotes and newlines inside string values: "content": "line1\\nline2"

# DELETION & FILE MANAGEMENT:
1. To "delete everything except X", do NOT use wildcards like '*.js'. Instead:
   - List the directory first.
   - Delete each item individually EXCEPT for X.
   - OR use a shell command via 'run_command' if it's safer (e.g., 'find . -maxdepth 1 ! -name .vscode ! -name . -exec rm -rf {} +').
2. ALWAYS verify deletion with 'list_dir' afterwards.

# SMART AUTO-CORRECTION & PROACTIVE FIXING:
1. If a command fails (e.g., "module not found", "command not found", "no such file or directory", "permission denied"), ANALYZE the error message.
2. PROACTIVELY attempt to fix the issue:
   - If a dependency is missing, install it: npm install <package>
   - If a directory is missing, create it: mkdir -p <path>
   - If a command is missing, try to find the correct one or install the tool.
   - If a file operation fails because of path issues, verify the path with 'list_dir' and retry with the correct path.
3. This proactive fixing applies to ALL common shell commands (rm, cp, mv, ls, tree, mkdir, touch, etc.) executed via 'run_command'.
4. If a tool call fails with a validation error (e.g., "content is required"), IMMEDIATELY retry with the missing arguments. NEVER repeat the same mistake.
5. Do not ask for permission to fix obvious environment issues unless they are high-risk.
6. If you encounter a bug in the code you just wrote, fix it immediately after seeing the error in the logs.
7. STOP CONDITION: If a tool result or verification confirms the goal is achieved (e.g., file deleted, content written, command succeeded), STOP and provide the final answer. Do NOT repeat the action or try alternative tools for the same goal.

# SCRATCHPAD USAGE (Your working memory):
1. For ANY task that requires more than 2 steps, start by updating the scratchpad with your plan using 'update_scratchpad'.
2. When you discover something important (e.g., "the API uses port 8080", "the main entry point is in src/index.ts"), log it in the scratchpad.
3. This file is YOUR memory. Use it to keep track of what you have done and what you need to do next.

# VERIFICATION & PERMISSIONS:
1. After deleting or modifying a file/directory, ALWAYS perform a 'read_file' or 'list_dir' to verify the action was successful. This ensures you have an up-to-date view of the file system.
2. Once the user authorizes a session (🔓 Allow for this session), you have full permission to read, write, and delete in the current directory. Do not ask again for the same directory in that session.
3. Always assume you have the necessary permissions once the session is authorized.

# EXAMPLES:
<tool_call name="read_file" args='{"filePath": "src/index.js"}' />
<tool_call name="write_file" args='{"filePath": "test.txt", "content": "Hello World\\nNew Line"}' />
<tool_call name="run_command" args='{"command": "npm install"}' />

Remember: You MUST use tools for all actions. Don't just talk, ACT.`;

  const combinedSystemPrompt = `${baseSystemPrompt}\n\n${systemMessages.map(m => m.content).join('\n\n')}\n\n${toolSystemPrompt}`;

  const chatMessagesWithTools: Message[] = [
    { role: 'system', content: combinedSystemPrompt },
    ...recentMessages
  ];

  let fullResponse = '';
  let running = true;
  let turnCount = 0;
  const maxTurns = 20;

  while (running && turnCount < maxTurns) {
    if (signal?.aborted) throw new Error('Operation aborted by user');

    // Check for pause
    while (isPaused) {
      if (signal?.aborted) throw new Error('Operation aborted by user');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    turnCount++;
    
    let currentTurnResponse = '';
    let printedLength = 0;
    
    if (options.stream !== false) {
      try {
        const stream = callLLMStream(config, chatMessagesWithTools, options, signal);
        
        for await (const chunk of stream) {
          if (signal?.aborted) throw new Error('Operation aborted by user');
          currentTurnResponse += chunk;
          
          // Logique de streaming simplifiée et robuste
          let textToDisplay = currentTurnResponse;
          
          // 1. Supprimer toutes les balises de tool_call (fermées) pour l'affichage
          textToDisplay = textToDisplay.replace(/<tool_call[\s\S]*?(?:\/>|<\/tool_call>)/gi, '');
          
          // 2. Cacher la balise en cours (non fermée)
          const openTagIndex = textToDisplay.toLowerCase().lastIndexOf('<tool');
          const closeTagIndex = textToDisplay.toLowerCase().lastIndexOf('>');
          
          if (openTagIndex !== -1 && openTagIndex > closeTagIndex) {
            textToDisplay = textToDisplay.substring(0, openTagIndex);
          }
          
          // 3. Afficher uniquement le nouveau texte
          if (textToDisplay.length > printedLength) {
            const newText = textToDisplay.substring(printedLength);
            if (onTextChunk) {
              onTextChunk(newText);
              printedLength += newText.length;
            }
          }
        }
      } catch (e: any) {
        if (e.message === 'Operation aborted by user') throw e;
        console.error('Stream error:', e);
        currentTurnResponse = await callLLM(config, chatMessagesWithTools, options, signal);
      }
    } else {
      currentTurnResponse = await callLLM(config, chatMessagesWithTools, options, signal);
    }
    
    // Afficher le reste du texte
    let finalNewText = currentTurnResponse.substring(printedLength);
    if (finalNewText && onTextChunk) {
      finalNewText = finalNewText.replace(/<tool_call[\s\S]*?(?:\/>|<\/tool_call>|$)/gi, '');
      if (finalNewText.trim()) {
        onTextChunk(finalNewText);
      }
    }
    
    fullResponse += currentTurnResponse;

    const toolCalls = extractToolCallsRobust(currentTurnResponse);
    
    if (toolCalls.length > 0) {
      let toolResults = '';
      
      for (const toolCall of toolCalls) {
        if (signal?.aborted) throw new Error('Operation aborted by user');
        const { name, args } = toolCall;
        const tool = allTools.find(t => t.name === name);
        
        if (tool) {
          try {
            // Normalisation des arguments
            const normalizedArgs = { ...args };
            if (normalizedArgs.path && !normalizedArgs.filePath) normalizedArgs.filePath = normalizedArgs.path;
            if (normalizedArgs.path && !normalizedArgs.dirPath) normalizedArgs.dirPath = normalizedArgs.path;

            if (onToolStart) onToolStart(name, normalizedArgs);
            else if (onTextChunk) onTextChunk(` ⚡ `);
            
            await reportEvent('tool_start', { name, args: normalizedArgs });

            // Gestion des permissions
            let permissionGranted = true;
            if (name === 'run_command' || name === 'delete_file' || name === 'write_file') {
              let details = '';
              let cmdToCheck = '';

              if (name === 'run_command') {
                cmdToCheck = normalizedArgs.command;
                details = `The agent wants to execute command:\n\n\`\`\`bash\n${normalizedArgs.command}\n\`\`\``;
              } else if (name === 'delete_file') {
                cmdToCheck = `rm ${normalizedArgs.filePath}`;
                details = `The agent wants to delete file: \`${normalizedArgs.filePath}\``;
              } else if (name === 'write_file') {
                const fullPath = path.resolve(process.cwd(), normalizedArgs.filePath);
                let oldContent = '';
                if (await fs.pathExists(fullPath)) {
                  oldContent = await fs.readFile(fullPath, 'utf-8');
                  if (oldContent !== normalizedArgs.content) {
                    details = `The agent wants to edit file: \`${normalizedArgs.filePath}\`\n\n${getDiff(oldContent, normalizedArgs.content, normalizedArgs.filePath)}`;
                  } else {
                    // Pas de changement, on exécute directement
                    const result = await tool.execute(normalizedArgs);
                    toolResults += `\n[Result of ${name}]:\n${result}\n`;
                    await onToolCall?.(name, normalizedArgs, result);
                    continue;
                  }
                } else {
                  details = `The agent wants to create new file: \`${normalizedArgs.filePath}\`\n\n\`\`\`\n${(normalizedArgs.content || '').substring(0, 500)}${(normalizedArgs.content || '').length > 500 ? '...' : ''}\n\`\`\``;
                }
                cmdToCheck = `write ${normalizedArgs.filePath}`;
              }

              const { allowed, instruction } = await checkPermission(cmdToCheck, details);
              if (!allowed) {
                toolResults += `\n[Result of ${name}]: Operation skipped by user.\n`;
                await onToolCall?.(name, normalizedArgs, 'Skipped', 'Permission denied');
                permissionGranted = false;
              } else if (instruction && name === 'run_command') {
                normalizedArgs.command = `${normalizedArgs.command} # Instruction: ${instruction}`;
              }
            }
            
            if (permissionGranted) {
              const result = await tool.execute(normalizedArgs);
              toolResults += `\n[Result of ${name}]:\n${result}\n`;
              await onToolCall?.(name, normalizedArgs, result);
              await reportEvent('tool_success', { name, args: normalizedArgs, result });
            }
            
          } catch (e: any) {
            const error = `Error executing ${name}: ${e.message}`;
            toolResults += `\n[Error in ${name}]:\n${error}\n`;
            await onToolCall?.(name, args, '', error);
            await reportEvent('tool_error', { name, args, error });
          }
        } else {
          const error = `Tool '${name}' not found.`;
          toolResults += `\n[Error]: ${error}\n`;
          await onToolCall?.(name, args, '', error);
        }
      }
      
      const assistantMsg: Message = { role: 'assistant', content: currentTurnResponse };
      const resultsMsg: Message = { 
        role: 'user', 
        content: `Tool execution results:\n${toolResults}\n\nContinue or provide final answer.` 
      };
      
      chatMessagesWithTools.push(assistantMsg);
      chatMessagesWithTools.push(resultsMsg);
      running = true;
    } else {
      running = false;
    }
  }

  const newMessages = chatMessagesWithTools.slice(recentMessages.length + 1);
  
  let cleanedFullResponse = fullResponse.replace(/<tool_call[\s\S]*?(?:\/>|<\/tool_call>|$)/gi, '').trim();
  
  if (!cleanedFullResponse && turnCount > 1) cleanedFullResponse = "Task completed.";
  return { fullResponse: cleanedFullResponse, newMessages };
}

export async function callLLM(config: Config, messages: Message[], options: any = {}, signal?: AbortSignal): Promise<string> {
  const { runtime, endpoint, model } = config;
  try {
    if (runtime === 'ollama') {
      const response = await axios.post(`${endpoint}/api/chat`, {
        model,
        messages,
        stream: false,
        options: { temperature: options.temperature || 0.7, top_p: options.topP || 0.9 }
      }, { signal });
      return (response.data.message?.content || response.data.response || "").trim();
    } else if (runtime === 'lmstudio' || runtime === 'llama-cpp' || runtime === 'mlx') {
      const response = await axios.post(`${endpoint}/v1/chat/completions`, {
        model,
        messages,
        temperature: options.temperature || 0.7
      }, { signal });
      return response.data.choices[0].message.content;
    }
    throw new Error(`Unsupported runtime: ${runtime}`);
  } catch (error: any) {
    if (axios.isCancel(error) || error.name === 'AbortError') throw new Error('Operation aborted by user');
    throw new Error(`LLM call failed: ${error.message}`);
  }
}

export async function* callLLMStream(config: Config, messages: Message[], options: any = {}, signal?: AbortSignal): AsyncGenerator<string> {
  const { runtime, endpoint, model } = config;
  
  // Check if endpoint is reachable for local runtimes
  if (runtime === 'ollama' || runtime === 'lmstudio' || runtime === 'llama-cpp') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch(endpoint, { method: 'HEAD', signal: controller.signal }).catch(() => {});
      clearTimeout(timeoutId);
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        throw new Error(`Connection to ${runtime} failed at ${endpoint}. Is it running?`);
      }
    }
  }

  try {
    if (runtime === 'ollama') {
      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true, options: { temperature: options.temperature || 0.7 } }),
        signal
      });
      if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            const content = json.message?.content || json.response || "";
            if (content) yield content;
          } catch (e) {}
        }
      }
    } else if (runtime === 'lmstudio' || runtime === 'llama-cpp') {
      const response = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true, temperature: options.temperature || 0.7 }),
        signal
      });
      if (!response.ok) throw new Error(`LM Studio error: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          if (trimmedLine.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmedLine.slice(6));
              const content = json.choices[0]?.delta?.content || "";
              if (content) yield content;
            } catch (e) {}
          }
        }
      }
    } else {
      yield await callLLM(config, messages, options, signal);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error('Operation aborted by user');
    throw new Error(`LLM stream failed: ${error.message}`);
  }
}