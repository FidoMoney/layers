from fastapi import APIRouter
from app.api.v1.endpoints import events
from app.api.endpoints import openai, analytics

api_router = APIRouter()
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(openai.router, prefix="/openai", tags=["openai"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"]) 