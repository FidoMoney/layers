import * as d3 from 'd3';
import type { NodeData } from './types';

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
    case 'ME': return '#28a745';
    case 'BE': return '#007bff';
    default: return '#6c757d';
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