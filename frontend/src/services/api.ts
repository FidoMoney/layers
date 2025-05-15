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

export const getUserFlows = async (version: string, conversionTimeMinutes: number): Promise<UserFlow[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/events/flows/${encodeURIComponent(version)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user flows');
    }
    const flows = await response.json();
    
    // Sort events within each flow by timestamp
    const sortedFlows = flows.map((flow: UserFlow) => ({
      ...flow,
      flow: flow.flow.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }));

    // Process flows to end either at App Launched or after conversion time
    return sortedFlows.map((flow: UserFlow) => {
      const events = flow.flow;
      const processedEvents = [];
      let lastEventTime = new Date(events[0].timestamp).getTime();
      
      for (let i = 0; i < events.length; i++) {
        const currentEvent = events[i];
        const currentEventTime = new Date(currentEvent.timestamp).getTime();
        
        // Transform event name if it matches the pattern "ME - XX"
        if (currentEvent.event_name.startsWith('ME - ') && currentEvent.event_name.split(' - ').length === 2) {
          const eventDescription = currentEvent.event_attributes?.event_description || '';
          const eventIntent = currentEvent.event_attributes?.event_intent || '';
          currentEvent.event_name = `${currentEvent.event_name} - ${eventDescription} - ${eventIntent}`;
        }
        
        // Add the current event
        processedEvents.push(currentEvent);
        
        // Check if this is the last event
        if (i === events.length - 1) {
          break;
        }
        
        // Check if next event is App Launched
        const nextEvent = events[i + 1];
        if (nextEvent.event_name === 'App Launched') {
          break;
        }
        
        // Check if time gap exceeds conversion time
        const timeGap = currentEventTime - lastEventTime;
        const conversionTimeMs = conversionTimeMinutes * 60 * 1000;
        if (timeGap > conversionTimeMs) {
          break;
        }
        
        lastEventTime = currentEventTime;
      }
      
      return {
        ...flow,
        flow: processedEvents
      };
    });
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