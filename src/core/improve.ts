import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';
import { Message, callLLMWithTools, callLLM } from './llm';

export async function improveSelf(config: Config, apply: boolean) {
  const root = process.cwd();
  const files = await fs.readdir(root);
  const relevantFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json'));

  const contents = await Promise.all(relevantFiles.map(async f => {
    const content = await fs.readFile(path.join(root, f), 'utf-8');
    return `--- ${f} ---\n${content.substring(0, 1000)}...`;
  }));

  const systemPrompt = `You are a self-improving AI. Analyze the codebase and suggest improvements or fixes. 
  If 'apply' is true, you MUST use the provided tools (write_file, delete_file, etc.) to actually implement the improvements.
  Always explain what you are doing.`;

  const messages: Message[] = [
    { role: 'user', content: `Analyze this codebase and ${apply ? 'APPLY' : 'SUGGEST'} improvements:\n\n${contents.join('\n\n')}` }
  ];

  if (apply) {
    const result = await callLLMWithTools(config, messages, { systemInstruction: systemPrompt });
    return result;
  } else {
    const messagesWithSystem: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    const suggestion = await callLLMWithTools(config, messagesWithSystem);
    return suggestion;
  }
}

export async function learnHabits(config: Config) {
  const historyFile = config.historyFile;
  if (!(await fs.pathExists(historyFile))) return "No history to learn from.";
  
  const history = await fs.readJson(historyFile);
  const messages: Message[] = [
    { role: 'system', content: 'Analyze the user history and extract habits, preferences, and common tasks.' },
    { role: 'user', content: `Analyze this history:\n\n${JSON.stringify(history.slice(-20))}` }
  ];

  const habits = await callLLM(config, messages);
  const habitsFile = path.join(path.dirname(config.historyFile), 'habits.json');
  await fs.writeJson(habitsFile, { habits, timestamp: new Date().toISOString() }, { spaces: 2 });
  return `Learned habits: ${habits.substring(0, 100)}...`;
}
