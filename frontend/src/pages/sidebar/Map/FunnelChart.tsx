import React, { useCallback, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { FlowStats, NodeData, DiagramLink } from './types';
import { getNodeColor, getVisibleLinks } from './utils';

// Minimum number of events required to display a funnel
const MIN_FUNNEL_LENGTH = 3;

interface FunnelChartProps {
  svgRef: React.RefObject<SVGSVGElement>;
  stats: FlowStats;
  visibleEvents: Set<string>;
}

interface WeightedSequence {
  sequence: { id: string; label: string; count: number }[];
  totalUsers: number;
}

interface UserFlow {
  events: string[];
}

const processUserFlows = (stats: FlowStats, visibleEvents: Set<string>): WeightedSequence[] => {
  // Array to store all funnels
  const funnels: WeightedSequence[] = [];
  
  // Process each user flow
  stats.userFlows.forEach((flow: UserFlow) => {
    // Filter the flow to only include visible events
    const visibleFlow = flow.events.filter((eventId: string) => visibleEvents.has(eventId));
    
    // For each node in the flow
    for (let i = 0; i < visibleFlow.length; i++) {
      const currentSequence = visibleFlow.slice(0, i + 1);
      
      // Look for an existing funnel that matches this sequence
      const existingFunnel = funnels.find(funnel => 
        funnel.sequence.length === currentSequence.length &&
        funnel.sequence.every((node, index) => node.id === currentSequence[index])
      );

      if (existingFunnel) {
        // If we found a matching funnel, increment the count for all nodes in the sequence
        existingFunnel.sequence.forEach(node => node.count++);
        existingFunnel.totalUsers++;
      } else {
        // If no matching funnel found, create a new one
        // First, look for a funnel that matches the previous sequence
        const previousSequence = visibleFlow.slice(0, i);
        const previousFunnel = funnels.find(funnel => 
          funnel.sequence.length === previousSequence.length &&
          funnel.sequence.every((node, index) => node.id === previousSequence[index])
        );

        // Create new funnel
        const newFunnel: WeightedSequence = {
          sequence: currentSequence.map((id, index) => {
            const node = stats.nodes.find(n => n.id === id);
            if (!node) {
              console.error(`Node not found: ${id}`);
              return {
                id,
                label: id,
                count: 1
              };
            }

            // If we have a previous funnel and this is a shared node, use its weight
            let count = 1;
            if (previousFunnel && index < previousFunnel.sequence.length) {
              count = previousFunnel.sequence[index].count + 1;
            }

            return {
              id: node.id,
              label: node.label,
              count
            };
          }),
          totalUsers: 1
        };
        funnels.push(newFunnel);
      }
    }
  });

  // Filter out funnels that are shorter than MIN_FUNNEL_LENGTH
  const filteredFunnels = funnels.filter(funnel => funnel.sequence.length >= MIN_FUNNEL_LENGTH);

  // Sort funnels lexicographically by their weights
  return filteredFunnels.sort((a, b) => {
    // First compare by sequence length
    if (a.sequence.length !== b.sequence.length) {
      return b.sequence.length - a.sequence.length;
    }
    
    // Then compare by weights at each position
    for (let i = 0; i < a.sequence.length; i++) {
      if (a.sequence[i].count !== b.sequence[i].count) {
        return b.sequence[i].count - a.sequence[i].count;
      }
    }
    
    // If all weights are equal, compare by labels
    for (let i = 0; i < a.sequence.length; i++) {
      const labelCompare = a.sequence[i].label.localeCompare(b.sequence[i].label);
      if (labelCompare !== 0) {
        return labelCompare;
      }
    }
    
    return 0;
  });
};

export const FunnelChart: React.FC<FunnelChartProps> = ({ svgRef, stats, visibleEvents }) => {
  const renderFunnelChart = useCallback(() => {
    if (!svgRef.current) return;

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const width = svgRef.current.clientWidth || 800;
      const margin = { top: 40, right: 80, bottom: 60, left: 60 };
      const innerWidth = width - margin.left - margin.right;

      // Process the flows into weighted sequences
      const weightedSequences = processUserFlows(stats, visibleEvents);
      if (weightedSequences.length === 0) return;

      // Calculate dimensions for each funnel
      const funnelHeight = 200;
      const funnelSpacing = 80;
      const containerPadding = 40;

      // Calculate total height needed
      const totalHeight = (funnelHeight + funnelSpacing) * weightedSequences.length + margin.top + margin.bottom;

      // Set SVG height to match the total content height
      svg.attr('width', width)
         .attr('height', totalHeight);

      // Create main group
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create a funnel for each sequence
      weightedSequences.forEach((sequence, index) => {
        const yOffset = index * (funnelHeight + funnelSpacing);

        // Create container for this funnel
        const container = g.append('g')
          .attr('class', 'flow-container')
          .attr('transform', `translate(0, ${yOffset})`);

        // Add container background
        container.append('rect')
          .attr('x', -containerPadding)
          .attr('y', -containerPadding)
          .attr('width', innerWidth + containerPadding * 2)
          .attr('height', funnelHeight + containerPadding * 2)
          .attr('fill', '#f8f9fa')
          .attr('stroke', '#dee2e6')
          .attr('stroke-width', 1)
          .attr('rx', 8);

        // Create scale for the bars
        const barAreaOffset = 20; // extra space between y-axis and bars
        const x = d3.scaleBand()
          .domain(sequence.sequence.map((d, i) => `${d.id}-${i}`)) // Use unique keys
          .range([barAreaOffset, innerWidth])
          .padding(0.1);

        // Calculate percentiles for each event in the sequence
        const firstEventCount = sequence.sequence[0]?.count || 1;
        const percentiles = sequence.sequence.map((event, i) =>
          i === 0 ? 100 : Math.round((event.count / firstEventCount) * 100)
        );

        const y = d3.scaleLinear()
          .domain([0, 100])
          .range([funnelHeight - 40, 0]);

        // Create bars for each event in the sequence
        sequence.sequence.forEach((event, i) => {
          const barKey = `${event.id}-${i}`;
          const barX = x(barKey) || 0;
          const percentile = percentiles[i];
          const barHeight = funnelHeight - 40 - y(percentile);
          
          // Determine event type for coloring
          let eventType: 'ME' | 'BE' | 'OTHER' = 'ME';
          const node = stats.nodes.find(n => n.id === event.id);
          if (node) {
            eventType = node.type;
          } else if (event.label.toLowerCase().includes('other')) {
            eventType = 'OTHER';
          }

          // Create the bar
          container.append('rect')
            .attr('x', barX)
            .attr('y', y(percentile))
            .attr('width', x.bandwidth())
            .attr('height', barHeight)
            .attr('fill', getNodeColor({ id: event.id, type: eventType, label: event.label, count: event.count, level: 0 }))
            // No border
            .attr('rx', 2);

          // Add event name (horizontal, split at every '-' after the first for 'ME -', and at every '_' after the first for 'BE_')
          function splitLabel(label: string): string[] {
            if (label.startsWith('ME -')) {
              // Do not break at the first dash, only after
              const firstDash = label.indexOf('-');
              if (firstDash === -1) return [label];
              const firstPart = label.slice(0, firstDash + 1).trim();
              const rest = label.slice(firstDash + 1).trim();
              if (!rest.includes('-')) return [label];
              const restParts = rest.split('-').map(s => s.trim()).filter(Boolean);
              return [firstPart + ' ' + restParts.shift(), ...restParts];
            }
            if (label.startsWith('BE_')) {
              // Do not break at the first underscore, only after
              const firstUnderscore = label.indexOf('_');
              if (firstUnderscore === -1) return [label];
              const firstPart = label.slice(0, firstUnderscore + 1).trim();
              const rest = label.slice(firstUnderscore + 1).trim();
              if (!rest.includes('_')) return [label];
              const restParts = rest.split('_').map(s => s.trim()).filter(Boolean);
              return [firstPart + restParts.shift(), ...restParts];
            }
            return [label];
          }

          const labelLines = splitLabel(event.label);
          const labelY = funnelHeight - 8;
          labelLines.forEach((line, lineIdx) => {
            container.append('text')
              .attr('x', barX + x.bandwidth() / 2)
              .attr('y', labelY + lineIdx * 12)
              .attr('text-anchor', 'middle')
              .attr('font-size', '10px')
              .attr('fill', '#333')
              .text(line);
          });

          // Add percentile
          container.append('text')
            .attr('x', barX + x.bandwidth() / 2)
            .attr('y', y(percentile) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', '#666')
            .text(`${percentile}%`);
        });

        const yAxis = d3.axisLeft(y);
        container.append('g')
          .attr('transform', `translate(20, 0)`)
          .call(yAxis);
      });
    } catch (error) {
      console.error('Error rendering funnel chart:', error);
    }
  }, [stats, visibleEvents]);

  React.useEffect(() => {
    renderFunnelChart();
  }, [renderFunnelChart]);

  return (
    <div className="diagram-wrapper">
      <svg 
        ref={svgRef} 
        style={{ 
          width: '100%',
          minHeight: '100%'
        }} 
      />
    </div>
  );
}; 