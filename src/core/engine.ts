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
   * Charge le contexte hiérarchique (cherche MIMOCODE.md dans le dossier actuel et les parents)
   */
  async getHierarchicalContext(): Promise<string> {
    let context = '';
    let curr = this.currentWorkspace;
    const root = path.parse(curr).root;

    while (curr !== root) {
      const mimocodeMd = path.join(curr, 'MIMOCODE.md');
      if (await fs.pathExists(mimocodeMd)) {
        const content = await fs.readFile(mimocodeMd, 'utf-8');
        context = `# CONTEXT FROM ${mimocodeMd}:\n${content}\n\n` + context;
      }
      curr = path.dirname(curr);
    }
    return context;
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

  async process(input: string, onToolCall?: (name: string, args: any, result: string, error?: string) => void, signal?: AbortSignal): Promise<EngineResponse> {
    if (!this.config) await this.init();
    
    const sessionId = await getOrCreateSession(this.currentWorkspace);
    let messages = await getSessionMessages(sessionId);
    
    // 1. Hierarchical Context
    const hContext = await this.getHierarchicalContext();
    if (hContext) {
      messages = [{ role: 'system', content: hContext }, ...messages];
    }

    // 2. High-Level Reasoning (Prioritize over Skills for complex requests)
    const analysis = await import('./orchestrator').then(m => m.analyzeComplexity(this.config!, input));
    
    if (analysis.complexity === 'complex' || input.toLowerCase().includes('react') || input.toLowerCase().includes('app')) {
       const response = await import('./orchestrator').then(m => m.processUserInput(
        this.config!, 
        input, 
        onToolCall, 
        signal
      ));
      await saveMessage(sessionId, 'user', input);
      await saveMessage(sessionId, 'assistant', response);
      return { content: response, toolsCalled: [] };
    }

    // 3. Fallback to skills or normal process
    const response = await processUserInput(
      this.config!, 
      input, 
      onToolCall, 
      signal
    );

    await saveMessage(sessionId, 'user', input);
    await saveMessage(sessionId, 'assistant', response);

    return {
      content: response,
      toolsCalled: [] // Sera rempli par l'orchestrateur si nécessaire
    };
  }

  getConfig() { return this.config; }
  getAgents() { return this.agents; }
  getSkills() { return this.skills; }
}

export const engine = new MimocodeEngine();
