import * as d3 from 'd3';

export interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  count: number;
  level: number;
  type: 'ME' | 'BE' | 'OTHER';
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  flowGroup?: string;
}

export interface EdgeData {
  source: string | NodeData;
  target: string | NodeData;
  count: number;
}

export interface FlowEvent {
  event_name: string;
  timestamp: string;
}

export interface UserFlow {
  user_id: string;
  flow: FlowEvent[];
}

export interface FlowStats {
  nodes: NodeData[];
  edges: EdgeData[];
  userFlows: { events: string[] }[];
}

export interface SankeyNode extends d3.SimulationNodeDatum {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  id: string;
  label: string;
  type: 'ME' | 'BE' | 'OTHER';
  count: number;
  level: number;
}

export interface BaseLink {
  source: string | NodeData;
  target: string | NodeData;
  count: number;
}

export interface FlowLink extends BaseLink {
  width?: number;
  opacity?: number;
}

export interface SankeyLink extends BaseLink {
  value: number;
  width?: number;
}

export interface DiagramLink {
  source: string | NodeData;
  target: string | NodeData;
  count: number;
  value: number;
  width?: number;
  opacity?: number;
}

export type VisualizationType = 'flow' | 'sankey' | 'funnel'; 