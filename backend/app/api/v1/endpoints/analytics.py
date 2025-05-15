from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.openai_service import OpenAIService
from app.services.prompts.funnel import FunnelCreationHandler
from app.services.prompts.flow_analysis import FlowAnalysisPrompt
from app.services.prompts.segment import SegmentCreationHandler
from app.dependencies import get_openai_service
from fastapi import HTTPException
import random

router = APIRouter()

class FunnelCreationRequest(BaseModel):
    description: str
    context: Optional[Dict[str, Any]] = None

class FlowAnalysisRequest(BaseModel):
    flow_data: Dict[str, Any]

class SegmentCreationRequest(BaseModel):
    description: str
    context: Optional[Dict[str, Any]] = None

MAX_FLOWS_TO_ANALYZE = 100  # Limit the number of flows to analyze

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
    try:
        # Log the incoming request for debugging
        print("Received flow analysis request:", request.flow_data.keys())
        
        if not request.flow_data.get("flows") or not request.flow_data.get("prompt"):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: 'flows' or 'prompt'"
            )
        
        flows = request.flow_data["flows"]
        prompt = request.flow_data["prompt"]
        
        # Sample flows if there are too many
        if len(flows) > MAX_FLOWS_TO_ANALYZE:
            print(f"Sampling {MAX_FLOWS_TO_ANALYZE} flows from {len(flows)} total flows")
            # Sort flows by length to get a representative sample
            flows.sort(key=lambda x: len(x["flow"]), reverse=True)
            # Take a stratified sample: some from the top (longest flows), some from the middle, and some random
            top_flows = flows[:MAX_FLOWS_TO_ANALYZE // 3]
            middle_flows = flows[len(flows)//2 - MAX_FLOWS_TO_ANALYZE//6:len(flows)//2 + MAX_FLOWS_TO_ANALYZE//6]
            remaining_count = MAX_FLOWS_TO_ANALYZE - len(top_flows) - len(middle_flows)
            other_flows = random.sample(
                [f for f in flows if f not in top_flows and f not in middle_flows],
                min(remaining_count, len(flows) - len(top_flows) - len(middle_flows))
            )
            flows = top_flows + middle_flows + other_flows
            random.shuffle(flows)  # Shuffle to avoid bias in the order
        
        # Format the flow data for analysis
        formatted_flows = []
        for flow in flows:
            # Only include essential event data to reduce token count
            formatted_flow = {
                "user_id": flow["user_id"],
                "events": [
                    {
                        "name": event["event_name"],
                        "timestamp": event["timestamp"]
                    }
                    for event in flow["flow"]
                ]
            }
            formatted_flows.append(formatted_flow)
        
        # Create a system message for the analysis
        system_message = """You are an expert in analyzing user behavior flows, calculating conversion rates, and analyzing time-based patterns. 
        Your task is to analyze the provided flow data and provide detailed insights about aggregate user behavior patterns.
        
        Important guidelines for time calculations:
        1. FIRST calculate times for each individual flow:
           - For each user flow, calculate:
             * Total duration (time between first and last event)
             * Duration of each step (time between consecutive events)
             * Time between steps
           - Explicitly identify and note:
             * The first event in each flow
             * The last event in each flow
             * Whether the flow reached a completion event
        2. THEN aggregate these individual calculations to get:
           - Average and median times across all flows
           - Time distributions and patterns
           - Outlier detection and handling
        3. Time calculation rules:
           - Convert all timestamps to seconds/minutes for calculation
           - Handle missing or invalid timestamps appropriately
           - Exclude unreasonable time gaps (e.g., >24 hours) from calculations
           - Note any time calculation assumptions made
        
        Other important guidelines:
        1. ALWAYS calculate and include:
           - Conversion rates between each step in the flow
           - Time metrics for the entire flow and each step
           - First and last events for each flow
        2. Focus ONLY on aggregate patterns and trends across all users
        3. NEVER mention individual user IDs or specific user behaviors
        4. Use percentages and averages to describe patterns
        5. Group similar behaviors into categories
        6. Identify common paths and drop-off points
        7. Provide actionable insights based on the overall data
        
        Format your response in a clear, structured way with emojis for better readability.
        Note: The data provided is a sample of the total flows, so focus on patterns and trends rather than absolute numbers."""
        
        # Generate the analysis using OpenAI
        prompt = f"""Please analyze the following user flow data and answer this specific question: {prompt}

Flow Data (Sample of {len(formatted_flows)} flows from a larger dataset):
{formatted_flows}

Follow these steps for analysis:

1. Flow Event Analysis (Do this first):
   For each individual flow:
   - Identify and note the first event
   - Identify and note the last event
   - Determine if the flow reached a completion event
   - Calculate total flow duration (last event timestamp - first event timestamp)
   - Calculate duration of each step (time between consecutive events)
   - Calculate time between steps
   - Note any unusual time gaps or patterns
   - Convert all times to minutes for consistency

2. Aggregate the individual calculations to get:
   - Overall flow metrics
   - Step-specific time metrics
   - Time distributions
   - Identify and handle outliers
   - Common first and last events
   - Completion rates

3. Provide a detailed analysis with the following structure:

📊 Overall Flow Metrics:
- First Event Analysis:
  * Most common first events
  * Distribution of first events
  * Average time from first event to next step
- Last Event Analysis:
  * Most common last events
  * Distribution of last events
  * Completion rate (flows ending with a completion event)
- Total number of users who started the flow
- Total number of users who completed the flow
- Overall conversion rate (start to completion)
- Time Metrics (based on individual flow calculations):
  * Average total flow duration (in minutes)
  * Median total flow duration (in minutes)
  * 25th and 75th percentile durations
  * Distribution of flow durations
  * Any notable outliers or time patterns

📈 Step-by-Step Analysis:
For each step in the flow:
- Number of users who reached this step
- Conversion rate from previous step
- Drop-off rate from previous step
- Time Metrics (based on individual calculations):
  * Average step duration (in minutes)
  * Median step duration (in minutes)
  * Time from flow start to this step
  * Time between this step and next step
  * Distribution of step durations
  * Any notable time patterns or outliers

⏱️ Time-Based Patterns:
- Most common time patterns in the flow
- Steps where users spend the most/least time
- Correlation between time spent and conversion rates
- Time-based drop-off patterns
- Optimal flow duration for highest conversion
- Any unusual time patterns or outliers
- Time patterns from first to last event

⚠️ Critical Drop-off Points:
- Identify steps with highest drop-off rates
- Calculate percentage of users lost at each critical point
- Time spent before drop-off (based on individual calculations)
- Analyze potential reasons for drop-offs
- Common last events before drop-off

💡 Key Insights:
- Main patterns in user behavior
- Most common paths through the flow
- Time-based patterns and engagement metrics
- Specific recommendations for improvement
- Time optimization opportunities
- Insights about flow completion and abandonment

Format your response with clear sections and use emojis for better readability.
Remember: Focus ONLY on aggregate patterns and NEVER mention individual users or user IDs.
Note: This is a sample of the data, so focus on patterns and trends rather than absolute numbers.
Include a note about any assumptions made in time calculations."""

        print(f"Sending prompt to OpenAI with {len(formatted_flows)} flows")
        
        try:
            result = await openai_service.generate_completion(
                prompt=prompt,
                system_message=system_message,
                temperature=0.7,
                max_tokens=2000
            )
            
            print("Successfully received response from OpenAI")
            return {"result": result}
            
        except Exception as openai_error:
            error_message = str(openai_error)
            if "rate_limit_exceeded" in error_message or "tokens" in error_message.lower():
                raise HTTPException(
                    status_code=429,
                    detail="The analysis request was too large. Please try with a smaller time range or fewer events."
                )
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI service error: {error_message}"
            )
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Error in analyze_flow:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze flows: {str(e)}"
        )

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