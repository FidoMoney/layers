import React from 'react';
import type { VisualizationType } from './types';

interface ChartPickerProps {
  visualizationType: VisualizationType;
  onVisualizationTypeChange: (type: VisualizationType) => void;
}

export const ChartPicker: React.FC<ChartPickerProps> = ({
  visualizationType,
  onVisualizationTypeChange,
}) => {
  return (
    <select
      value={visualizationType}
      onChange={(e) => onVisualizationTypeChange(e.target.value as VisualizationType)}
      className="visualization-select"
    >
      <option value="funnel">Funnel Chart</option>
      <option value="flow">Flow Chart</option>
      {/* <option value="sankey">Sankey Diagram</option> */}
    </select>
  );
}; 