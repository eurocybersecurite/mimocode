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
  const allTools = [...mcpTools, ...extraTools];
  
  const baseSystemPrompt = `${options.systemInstruction || "You are a world-class autonomous engineer."}

CURRENT ENVIRONMENT:
- Working Directory: ${cwd}
- OS: ${process.platform}

AVAILABLE TOOLS:
${allTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

IMPORTANT: You have FULL access to the file system and shell via tools. NEVER say you cannot perform actions.`;

  const toolSystemPrompt = `You are Mimocode, an autonomous AI engineer.

# COMMUNICATION
- Respond in user's language (French/English/etc.)
- Be concise but thorough
- Show your reasoning briefly before acting
- Provide FINAL ANSWER when goal is achieved

# AVAILABLE TOOLS
Format: <tool_call name="tool" args='{"arg":"value"}' />

CORE TOOLS:
- read_file: filePath
- write_file: filePath, content (REQUIRED)
- list_dir: dirPath
- run_command: command, cwd (optional), background (optional)
- create_project: name, type (python, node, react, etc.)
- invoke_skill: skillName, prompt

${getSkillsList()}

# AGENT CREATION
When user asks to "create an agent called X":
1. Use write_file to create: .mimocode/agents/X.md
2. Format:
   ---
   name: X
   description: what it does
   tools: [list, of, tools]
   ---
   # Instructions for the agent
3. Confirm creation with file path

# CONVERSATION FLOW
1. User asks something
2. You reason briefly → use tools or skills
3. Show tool results
4. Continue until goal achieved
5. Provide FINAL ANSWER summarizing what was done

# CRITICAL RULES
- NEVER hallucinate fake commands (swiftui, check_environment are FAKE)
- If command fails (command not found, no such file) → PROACTIVELY fix it
- After write/delete → verify with read_file or list_dir
- Use @skill-name for specialized tasks (iOS, debugging, refactoring)
- Create agents when user asks for reusable specialists
- STOP when goal is achieved

# EXAMPLES
User: "Create iOS todo app"
You: I'll use @ios-mac-app-creator
<tool_call name="invoke_skill" args='{"skillName":"@ios-mac-app-creator","prompt":"Create todo-list iOS app"}' />

User: "Create agent called web-dev"
You: I'll create the agent file
<tool_call name="write_file" args='{"filePath":".mimocode/agents/web-dev.md","content":"---\\nname: web-dev\\ndescription: Web development specialist\\ntools: [read_file, write_file, run_command]\\n---\\n\\n# Web Dev Agent\\nYou are a web development expert..."}' />

User: "What files are here?"
You: Let me check
<tool_call name="list_dir" args='{"dirPath":"."}' />

Remember: Use tools, don't just talk. Stop when done.`;


function getSkillsList(): string {
  const skillsDir = path.join(process.cwd(), '.mimocode', 'skills');
  try {
    if (!fs.existsSync(skillsDir)) return '';
    const skills = fs.readdirSync(skillsDir).filter(f => {
      const p = path.join(skillsDir, f);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'SKILL.md'));
    });
    if (skills.length === 0) return '';
    return `Available: ${skills.map(s => `@${s}`).join(', ')}`;
  } catch { return ''; }
}
  const combinedSystemPrompt = `${baseSystemPrompt}\n\n${toolSystemPrompt}`;

  const filteredMessages = messages.filter(m => m.role !== 'system');
  const recentMessages = filteredMessages.slice(-30);

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
          // On cherche n'importe quoi qui commence par <tool pour éviter les flashs
          const openTagIndex = textToDisplay.toLowerCase().indexOf('<tool');
          if (openTagIndex !== -1) {
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
    
    // Afficher le reste du texte si non streamé ou si la boucle de stream a fini
    let finalNewText = currentTurnResponse.substring(printedLength);
    if (finalNewText && onTextChunk) {
      // Nettoyage final agressif pour éviter les balises résiduelles
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
            else if (onTextChunk) onTextChunk(`\n🔧 Exécution de ${chalk.bold(name)}...\n`);
            
            // Report to web interface
            await reportEvent('tool_start', { name, args: normalizedArgs });

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
                continue;
              }
              if (instruction && name === 'run_command') {
                normalizedArgs.command = `${normalizedArgs.command} # Instruction: ${instruction}`;
              }
            }
            
            const result = await tool.execute(normalizedArgs);
            toolResults += `\n[Result of ${name}]:\n${result}\n`;
            await onToolCall?.(name, normalizedArgs, result);
            
            // Report to web interface
            await reportEvent('tool_success', { name, args: normalizedArgs, result });
            
          } catch (e: any) {
            const error = `Error executing ${name}: ${e.message}`;
            toolResults += `\n[Error in ${name}]:\n${error}\n`;
            await onToolCall?.(name, args, '', error);
            
            // Report to web interface
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
  
  // Nettoyage final de la réponse complète pour l'affichage
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
      // We try to fetch the base endpoint or a common health check
      await fetch(endpoint, { method: 'HEAD', signal: controller.signal }).catch(() => {
        // Some endpoints might not support HEAD, so we just check if we can connect
      });
      clearTimeout(timeoutId);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Ignore timeout
      } else {
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
