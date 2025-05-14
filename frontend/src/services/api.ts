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

export const getAppVersions = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/events/versions`);
    if (!response.ok) {
      throw new Error('Failed to fetch app versions');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching app versions:', error);
    return [];
  }
};

export interface UserFlow {
  user_id: string;
  flow: Array<{
    event_name: string;
    event_attributes: Record<string, any>;
    timestamp: number;
  }>;
}

export const getUserFlows = async (version: string): Promise<UserFlow[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/events/flows/${encodeURIComponent(version)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user flows');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user flows:', error);
    throw error;
  }
};

export const analyzeFlows = async (flows: UserFlow[], prompt: string): Promise<string> => {
  const response = await fetch('/api/analyze/flows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ flows, prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze flows');
  }

  const data = await response.json();
  return data.analysis;
}; 