from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.openai_service import OpenAIService
from app.dependencies import get_openai_service

router = APIRouter()

class TextAnalysisRequest(BaseModel):
    text: str
    analysis_type: str
    context: str | None = None

@router.post("/analyze")
async def analyze_text(
    request: TextAnalysisRequest,
    openai_service: OpenAIService = Depends(get_openai_service)
):
    """
    Analyze text using OpenAI's API.
    
    Args:
        request: The text analysis request containing:
            - text: The text to analyze
            - analysis_type: The type of analysis to perform
            - context: Optional context for the analysis
    """
    result = await openai_service.analyze_text(
        text=request.text,
        analysis_type=request.analysis_type,
        context=request.context
    )
    return {"result": result} 