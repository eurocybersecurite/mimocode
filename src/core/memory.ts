import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const MEMORY_DIR = path.join(os.homedir(), '.mimocode', 'memory');

export interface MemoryEntry {
  key: string;
  value: any;
  timestamp: string;
}

export async function initMemory() {
  await fs.ensureDir(MEMORY_DIR);
}

export async function saveMemory(key: string, value: any) {
  const filePath = path.join(MEMORY_DIR, `${key}.json`);
  const entry: MemoryEntry = {
    key,
    value,
    timestamp: new Date().toISOString()
  };
  await fs.writeJson(filePath, entry, { spaces: 2 });
}

export async function getMemory(key: string): Promise<any | null> {
  const filePath = path.join(MEMORY_DIR, `${key}.json`);
  if (await fs.pathExists(filePath)) {
    const entry: MemoryEntry = await fs.readJson(filePath);
    return entry.value;
  }
  return null;
}

export async function getAllMemory(): Promise<Record<string, any>> {
  if (!(await fs.pathExists(MEMORY_DIR))) return {};
  const files = await fs.readdir(MEMORY_DIR);
  const memory: Record<string, any> = {};
  for (const file of files) {
    if (file.endsWith('.json')) {
      const entry: MemoryEntry = await fs.readJson(path.join(MEMORY_DIR, file));
      memory[entry.key] = entry.value;
    }
  }
  return memory;
}

export async function addMemory(config: any, text: string) {
  const key = `mem_${Date.now()}`;
  await saveMemory(key, { content: text });
}

export async function searchMemory(config: any, query: string) {
  const all = await getAllMemory();
  return Object.values(all)
    .filter((m: any) => m.content.toLowerCase().includes(query.toLowerCase()))
    .map((m: any) => ({ content: m.content }));
}

export async function exportMemory(config: any) {
  const all = await getAllMemory();
  return JSON.stringify(all, null, 2);
}
