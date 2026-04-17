# Mimocode Project Mandates

This file serves as the foundational authority for all AI agent interactions within this project. Mimocode agents MUST adhere to these rules at all times.

## 🛡️ Security & Integrity
- **Credential Protection:** NEVER log, print, or commit secrets, API keys, or `.env` files.
- **Source Control:** ALWAYS use the Git integration features for versioning.
- **Persistence:** All business logic must reside in `src/core`, UI components in `src/ui` or `src/components`.

## 🏗️ Architectural Standards
- **Core-First:** Any new feature or reasoning logic MUST be implemented in the `src/core` layer to be available for both CLI and Web interfaces.
- **UI Decoupling:** The CLI and Web UI should only be responsible for display and delegating actions to the `MimocodeEngine`.
- **React Standards:** 
    - Use Vite for project initialization.
    - Always use Functional Components with Hooks.
    - Implement responsive design using Tailwind CSS.
    - Use Lucide-React for icons.
    - Split code into modular components (components/ui, components/pages).
    - Ensure production-ready code: error boundaries, loading states, and clean types.

## 🎨 Tech Stack & Style
- **Frontend:** React (TypeScript) with Tailwind CSS.
- **Editor:** Use Monaco Editor for all code editing components.
- **CLI:** Powered by `ink` and `commander`. Maintain a clean, professional aesthetic.
- **Styling:** Prefer modern, dark-themed glassmorphism (backdrop-blur, border-zinc-800).

## 🤖 Operational Guidelines
- **Autonomy:** Once "Full Session Trust" is granted, execute tasks to completion without unnecessary confirmation prompts.
- **Deep Implementation:** NEVER provide minimal examples. When asked for an application, build a complete, professional, and visually appealing prototype with rich aesthetics.
- **No Placeholders:** NEVER write "TODO" or incomplete implementations. Every code change must be 100% functional.
- **Hierarchy:** Mimocode looks for `MIMOCODE.md` files recursively. Respect rules defined in sub-directories if they exist.

## 📚 Specialized Guides
- **Git:** All commits must follow a clear, descriptive format. Use the temporary file method for multi-line commits.
- **Plugins:** New plugins must be registered in the `PLUGIN_STORE` in `server.ts` and provide a `plugin.json` manifest.
