import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface FunnelCreationResponse {
  result: string;
}

export interface FunnelAnalysisResponse {
  result: string;
}

export interface SegmentCreationResponse {
  result: string;
}

export const analyticsService = {
  async createFunnel(description: string, context?: Record<string, any>): Promise<FunnelCreationResponse> {
    const response = await axios.post(`${API_BASE_URL}/analytics/funnels/create`, {
      description,
      context
    });
    return response.data;
  },

  async analyzeFunnel(funnelData: Record<string, any>, context?: Record<string, any>): Promise<FunnelAnalysisResponse> {
    const response = await axios.post(`${API_BASE_URL}/analytics/funnels/analyze`, {
      funnel_data: funnelData,
      context
    });
    return response.data;
  },

  async createSegment(description: string, context?: Record<string, any>): Promise<SegmentCreationResponse> {
    const response = await axios.post(`${API_BASE_URL}/analytics/segments/create`, {
      description,
      context
    });
    return response.data;
  }
}; 