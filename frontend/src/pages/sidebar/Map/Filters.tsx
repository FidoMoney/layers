import React from 'react';

interface FiltersProps {
  flowStats: any;
  visibleEvents: Set<string>;
  showMobileEvents: boolean;
  showBackendEvents: boolean;
  showOtherEvents: boolean;
  selectedMobileFlow: string;
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
  selectedMobileFlow,
  mobileFlows,
  allEvents,
  onEventVisibilityChange,
  onTypeFilterChange,
  onMobileFlowChange
}) => {
  if (!flowStats) return null;

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
          <select
            value={selectedMobileFlow}
            onChange={(e) => onMobileFlowChange(e.target.value)}
            className="flow-select"
          >
            <option value="all">All Mobile Flows</option>
            {mobileFlows.map(flow => (
              <option key={flow} value={flow}>
                {flow}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-section">
        <h3>Event Visibility</h3>
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
      </div>
    </div>
  );
}; 