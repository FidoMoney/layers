import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { User } from '../../types/user';
import { userService } from '../../services/userService';
import AnalysisSidebar from '../../components/sidebar/AnalysisSidebar';
import { analyticsService } from '../../services/analyticsService';
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
    const [isAnalyzeSidebarOpen, setIsAnalyzeSidebarOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

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

    const handleFindInsights = async () => {
        if (!foundUser || !userEvents.length) return;
        
        setIsAnalyzeSidebarOpen(true);
        setAnalysisError(null);
    };

    const handleAnalyze = async (prompt: string): Promise<string> => {
        if (!foundUser || !userEvents.length) {
            throw new Error('No user or events data available');
        }

        try {
            setIsAnalyzing(true);
            setAnalysisError(null);

            // Format the user's events into the structure expected by UserBehaviorPrompt
            const userData = {
                user_id: foundUser.user_id,
                events: userEvents.map(event => ({
                    event_name: event.name,
                    timestamp: event.timestamp,
                    attributes: event.attributes
                }))
            };

            // Format the events into a readable string for the prompt
            const formattedEvents = userEvents.map(event => {
                const timestamp = new Date(event.timestamp).toISOString();
                const attributes = Object.entries(event.attributes)
                    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                    .join(', ');
                return `${timestamp} - ${event.name}${attributes ? ` (${attributes})` : ''}`;
            }).join('\n');

            // Generate a prompt focused on individual user behavior analysis
            const analysisPrompt = `You are an expert in analyzing user behavior in mobile apps.

I will provide you with the complete event history for user ${foundUser.user_id}, and I need you to perform a detailed behavioral analysis.

User Information:
- User ID: ${foundUser.user_id}
- Name: ${foundUser.name}
- Country: ${foundUser.country}
- Created: ${new Date(foundUser.timestamp).toLocaleString()}

Here's the user's event data:

${formattedEvents}

Please analyze this data and provide a comprehensive behavioral analysis following these steps:

1. Session Identification:
   - Identify all user sessions (30-minute inactivity threshold)
   - For each session, provide:
     * Start and end timestamps
     * Total duration
     * All flows interacted with
     * Success/failure status of each flow

2. Flow Analysis per Session:
   For each session, analyze:
   - Which flows were started
   - Which flows were completed
   - Which flows were abandoned
   - Time spent in each flow
   - Any retry attempts within the session

3. Cross-Session Behavior:
   - Time between sessions
   - Flow retry patterns across sessions
   - Failed flow completion attempts
   - Most common session patterns

4. User Behavior Summary:
   - Session frequency and duration patterns
   - Most engaged with flows
   - Most problematic flows
   - Overall success/failure patterns
   - Time-of-day patterns
   - Flow completion rates

Please format your response exactly as follows:

👤 User ${foundUser.user_id} Behavior Analysis

📅 Session Analysis:
[For each session]
- Session [N]:
  * Start: [timestamp]
  * End: [timestamp]
  * Duration: [X] minutes
  * Flows: [list of flows]
  * Status: [completed/abandoned flows]

🔄 Flow Analysis:
[For each unique flow]
- Flow: [name]
  * Started: [N] times
  * Completed: [N] times
  * Failed: [N] times
  * Average time: [X] minutes
  * Retry rate: [X]%

⏱️ Time Patterns:
- Average session duration: [X] minutes
- Average time between sessions: [X] hours
- Most active time: [time range]
- Most successful time: [time range]

📊 Overall Behavior:
- Total sessions: [N]
- Most used flow: [name] ([N] times)
- Most problematic flow: [name] ([X]% failure rate)
- Overall completion rate: [X]%

💡 Key Insights:
[3-5 key behavioral patterns or insights]

${prompt}`;

            const analysis = await analyticsService.analyzeFlows([{
                user_id: foundUser.user_id,
                flow: userEvents.map(event => ({
                    event_name: event.name,
                    event_attributes: event.attributes,
                    timestamp: event.timestamp
                }))
            }], analysisPrompt);
            return analysis || 'No insights available';
        } catch (err) {
            console.error('Error analyzing user events:', err);
            throw new Error('Failed to analyze user events. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
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
        <div className={`user-search-page ${isAnalyzeSidebarOpen ? 'has-sidebar' : ''}`}>
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
            <AnalysisSidebar
                isOpen={isAnalyzeSidebarOpen}
                onClose={() => setIsAnalyzeSidebarOpen(false)}
                onSubmit={handleAnalyze}
                isLoading={isAnalyzing}
                error={analysisError}
                initialPrompt="Analyze this user's behavior and provide detailed insights about their journey, focusing on their activity patterns, key events, and overall engagement."
                userName={foundUser?.name}
            />
        </div>
    );
};

export default UserSearch; 