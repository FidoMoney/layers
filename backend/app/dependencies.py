from typing import AsyncGenerator
from fastapi import Depends
from app.data_access.mongodb import MongoEventDataAccess
from app.data_access.base import EventDataAccess
from app.services.openai_service import OpenAIService

async def get_event_dao() -> AsyncGenerator[EventDataAccess, None]:
    """Dependency for getting the event data access object."""
    dao = MongoEventDataAccess()
    try:
        yield dao
    finally:
        await dao.close()

def get_openai_service() -> OpenAIService:
    return OpenAIService() 