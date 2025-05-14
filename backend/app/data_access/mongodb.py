from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from .base import EventDataAccess
from app.models.event import Event
from app.core.config import settings

class MongoEventDataAccess(EventDataAccess):
    """MongoDB implementation of event data access."""
    
    def __init__(self):
        """Initialize MongoDB connection using settings."""
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.MONGODB_DATABASE]
        self.events_collection = self.db.events
    
    async def close(self):
        """Close the MongoDB connection."""
        self.client.close()
    
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
        query = {}
        
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = int(start_date.timestamp() * 1000)
            if end_date:
                query["timestamp"]["$lte"] = int(end_date.timestamp() * 1000)
        
        if name:
            query["name"] = name
        
        if user_id:
            query["user_id"] = user_id
        
        cursor = self.events_collection.find(query).skip(offset).limit(limit)
        events = await cursor.to_list(length=limit)
        return [Event(**event) for event in events]
    
    async def get_event_by_id(self, event_id: str) -> Optional[Event]:
        """Retrieve a specific event by its ID."""
        event = await self.events_collection.find_one({"_id": ObjectId(event_id)})
        return Event(**event) if event else None
    
    async def get_event_names(self) -> List[str]:
        """Retrieve all unique event names."""
        return await self.events_collection.distinct("name")
    
    async def get_event_count(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        name: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> int:
        """Get the count of events matching the given filters."""
        query = {}
        
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = int(start_date.timestamp() * 1000)
            if end_date:
                query["timestamp"]["$lte"] = int(end_date.timestamp() * 1000)
        
        if name:
            query["name"] = name
        
        if user_id:
            query["user_id"] = user_id
        
        return await self.events_collection.count_documents(query)
    
    async def create_event(self, event: Event) -> Event:
        """Create a new event."""
        event_dict = event.model_dump()
        result = await self.events_collection.insert_one(event_dict)
        event_dict["_id"] = result.inserted_id
        return Event(**event_dict) 