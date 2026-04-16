import axios from 'axios';

export async function reportEvent(type: string, data: any) {
  try {
    // We assume the server is running on localhost:3000
    // This is safe in this environment
    await axios.post('http://localhost:3000/api/internal/event', { type, data });
  } catch (e) {
    // Silently fail if server is not reachable
  }
}
