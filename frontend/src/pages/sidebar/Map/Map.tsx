import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFunnelAnalysis } from '../../services/api';
import FlowChart from './components/FlowChart';
import SankeyDiagram from './components/SankeyDiagram';
import Filters from './components/Filters';
import VersionPicker from './components/VersionPicker';
import { FunnelAnalysis, FunnelStep } from './types';
import './Map.css';

const Map: React.FC = () => {
  const { funnelId } = useParams<{ funnelId: string }>();
  const [analysis, setAnalysis] = useState<FunnelAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('latest');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    segment: 'all'
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getFunnelAnalysis(funnelId!, selectedVersion, filters);
        setAnalysis(data);
        setError(null);
      } catch (err) {
        setError('Failed to load funnel analysis');
        console.error('Error fetching funnel analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    if (funnelId) {
      fetchAnalysis();
    }
  }, [funnelId, selectedVersion, filters]);

  if (loading) {
    return <div className="loading">Loading funnel analysis...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!analysis) {
    return <div className="no-data">No funnel analysis available</div>;
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <h1>{analysis.name}</h1>
        <VersionPicker
          versions={analysis.versions}
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
        />
      </div>
      
      <Filters
        filters={filters}
        onFilterChange={setFilters}
      />

      <div className="visualization-container">
        <div className="flow-chart">
          <h2>Flow Chart</h2>
          <FlowChart steps={analysis.steps} />
        </div>
        
        <div className="sankey-diagram">
          <h2>Sankey Diagram</h2>
          <SankeyDiagram steps={analysis.steps} />
        </div>
      </div>

      <div className="metrics-container">
        <h2>Key Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total Users</h3>
            <p>{analysis.totalUsers}</p>
          </div>
          <div className="metric-card">
            <h3>Conversion Rate</h3>
            <p>{analysis.conversionRate}%</p>
          </div>
          <div className="metric-card">
            <h3>Average Time</h3>
            <p>{analysis.averageTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map; 