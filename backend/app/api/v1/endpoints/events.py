from fastapi import APIRouter, Depends
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