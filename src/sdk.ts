import axios from 'axios';

/**
 * mimocode SDK
 * A simple client to interact with the mimocode local server.
 */
export class MimocodeClient {
  private endpoint: string;
  private apiKey?: string;

  constructor(endpoint = 'http://localhost:3000', apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  /**
   * Execute a mimocode CLI command
   */
  async exec(command: string) {
    const response = await axios.post(`${this.endpoint}/api/exec`, {
      command,
      apiKey: this.apiKey
    });
    return response.data;
  }

  /**
   * Get all agents
   */
  async getAgents() {
    const response = await axios.get(`${this.endpoint}/api/agents/details`);
    return response.data;
  }

  /**
   * Create or update an agent
   */
  async saveAgent(agent: { name: string; description: string; systemInstruction: string; tags?: string[] }) {
    const response = await axios.post(`${this.endpoint}/api/agents`, agent);
    return response.data;
  }

  /**
   * Run a task through the planner
   */
  async planAndExecute(task: string) {
    const planRes = await axios.post(`${this.endpoint}/api/plan/generate`, { task });
    const { steps } = planRes.data;
    const execRes = await axios.post(`${this.endpoint}/api/plan/execute`, { steps });
    return execRes.data;
  }

  /**
   * Read a local file
   */
  async readFile(filePath: string) {
    const response = await axios.get(`${this.endpoint}/api/files/read`, { params: { filePath } });
    return response.data.content;
  }

  /**
   * Write a local file
   */
  async writeFile(filePath: string, content: string) {
    const response = await axios.post(`${this.endpoint}/api/files/write`, { filePath, content });
    return response.data;
  }
}

// Example usage:
// const client = new MimocodeClient();
// const agents = await client.getAgents();
// console.log(agents);
