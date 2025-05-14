from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.prompts.flow_analysis import FlowAnalysisPrompt

router = APIRouter()

class AnalyzeRequest(BaseModel):
    flow_data: Dict[str, Any]

@router.post("/flows")
async def analyze_flows(request: AnalyzeRequest):
    try:
        flow_analysis = FlowAnalysisPrompt()
        analysis = flow_analysis.generate_prompt(request.flow_data)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 