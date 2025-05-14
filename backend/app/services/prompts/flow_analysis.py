from typing import Dict, Any, List
from datetime import datetime

class FlowAnalysisPrompt:
    """Prompt template for analyzing user behavior flows."""

    @staticmethod
    def generate_prompt(flow_data: Dict[str, Any]) -> str:
        """
        Generate a prompt for analyzing user behavior flows.
        
        Args:
            flow_data: Dictionary containing flow_name and users data
            
        Returns:
            str: Formatted prompt for flow analysis
        """
        flow_name = flow_data.get('flow_name', '')
        users = flow_data.get('users', [])
        
        # Extract flow-specific events for each user
        flow_events = []
        for user in users:
            user_events = user.get('events', [])
            if user_events:
                flow_events.append({
                    'user_id': user['user_id'],
                    'events': user_events
                })
        
        # Generate the prompt
        prompt = f"""You are an expert in analyzing user behavior flows based on chronological event logs.

I will provide you with event data for the "{flow_name}" flow, and I need you to analyze it thoroughly.

Here's the event data for {len(flow_events)} users:

{flow_events}

Please analyze this data and provide a detailed funnel analysis following these steps:

1. Flow Funnel Analysis:
   - Identify all events in chronological order from first to last
   - For each step in the funnel:
     * Calculate the number of users who reached this step
     * Calculate the conversion rate from the previous step
     * Calculate the drop-off rate from the previous step
     * Calculate the average time users spent on this step before moving to the next

2. Timing Analysis:
   - For each step:
     * Calculate the average time users spent on this step
     * Identify any steps with unusually long durations (>2 minutes)
   - Calculate the total average time from first to last event
   - Identify any bottlenecks or steps with significant delays

Please format your response exactly as follows:

📍 {flow_name} Flow Funnel:

Step 1: [First Event Name]
Users: [X] (100%)
Avg Time: [X] minutes
↓ [Conversion Rate]%

Step 2: [Second Event Name]
Users: [X] ([Y]% of previous step)
Avg Time: [X] minutes
↓ [Conversion Rate]%

[Continue for all steps...]

Final Step: [Last Event Name]
Users: [X] ([Y]% of previous step)
Avg Time: [X] minutes

📊 Overall Metrics:
- Total Steps: [X]
- Total Users Started: [X]
- Total Users Completed: [X]
- Overall Conversion Rate: [X]%
- Total Average Flow Time: [X] minutes

⚠️ Steps with High Average Time (>2 minutes):
[List steps with their average times]

💡 Key Insights:
[3-5 key insights about user behavior and potential improvements]"""

        return prompt

    @staticmethod
    def parse_response(response: str) -> Dict[str, Any]:
        """
        Parse the AI's response into structured data.
        
        Args:
            response: The AI's analysis response
            
        Returns:
            Dict containing structured analysis results
        """
        # Implementation for parsing the response into structured data
        # This can be customized based on the specific format needed
        return {
            'raw_response': response,
            'parsed_at': datetime.now().isoformat()
        } 