import { Config } from './config';
import { loadSkills, runSkill } from './skills';
import chalk from 'chalk';

export interface SkillRouteResult {
  used: boolean;
  response: string;
}

/**
 * Detects if the user request matches an existing skill and routes it.
 */
export async function routeToSkill(config: Config, userInput: string): Promise<SkillRouteResult> {
  // Prevent system tools from being routed to skills
  if (userInput.includes('read_file') || userInput.includes('write_file') || userInput.includes('list_dir')) {
    return { used: false, response: '' };
  }

  const skills = await loadSkills(config);
  
  // Simple keyword-based detection for now
  // In a more advanced version, we could use LLM to match
  for (const skill of skills) {
    const keywords = skill.name.split(/[-_ ]/);
    if (keywords.some(kw => userInput.toLowerCase().includes(kw.toLowerCase()) && kw.length > 3)) {
      console.log(chalk.blue(`\n🛠️  Skill detected: ${skill.name}. Routing...`));
      const response = await runSkill(config, skill.name, userInput);
      return { used: true, response };
    }
  }

  return { used: false, response: '' };
}
