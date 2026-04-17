import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

export const gitTools = [
  {
    name: 'git_status',
    description: 'Get the current status of the git repository',
    execute: async () => {
      try {
        return execSync('git status', { encoding: 'utf-8' });
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
  },
  {
    name: 'git_log',
    description: 'Get the git commit log',
    execute: async () => {
      try {
        return execSync('git log --oneline -n 10', { encoding: 'utf-8' });
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
  },
  {
    name: 'git_diff',
    description: 'Get the git diff of staged or unstaged changes',
    execute: async (args: { staged?: boolean }) => {
      try {
        const cmd = args.staged ? 'git diff --staged' : 'git diff';
        return execSync(cmd, { encoding: 'utf-8' });
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
  },
  {
    name: 'git_commit',
    description: 'Commit changes to the repository',
    execute: async (args: { message: string, all?: boolean }) => {
      try {
        if (args.all) execSync('git add .');
        return execSync(`git commit -m "${args.message}"`, { encoding: 'utf-8' });
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
  }
];
