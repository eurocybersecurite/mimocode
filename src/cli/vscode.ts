import fs from 'fs-extra';
import path from 'path';

export async function setupVSCode() {
  const vscodeDir = path.join(process.cwd(), '.vscode');
  await fs.ensureDir(vscodeDir);

  const tasks = {
    version: "2.0.0",
    tasks: [
      {
        label: "mimocode: chat",
        type: "shell",
        command: "npx tsx src/cli/index.ts chat",
        problemMatcher: [],
        group: {
          kind: "build",
          isDefault: true
        }
      },
      {
        label: "mimocode: heal",
        type: "shell",
        command: "npx tsx src/cli/index.ts heal --fix",
        problemMatcher: []
      },
      {
        label: "mimocode: improve",
        type: "shell",
        command: "npx tsx src/cli/index.ts improve --apply",
        problemMatcher: []
      }
    ]
  };

  const launch = {
    version: "0.2.0",
    configurations: [
      {
        type: "node",
        request: "launch",
        name: "mimocode: debug cli",
        program: "${workspaceFolder}/src/cli/index.ts",
        args: ["chat"],
        runtimeArgs: ["--loader", "ts-node/esm"],
        console: "integratedTerminal",
        internalConsoleOptions: "neverOpen"
      },
      {
        type: "node",
        request: "attach",
        name: "mimocode: attach to server",
        port: 9229,
        restart: true,
        protocol: "inspector"
      }
    ]
  };

  const extensions = {
    recommendations: [
      "ms-vscode.vscode-typescript-next",
      "esbenp.prettier-vscode",
      "dbaeumer.vscode-eslint"
    ]
  };

  await fs.writeJson(path.join(vscodeDir, 'tasks.json'), tasks, { spaces: 2 });
  await fs.writeJson(path.join(vscodeDir, 'launch.json'), launch, { spaces: 2 });
  await fs.writeJson(path.join(vscodeDir, 'extensions.json'), extensions, { spaces: 2 });

  return "VS Code configuration (tasks, launch, extensions) generated in .vscode/";
}

export async function attachVSCode() {
  // This would typically involve setting up a websocket or similar
  // For now, we'll return the connection details for the user to use
  return "VS Code Attach: Use the 'mimocode: attach to server' launch configuration (Port 9229).";
}
