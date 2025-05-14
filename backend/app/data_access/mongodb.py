from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from .base import EventDataAccess
from app.models.event import Event
from app.core.config import settings

# Event type constants
APP_LAUNCHED_EVENT = "App Launched"
APP_VERSION_ATTRIBUTE = "CT App Version"

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

    async def get_app_versions(self) -> List[str]:
        """Retrieve all unique app versions from App Launched events."""
        pipeline = [
            {"$match": {"name": APP_LAUNCHED_EVENT}},
            {"$group": {"_id": f"$attributes.{APP_VERSION_ATTRIBUTE}"}},
            {"$project": {"_id": 0, "version": "$_id"}},
            {"$sort": {"version": -1}}  # Sort versions in descending order
        ]
        
        versions = await self.events_collection.aggregate(pipeline).to_list(None)
        return [doc["version"] for doc in versions if doc["version"] is not None]

    async def get_user_flows_by_version(self, version: str) -> List[Dict[str, Any]]:
        """
        Get all user flows for a specific app version.
        A flow is a sequence of events from one App Launched to the next.
        Duplicate events (same event name and timestamp) are removed.
        
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
        # First, get all events for users who used this version
        pipeline = [
            # Match App Launched events with the specific version
            {
                "$match": {
                    "name": APP_LAUNCHED_EVENT,
                    f"attributes.{APP_VERSION_ATTRIBUTE}": version
                }
            },
            # Get unique user IDs
            {"$group": {"_id": "$user_id"}},
            # Get all events for these users
            {
                "$lookup": {
                    "from": "events",
                    "let": {"userId": "$_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$user_id", "$$userId"]}}},
                        {"$sort": {"timestamp": 1}}  # Sort by timestamp ascending
                    ],
                    "as": "user_events"
                }
            }
        ]
        
        user_events = await self.events_collection.aggregate(pipeline).to_list(None)
        
        flows = []
        for user_doc in user_events:
            user_id = user_doc["_id"]
            events = user_doc["user_events"]
            
            # Split events into flows based on App Launched events
            current_flow = []
            seen_events = set()  # Track seen events to avoid duplicates
            
            for event in events:
                # Create a unique key for the event using name and timestamp
                event_key = f"{event['name']}_{event['timestamp']}"
                
                if event["name"] == APP_LAUNCHED_EVENT and current_flow:
                    # End of a flow, save it and start a new one
                    flows.append({
                        "user_id": user_id,
                        "flow": current_flow
                    })
                    current_flow = []
                    seen_events.clear()  # Reset seen events for new flow
                
                # Only add event if we haven't seen it before
                if event_key not in seen_events:
                    seen_events.add(event_key)
                    current_flow.append({
                        "event_name": event["name"],
                        "event_attributes": event.get("attributes", {}),
                        "timestamp": event["timestamp"]
                    })
            
            # Add the last flow if it exists
            if current_flow:
                flows.append({
                    "user_id": user_id,
                    "flow": current_flow
                })
        
        return flows 