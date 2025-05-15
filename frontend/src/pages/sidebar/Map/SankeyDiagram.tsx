import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { FlowStats, NodeData, DiagramLink } from './types';
import { processLinks } from './utils';

interface SankeyNode {
  id: string;
  name: string;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface SankeyLink {
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  width?: number;
}

interface SankeyDiagramProps {
  svgRef: React.RefObject<SVGSVGElement>;
  stats: FlowStats;
  visibleEvents: Set<string>;
}

const MAX_SELECTED_EVENTS = 10;

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ svgRef, stats, visibleEvents }) => {
  const svg = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const g = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !stats) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Filter nodes to only include visible events
    const visibleNodes = stats.nodes.filter(node => visibleEvents.has(node.id));
    
    // Process links using common utility
    const links = processLinks(stats.edges, visibleEvents);

    // Create Sankey data structure
    const sankeyData = {
      nodes: visibleNodes,
      links
    };

    // Set up dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Create Sankey generator
    const sankeyGenerator = sankey<NodeData, DiagramLink>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    // Generate Sankey data
    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator(sankeyData);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add links
    svg.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width || 0))
      .attr('stroke', '#000')
      .attr('fill', 'none')
      .attr('opacity', d => d.opacity || 0.5);

    // Add nodes
    const node = svg.append('g')
      .selectAll('rect')
      .data(sankeyNodes)
      .join('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('height', d => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', d => (d.x1 || 0) - (d.x0 || 0))
      .attr('fill', '#69b3a2')
      .attr('stroke', '#000');

    // Add labels
    svg.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .join('text')
      .attr('x', d => (d.x0 || 0) < width / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
      .attr('y', d => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.x0 || 0) < width / 2 ? 'start' : 'end')
      .text(d => d.label)
      .attr('font-size', '10px');

  }, [svgRef, stats, visibleEvents]);

  return (
    <div className="diagram-wrapper">
      <svg
        ref={svgRef}
        style={{
          width: '100%'
        }}
      />
    </div>
  );
}; 