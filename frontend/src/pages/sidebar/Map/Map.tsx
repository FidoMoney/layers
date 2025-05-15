import React, { useState, useEffect, useRef } from 'react';
import { getAppVersions, getUserFlows, analyzeFlows } from '../../../services/api';
import type { UserFlow } from '../../../services/api';
import type { FlowStats, EdgeData, NodeData, VisualizationType } from './types';
import { getEventType, getMobileFlowName } from './utils';
import { FlowChart } from './FlowChart';
import { SankeyDiagram } from './SankeyDiagram';
import { FunnelChart } from './FunnelChart';
import { Filters } from './Filters';
import { VersionPicker } from './VersionPicker';
import PromptModal from '../../../components/modals/PromptModal';
import { ChartPicker } from './ChartPicker';
import './Map.css';

enum AnalysisType {
  ALL_VISIBLE = 'ALL_VISIBLE',
  FUNNEL = 'FUNNEL'
}

interface FunnelData {
  sequence: { id: string; label: string; count: number }[];
  totalUsers: number;
}

interface AnalysisData {
  type: AnalysisType;
  funnelData?: FunnelData;
}

const FlowMap: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [versions, setVersions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('funnel');
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('30');
  const svgRef = useRef<SVGSVGElement>(null!);
  
  // State for filters
  const [visibleEvents, setVisibleEvents] = useState<Set<string>>(new Set());
  const [showMobileEvents, setShowMobileEvents] = useState(true);
  const [showBackendEvents, setShowBackendEvents] = useState(true);
  const [showOtherEvents, setShowOtherEvents] = useState(true);
  const [allEvents, setAllEvents] = useState<string[]>([]);
  const [flowStats, setFlowStats] = useState<FlowStats | null>(null);
  const [selectedMobileFlows, setSelectedMobileFlows] = useState<Set<string>>(new Set(['all']));
  const [mobileFlows, setMobileFlows] = useState<string[]>([]);
  // Store all event pairs and their counts
  const [allEventPairs, setAllEventPairs] = useState<Map<string, number>>(new Map());
  const [analyzeData, setAnalyzeData] = useState<AnalysisData | null>(null);

  // Update visible events when filters change
  useEffect(() => {
    if (!flowStats) return;

    setIsRendering(true);
    const newVisibleEvents = new Set<string>();
    
    if (selectedMobileFlows.has('all')) {
      // When 'all' is selected, show events based on type filters
      flowStats.nodes.forEach(node => {
        if (
          (node.type === 'ME' && showMobileEvents) ||
          (node.type === 'BE' && showBackendEvents) ||
          (node.type === 'OTHER' && showOtherEvents)
        ) {
          newVisibleEvents.add(node.id);
        }
      });
    } else {
      // When specific mobile flows are selected:
      // 1. Add only mobile events from the selected flows
      flowStats.nodes.forEach(node => {
        if (node.type === 'ME') {
          const flowName = getMobileFlowName(node.id);
          if (flowName && selectedMobileFlows.has(flowName)) {
            newVisibleEvents.add(node.id);
          }
        }
      });

      // 2. Add other events if their filter is enabled
      if (showOtherEvents) {
        flowStats.nodes.forEach(node => {
          if (node.type === 'OTHER') {
            newVisibleEvents.add(node.id);
          }
        });
      }
    }

    // When specific mobile flows are selected, automatically disable backend events
    if (!selectedMobileFlows.has('all') && showBackendEvents) {
      setShowBackendEvents(false);
    }

    setVisibleEvents(newVisibleEvents);
    // Add a small delay to ensure the loading state is visible
    setTimeout(() => setIsRendering(false), 100);
  }, [selectedMobileFlows, flowStats, showMobileEvents, showBackendEvents, showOtherEvents]);

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
    console.log('Raw flows data:', flows);
    
    const nodeMap = new Map<string, any>();
    const edgeMap = new Map<string, number>();
    const uniqueEvents = new Set<string>();
    
    flows.forEach(flow => {
      const events = flow.flow;
      
      // First pass: create a map of event sequences and dependencies
      const eventSequences = new Map<string, Set<number>>();
      const dependencies = new Map<string, Set<string>>();
      
      events.forEach((event, index) => {
        const nodeId = event.event_name;
        if (!eventSequences.has(nodeId)) {
          eventSequences.set(nodeId, new Set());
          dependencies.set(nodeId, new Set());
        }
        eventSequences.get(nodeId)!.add(index);
        
        // Add dependency: current event depends on previous event
        if (index > 0) {
          const prevEvent = events[index - 1].event_name;
          dependencies.get(nodeId)!.add(prevEvent);
        }
      });

      // Second pass: assign nodes
      events.forEach((event, index) => {
        const nodeId = event.event_name;
        uniqueEvents.add(nodeId);
        const existingNode = nodeMap.get(nodeId);
        if (existingNode) {
          existingNode.count++;
        } else {
          const type = getEventType(event.event_name);
          let flowGroup: string | undefined = undefined;
          if (type === 'ME') {
            flowGroup = getMobileFlowName(event.event_name) || undefined;
          }
          nodeMap.set(nodeId, { 
            id: nodeId, 
            label: event.event_name, 
            count: 1,
            level: 0,
            type,
            flowGroup,
            sequences: eventSequences.get(nodeId) || new Set(),
            dependencies: dependencies.get(nodeId) || new Set()
          });
        }

        // Create links between consecutive events
        if (index < events.length - 1) {
          const nextEvent = events[index + 1];
          const edgeId = `${nodeId}->${nextEvent.event_name}`;
          edgeMap.set(edgeId, (edgeMap.get(edgeId) || 0) + 1);
        }
      });
    });

    // Calculate levels using topological sort
    const nodes = Array.from(nodeMap.values());
    const levelMap = new Map<string, number>();
    const visited = new Set<string>();
    const temp = new Set<string>();

    function visit(nodeId: string, level: number) {
      if (temp.has(nodeId)) {
        // Circular dependency detected, break it
        return level;
      }
      if (visited.has(nodeId)) {
        return levelMap.get(nodeId) || level;
      }
      
      temp.add(nodeId);
      const node = nodeMap.get(nodeId)!;
      let maxLevel = level;
      
      // Visit all dependencies
      node.dependencies?.forEach((depId: string) => {
        const depLevel = visit(depId, level + 1);
        maxLevel = Math.max(maxLevel, depLevel);
      });
      
      temp.delete(nodeId);
      visited.add(nodeId);
      levelMap.set(nodeId, maxLevel);
      return maxLevel;
    }

    // Start topological sort from nodes with no dependencies
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        visit(node.id, 0);
      }
    });

    // Assign final levels
    nodes.forEach(node => {
      node.level = levelMap.get(node.id) || 0;
    });

    // Store all event pairs for later filtering
    setAllEventPairs(edgeMap);

    const processedStats = {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.entries()).map(([id, count]) => {
        const [source, target] = id.split('->');
        return { 
          source,
          target,
          count 
        };
      }),
      userFlows: flows.map(flow => ({
        events: flow.flow.map(event => event.event_name)
      }))
    };
    
    console.log('Processed FlowStats:', processedStats);
    console.log('Node Map:', Array.from(nodeMap.entries()));
    console.log('Edge Map:', Array.from(edgeMap.entries()));
    console.log('Unique events:', Array.from(uniqueEvents));

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
    console.log('Initial visible events:', Array.from(initialVisibleEvents));
    setVisibleEvents(initialVisibleEvents);

    return processedStats;
  };

  const handleCreateMap = async () => {
    if (!selectedVersion) {
      setError('Please select a version first');
      return;
    }

    try {
      setIsLoadingFlows(true);
      setError(null);
      console.log('Fetching flows for version:', selectedVersion);
      const flows = await getUserFlows(selectedVersion, parseInt(selectedTime));
      console.log('Received flows:', flows);
      const stats = processFlows(flows);
      setFlowStats(stats);
    } catch (err) {
      console.error('Error loading user flows:', err);
      setError('Failed to load user flows');
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
      const flows = await getUserFlows(selectedVersion, parseInt(selectedTime));
      
      if (analyzeData?.type === AnalysisType.FUNNEL && analyzeData.funnelData) {
        // Filter flows to only include users who followed this exact funnel sequence
        const funnelSequence = analyzeData.funnelData.sequence.map(e => e.id);
        const filteredFlows = flows.map(flow => ({
          user_id: flow.user_id,
          flow: flow.flow.filter(event => funnelSequence.includes(event.event_name))
        })).filter(flow => {
          // Check if the user's flow matches the funnel sequence
          const userEventIds = flow.flow.map(e => e.event_name);
          return funnelSequence.every((eventId, index) => userEventIds[index] === eventId);
        });

        const analysis = await analyzeFlows(filteredFlows, `Analyze this funnel sequence: ${analyzeData.funnelData.sequence.map(e => e.label).join(' -> ')}`);
        console.log('Funnel Analysis:', analysis);
      } else {
        // For regular analyze button, filter flows to only include visible events
        const filteredFlows = flows.map(flow => ({
          user_id: flow.user_id,
          flow: flow.flow.filter(event => visibleEvents.has(event.event_name))
        })).filter(flow => flow.flow.length > 0);

        const analysis = await analyzeFlows(filteredFlows, prompt);
        console.log('Analysis:', analysis);
      }
    } catch (err) {
      console.error('Error analyzing flows:', err);
    } finally {
      setIsAnalyzing(false);
      setIsAnalyzeModalOpen(false);
      setAnalyzeData(null); // Always clear the analysis data after analysis
    }
  };

  const handleMobileFlowChange = (flow: string) => {
    setSelectedMobileFlows(prev => {
      const newSet = new Set(prev);
      
      if (flow === 'none') {
        // Deselect all flows
        newSet.clear();
      } else if (flow === 'all') {
        // Select all flows
        newSet.clear();
        newSet.add('all');
      } else {
        // Handle individual flow selection
        newSet.delete('all'); // Remove 'all' when selecting individual flows
        if (newSet.has(flow)) {
          newSet.delete(flow);
        } else {
          newSet.add(flow);
        }
        
        // If all flows are selected individually, switch to 'all' state
        if (newSet.size === mobileFlows.length) {
          newSet.clear();
          newSet.add('all');
        }
      }
      
      return newSet;
    });
  };

  const handleViewAlerts = () => {
    if (!selectedVersion) return;
    console.log('Viewing alerts for version:', selectedVersion);
    // TODO: Implement alerts view logic
  };

  return (
    <div className="map-container">
      {(isLoadingFlows || isRendering) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '10px',
            }}
          />
          <div style={{ color: '#666', fontSize: '14px' }}>
            {isLoadingFlows ? 'Loading flows...' : 'Updating visualization...'}
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div className="controls-container">
        <div className="version-controls">
          <select 
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="version-select"
            disabled={isLoading}
          >
            <option value="">Select App Version</option>
            {versions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="time-select"
            disabled={isLoading}
          >
            <option value="5">5 mins</option>
            <option value="10">10 mins</option>
            <option value="15">15 mins</option>
            <option value="30">30 mins</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="1440">1 day</option>
            <option value="2880">2 days</option>
          </select>
        </div>
        <div className="chart-picker-container">
          <ChartPicker
            visualizationType={visualizationType}
            onVisualizationTypeChange={setVisualizationType}
          />
        </div>
        <div className="action-buttons">
          <button 
            onClick={handleCreateMap}
            className="create-map-button"
            disabled={isLoading || !selectedVersion || !selectedTime || isLoadingFlows}
          >
            {isLoadingFlows ? 'Loading...' : 'Create Map'}
          </button>
          {flowStats && (
            <>
              <button 
                onClick={() => setIsAnalyzeModalOpen(true)}
                className="analyze-button"
              >
                Analyze
              </button>
              <button 
                onClick={handleViewAlerts}
                className="analyze-button"
              >
                <span className="alert-dot"></span>
                View alerts
              </button>
            </>
          )}
        </div>
      </div>

      {flowStats && (
        <>
          <div className="filters-horizontal">
            <Filters
              flowStats={flowStats}
              visibleEvents={visibleEvents}
              showMobileEvents={showMobileEvents}
              showBackendEvents={showBackendEvents}
              showOtherEvents={showOtherEvents}
              selectedMobileFlows={selectedMobileFlows}
              mobileFlows={mobileFlows}
              allEvents={allEvents}
              onEventVisibilityChange={handleEventVisibilityChange}
              onTypeFilterChange={handleTypeFilterChange}
              onMobileFlowChange={handleMobileFlowChange}
            />
          </div>
          {visualizationType === 'flow' && (
            <FlowChart
              svgRef={svgRef}
              stats={flowStats}
              visibleEvents={visibleEvents}
            />
          )}
          {visualizationType === 'sankey' && (
            <SankeyDiagram
              svgRef={svgRef}
              stats={flowStats}
              visibleEvents={visibleEvents}
            />
          )}
          {visualizationType === 'funnel' && (
            <FunnelChart
              svgRef={svgRef}
              stats={flowStats}
              visibleEvents={visibleEvents}
              onAnalyze={(funnelData) => {
                setAnalyzeData({
                  type: AnalysisType.FUNNEL,
                  funnelData
                });
                setIsAnalyzeModalOpen(true);
              }}
            />
          )}
        </>
      )}

      <PromptModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setIsAnalyzeModalOpen(false);
          setAnalyzeData(null); // Clear analysis data when modal is closed
        }}
        onSubmit={handleAnalyze}
        title={analyzeData?.type === AnalysisType.FUNNEL ? "Analyze Funnel" : "Analyze Flow"}
        isLoading={isAnalyzing}
      />
    </div>
  );
};

export default FlowMap; 