import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';
import axios from 'axios';
import * as cliProgress from 'cli-progress';
import chalk from 'chalk';

export interface VectorEntry {
  path: string;
  content: string;
  embedding: number[];
}

export async function indexDirectory(config: Config, dirPath: string) {
  const root = path.resolve(process.cwd(), dirPath);
  const indexFile = path.join(path.dirname(config.historyFile), 'rag_index.json');
  
  if (config.runtime !== 'ollama') {
    throw new Error("Local RAG currently requires Ollama for embeddings.");
  }

  const entries: VectorEntry[] = [];
  const filesToIndex: string[] = [];

  // First pass: count files
  async function collect(dir: string) {
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of list) {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', '.mimocode'].includes(entry.name)) continue;
        await collect(res);
      } else {
        filesToIndex.push(res);
      }
    }
  }

  console.log(chalk.blue('🔍 Scanning directory...'));
  await collect(root);

  const progressBar = new cliProgress.SingleBar({
    format: chalk.cyan('Indexing |') + chalk.blue('{bar}') + '| {percentage}% || {value}/{total} Files || {file}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  progressBar.start(filesToIndex.length, 0, { file: 'Starting...' });

  for (const file of filesToIndex) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      progressBar.update(entries.length + 1, { file: path.basename(file) });
      
      if (content.length > 10000) continue; 
      
      const response = await axios.post(`${config.endpoint}/api/embeddings`, {
        model: config.model,
        prompt: content.substring(0, 5000),
      });
      
      entries.push({
        path: path.relative(process.cwd(), file),
        content,
        embedding: response.data.embedding,
      });
    } catch (e) {}
  }

  progressBar.stop();
  await fs.writeJson(indexFile, entries, { spaces: 2 });
  return `Successfully indexed ${entries.length} files into local vector memory.`;
}

function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

export async function queryIndex(config: Config, query: string) {
  const indexFile = path.join(path.dirname(config.historyFile), 'rag_index.json');
  if (!(await fs.pathExists(indexFile))) {
    return "Index not found. Please run 'rag index' first.";
  }

  if (config.runtime !== 'ollama') {
    throw new Error("Local RAG currently requires Ollama for embeddings.");
  }
  
  const response = await axios.post(`${config.endpoint}/api/embeddings`, {
    model: config.model,
    prompt: query,
  });
  const queryVector = response.data.embedding;

  const entries: VectorEntry[] = await fs.readJson(indexFile);
  const results = entries
    .map(e => ({ ...e, score: cosineSimilarity(e.embedding, queryVector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (results.length === 0) return "No matches found.";

  return results.map(r => `--- ${r.path} (Score: ${r.score.toFixed(4)}) ---\n${r.content.substring(0, 500)}...`).join('\n\n');
}

export async function clearIndex(config: Config) {
  const indexFile = path.join(path.dirname(config.historyFile), 'rag_index.json');
  if (await fs.pathExists(indexFile)) {
    await fs.remove(indexFile);
    return "RAG index cleared.";
  }
  return "Index already empty.";
}
