import React, { useState, useEffect } from 'react';
import './Events.css';

interface Event {
  name: string;
}

const Events: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/events/names');
        const data = await response.json();
        const validEvents = Array.isArray(data) ? data.map(name => ({ name })) : [];
        setEvents(validEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const event = events.find(ev => ev.name === value);
    setSelectedEvent(event || null);
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Event Explorer</h1>
        <div className="events-search-container">
          <input
            type="text"
            className="events-select"
            list="events-list"
            placeholder="Search or select an event..."
            value={searchTerm}
            onChange={handleInputChange}
          />
          <datalist id="events-list">
            {events.map((event, index) => (
              <option key={index} value={event.name} />
            ))}
          </datalist>
        </div>
      </div>

      {selectedEvent && (
        <div className="event-details">
          <div className="event-card">
            <h3>{selectedEvent.name}</h3>
            {/* Add more event details here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Events; 