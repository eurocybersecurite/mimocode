export type Provider = "ollama" | "lmstudio" | "llama-cpp" | "mlx";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  provider: Provider;
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface MCPFile {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface Config {
  provider: Provider;
  model: string;
  endpoint: string;
}
