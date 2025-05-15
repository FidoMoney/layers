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

const MAX_FLOWS_TO_ANALYZE = 25;  // Further reduced to minimize token count
const MAX_EVENTS_PER_FLOW = 10;   // Reduced events per flow
const MAX_EVENT_NAME_LENGTH = 30; // Truncate long event names

function truncateEventName(name: string): string {
  return name.length > MAX_EVENT_NAME_LENGTH 
    ? name.substring(0, MAX_EVENT_NAME_LENGTH) + '...'
    : name;
}

function sampleFlows(flows: UserFlow[]): UserFlow[] {
  if (flows.length <= MAX_FLOWS_TO_ANALYZE) {
    return flows;
  }

  console.log(`Sampling ${MAX_FLOWS_TO_ANALYZE} flows from ${flows.length} total flows`);
  
  // Sort flows by length to get a representative sample
  const sortedFlows = [...flows].sort((a, b) => b.flow.length - a.flow.length);
  
  // Take a stratified sample
  const topFlows = sortedFlows.slice(0, MAX_FLOWS_TO_ANALYZE / 2);  // Take more from top flows
  const remainingCount = MAX_FLOWS_TO_ANALYZE - topFlows.length;
  const otherFlows = sortedFlows
    .filter(flow => !topFlows.includes(flow))
    .sort(() => Math.random() - 0.5)
    .slice(0, remainingCount);
  
  // Combine and shuffle all samples
  const sampledFlows = [...topFlows, ...otherFlows]
    .sort(() => Math.random() - 0.5);
  
  return sampledFlows;
}

function prepareFlowForAnalysis(flow: UserFlow): any {
  // Include all events in the flow, up to the maximum limit
  const events = flow.flow
    .slice(0, MAX_EVENTS_PER_FLOW)
    .map(event => ({
      event_name: truncateEventName(event.event_name),
      timestamp: event.timestamp,
      event_attributes: event.event_attributes || {}
    }));

  if (events.length === 0) {
    return null;  // Skip empty flows
  }

  return {
    user_id: flow.user_id,
    flow: events
  };
}

export const analyzeFlows = async (flows: UserFlow[], prompt: string): Promise<string> => {
  try {
    // Sample flows before sending to reduce token count
    const sampledFlows = sampleFlows(flows);
    
    // Prepare flows for analysis with reduced data
    const preparedFlows = sampledFlows
      .map(prepareFlowForAnalysis)
      .filter(Boolean);  // Remove null flows
    
    if (preparedFlows.length === 0) {
      throw new Error('No events found in the selected flows. Please check your filters or try a different version.');
    }
    
    console.log('Sending analyze request with:', {
      totalFlows: flows.length,
      sampledFlows: preparedFlows.length,
      totalEvents: preparedFlows.reduce((sum, flow) => sum + flow.flow.length, 0),
      prompt,
      firstFlow: preparedFlows[0] ? {
        userId: preparedFlows[0].user_id,
        eventCount: preparedFlows[0].flow.length,
        firstEvent: preparedFlows[0].flow[0]
      } : null
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/flows/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flow_data: {
          flows: preparedFlows,
          prompt: `${prompt} (Note: Analysis is based on a sample of ${preparedFlows.length} flows)`
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error('The analysis request was too large. Please try with a smaller time range or fewer events.');
      }
      throw new Error(errorData.detail || 'Failed to analyze flows');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error in analyzeFlows:', error);
    throw error;
  }
}; 