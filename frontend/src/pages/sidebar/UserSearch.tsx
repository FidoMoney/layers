import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { User } from '../../types/user';
import { userService } from '../../services/userService';
import './UserSearch.css';

interface UserEvent {
    name: string;
    attributes: Record<string, any>;
    timestamp: number;
}

const UserSearch: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [userEvents, setUserEvents] = useState<UserEvent[]>([]);

    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            handleSearch(query);
        }
    }, [searchParams]);

    const handleSearch = async (term: string) => {
        if (!term.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const user = await userService.searchUser(term.trim());
            setFoundUser(user);
            if (!user) {
                setError('User not found');
                setUserEvents([]);
            } else {
                // Fetch user events when user is found
                fetchUserEvents(user.user_id);
            }
        } catch (err) {
            setError('Failed to search user');
            console.error('Error searching user:', err);
            setUserEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserEvents = async (userId: string) => {
        setIsLoadingEvents(true);
        try {
            const events = await userService.getUserEvents(userId);
            setUserEvents(events);
        } catch (err) {
            console.error('Error fetching user events:', err);
            setUserEvents([]);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const formatEventTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const getEventType = (eventName: string): 'ME' | 'BE' | 'OTHER' => {
        if (eventName.startsWith('ME - ') || eventName.startsWith('ME ')) return 'ME';
        if (eventName.startsWith('BE_') || eventName.startsWith('BE ')) return 'BE';
        return 'OTHER';
    };

    const handleFindInsights = () => {
        if (!foundUser) return;
        console.log('Finding insights for user:', foundUser.user_id);
        // TODO: Implement insights logic
    };

    if (isLoading) {
        return (
            <div className="user-search-page">
                <div className="search-loading">Searching...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-search-page">
                <div className="search-error-message">{error}</div>
            </div>
        );
    }

    if (!searchParams.get('q')) {
        return (
            <div className="user-search-page">
                <div className="search-empty-state">
                    Enter a user ID or phone number in the search bar above to find a user
                </div>
            </div>
        );
    }

    return (
        <div className="user-search-page">
            {foundUser && (
                <div className="user-details-container">
                    <div className="user-card">
                        <div className="user-header-container">
                            <div className="user-header-name">
                                {foundUser.name}
                            </div>
                            <button 
                                className="user-action-button"
                                onClick={handleFindInsights}
                            >
                                Find insights
                            </button>
                        </div>
                        <div className="user-info">
                            <div className="info-row">
                                {foundUser.user_id}
                            </div>
                            <div className="info-row">
                                {foundUser.phone_number}
                            </div>
                            <div className="info-row">
                                {foundUser.country}
                            </div>
                            <div className="info-row">
                                {new Date(foundUser.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div className="activities-section">
                        <h3>Activities</h3>
                        {isLoadingEvents ? (
                            <div className="search-loading">Loading activities...</div>
                        ) : userEvents.length > 0 ? (
                            <div className="events-list">
                                {userEvents.map((event, index) => (
                                    <div key={index} className={`event-item ${getEventType(event.name).toLowerCase()}`}>
                                        <div className="event-header">
                                            <span className="event-time">{formatEventTimestamp(event.timestamp)}</span>
                                            <span className="event-separator">•</span>
                                            <span className="event-name">{event.name}</span>
                                        </div>
                                        {Object.keys(event.attributes).length > 0 && (
                                            <div className="event-attributes">
                                                {Object.entries(event.attributes).map(([key, value], attrIndex, array) => (
                                                    <React.Fragment key={key}>
                                                        <div className="attribute-row" title={key}>
                                                            <span className="attribute-value">
                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                            </span>
                                                        </div>
                                                        {attrIndex < array.length - 1 && <div className="attribute-separator" />}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No activities found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSearch; 