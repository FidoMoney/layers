import React, { useCallback } from 'react';
import * as d3 from 'd3';
import type { FlowStats, NodeData } from './types';
import { getNodeColor } from './utils';

interface FlowChartProps {
  svgRef: React.RefObject<SVGSVGElement>;
  stats: FlowStats;
  visibleEvents: Set<string>;
}

export const FlowChart: React.FC<FlowChartProps> = ({ svgRef, stats, visibleEvents }) => {
  const renderFlowChart = useCallback(() => {
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

    // Group nodes by level
    const nodesByLevel = new Map<number, NodeData[]>();
    filteredNodes.forEach(node => {
      if (!nodesByLevel.has(node.level)) {
        nodesByLevel.set(node.level, []);
      }
      nodesByLevel.get(node.level)?.push(node);
    });

    // Calculate layout dimensions
    const maxLevel = Math.max(...filteredNodes.map(n => n.level));
    const levelWidth = Math.max((width - margin.left - margin.right) / (maxLevel + 1), 200);
    const nodeHeight = 60;
    const nodeSpacing = 30;

    // Position nodes in a flow chart layout
    nodesByLevel.forEach((nodes, level) => {
      const totalHeight = nodes.length * (nodeHeight + nodeSpacing) - nodeSpacing;
      const startY = (height - totalHeight) / 2;
      
      nodes.forEach((node, index) => {
        node.x = margin.left + level * levelWidth;
        node.y = startY + index * (nodeHeight + nodeSpacing);
        node.fx = node.x;
        node.fy = node.y;
      });
    });

    // Create the force simulation with minimal forces
    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredEdges)
        .id((d: any) => d.id)
        .distance(levelWidth / 2))
      .force('x', d3.forceX<NodeData>((d) => d.fx || 0).strength(1))
      .force('y', d3.forceY<NodeData>((d) => d.fy || 0).strength(1))
      .force('collision', d3.forceCollide().radius(70))
      .alphaDecay(0.1);

    // Add arrow marker definition
    g.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Create the links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(filteredEdges)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.count) * 2)
      .attr('marker-end', 'url(#arrow)');

    // Create the nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('class', 'node-group')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add rectangles to nodes
    node.append('rect')
      .attr('width', 120)
      .attr('height', nodeHeight)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('x', -60)
      .attr('y', -nodeHeight/2)
      .attr('fill', '#fff')
      .attr('stroke', d => getNodeColor(d))
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // Add count to nodes
    node.append('text')
      .text(d => `Count: ${d.count}`)
      .attr('text-anchor', 'middle')
      .attr('dy', 15)
      .attr('font-size', '11px')
      .attr('fill', '#666');

    // Update positions on each tick
    simulation.on('tick', () => {
      link.attr('d', d => {
        const source = d.source as NodeData;
        const target = d.target as NodeData;
        const midX = (source.x! + target.x!) / 2;
        return `M${source.x},${source.y} C${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    // Reset zoom to fit the graph
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.8);
    svg.call(zoom.transform, initialTransform);
  }, [stats, visibleEvents]);

  React.useEffect(() => {
    renderFlowChart();
  }, [renderFlowChart]);

  return null;
}; 