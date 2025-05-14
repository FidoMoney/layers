const API_BASE_URL = 'http://localhost:8000';

export interface ServerStatus {
  message: string;
}

export const checkServerStatus = async (): Promise<ServerStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error('Server is not responding');
    }
    return await response.json();
  } catch (error) {
    throw new Error('Failed to connect to server');
  }
}; 