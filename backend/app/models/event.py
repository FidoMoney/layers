from typing import Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class Event(BaseModel):
    """Event model representing an analytics event."""
    name: str = Field(..., description="Name of the event")
    user_id: str = Field(..., description="ID of the user who triggered the event")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Additional event attributes")
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    
    @classmethod
    def from_datetime(cls, dt: datetime, **kwargs) -> 'Event':
        """Create an event from a datetime object, converting to milliseconds timestamp."""
        timestamp_ms = int(dt.timestamp() * 1000)
        return cls(timestamp=timestamp_ms, **kwargs)
    
    def to_datetime(self) -> datetime:
        """Convert the millisecond timestamp to a datetime object."""
        return datetime.fromtimestamp(self.timestamp / 1000) 