import axios from "axios";
import { Message, Provider, Session } from "../types";

const API_URL = ""; // Relative to the same host

export const chatApi = {
  async sendMessage(provider: Provider, model: string, messages: Message[], endpoint: string) {
    const response = await axios.post(`${API_URL}/api/chat`, {
      provider,
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      options: { endpoint },
    });
    return response.data;
  },
};

export const mcpApi = {
  async listFiles(dir = ".") {
    const response = await axios.get(`${API_URL}/api/mcp/files`, { params: { dir } });
    return response.data;
  },
  async readFile(filePath: string) {
    const response = await axios.post(`${API_URL}/api/mcp/read`, { filePath });
    return response.data;
  },
  async writeFile(filePath: string, content: string) {
    const response = await axios.post(`${API_URL}/api/mcp/write`, { filePath, content });
    return response.data;
  },
};

export const sessionApi = {
  async listSessions() {
    const response = await axios.get(`${API_URL}/api/sessions`);
    return response.data;
  },
  async saveSession(session: Session) {
    const response = await axios.post(`${API_URL}/api/sessions`, session);
    return response.data;
  },
};
