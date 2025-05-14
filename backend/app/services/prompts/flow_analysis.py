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
            user_events = [
                event for event in user['events']
                if flow_name in event['event_name']
            ]
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

Please analyze this data and provide a detailed analysis following these steps:

1. Flow Extraction:
   - Extract all events that include "{flow_name}" in their event_name
   - Order events chronologically
   - Identify the complete flow sequence

2. Path Analysis:
   - Identify all unique paths users take through the flow
   - Calculate the percentage of users following each path
   - Determine the most common path

3. Drop-off Analysis:
   - For each step in the flow, calculate:
     * Number of users who reached that step
     * Number of users who continued to the next step
     * Drop-off percentage at each step

4. Conversion Analysis:
   - Calculate overall conversion rate (users who completed the flow)
   - Break down conversion rates by:
     * Country
     * App version

5. Timing Analysis:
   - Calculate average time between consecutive steps
   - Calculate total flow duration for each user
   - Identify steps with unusually high completion times (>2 minutes)

Please format your response exactly as follows:

📍 {flow_name} Flow:
[Numbered list of all unique events in chronological order]

✅ Most common path:
[Path with exact percentage of users]

❌ Drop-off points:
[Each point with exact percentage of users who dropped]

🎯 Conversion rate:
[Overall percentage and breakdowns by country/version]

⏱️ Average time between steps:
[Each step transition with exact time in minutes]

⏱️ Total flow time (avg): [X] min
⚠️ High average time: [List steps taking >2 minutes]

🌍 Country breakdown:
[Each country with exact conversion percentage]

🛠 Version breakdown:
[Each version with exact conversion percentage]"""

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