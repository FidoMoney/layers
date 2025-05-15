import React from 'react';
import type { VisualizationType } from './types';

interface VersionPickerProps {
  selectedVersion: string;
  versions: string[];
  visualizationType: VisualizationType;
  isLoading: boolean;
  isLoadingFlows: boolean;
  error: string | null;
  onVersionChange: (version: string) => void;
  onVisualizationTypeChange: (type: VisualizationType) => void;
  onCreateMap: () => void;
  onAnalyze: () => void;
  hasFlowStats: boolean;
  analyzeButtonText?: string;
}

export const VersionPicker: React.FC<VersionPickerProps> = ({
  selectedVersion,
  versions,
  visualizationType,
  isLoading,
  isLoadingFlows,
  error,
  onVersionChange,
  onVisualizationTypeChange,
  onCreateMap,
  onAnalyze,
  hasFlowStats,
  analyzeButtonText = 'Analyze'
}) => {
  return (
    <div className="version-picker">
      <div className="version-controls">
        <select 
          value={selectedVersion}
          onChange={(e) => onVersionChange(e.target.value)}
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
          value={visualizationType}
          onChange={(e) => onVisualizationTypeChange(e.target.value as VisualizationType)}
          className="visualization-select"
        >
          <option value="flow">Flow Chart</option>
          <option value="sankey">Sankey Diagram</option>
        </select>
        <button 
          onClick={onCreateMap}
          className="create-map-button"
          disabled={isLoading || !selectedVersion || isLoadingFlows}
        >
          {isLoadingFlows ? 'Loading...' : 'Create Map'}
        </button>
        {hasFlowStats && (
          <button 
            onClick={onAnalyze}
            className="analyze-button"
          >
            {analyzeButtonText}
          </button>
        )}
      </div>
      {isLoading && <span className="loading">Loading versions...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}; 