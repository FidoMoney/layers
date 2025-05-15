import React, { useState } from 'react';

interface FiltersProps {
  flowStats: any;
  visibleEvents: Set<string>;
  showMobileEvents: boolean;
  showBackendEvents: boolean;
  showOtherEvents: boolean;
  selectedMobileFlows: Set<string>;
  mobileFlows: string[];
  allEvents: string[];
  onEventVisibilityChange: (eventName: string) => void;
  onTypeFilterChange: (type: 'ME' | 'BE' | 'OTHER', checked: boolean) => void;
  onMobileFlowChange: (flow: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  flowStats,
  visibleEvents,
  showMobileEvents,
  showBackendEvents,
  showOtherEvents,
  selectedMobileFlows,
  mobileFlows,
  allEvents,
  onEventVisibilityChange,
  onTypeFilterChange,
  onMobileFlowChange
}) => {
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  if (!flowStats) return null;

  // Calculate the actual number of selected flows (excluding 'all')
  const selectedCount = selectedMobileFlows.has('all') 
    ? mobileFlows.length 
    : selectedMobileFlows.size;

  return (
    <div className="filters-panel">
      <div className="filter-section">
        <h3>Event Type Filters</h3>
        <label>
          <input
            type="checkbox"
            checked={showMobileEvents}
            onChange={(e) => onTypeFilterChange('ME', e.target.checked)}
          />
          Mobile Events (ME)
        </label>
        <label>
          <input
            type="checkbox"
            checked={showBackendEvents}
            onChange={(e) => onTypeFilterChange('BE', e.target.checked)}
          />
          Backend Events (BE)
        </label>
        <label>
          <input
            type="checkbox"
            checked={showOtherEvents}
            onChange={(e) => onTypeFilterChange('OTHER', e.target.checked)}
          />
          Other Events
        </label>
      </div>

      {showMobileEvents && mobileFlows.length > 0 && (
        <div className="filter-section">
          <h3>Mobile Flow Filter</h3>
          <div className="flow-buttons">
            <button 
              className="flow-button"
              onClick={() => onMobileFlowChange('all')}
            >
              Select All
            </button>
            <button 
              className="flow-button"
              onClick={() => onMobileFlowChange('none')}
            >
              Deselect All
            </button>
          </div>
          <div className="flow-dropdown">
            <div className="flow-dropdown-header">
              <span>Selected Flows ({selectedCount})</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            <div className="flow-dropdown-content">
              <label className="flow-option">
                <input
                  type="checkbox"
                  checked={selectedMobileFlows.has('all')}
                  onChange={() => onMobileFlowChange('all')}
                />
                <span>All Flows</span>
              </label>
              {mobileFlows.map(flow => (
                <label key={flow} className="flow-option">
                  <input
                    type="checkbox"
                    checked={selectedMobileFlows.has(flow)}
                    onChange={() => onMobileFlowChange(flow)}
                  />
                  <span>{flow}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="filter-section">
        <h3>Event Visibility</h3>
        <div className="events-dropdown">
          <button 
            className="events-dropdown-button"
            onClick={() => setIsEventsOpen(!isEventsOpen)}
          >
            {isEventsOpen ? 'Hide Events' : 'Show Events'}
          </button>
          {isEventsOpen && (
            <div className="events-list">
              {allEvents.map(eventName => (
                <label key={eventName} className="event-checkbox">
                  <input
                    type="checkbox"
                    checked={visibleEvents.has(eventName)}
                    onChange={() => onEventVisibilityChange(eventName)}
                  />
                  {eventName}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 