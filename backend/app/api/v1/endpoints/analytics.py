from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.openai_service import OpenAIService
from app.services.prompts.funnel import FunnelCreationHandler
from app.services.prompts.flow_analysis import FlowAnalysisPrompt
from app.services.prompts.segment import SegmentCreationHandler
from app.dependencies import get_openai_service

router = APIRouter()

class FunnelCreationRequest(BaseModel):
    description: str
    context: Optional[Dict[str, Any]] = None

class FlowAnalysisRequest(BaseModel):
    flow_data: Dict[str, Any]

class SegmentCreationRequest(BaseModel):
    description: str
    context: Optional[Dict[str, Any]] = None

@router.post("/funnels/create")
async def create_funnel(
    request: FunnelCreationRequest,
    openai_service: OpenAIService = Depends(get_openai_service)
):
    """Create a new funnel based on the provided description."""
    handler = FunnelCreationHandler(openai_service)
    result = await handler.create_funnel(
        description=request.description,
        context=request.context
    )
    return {"result": result}

@router.post("/flows/analyze")
async def analyze_flow(
    request: FlowAnalysisRequest,
    openai_service: OpenAIService = Depends(get_openai_service)
):
    """Analyze flow data and provide insights."""
    flow_analysis = FlowAnalysisPrompt()
    result = flow_analysis.generate_prompt(request.flow_data)
    return {"result": result}

@router.post("/segments/create")
async def create_segment(
    request: SegmentCreationRequest,
    openai_service: OpenAIService = Depends(get_openai_service)
):
    """Create a new user segment based on the provided description."""
    handler = SegmentCreationHandler(openai_service)
    result = await handler.create_segment(
        description=request.description,
        context=request.context
    )
    return {"result": result} 