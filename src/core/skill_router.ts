import { Config } from './config';
import { loadSkills, runSkill } from './skills';
import { processUserInput } from './orchestrator';
import chalk from 'chalk';

export interface SkillRouteResult {
  used: boolean;
  response: string;
}

/**
 * Detects if the user request matches an existing skill and routes it.
 */
export async function routeToSkill(config: Config, userInput: string): Promise<SkillRouteResult> {
  const skills = await loadSkills(config);
  
  // Simple keyword-based detection for now
  for (const skill of skills) {
    const keywords = skill.name.split(/[-_ ]/);
    if (keywords.some(kw => userInput.toLowerCase().includes(kw.toLowerCase()) && kw.length > 3)) {
      // If the skill is complex (e.g. "create-app"), route to orchestrator
      if (skill.name.includes('create') || skill.name.includes('app') || skill.workflow) {
        const response = await processUserInput(config, `Using skill "${skill.name}": ${userInput}`);
        return { used: true, response };
      }
      const response = await runSkill(config, skill.name, userInput);
      return { used: true, response };
    }
  }

  return { used: false, response: '' };
}
