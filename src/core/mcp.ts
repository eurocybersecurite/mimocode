import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';
import * as rg from 'vscode-ripgrep';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const execAsync = promisify(exec);
const rgPath = (rg as any).rgPath || (rg as any).default?.rgPath;
const WORKSPACE_ROOT = process.cwd();

function isPathSafe(filePath: string): boolean {
  const fullPath = path.resolve(WORKSPACE_ROOT, filePath);
  return fullPath.startsWith(WORKSPACE_ROOT);
}

import { showDiff } from './diff';
import { verifyFileWritten, verifyFileDeleted, verifyDirectoryCreated, verifyCommandSuccess } from './agent_verifier';

export interface MCPTool {
  name: string;
  description: string;
  execute: (args: any) => Promise<string>;
}

export const mcpTools: MCPTool[] = [
  {
    name: 'read_file',
    description: 'Read the content of a file. Use this to understand existing code or data.',
    execute: async (args) => {
      const filePath = args.filePath || args.path;
      if (!filePath) throw new Error('filePath or path is required');
      if (!isPathSafe(filePath)) throw new Error(`Access denied: ${filePath} is outside the workspace.`);
      const content = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf-8');
      return content;
    },
  },
  {
    name: 'write_file',
    description: 'Create a new file or overwrite an existing one with new content. Use this for all code and text creation.',
    execute: async (args) => {
      const filePath = args.filePath || args.path;
      let content = args.content;
      
      if (!filePath) throw new Error('filePath or path is required');
      if (!isPathSafe(filePath)) throw new Error(`Access denied: ${filePath} is outside the workspace.`);
      
      if (content === undefined) {
        throw new Error(`Error: "content" is required for write_file. 
Example: <tool_call name="write_file" args='{"filePath": "test.txt", "content": "Hello world"}' />`);
      }

      // 1-line file check (unless it's a simple config or explicitly requested)
      if (typeof content === 'string' && content.split('\n').length === 1 && content.length < 50 && !filePath.endsWith('.json') && !filePath.endsWith('.txt')) {
        console.log(chalk.yellow(`[FileSystem] Warning: Writing a very short 1-line file to ${filePath}. This might be incomplete.`));
      }

      // Auto-convert objects to JSON string
      if (typeof content === 'object' && content !== null) {
        content = JSON.stringify(content, null, 2);
      }

      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      
      let oldContent = '';
      if (await fs.pathExists(fullPath)) {
        oldContent = await fs.readFile(fullPath, 'utf-8');
      }

      // Exact content comparison
      if (oldContent === content && oldContent.length > 0) {
        return `Error: No changes detected. The content you provided is identical to what is already in ${filePath}. If you intended to append or modify, make sure the 'content' argument is different.`;
      }

      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf-8');
      
      const oldLines = oldContent.split('\n').length;
      const newLines = content.split('\n').length;
      const added = Math.max(0, newLines - oldLines);
      const removed = Math.max(0, oldLines - newLines);

      return `✓ Edit ${filePath} → Accepted (+${added}, -${removed})`;
      },
      },

  {
    name: 'list_dir',
    description: 'List files in a directory.',
    execute: async (args) => {
      const dirPath = args.dirPath || args.path || '.';
      if (!isPathSafe(dirPath)) throw new Error(`Access denied: ${dirPath} is outside the workspace.`);
      const files = await fs.readdir(path.resolve(process.cwd(), dirPath));
      return files.join('\n');
    },
  },
  {
    name: 'search_files',
    description: 'Search for a pattern in file contents.',
    execute: async ({ pattern, dirPath = '.' }) => {
      const root = path.resolve(process.cwd(), dirPath);
      const results: string[] = [];
      
      async function walk(dir: string) {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          const res = path.resolve(dir, file.name);
          if (file.isDirectory()) {
            if (file.name === 'node_modules' || file.name === '.git' || file.name === 'dist') continue;
            await walk(res);
          } else {
            try {
              const content = await fs.readFile(res, 'utf-8');
              if (content.includes(pattern)) {
                results.push(path.relative(process.cwd(), res));
              }
            } catch (e) {
              // Skip binary or unreadable files
            }
          }
        }
      }

      await walk(root);
      return results.length > 0 ? results.join('\n') : 'No matches found in content.';
    },
  },
  {
    name: 'find_files',
    description: 'Find files by name pattern (regex).',
    execute: async ({ pattern, dirPath = '.' }) => {
      const root = path.resolve(process.cwd(), dirPath);
      const results: string[] = [];
      const regex = new RegExp(pattern);
      
      async function walk(dir: string) {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          const res = path.resolve(dir, file.name);
          const relativePath = path.relative(process.cwd(), res);
          
          if (regex.test(file.name) || regex.test(relativePath)) {
            results.push(relativePath);
          }

          if (file.isDirectory()) {
            if (file.name === 'node_modules' || file.name === '.git' || file.name === 'dist') continue;
            await walk(res);
          }
        }
      }

      await walk(root);
      return results.length > 0 ? results.join('\n') : 'No files found matching pattern.';
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file.',
    execute: async (args) => {
      const filePath = args.filePath || args.path;
      if (!filePath) throw new Error('filePath or path is required');
      if (!isPathSafe(filePath)) throw new Error(`Access denied: ${filePath} is outside the workspace.`);
      const fullPath = path.resolve(process.cwd(), filePath);
      
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
        const verification = await verifyFileDeleted(filePath);
        if (verification.success) {
          return `Successfully deleted ${filePath}. ${verification.message}`;
        } else {
          return `Warning: Deleted ${filePath} but verification failed: ${verification.message}`;
        }
      }
      return `File ${filePath} does not exist, nothing to delete.`;
    },
  },
  {
    name: 'create_directory',
    description: 'Create a new directory.',
    execute: async (args) => {
      const dirPath = args.dirPath || args.path;
      if (!dirPath) throw new Error('dirPath or path is required');
      if (!isPathSafe(dirPath)) throw new Error(`Access denied: ${dirPath} is outside the workspace.`);
      await fs.ensureDir(path.resolve(process.cwd(), dirPath));
      
      const verification = await verifyDirectoryCreated(dirPath);
      if (verification.success) {
        return `Successfully created directory ${dirPath}. ${verification.message}`;
      } else {
        return `Warning: Created directory ${dirPath} but verification failed: ${verification.message}`;
      }
    },
  },
  {
    name: 'copy_file',
    description: 'Copy a file from source to destination.',
    execute: async ({ source, destination }) => {
      const fullSource = path.isAbsolute(source) ? source : path.resolve(process.cwd(), source);
      let fullDest = path.isAbsolute(destination) ? destination : path.resolve(process.cwd(), destination);
      
      if (await fs.pathExists(fullDest) && (await fs.stat(fullDest)).isDirectory()) {
        fullDest = path.join(fullDest, path.basename(fullSource));
      }
      
      await fs.ensureDir(path.dirname(fullDest));
      await fs.copy(fullSource, fullDest, { overwrite: true });
      return `File copied from ${source} to ${fullDest} successfully.`;
    },
  },
  {
    name: 'move_file',
    description: 'Move or rename a file/directory.',
    execute: async ({ source, destination }) => {
      const fullSource = path.resolve(process.cwd(), source);
      let fullDest = path.resolve(process.cwd(), destination);
      
      if (await fs.pathExists(fullDest) && (await fs.stat(fullDest)).isDirectory()) {
        fullDest = path.join(fullDest, path.basename(fullSource));
      }
      
      await fs.ensureDir(path.dirname(fullDest));
      await fs.move(fullSource, fullDest, { overwrite: true });

      return `Moved ${source} to ${fullDest} successfully.`;
    },
  },
  {
    name: 'fast_search',
    description: 'Fast search using ripgrep or grep.',
    execute: async ({ pattern, dirPath = '.' }) => {
      const root = path.resolve(process.cwd(), dirPath);
      
      try {
        // Try ripgrep first
        // Safely escape arguments for shell
        const escapedPattern = pattern.replace(/"/g, '\\"');
        const escapedRoot = root.replace(/"/g, '\\"');
        const output = execSync(`"${rgPath}" -l "${escapedPattern}" "${escapedRoot}"`, { encoding: 'utf-8' });
        return output || 'No matches found.';
      } catch (e) {
        try {
          // Fallback to grep
          const escapedPattern = pattern.replace(/"/g, '\\"');
          const escapedRoot = root.replace(/"/g, '\\"');
          const output = execSync(`grep -rI -l "${escapedPattern}" "${escapedRoot}"`, { encoding: 'utf-8' });
          return output || 'No matches found.';
        } catch (e2) {
          return 'Fast search failed. Make sure ripgrep or grep is installed.';
        }
      }
    },
  },
  {
    name: 'list_files_recursive',
    description: 'List all files in a directory recursively.',
    execute: async (args) => {
      const dirPath = args.dirPath || args.path || '.';
      const root = path.resolve(process.cwd(), dirPath);
      const results: string[] = [];
      
      async function walk(dir: string) {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          const res = path.resolve(dir, file.name);
          if (file.isDirectory()) {
            if (file.name === 'node_modules' || file.name === '.git' || file.name === 'dist') continue;
            await walk(res);
          } else {
            results.push(path.relative(process.cwd(), res));
          }
        }
      }

      await walk(root);
      return results.length > 0 ? results.join('\n') : 'No files found.';
    },
  },
  {
    name: 'run_command',
    description: 'Execute any shell command (bash/zsh). Set background: true for servers. It will automatically try to fix common errors like missing directories.',
    execute: async ({ command, background = false, cwd }) => {
      const executionCwd = cwd ? (path.isAbsolute(cwd) ? cwd : path.resolve(process.cwd(), cwd)) : process.cwd();
      
      // Auto-fix: If directory doesn't exist, try to create it or run in root
      if (cwd && !fs.existsSync(executionCwd)) {
        await fs.ensureDir(executionCwd);
      }

      return new Promise((resolve) => {
        const child = spawn(command, { shell: true, cwd: executionCwd });
        let stdout = '';
        let stderr = '';
        let resolved = false;
        
        child.stdout.on('data', (data) => {
          const chunk = data.toString();
          stdout += chunk;

          if (!resolved && (
            chunk.includes('ready in') || 
            chunk.includes('Local: http') || 
            chunk.includes('listening on') ||
            chunk.includes('Compiled successfully')
          )) {
            resolved = true;
            resolve(`Output: ${stdout}\n[Status: Server started successfully]`);
          }
        });
        
        child.stderr.on('data', (data) => {
          const chunk = data.toString();
          stderr += chunk;
        });
        
        child.on('close', (code) => {
          if (resolved) return;
          resolved = true;
          if (code === 0) {
            const shortCmd = command.length > 30 ? command.slice(0, 30) + '...' : command;
            let resultPrefix = `✓ shell ${shortCmd} → Success`;
            
            // Critical check for 'mail' command which often fails silently
            if (command.startsWith('mail ')) {
              resultPrefix += " (Warning: 'mail' command returned code 0 but might not have been delivered if your local SMTP is not configured. Ask user to check if they received it.)";
            }
            
            resolve(resultPrefix);
          } else {
            // Smarter error reporting with Repair Tips
            let errorMsg = stderr || stdout;
            let tips = "";

            if (errorMsg.includes('Missing script: "start"')) {
              tips += "\nTip: For Vite/React projects, try 'npm run dev' instead of 'npm start'. Check package.json scripts.";
            }
            if (errorMsg.includes('command not found') || errorMsg.includes('not found')) {
              tips += "\nTip: The command is not installed. Try searching for it or installing the corresponding package (e.g., npm install <package>).";
            }
            if (errorMsg.includes('MODULE_NOT_FOUND')) {
              tips += "\nTip: A required node module is missing. Try running 'npm install'.";
            }
            if (errorMsg.includes('No such file or directory')) {
              tips += "\nTip: Verify the path with 'list_dir'. If you are in a subdirectory, use the correct relative path or the 'cwd' argument.";
            }
            if (errorMsg.includes('EADDRINUSE')) {
              const portMatch = errorMsg.match(/port:? (\d+)/i);
              const port = portMatch ? portMatch[1] : 'the port';
              tips += `\nTip: Port ${port} is already in use. Try to find and kill the process or use a different port (Mimocode prefers 3000).`;
            }

            resolve(`Error (Exit Code ${code}): ${errorMsg}${tips}`);
          }
        });
        
        if (background) {
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(`Output so far: ${stdout}\n[Status: Running in background]`);
            }
          }, 5000);
        }

        child.on('error', (err) => {
          if (resolved) return;
          resolved = true;
          resolve(`Execution Error: ${err.message}`);
        });
      });
    },
  },
  {
    name: 'create_project',
    description: 'Bootstrap a new project with a template (e.g., java, python, react, node).',
    execute: async (args) => {
      const name = args.name || args.projectName;
      const type = args.type || args.language || args.template;
      if (!name || !type) {
        throw new Error(`Both "name" (or "projectName") and "type" (or "language") are required for create_project. Received: ${JSON.stringify(args)}`);
      }
      const root = path.resolve(process.cwd(), name);
      await fs.ensureDir(root);
      
      switch (type.toLowerCase()) {
        case 'java':
          await fs.ensureDir(path.join(root, 'src/main/java/com/example'));
          await fs.writeFile(path.join(root, 'pom.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>${name}</artifactId>
  <version>1.0-SNAPSHOT</version>
</project>`, 'utf-8');
          await fs.writeFile(path.join(root, 'src/main/java/com/example/Main.java'), `package com.example;
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from ${name}!");
    }
}`, 'utf-8');
          break;
        case 'python':
          await fs.writeFile(path.join(root, 'main.py'), `def main():
    print("Hello from ${name}!")

if __name__ == "__main__":
    main()`, 'utf-8');
          await fs.writeFile(path.join(root, 'requirements.txt'), '', 'utf-8');
          break;
        case 'react':
          // Use a proper modern scaffold
          await fs.ensureDir(root);
          await execAsync('npm create vite@latest . -- --template react-ts', { cwd: root });
          return `React project ${name} bootstrapped using Vite (TypeScript) in ${root}. You should now run 'npm install' inside that directory.`;
        case 'node':
          await fs.writeFile(path.join(root, 'index.js'), `console.log("Hello from Node.js project: ${name}");`);
          await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({
            name,
            version: '1.0.0',
            main: 'index.js',
            scripts: { start: 'node index.js' }
          }, null, 2), 'utf-8');
          break;
        case 'go':
          await fs.writeFile(path.join(root, 'main.go'), `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello from ${name}!")\n}`);
          break;
        case 'cpp':
          await fs.writeFile(path.join(root, 'main.cpp'), `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${name}!" << std::endl;\n    return 0;\n}`);
          break;
        case 'php':
          await fs.writeFile(path.join(root, 'index.php'), `<?php\necho "Hello from ${name}!";`);
          break;
        case 'rust':
          await fs.ensureDir(path.join(root, 'src'));
          await fs.writeFile(path.join(root, 'Cargo.toml'), `[package]\nname = "${name}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]`, 'utf-8');
          await fs.writeFile(path.join(root, 'src/main.rs'), `fn main() {\n    println!("Hello from ${name}!");\n}`, 'utf-8');
          break;
        default:
          // Generic fallback: just create the directory and a README
          await fs.writeFile(path.join(root, 'README.md'), `# ${name}\n\nProject initialized as ${type}.`);
          return `Project ${name} initialized with generic template ${type}.`;
      }
      return `Project ${name} (${type}) bootstrapped successfully in ${root}`;
    }
  },
  {
    name: 'check_environment',
    description: 'Check if required software is installed (e.g., java, python, node, mvn).',
    execute: async ({ tools }) => {
      const results: any = {};
      const toolList = Array.isArray(tools) ? tools : [tools];
      
      for (const tool of toolList) {
        try {
          const version = execSync(`${tool} --version`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
          results[tool] = { installed: true, version: version.split('\n')[0].trim() };
        } catch (e) {
          try {
            const version = execSync(`${tool} -version`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
            results[tool] = { installed: true, version: version.split('\n')[0].trim() };
          } catch (e2) {
            results[tool] = { installed: false };
          }
        }
      }
      return JSON.stringify(results, null, 2);
    }
  },
  {
    name: 'web_search',
    description: 'Search the web for information using a search engine.',
    execute: async ({ query }) => {
      try {
        // Using a public search API or a fallback
        const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        const data = response.data;
        let result = `Search results for: ${query}\n\n`;
        if (data.AbstractText) result += `Abstract: ${data.AbstractText}\n`;
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          result += `Related Topics:\n`;
          data.RelatedTopics.slice(0, 5).forEach((t: any) => {
            if (t.Text) result += `- ${t.Text}\n`;
          });
        }
        return result || 'No direct results found. Try a different query.';
      } catch (e: any) {
        return `Search failed: ${e.message}. You can try using 'run_command' with 'curl' to fetch specific pages.`;
      }
    }
  },
  {
    name: 'web_browse',
    description: 'Fetch the content of a specific URL.',
    execute: async ({ url }) => {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        // Simple HTML to text conversion (very basic)
        const text = response.data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        return text.substring(0, 5000) + (text.length > 5000 ? '...' : '');
      } catch (e: any) {
        return `Failed to fetch URL: ${e.message}`;
      }
    }
  },
  {
    name: 'web_scraper',
    description: 'Scrape and extract content from any webpage (supports dynamic JS rendering)',
    execute: async ({ url, selector, extractImages = false }) => {
      try {
        const puppeteer = await import('puppeteer-core');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        let content = selector ? 
          await page.$eval(selector, el => el.textContent) :
          await page.evaluate(() => document.body.innerText);
        
        if (extractImages) {
          const images = await page.$$eval('img', (imgs: any[]) => 
            imgs.map(img => ({ src: img.src, alt: img.alt }))
          );
          content = JSON.stringify({ text: content, images });
        }
        
        await browser.close();
        return typeof content === 'string' ? content : JSON.stringify(content);
      } catch (e: any) {
        return `Scraping failed: ${e.message}`;
      }
    }
  },
  {
    name: 'code_search',
    description: 'Search codebase with AST-aware queries (find functions, classes, imports)',
    execute: async ({ pattern, type = 'string' }) => {
      try {
        if (type === 'function') {
          const result = execSync(`grep -rn "function\\s\\+${pattern}\\s*(" --include="*.{js,ts,py,java,go}" .`);
          return result.toString();
        } else if (type === 'class') {
          const result = execSync(`grep -rn "class\\s\\+${pattern}" --include="*.{js,ts,java,py}" .`);
          return result.toString();
        } else if (type === 'import') {
          const result = execSync(`grep -rn "import.*${pattern}\\|require.*${pattern}" --include="*.{js,ts}" .`);
          return result.toString();
        }
        const result = execSync(`"${rgPath}" -l "${pattern}" --type-add 'code:*.{js,ts,py,java,go,rs,cpp,h}' -t code`);
        return result.toString();
      } catch (e: any) {
        return `Search failed: ${e.message}`;
      }
    }
  },
  {
    name: 'git_history_analyzer',
    description: 'Analyze git history (blame, commits, contributors, file evolution)',
    execute: async ({ filePath, since = '1 month ago', format = 'summary' }) => {
      try {
        if (format === 'summary') {
          const commits = execSync(`git log --since="${since}" --pretty=format:"%h|%an|%ad|%s" ${filePath || ''}`);
          return commits.toString();
        } else if (format === 'blame') {
          const blame = execSync(`git blame --date=short ${filePath}`);
          return blame.toString();
        } else if (format === 'statistics') {
          const stats = execSync(`git log --since="${since}" --numstat --pretty="" ${filePath || ''} | awk '{add+=$1; subs+=$2} END {print "Added: " add ", Deleted: " subs}'`);
          return stats.toString();
        }
        return "No git history found";
      } catch (e: any) {
        return `Git analysis failed: ${e.message}`;
      }
    }
  },
  {
    name: 'code_reviewer',
    description: 'Review code for issues, improvements, and security (AI-powered)',
    execute: async ({ filePath, severity = 'all' }) => {
      try {
        const content = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf-8');
        const { loadConfig } = await import('./config');
        const { callLLM } = await import('./llm');
        const config = await loadConfig();
        
        const reviewPrompt = `Review this code and provide feedback on:
        1. Code quality & readability
        2. Potential bugs
        3. Security issues
        4. Performance problems
        5. Best practices violations
        6. Suggestions for improvement
        
        File: ${filePath}
        Severity filter: ${severity}
        
        \`\`\`
        ${content}
        \`\`\`
        
        Return structured JSON with issues array (line, severity, message, suggestion).`;
        
        const response = await callLLM(config, [{ role: 'user', content: reviewPrompt }]);
        return response;
      } catch (e: any) {
        return `Review failed: ${e.message}`;
      }
    }
  },
  {
    name: 'dependency_visualizer',
    description: 'Generate dependency graph (Mermaid format) for the project',
    execute: async ({ format = 'mermaid' }) => {
      try {
        if (await fs.pathExists('package.json')) {
          const pkg = await fs.readJson('package.json');
          const deps = pkg.dependencies || {};
          const devDeps = pkg.devDependencies || {};
          
          if (format === 'mermaid') {
            let graph = '```mermaid\ngraph TD\n';
            Object.keys(deps).forEach(dep => {
              graph += `  app --> ${dep.replace(/[^a-zA-Z0-9]/g, '_')}\n`;
            });
            graph += '```\n';
            return graph;
          } else if (format === 'json') {
            return JSON.stringify({ dependencies: deps, devDependencies: devDeps }, null, 2);
          }
        }
        return "No dependencies found";
      } catch (e: any) {
        return `Visualization failed: ${e.message}`;
      }
    }
  },
  {
    name: 'api_tester',
    description: 'Test API endpoints (REST, GraphQL, WebSocket) with automated assertions',
    execute: async ({ url, method = 'GET', body, headers, expectedStatus = 200, timeout = 30000 }) => {
      try {
        const startTime = Date.now();
        const response = await axios({
          method,
          url,
          data: body,
          headers: headers || {},
          timeout
        });
        const duration = Date.now() - startTime;
        
        const passed = response.status === expectedStatus;
        
        return JSON.stringify({
          passed,
          status: response.status,
          expectedStatus,
          duration: `${duration}ms`,
          data: response.data,
          headers: response.headers
        });
      } catch (error: any) {
        return JSON.stringify({
          passed: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
  },
  {
    name: 'database_connector',
    description: 'Connect to databases (PostgreSQL, MySQL, MongoDB, SQLite) and run queries',
    execute: async ({ type, host, port, database, username, password, query }) => {
      try {
        let result = '';
        
        if (type === 'postgresql') {
          const { Client } = await import('pg');
          const client = new Client({ host, port, database, user: username, password });
          await client.connect();
          const res = await client.query(query);
          result = JSON.stringify(res.rows, null, 2);
          await client.end();
        } else if (type === 'mysql') {
          const mysql = await import('mysql2/promise');
          const connection = await mysql.createConnection({ host, port, database, user: username, password });
          const [rows] = await connection.execute(query);
          result = JSON.stringify(rows, null, 2);
          await connection.end();
        } else if (type === 'sqlite') {
          const sqlite3 = await import('sqlite3');
          const { open } = await import('sqlite');
          const db = await open({ filename: database, driver: sqlite3.Database });
          const rows = await db.all(query);
          result = JSON.stringify(rows, null, 2);
          await db.close();
        }
        
        return result || "Query executed successfully.";
      } catch (e: any) {
        return `Database connection failed: ${e.message}`;
      }
    }
  },
  {
    name: 'update_scratchpad',
    description: 'Update the project scratchpad with findings, todos, or current state. Use this to maintain a working memory across multiple turns.',
    execute: async ({ content, section }) => {
      const scratchpadPath = path.join(process.cwd(), '.mimocode', 'scratchpad.md');
      await fs.ensureDir(path.dirname(scratchpadPath));
      
      let existingContent = '';
      if (await fs.pathExists(scratchpadPath)) {
        existingContent = await fs.readFile(scratchpadPath, 'utf-8');
      }

      const timestamp = new Date().toLocaleString();
      const newEntry = `\n\n## ${section || 'Update'} (${timestamp})\n${content}`;
      
      await fs.writeFile(scratchpadPath, existingContent + newEntry, 'utf-8');
      return `Scratchpad updated in .mimocode/scratchpad.md`;
    },
  },
  {
    name: 'convert_to_markdown',
    description: 'Convert various file formats (PDF, Word, Excel, PPT, Images) to Markdown.',
    execute: async ({ filePath }) => {
      try {
        const { convertDocument } = await import('./markitdown');
        return await convertDocument(filePath);
      } catch (e: any) {
        return `Conversion error: ${e.message}`;
      }
    }
  }
];
