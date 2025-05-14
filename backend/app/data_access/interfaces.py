from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.event import Event

class EventDataAccess(ABC):
    """Abstract base class for event data access implementations."""
    
    @abstractmethod
    async def get_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Event]:
        """Retrieve events based on various filters."""
        pass
    
    @abstractmethod
    async def get_event_by_id(self, event_id: str) -> Optional[Event]:
        """Retrieve a specific event by its ID."""
        pass
    
    @abstractmethod
    async def get_event_names(self) -> List[str]:
        """Retrieve all unique event names."""
        pass
    
    @abstractmethod
    async def get_event_count(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        name: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> int:
        """Get the count of events matching the given filters."""
        pass
    
    @abstractmethod
    async def create_event(self, event: Event) -> Event:
        """Create a new event."""
        pass

    @abstractmethod
    async def get_app_versions(self) -> List[str]:
        """Retrieve all unique app versions from App Launched events."""
        pass

    @abstractmethod
    async def get_user_flows_by_version(self, version: str) -> List[Dict[str, Any]]:
        """
        Get all user flows for a specific app version.
        A flow is a sequence of events from one App Launched to the next.
        
        Args:
            version: The app version to filter by
            
        Returns:
            List of flows, where each flow contains:
            {
                "user_id": str,
                "flow": [
                    {
                        "event_name": str,
                        "event_attributes": Dict[str, Any],
                        "timestamp": int
                    },
                    ...
                ]
            }
        """
        pass 