import * as d3 from 'd3';
import type { NodeData, EdgeData, DiagramLink } from './types';

export const getEventType = (eventName: string): 'ME' | 'BE' | 'OTHER' => {
  if (eventName.startsWith('ME - ') || eventName.startsWith('ME ')) return 'ME';
  if (eventName.startsWith('BE_') || eventName.startsWith('BE ')) return 'BE';
  return 'OTHER';
};

export const getMobileFlowName = (eventName: string): string => {
  if (!eventName.startsWith('ME - ')) return '';
  const withoutPrefix = eventName.slice(5);
  const [flowName] = withoutPrefix.split('-');
  return flowName.trim() || '';
};

export const getNodeColor = (node: NodeData): string => {
  switch (node.type) {
    case 'ME': return '#e0528c';
    case 'BE': return '#007bff';
    default: return '#b0b0b0';
  }
};

export const wrap = (text: d3.Selection<SVGTextElement, any, SVGGElement, unknown>, width: number) => {
  text.each(function() {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word;
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.1;
    const y = text.attr('y');
    const dy = parseFloat(text.attr('dy') || '0');
    let tspan = text.text(null).append('tspan').attr('x', width / 2).attr('y', y).attr('dy', dy + 'em');
    
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(' '));
      const node = tspan.node();
      if (node && node.getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan').attr('x', width / 2).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
      }
    }
  });
}; 

export function processLinks(edges: EdgeData[], visibleEvents: Set<string>): DiagramLink[] {
  // Create a map of all event pairs and their counts
  const eventPairs = new Map<string, number>();
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    if (visibleEvents.has(sourceId) && visibleEvents.has(targetId)) {
      const pairKey = `${sourceId}-${targetId}`;
      eventPairs.set(pairKey, (eventPairs.get(pairKey) || 0) + edge.count);
    }
  });

  // Convert to array of links
  return Array.from(eventPairs.entries()).map(([pair, count]) => {
    const [sourceId, targetId] = pair.split('-');
    return {
      source: { id: sourceId } as NodeData,
      target: { id: targetId } as NodeData,
      count,
      value: count, // For Sankey diagram
      width: Math.sqrt(count) * 2, // For flow chart
      opacity: 0.6
    };
  });
}

export function getVisibleLinks(edges: EdgeData[], visibleEvents: Set<string>): DiagramLink[] {
  
  const filteredEdges = edges.filter(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    const isVisible = visibleEvents.has(sourceId) && visibleEvents.has(targetId);
    return isVisible;
  });

  const links = filteredEdges.map(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    return {
      source: sourceId,
      target: targetId,
      count: edge.count,
      value: edge.count,
      width: Math.sqrt(edge.count) * 2,
      opacity: 0.6
    };
  });

  console.log('Output links:', links);
  return links;
} 