# mimocode Documentation 📚

## 🛠️ MCP Tools (Model Context Protocol)

mimocode provides a set of tools that the AI can use to interact with your local system. These tools are available in the interactive chat session.

### Available Tools:
- `read_file`: Read content from a file.
- `write_file`: Create or update a file.
- `list_dir`: List files in a directory.
- `search_files`: Search for text patterns in files.
- `find_files`: Find files by name.
- `delete_file`: Remove a file.
- `create_directory`: Create a new folder.
- `copy_file`: Copy files.
- `fast_search`: High-performance search using ripgrep.
- `run_command`: Execute any shell command (git, npm, etc.).
- `create_project`: Bootstrap a new project (Java, Python, React, Node, Go, C++, PHP, Rust).
- `check_environment`: Verify installed software versions.

### How it works:
Mimocode is an **autonomous agent**. When you give it a task, it doesn't just explain how to do it; it uses these tools to execute the task. It can read your code, understand the context, and make precise modifications.

**Interactive Permissions:** For sensitive actions like writing to files or running shell commands, Mimocode will prompt you for permission. When editing files, it provides a **diff preview** so you can see exactly what will change before approving.

---

## 🤖 Expert Agents

Agents are specialized AI personas. You can trigger them using the `@` symbol.

### Examples:
- `@coder "Create a React component for a login form"`: Uses the expert coder to write the code.
- `@debugger "Why is my server crashing with EADDRINUSE?"`: Methodically finds the process and suggests a fix.
- `@architect "Design a microservices architecture for an e-commerce site"`: Provides a high-level design and folder structure.

---

## ✨ Skills

Skills are reusable capabilities or complex prompts.

### Examples:
- `/skill run create-app "A simple todo list in Python"`: Uses the `create-app` skill to bootstrap the project.
- `/skill run refactor "src/main.ts"`: Analyzes the file and suggests improvements.

---

## 🛠️ MCP (Model Context Protocol)

MCP tools allow the AI to perform real actions.

### Examples:
- `run_command`: `npm install`, `git commit`, `java -jar app.jar`.
- `write_file`: The AI writes the actual code to your disk, not just in the chat.
- `create_project`: `mimocode chat "Create a new React project called my-app"` -> triggers `create_project`.

---

## 🤝 Collaboration

Multiple agents can work together on a single task.

### Example:
- `/plan "Build a full-stack blog"`:
  1. **Architect** designs the DB and API.
  2. **Coder** implements the backend.
  3. **Coder** implements the frontend.
  4. **Debugger** verifies everything works.

---

## 🧠 RAG (Retrieval-Augmented Generation)

RAG allows Mimocode to "read" your entire project and answer questions based on it.

### Usage:
1. `/rag index .`: Index your current directory.
2. `/rag query "How does the authentication flow work?"`: Mimocode searches the index and explains the flow using your real code as context.

---

## 📝 Planning

For complex tasks, Mimocode can generate a multi-step plan before execution.

### Example:
- `/plan "Migrate this project from JavaScript to TypeScript"`:
  1. Create `tsconfig.json`.
  2. Rename `.js` files to `.ts`.
  3. Fix type errors using the `coder` agent.
  4. Verify build with `run_command`.

---

## 🛠️ Mimocode SDK

You can interact with the Mimocode server programmatically using the built-in SDK.

### Usage Example:
```typescript
import { MimocodeClient } from './src/sdk';

const client = new MimocodeClient('http://localhost:3000');

async function main() {
  // List agents
  const agents = await client.getAgents();
  console.log('Agents:', agents);

  // Execute a command
  const result = await client.executeCommand('mimocode chat "Hello"');
  console.log('Result:', result.stdout);
}

main();
```

---

## 🖥️ CLI Commands

- `mimocode open`: Opens the Web UI in your browser.
- `mimocode edit [file]`: Opens the Web Editor (optionally at a specific file).
- `mimocode chat`: Starts an interactive chat session.
- `mimocode skill list`: Lists available skills.

### Managing Skills:
- **List**: `mimocode skill list`
- **Create**: `mimocode skill create <name>`
- **Run**: `mimocode skill run <name> "input"`

---

## 🌐 Web Interface vs CLI

mimocode offers a synchronized experience:
- **Terminal**: A full XTerm.js terminal in the browser.
- **Rich Output**: Markdown and code rendering for AI responses.
- **Dashboard**: Visual management of agents, skills, and history.
- **Chat History**: A dedicated tab to view the full conversation history, including system prompts and tool results.
- **Files Tab**: A built-in file explorer and code editor with **auto-save** to browse and modify your project files directly from the web UI.
- **Sync**: Actions taken in the terminal (like creating an agent) are immediately reflected in the dashboard.

---

## 📦 SDK (Software Development Kit)

mimocode includes a lightweight SDK to integrate its capabilities into your own TypeScript/Node.js projects.

### Example Usage:
```typescript
import { MimocodeClient } from './src/sdk';

const client = new MimocodeClient('http://localhost:3000');

// List all expert agents
const agents = await client.getAgents();

// Run a complex task autonomously
await client.planAndExecute("Create a unit test for src/cli/llm.ts");
```

You can find the SDK implementation in `src/sdk.ts`.
