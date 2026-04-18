import fs from 'fs-extra';
import path from 'path';

export async function setupVSCode() {
  const vscodeDir = path.join(process.cwd(), '.vscode');
  await fs.ensureDir(vscodeDir);

  // Backup existing files if they exist
  const filesToBackup = ['tasks.json', 'launch.json', 'extensions.json'];
  for (const file of filesToBackup) {
    const filePath = path.join(vscodeDir, file);
    if (await fs.pathExists(filePath)) {
      await fs.copy(filePath, `${filePath}.bak-${Date.now()}`);
    }
  }

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

  return "VS Code integration files successfully updated. Existing configurations have been backed up.";
}

export async function attachVSCode() {
  return "VS Code Attach: Use the 'mimocode: attach to server' launch configuration (Port 9229).";
}
