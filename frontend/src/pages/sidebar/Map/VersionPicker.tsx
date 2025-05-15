import React from 'react';

interface VersionPickerProps {
  selectedVersion: string;
  versions: string[];
  isLoading: boolean;
  isLoadingFlows: boolean;
  error: string | null;
  onVersionChange: (version: string) => void;
  onCreateMap: () => void;
  onAnalyze: () => void;
  hasFlowStats: boolean;
  analyzeButtonText?: string;
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

export const VersionPicker: React.FC<VersionPickerProps> = ({
  selectedVersion,
  versions,
  isLoading,
  isLoadingFlows,
  error,
  onVersionChange,
  onCreateMap,
  onAnalyze,
  hasFlowStats,
  analyzeButtonText = 'Analyze',
  selectedTime,
  onTimeChange
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
          value={selectedTime}
          onChange={(e) => onTimeChange(e.target.value)}
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
      <div className="action-buttons">
        <button 
          onClick={onCreateMap}
          className="create-map-button"
          disabled={isLoading || !selectedVersion || !selectedTime || isLoadingFlows}
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