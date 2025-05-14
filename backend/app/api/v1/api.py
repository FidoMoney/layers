from fastapi import APIRouter
from app.api.v1.endpoints import events, funnels, analyze, openai, analytics, users

api_router = APIRouter()

# Events endpoints
api_router.include_router(events.router, prefix="/events", tags=["events"])

# Funnel endpoints
api_router.include_router(funnels.router, prefix="/funnels", tags=["funnels"])

# Analysis endpoints
api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])

# OpenAI endpoints
api_router.include_router(openai.router, prefix="/openai", tags=["openai"])

# Analytics endpoints
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Users endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"]) 