import type { User } from '../types/user';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface UserEvent {
    name: string;
    attributes: Record<string, any>;
    timestamp: number;
}

export const userService = {
    async searchUser(query: string): Promise<User | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error('Failed to search user');
            }
            return await response.json();
        } catch (error) {
            console.error('Error searching user:', error);
            throw error;
        }
    },

    async getUserEvents(userId: string): Promise<UserEvent[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/events?user_id=${encodeURIComponent(userId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user events');
            }
            const events = await response.json();
            return events.sort((a: UserEvent, b: UserEvent) => b.timestamp - a.timestamp); // Sort by timestamp descending
        } catch (error) {
            console.error('Error fetching user events:', error);
            throw error;
        }
    }
}; 