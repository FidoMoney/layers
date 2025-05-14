import * as d3 from 'd3';

export interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  count: number;
  level: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  type?: 'ME' | 'BE' | 'OTHER';
}

export interface EdgeData extends d3.SimulationLinkDatum<NodeData> {
  source: string | NodeData;
  target: string | NodeData;
  count: number;
}

export interface FlowStats {
  nodes: NodeData[];
  edges: EdgeData[];
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

export interface SankeyLink extends d3.SimulationLinkDatum<SankeyNode> {
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  width?: number;
}

export type VisualizationType = 'flow' | 'sankey'; 