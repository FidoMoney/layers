import React, { useState, useEffect, useRef } from 'react';
import { getAppVersions, getUserFlows, analyzeFlows } from '../../../services/api';
import type { UserFlow } from '../../../services/api';
import type { FlowStats, VisualizationType } from './types';
import { getEventType, getMobileFlowName } from './utils';
import { FlowChart } from './FlowChart';
import { SankeyDiagram } from './SankeyDiagram';
import { Filters } from './Filters';
import { VersionPicker } from './VersionPicker';
import PromptModal from '../../../components/modals/PromptModal';
import './Map.css';

const FlowMap: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [versions, setVersions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('flow');
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null!);
  
  // State for filters
  const [visibleEvents, setVisibleEvents] = useState<Set<string>>(new Set());
  const [showMobileEvents, setShowMobileEvents] = useState(true);
  const [showBackendEvents, setShowBackendEvents] = useState(true);
  const [showOtherEvents, setShowOtherEvents] = useState(true);
  const [allEvents, setAllEvents] = useState<string[]>([]);
  const [flowStats, setFlowStats] = useState<FlowStats | null>(null);
  const [selectedMobileFlow, setSelectedMobileFlow] = useState<string>('all');
  const [mobileFlows, setMobileFlows] = useState<string[]>([]);

  // Update visible events when type filters change
  useEffect(() => {
    if (!flowStats) return;

    const newVisibleEvents = new Set<string>();
    flowStats.nodes.forEach(node => {
      if (
        (node.type === 'ME' && showMobileEvents) ||
        (node.type === 'BE' && showBackendEvents) ||
        (node.type === 'OTHER' && showOtherEvents)
      ) {
        newVisibleEvents.add(node.id);
      }
    });
    setVisibleEvents(newVisibleEvents);
  }, [showMobileEvents, showBackendEvents, showOtherEvents, flowStats]);

  // Update mobile flows when nodes change
  useEffect(() => {
    if (!flowStats) return;
    
    const flows = new Set<string>();
    flowStats.nodes.forEach(node => {
      if (node.type === 'ME') {
        const flowName = getMobileFlowName(node.id);
        if (flowName) flows.add(flowName);
      }
    });
    setMobileFlows(Array.from(flows).sort());
  }, [flowStats]);

  // Update visible events when mobile flow filter changes
  useEffect(() => {
    if (!flowStats) return;

    if (selectedMobileFlow !== 'all') {
      setShowBackendEvents(false);
    } else {
      setShowBackendEvents(true);
    }

    setVisibleEvents(prev => {
      const newSet = new Set(prev);
      
      if (selectedMobileFlow === 'all') {
        flowStats.nodes.forEach(node => {
          if (
            (node.type === 'ME' && showMobileEvents) ||
            (node.type === 'BE' && showBackendEvents) ||
            (node.type === 'OTHER' && showOtherEvents)
          ) {
            newSet.add(node.id);
          } else {
            newSet.delete(node.id);
          }
        });
      } else {
        flowStats.nodes.forEach(node => {
          if (node.type === 'ME') {
            const flowName = getMobileFlowName(node.id);
            if (flowName === selectedMobileFlow) {
              newSet.add(node.id);
            } else {
              newSet.delete(node.id);
            }
          } else if (node.type === 'BE') {
            newSet.delete(node.id);
          } else if (node.type === 'OTHER' && showOtherEvents) {
            newSet.add(node.id);
          }
        });
      }
      return newSet;
    });
  }, [selectedMobileFlow, flowStats, showMobileEvents, showBackendEvents, showOtherEvents]);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const appVersions = await getAppVersions();
        const sortedVersions = [...appVersions].sort((a, b) => {
          const aParts = a.split('.').map(Number);
          const bParts = b.split('.').map(Number);
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            if (aPart !== bPart) {
              return bPart - aPart;
            }
          }
          return 0;
        });
        setVersions(sortedVersions);
      } catch (err) {
        setError('Failed to load app versions');
        console.error('Error loading app versions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, []);

  const processFlows = (flows: UserFlow[]): FlowStats => {
    const nodeMap = new Map<string, any>();
    const edgeMap = new Map<string, any>();
    const uniqueEvents = new Set<string>();
    
    flows.forEach(flow => {
      const events = flow.flow;
      events.forEach((event, index) => {
        const nodeId = event.event_name;
        uniqueEvents.add(nodeId);
        const existingNode = nodeMap.get(nodeId);
        if (existingNode) {
          existingNode.count++;
        } else {
          const type = getEventType(event.event_name);
          nodeMap.set(nodeId, { 
            id: nodeId, 
            label: event.event_name, 
            count: 1,
            level: index,
            type
          });
        }

        if (index < events.length - 1) {
          const nextEvent = events[index + 1];
          const edgeId = `${nodeId}-${nextEvent.event_name}`;
          const existingEdge = edgeMap.get(edgeId);
          if (existingEdge) {
            existingEdge.count++;
          } else {
            edgeMap.set(edgeId, {
              source: nodeId,
              target: nextEvent.event_name,
              count: 1
            });
          }
        }
      });
    });

    setAllEvents(Array.from(uniqueEvents).sort());

    const initialVisibleEvents = new Set<string>();
    nodeMap.forEach((node) => {
      if (
        (node.type === 'ME' && showMobileEvents) ||
        (node.type === 'BE' && showBackendEvents) ||
        (node.type === 'OTHER' && showOtherEvents)
      ) {
        initialVisibleEvents.add(node.id);
      }
    });
    setVisibleEvents(initialVisibleEvents);

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values())
    };
  };

  const handleCreateMap = async () => {
    if (!selectedVersion) {
      setError('Please select a version first');
      return;
    }

    try {
      setIsLoadingFlows(true);
      setError(null);
      const flows = await getUserFlows(selectedVersion);
      const stats = processFlows(flows);
      setFlowStats(stats);
    } catch (err) {
      setError('Failed to load user flows');
      console.error('Error loading user flows:', err);
    } finally {
      setIsLoadingFlows(false);
    }
  };

  const handleEventVisibilityChange = (eventName: string) => {
    setVisibleEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventName)) {
        newSet.delete(eventName);
      } else {
        newSet.add(eventName);
      }
      return newSet;
    });
  };

  const handleTypeFilterChange = (type: 'ME' | 'BE' | 'OTHER', checked: boolean) => {
    switch (type) {
      case 'ME':
        setShowMobileEvents(checked);
        break;
      case 'BE':
        setShowBackendEvents(checked);
        break;
      case 'OTHER':
        setShowOtherEvents(checked);
        break;
    }
  };

  const handleAnalyze = async (prompt: string) => {
    if (!selectedVersion) return;

    try {
      setIsAnalyzing(true);
      const flows = await getUserFlows(selectedVersion);
      
      // Filter flows to only include visible events
      const filteredFlows = flows.map(flow => ({
        user_id: flow.user_id,
        flow: flow.flow.filter(event => visibleEvents.has(event.event_name))
      })).filter(flow => flow.flow.length > 0);

      const analysis = await analyzeFlows(filteredFlows, prompt);
      console.log('Analysis:', analysis);
    } catch (err) {
      console.error('Error analyzing flows:', err);
    } finally {
      setIsAnalyzing(false);
      setIsAnalyzeModalOpen(false);
    }
  };

  return (
    <div className="map-container">
      <VersionPicker
        selectedVersion={selectedVersion}
        versions={versions}
        visualizationType={visualizationType}
        isLoading={isLoading}
        isLoadingFlows={isLoadingFlows}
        error={error}
        onVersionChange={setSelectedVersion}
        onVisualizationTypeChange={setVisualizationType}
        onCreateMap={handleCreateMap}
        onAnalyze={() => setIsAnalyzeModalOpen(true)}
        hasFlowStats={!!flowStats}
      />

      {flowStats && (
        <Filters
          flowStats={flowStats}
          visibleEvents={visibleEvents}
          showMobileEvents={showMobileEvents}
          showBackendEvents={showBackendEvents}
          showOtherEvents={showOtherEvents}
          selectedMobileFlow={selectedMobileFlow}
          mobileFlows={mobileFlows}
          allEvents={allEvents}
          onEventVisibilityChange={handleEventVisibilityChange}
          onTypeFilterChange={handleTypeFilterChange}
          onMobileFlowChange={setSelectedMobileFlow}
        />
      )}

      <svg ref={svgRef} className="flow-graph" />
      {flowStats && visualizationType === 'flow' && (
        <FlowChart
          svgRef={svgRef}
          stats={flowStats}
          visibleEvents={visibleEvents}
        />
      )}
      {flowStats && visualizationType === 'sankey' && (
        <SankeyDiagram
          svgRef={svgRef}
          stats={flowStats}
          visibleEvents={visibleEvents}
        />
      )}

      <PromptModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        onSubmit={handleAnalyze}
        title="Analyze Flow"
        isLoading={isAnalyzing}
      />
    </div>
  );
};

export default FlowMap; 