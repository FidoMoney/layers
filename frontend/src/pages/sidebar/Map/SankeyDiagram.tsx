import React, { useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { FlowStats, NodeData, SankeyNode, SankeyLink } from './types';
import { getNodeColor, wrap } from './utils';

interface SankeyDiagramProps {
  svgRef: React.RefObject<SVGSVGElement>;
  stats: FlowStats;
  visibleEvents: Set<string>;
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ svgRef, stats, visibleEvents }) => {
  const renderSankey = useCallback(() => {
    if (!svgRef.current) return;

    // Filter nodes and edges based on visibility settings
    const filteredNodes = stats.nodes.filter(node => visibleEvents.has(node.id));
    const filteredEdges = stats.edges.filter(edge => {
      const source = edge.source as NodeData;
      const target = edge.target as NodeData;
      return visibleEvents.has(source.id) && visibleEvents.has(target.id);
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create a group for all elements that will be transformed
    const g = svg.append('g');

    // Create Sankey generator
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    // Process data for Sankey
    const sankeyData = {
      nodes: filteredNodes.map(node => ({
        id: node.id,
        label: node.label,
        type: node.type || 'OTHER',
        count: node.count,
        level: node.level
      })) as SankeyNode[],
      links: filteredEdges.map(edge => {
        const source = edge.source as NodeData;
        const target = edge.target as NodeData;
        const sourceNode = filteredNodes.find(n => n.id === source.id);
        const targetNode = filteredNodes.find(n => n.id === target.id);
        if (!sourceNode || !targetNode) {
          console.warn('Missing node for edge:', { source: source.id, target: target.id });
          return null;
        }
        return {
          source: sourceNode,
          target: targetNode,
          value: edge.count
        };
      }).filter((link): link is SankeyLink => link !== null)
    };

    // Generate Sankey layout
    const { nodes, links } = sankeyGenerator(sankeyData);

    // Create gradient definitions for links
    const defs = g.append('defs');
    links.forEach((link: SankeyLink) => {
      const gradientId = `gradient-${link.source.id}-${link.target.id}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('x2', '100%')
        .attr('y1', '0%')
        .attr('y2', '0%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', getNodeColor(link.source as unknown as NodeData))
        .attr('stop-opacity', 0.5);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', getNodeColor(link.target as unknown as NodeData))
        .attr('stop-opacity', 0.5);
    });

    // Draw links
    const linkGroup = g.append('g')
      .attr('class', 'links');

    const linkPaths = linkGroup
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', (d: SankeyLink) => Math.max(1, d.width || 0))
      .attr('stroke', (d: SankeyLink) => `url(#gradient-${d.source.id}-${d.target.id})`)
      .attr('fill', 'none')
      .attr('opacity', 0.5);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', (d: SankeyNode) => `translate(${d.x0 || 0},${d.y0 || 0})`);

    node.append('rect')
      .attr('height', (d: SankeyNode) => Math.max(0, (d.y1 || 0) - (d.y0 || 0)))
      .attr('width', (d: SankeyNode) => Math.max(0, (d.x1 || 0) - (d.x0 || 0)))
      .attr('fill', (d: SankeyNode) => getNodeColor(d as unknown as NodeData))
      .attr('stroke', '#000')
      .attr('stroke-width', 1);

    // Add labels
    node.append('text')
      .attr('x', (d: any) => ((d.x1 || 0) - (d.x0 || 0)) / 2)
      .attr('y', (d: any) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.label)
      .attr('font-size', '10px')
      .attr('fill', '#000')
      .call(wrap, 15);

    // Reset zoom to fit the graph
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.8);
    svg.call(zoom.transform, initialTransform);
  }, [stats, visibleEvents]);

  React.useEffect(() => {
    renderSankey();
  }, [renderSankey]);

  return null;
}; 