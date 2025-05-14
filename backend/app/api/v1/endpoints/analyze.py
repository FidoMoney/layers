from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.prompts.funnel_analysis import FunnelPrompt

router = APIRouter()

class AnalyzeRequest(BaseModel):
    flows: List[Dict[str, Any]]
    prompt: str

@router.post("/flows")
async def analyze_flows(request: AnalyzeRequest):
    try:
        funnel_prompt = FunnelPrompt()
        analysis = funnel_prompt.analyze_flows(request.flows, request.prompt)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 