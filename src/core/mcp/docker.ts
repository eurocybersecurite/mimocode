import { execSync } from 'child_process';

export const dockerTools = [
  {
    name: 'docker_ps',
    description: 'List running docker containers',
    execute: async () => {
      try {
        return execSync('docker ps', { encoding: 'utf-8' });
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
  },
  {
    name: 'docker_build',
    description: 'Build a docker image from a Dockerfile',
    execute: async (args: { tag: string, path?: string }) => {
      try {
        const buildPath = args.path || '.';
        return execSync(`docker build -t ${args.tag} ${buildPath}`, { encoding: 'utf-8' });
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
  },
  {
    name: 'docker_run',
    description: 'Run a docker container',
    execute: async (args: { image: string, name?: string, ports?: string[] }) => {
      try {
        const nameFlag = args.name ? `--name ${args.name}` : '';
        const portFlags = args.ports ? args.ports.map(p => `-p ${p}`).join(' ') : '';
        return execSync(`docker run -d ${nameFlag} ${portFlags} ${args.image}`, { encoding: 'utf-8' });
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
  }
];
