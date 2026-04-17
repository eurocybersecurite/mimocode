import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Config } from './config';
import { callLLM } from './llm';

export interface ScheduledTask {
  id: string;
  task: string;
  cron: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'cancelled';
}

const SCHEDULER_FILE = path.join(process.cwd(), '.mimocode', 'scheduler.json');

export async function loadScheduledTasks(): Promise<ScheduledTask[]> {
  if (!(await fs.pathExists(SCHEDULER_FILE))) {
    return [];
  }
  return fs.readJson(SCHEDULER_FILE);
}

export async function saveScheduledTasks(tasks: ScheduledTask[]): Promise<void> {
  await fs.ensureDir(path.dirname(SCHEDULER_FILE));
  await fs.writeJson(SCHEDULER_FILE, tasks, { spaces: 2 });
}

export async function scheduleTask(config: Config, task: string, cron: string): Promise<string> {
  const tasks = await loadScheduledTasks();
  const id = Math.random().toString(36).substring(7);
  const newTask: ScheduledTask = {
    id,
    task,
    cron,
    status: 'active',
  };
  tasks.push(newTask);
  await saveScheduledTasks(tasks);
  return id;
}

export async function listScheduledTasks(): Promise<ScheduledTask[]> {
  return await loadScheduledTasks();
}

export async function cancelScheduledTask(id: string): Promise<boolean> {
  const tasks = await loadScheduledTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  tasks[index].status = 'cancelled';
  await saveScheduledTasks(tasks);
  return true;
}
