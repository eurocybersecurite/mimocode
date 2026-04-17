import fs from 'fs-extra';
import path from 'path';
import { Config } from './config';

export async function createCheckpoint(config: Config) {
  const checkpointsDir = path.join(path.dirname(config.historyFile), 'checkpoints');
  await fs.ensureDir(checkpointsDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const checkpointPath = path.join(checkpointsDir, `checkpoint-${timestamp}.json`);
  
  await fs.ensureDir(config.agentDir);
  const data = {
    config,
    timestamp,
    agents: await fs.readdir(config.agentDir).then(files => 
      Promise.all(files.filter(f => f.endsWith('.json')).map(f => fs.readJson(path.join(config.agentDir, f))))
    )
  };

  await fs.writeJson(checkpointPath, data, { spaces: 2 });
  return checkpointPath;
}

export async function restoreLatest(config: Config) {
  const checkpointsDir = path.join(path.dirname(config.historyFile), 'checkpoints');
  if (!(await fs.pathExists(checkpointsDir))) return "No checkpoints found.";
  
  const files = await fs.readdir(checkpointsDir);
  const latest = files.sort().reverse()[0];
  if (!latest) return "No checkpoints found.";

  const data = await fs.readJson(path.join(checkpointsDir, latest));
  await fs.writeJson(path.join(path.dirname(config.historyFile), 'config.json'), data.config, { spaces: 2 });
  
  for (const agent of data.agents) {
    await fs.writeJson(path.join(config.agentDir, `${agent.name}.json`), agent, { spaces: 2 });
  }

  return `Restored to checkpoint from ${data.timestamp}.`;
}
