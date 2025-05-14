from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime
from app.data_access.base import EventDataAccess
from app.dependencies import get_event_dao

router = APIRouter()

@router.get("/names")
async def get_event_names(event_dao: EventDataAccess = Depends(get_event_dao)):
    """Get all unique event names."""
    return await event_dao.get_event_names() 

@router.get("/versions")
async def get_app_versions(event_dao: EventDataAccess = Depends(get_event_dao)):
    """Get all unique app versions from App Launched events."""
    return await event_dao.get_app_versions()

@router.get("/flows/{version}")
async def get_user_flows(version: str, event_dao: EventDataAccess = Depends(get_event_dao)):
    """Get all user flows for a specific app version."""
    return await event_dao.get_user_flows_by_version(version)

@router.get("/")
async def get_events(
    user_id: Optional[str] = Query(None, description="Filter events by user ID"),
    name: Optional[str] = Query(None, description="Filter events by name"),
    start_date: Optional[datetime] = Query(None, description="Filter events after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events before this date"),
    limit: int = Query(100, description="Maximum number of events to return"),
    offset: int = Query(0, description="Number of events to skip"),
    event_dao: EventDataAccess = Depends(get_event_dao)
):
    """Get events with optional filters."""
    return await event_dao.get_events(
        start_date=start_date,
        end_date=end_date,
        name=name,
        user_id=user_id,
        limit=limit,
        offset=offset
    ) 