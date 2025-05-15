import React, { useCallback, useRef } from 'react';
import * as d3 from 'd3';
import type { FlowStats, NodeData, DiagramLink } from './types';
import { getNodeColor, getVisibleLinks } from './utils';

interface FlowChartProps {
  svgRef: React.RefObject<SVGSVGElement>;
  stats: FlowStats;
  visibleEvents: Set<string>;
}

export const FlowChart: React.FC<FlowChartProps> = ({ svgRef, stats, visibleEvents }) => {
  // Store previous node positions
  const prevPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const renderFlowChart = useCallback(() => {
    if (!svgRef.current) return;

    // Filter nodes and edges based on visibility settings
    const filteredNodes = stats.nodes.filter(node => visibleEvents.has(node.id));
    const filteredEdges = getVisibleLinks(stats.edges, visibleEvents);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const innerWidth = width;
    const innerHeight = height;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create a group for all elements that will be transformed
    const g = svg.append('g');

    // Calculate node levels and groups
    const nodeLevels = new Map<string, number>();
    const nodeGroups = new Map<string, NodeData[]>();
    const centerNodes: NodeData[] = []; // For BE and OTHER events

    // First pass: calculate levels and group nodes
    filteredNodes.forEach(node => {
      if (node.type === 'ME' && node.flowGroup) {
        const group = nodeGroups.get(node.flowGroup) || [];
        group.push(node);
        nodeGroups.set(node.flowGroup, group);
      } else {
        // Put BE and OTHER events in the center
        centerNodes.push(node);
      }
      nodeLevels.set(node.id, node.level || 0);
    });

    // Position nodes by level and group]
    const groupNames = Array.from(nodeGroups.keys()).sort();
    const numGroups = groupNames.length + 1; // Number of selected flow groups + 1 for center

    // Dynamically calculate grid dimensions for a square-like grid
    const numRows = Math.ceil(Math.sqrt(numGroups));
    const numCols = Math.ceil(numGroups / numRows);

    // Calculate how many groups per row
    // First (numGroups % numRows) rows get numCols groups, rest get (numCols - 1)
    const groupsPerRow: number[] = [];
    let groupsLeft = numGroups;
    for (let i = 0; i < numRows; i++) {
      const groupsThisRow = i < (numGroups % numRows) ? numCols : numCols - 1;
      groupsPerRow.push(groupsThisRow);
      groupsLeft -= groupsThisRow;
    }

    console.log('Grid Layout Dimensions:');
    console.log(`Number of Groups: ${numGroups}`);
    console.log(`Rows: ${numRows}, Columns: ${numCols}`);
    console.log('Groups per row:', groupsPerRow);
    
    const sectionHeight = height / numRows;

    // Calculate the width for each row based on its number of columns
    const rowWidths = groupsPerRow.map(cols => width / cols);

    // Add grid lines and section boundaries
    const gridGroup = g.append('g').attr('class', 'grid');
    // Draw horizontal section boundaries (including top and bottom at 0 and height)
    for (let i = 0; i <= numRows; i++) {
      const y = i === numRows ? height : i * sectionHeight;
      gridGroup.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y)
        .attr('stroke', '#ddd')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    }
    // Draw vertical boundaries for each row (including left and right at 0 and width)
    for (let row = 0; row < numRows; row++) {
      const cols = groupsPerRow[row];
      const rowWidth = rowWidths[row];
      const y1 = row * sectionHeight;
      const y2 = y1 + sectionHeight;
      for (let col = 0; col <= cols; col++) {
        const x = col === cols ? width : col * rowWidth;
        gridGroup.append('line')
          .attr('x1', x)
          .attr('y1', y1)
          .attr('x2', x)
          .attr('y2', y2)
          .attr('stroke', '#ddd')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      }
    }

    // Distribute group names (including center) into the grid
    const allGroups = [...groupNames, 'Center'];
    let groupPointer = 0;
    for (let row = 0; row < numRows; row++) {
      const cols = groupsPerRow[row];
      const rowWidth = rowWidths[row];
      for (let col = 0; col < cols; col++) {
        if (groupPointer >= allGroups.length) break;
        const groupName = allGroups[groupPointer];
        let nodes: NodeData[] = [];
        if (groupName === 'Center') {
          nodes = centerNodes;
        } else {
          nodes = nodeGroups.get(groupName) || [];
        }
        // Sort nodes for consistent placement
        nodes.sort((a, b) => (a.id.localeCompare(b.id)));
        // Place nodes distributed horizontally within the cell
        const cellX = margin.left + col * rowWidth;
        const cellY = margin.top + row * sectionHeight;
        const cellWidth = rowWidth;
        const cellHeight = sectionHeight;
        const n = nodes.length;
        nodes.forEach((node, nIdx) => {
          // Distribute nodes evenly across the cell width
          node.x = cellX + ((n === 1) ? cellWidth / 2 : ((nIdx + 0.5) * cellWidth / n));
          // Vertically center in the cell
          node.y = cellY + cellHeight / 2;
          prevPositions.current.set(node.id, { x: node.x, y: node.y });
          // Log node position and id
          console.log(`Node '${node.id}' positioned at (${node.x}, ${node.y})`);
        });
        groupPointer++;
      }
    }

    // Add arrow marker definition
    g.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
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
      .attr('stroke-width', d => Math.sqrt(d.count))
      .attr('marker-end', 'url(#arrow)')
      .attr('opacity', 0.6)
      .attr('d', d => {
        // Find source and target node positions
        const source = filteredNodes.find(n => n.id === d.source)!;
        const target = filteredNodes.find(n => n.id === d.target)!;
        return `M${source.x},${source.y}L${target.x},${target.y}`;
      });

    // Create the nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, NodeData>('g')
      .data(filteredNodes)
      .join('g');

    // Position each node at its assigned coordinates
    node.attr('transform', d => `translate(${d.x},${d.y})`);

    // Add rectangles to nodes
    node.append('rect')
      .attr('width', 120)
      .attr('height', 60)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('x', -60)
      .attr('y', -30)
      .attr('fill', '#fff')
      .attr('stroke', (d: NodeData) => getNodeColor(d))
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text((d: NodeData) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // Add count to nodes
    node.append('text')
      .text((d: NodeData) => `Count: ${d.count}`)
      .attr('text-anchor', 'middle')
      .attr('dy', 15)
      .attr('font-size', '11px')
      .attr('fill', '#666');

    // Reset zoom to fit the graph
    // const bounds = g.node()?.getBBox();
    // if (bounds) {
    //   const scale = 1 / Math.max(
    //     bounds.width / width,
    //     bounds.height / height
    //   );
    //   const transform = d3.zoomIdentity
    //     .translate(
    //       width / 2 - (bounds.x + bounds.width / 2) * scale,
    //       height / 2 - (bounds.y + bounds.height / 2) * scale
    //     )
    //     .scale(scale);
    //   svg.call(zoom.transform, transform);
    // }
  }, [stats, visibleEvents]);

  React.useEffect(() => {
    renderFlowChart();
  }, [renderFlowChart]);

  return (
    <div className="diagram-wrapper">
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}; 