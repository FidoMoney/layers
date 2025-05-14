from typing import AsyncGenerator
from fastapi import Depends
from app.data_access.mongodb import MongoEventDataAccess, MongoUserDataAccess
from app.data_access.interfaces import EventDataAccess, UserDataAccess
from app.services.openai_service import OpenAIService

async def get_event_dao() -> AsyncGenerator[EventDataAccess, None]:
    """Dependency for getting the event data access object."""
    dao = MongoEventDataAccess()
    try:
        yield dao
    finally:
        await dao.close()

async def get_user_dao() -> AsyncGenerator[UserDataAccess, None]:
    """Dependency for getting the user data access object."""
    dao = MongoUserDataAccess()
    try:
        yield dao
    finally:
        await dao.close()

def get_openai_service() -> OpenAIService:
    return OpenAIService() 