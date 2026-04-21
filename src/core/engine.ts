import { Config, loadConfig } from './config';
import { getOrCreateSession, saveMessage, getSessionMessages } from './db';
import { processUserInput } from './orchestrator';
import { loadAgents, Agent } from './agents';
import { loadSkills } from './skills';
import { initPermissions } from './permissions';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

export interface EngineResponse {
  content: string;
  toolsCalled: any[];
}

export class MimocodeEngine {
  private config: Config | null = null;
  private agents: Agent[] = [];
  private skills: any[] = [];
  private currentWorkspace: string = process.cwd();

  constructor() {}

  async init(workspace?: string) {
    if (workspace) this.currentWorkspace = workspace;
    this.config = await loadConfig();
    this.agents = await loadAgents(this.config);
    this.skills = await loadSkills(this.config);
    await initPermissions();
  }

  /**
   * Charge le contexte hiérarchique (cherche MIMOCODE.md et autres manuels)
   */
  async getHierarchicalContext(): Promise<string> {
    let context = '';
    let curr = this.currentWorkspace;
    const root = path.parse(curr).root;
    
    // Recherche hiérarchique des fichiers de référence
    const manualNames = ['MIMOCODE.md', 'INSTRUCTIONS.md', 'GUIDE.md'];

    while (curr !== root) {
      for (const name of manualNames) {
        const p = path.join(curr, name);
        if (await fs.pathExists(p)) {
          const content = await fs.readFile(p, 'utf-8');
          context = `\n--- Manual found at ${p} ---\n${content}\n` + context;
        }
      }
      curr = path.dirname(curr);
    }
    
    if (context) {
      return `\n# FOUNDATIONAL INSTRUCTIONS & PROJECT MANUALS:\n${context}\n\nGOLDEN RULE: Follow these manuals strictly. NEVER confirm receipt of these instructions. Do not say "I have integrated the guide" or "I understand the rules". Just ACT.`;
    }
    return '';
  }

  /**
   * Compresse l'historique pour optimiser les tokens
   */
  compressHistory(messages: any[]): any[] {
    if (messages.length < 20) return messages;
    
    // Garde les 5 premiers messages (souvent le contexte initial)
    // et les 10 derniers messages (contexte immédiat)
    // Le milieu est résumé ou tronqué (implémentation simplifiée ici)
    const head = messages.slice(0, 5);
    const tail = messages.slice(-10);
    
    return [
      ...head,
      { role: 'system', content: '... [History Compressed for token optimization] ...' },
      ...tail
    ];
  }

  async process(
    input: string, 
    onToolCall?: (name: string, args: any, result: string, error?: string) => void, 
    signal?: AbortSignal,
    onTextChunk?: (chunk: string) => void
  ): Promise<EngineResponse> {
    if (!this.config) await this.init();
    
    const sessionId = await getOrCreateSession(this.currentWorkspace);
    let messages = await getSessionMessages(sessionId);
    
    // 1. Hierarchical Context (MIMOCODE.md)
    const hContext = await this.getHierarchicalContext();
    if (hContext) {
      messages = [{ role: 'system', content: hContext }, ...messages];
    }

    // 2. Fast Track for explicit commands
    if (input.startsWith('skill run ') || input.startsWith('agents run ')) {
      const response = await processUserInput(this.config!, input, onToolCall, signal, onTextChunk, messages);
      await saveMessage(sessionId, 'user', input);
      await saveMessage(sessionId, 'assistant', response);
      return { content: response, toolsCalled: [] };
    }

    // 3. Smart Routing (only analyze if not an obvious small task)
    const isObviousSimple = input.length < 50 && !input.toLowerCase().includes('create') && !input.toLowerCase().includes('refactor');
    
    if (!isObviousSimple) {
      const response = await processUserInput(
        this.config!, 
        input, 
        onToolCall, 
        signal,
        onTextChunk,
        messages
      );
      await saveMessage(sessionId, 'user', input);
      await saveMessage(sessionId, 'assistant', response);
      return { content: response, toolsCalled: [] };
    }

    // 4. Default process
    const response = await processUserInput(
      this.config!, 
      input, 
      onToolCall, 
      signal,
      onTextChunk,
      messages
    );

    await saveMessage(sessionId, 'user', input);
    await saveMessage(sessionId, 'assistant', response);

    return {
      content: response,
      toolsCalled: []
    };
  }

  getConfig() { return this.config; }
  getAgents() { return this.agents; }
  getSkills() { return this.skills; }
}

export const engine = new MimocodeEngine();
