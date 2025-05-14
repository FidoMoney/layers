from fastapi import APIRouter, Depends
from app.data_access.base import EventDataAccess
from app.dependencies import get_event_dao

router = APIRouter()

@router.get("/names")
async def get_event_names(event_dao: EventDataAccess = Depends(get_event_dao)):
    """Get all unique event names."""
    return await event_dao.get_event_names() 