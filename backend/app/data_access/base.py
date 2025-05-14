from abc import ABC, abstractmethod
from typing import List, Optional
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