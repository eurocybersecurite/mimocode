import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';
import { callLLM, Message } from './llm';

export interface Skill {
  name: string;
  description: string;
  prompt: string;
  workflow?: string[]; // Sequence of high-level steps or business rules
  tags?: string[];
}

export async function loadSkills(config: Config): Promise<Skill[]> {
  const skillsDir = path.join(path.dirname(config.historyFile), 'skills');
  const defaultSkills: Skill[] = [
    {
      name: 'create-app',
      description: 'Create a basic application structure',
      prompt: 'You are an expert app generator. When asked to create an app, use the write_file tool to create a package.json, an index.js, and a README.md. Structure the app according to the user\'s needs.'
    },
    {
      name: 'refactor',
      description: 'Refactor code for better readability',
      prompt: 'You are a code refactoring expert. Analyze the provided code and suggest improvements using the write_file tool to apply them if requested.'
    },
    {
      name: 'debug',
      description: 'Find and fix bugs in code',
      prompt: 'You are a debugging expert. Use read_file to examine code, identify bugs, and explain the fix.'
    }
  ];

  if (!(await fs.pathExists(skillsDir))) {
    await fs.ensureDir(skillsDir);
    for (const skill of defaultSkills) {
      await fs.writeJson(path.join(skillsDir, `${skill.name}.json`), skill, { spaces: 2 });
    }
    return defaultSkills;
  }

  const files = await fs.readdir(skillsDir);
  const skills: Skill[] = [];
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(skillsDir, file);
      try {
        skills.push(await fs.readJson(filePath));
      } catch (e) {
        console.error(chalk.red(`\n⚠️ Corrupted skill file detected: ${file}. Renaming to .bak for safety.`));
        try {
          await fs.move(filePath, `${filePath}.bak`, { overwrite: true });
        } catch (err) {}
      }
    }
  }
  return skills.length > 0 ? skills : defaultSkills;
}

/**
 * Writes JSON atomically using a temporary file.
 */
async function atomicWriteJson(filePath: string, data: any) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeJson(tempPath, data, { spaces: 2 });
  await fs.move(tempPath, filePath, { overwrite: true });
}

export async function createSkill(config: Config, skill: Skill) {
  const skillsDir = path.join(path.dirname(config.historyFile), 'skills');
  await fs.ensureDir(skillsDir);
  const filePath = path.join(skillsDir, `${skill.name}.json`);
  await atomicWriteJson(filePath, skill);
}

export async function deleteSkill(config: Config, name: string) {
  const skillsDir = path.join(path.dirname(config.historyFile), 'skills');
  const filePath = path.join(skillsDir, `${name}.json`);
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
    return true;
  }
  return false;
}

export async function runSkill(config: Config, name: string, input: string) {
  const skills = await loadSkills(config);
  const skill = skills.find(s => s.name === name);
  if (!skill) throw new Error(`Skill ${name} not found.`);

  const messages: Message[] = [
    { role: 'system', content: skill.prompt + (skill.workflow ? `\n\nBusiness Workflow to follow:\n${skill.workflow.map((s, i) => `${i+1}. ${s}`).join('\n')}` : '') },
    { role: 'user', content: input }
  ];

  return await callLLM(config, messages);
}

/**
 * Converts skills into tools that agents can call.
 */
export async function getSkillTools(config: Config) {
  const skills = await loadSkills(config);
  return skills.map(skill => ({
    name: `invoke_skill_${skill.name.replace(/-/g, '_')}`,
    description: `Invoke the high-level skill: ${skill.description}. Use this for complex business procedures.`,
    execute: async (args: { input: string }) => {
      return await runSkill(config, skill.name, args.input);
    }
  }));
}
