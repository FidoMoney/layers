from typing import Dict, Any, List
from datetime import datetime

class FlowAnalysisPrompt:
    """Prompt template for analyzing user behavior flows."""

    @staticmethod
    def generate_prompt(flow_data: Dict[str, Any]) -> str:
        """
        Generate a prompt for analyzing user behavior flows.
        
        Args:
            flow_data: Dictionary containing users data with their events
            
        Returns:
            str: Formatted prompt for flow analysis
        """
        users = flow_data.get('users', [])
        
        # Extract flow-specific events for each user
        flow_events = []
        for user in users:
            user_events = user.get('events', [])
            if user_events:
                # Sort events by timestamp to ensure chronological order
                sorted_events = sorted(user_events, key=lambda x: x.get('timestamp', ''))
                # Format events to make timestamps more visible
                formatted_events = []
                for i, event in enumerate(sorted_events):
                    timestamp = event.get('timestamp', 0)
                    # Convert timestamp to readable format
                    event_time = datetime.fromtimestamp(timestamp/1000).strftime('%Y-%m-%d %H:%M:%S')
                    # Calculate time difference from previous event if not first event
                    time_diff = None
                    if i > 0:
                        prev_timestamp = sorted_events[i-1].get('timestamp', 0)
                        time_diff = (timestamp - prev_timestamp) / 1000  # Convert to seconds
                    
                    formatted_events.append({
                        'event_name': event['event_name'],
                        'timestamp': timestamp,
                        'time': event_time,
                        'time_since_previous': f"{time_diff:.2f}s" if time_diff is not None else None,
                        'attributes': event.get('event_attributes', {})
                    })
                flow_events.append({
                    'user_id': user['user_id'],
                    'events': formatted_events
                })
        
        # Generate the prompt
        prompt = f"""You are an expert in analyzing user behavior flows based on chronological event logs.

I will provide you with event data for {len(flow_events)} users, and I need you to analyze their behavior through the selected events.

Here's the event data:

{flow_events}

Please analyze this data and provide a detailed performance analysis following these steps:

1. Flow Start and End Points:
   - Identify the first event (most common first event by timestamp)
   - Identify the last event (most common last event by timestamp)
   - Calculate how many users started with the first event
   - Calculate how many users ended with the last event

2. Performance Metrics:
   - Calculate the overall conversion rate:
     * (Number of users who completed the last event / Number of users who started with the first event) * 100
   - Calculate the total flow time:
     * For each user: time difference between first and last event
     * Average total flow time across all users
     * Median total flow time across all users

3. Step-by-Step Analysis:
   - For each event in chronological order:
     * Number of users who reached this step
     * Conversion rate from previous step
     * Average time spent on this step
     * Median time spent on this step

Please format your response exactly as follows:

🎯 Overall Performance:
- First Event: [Event Name] (reached by [X] users)
- Last Event: [Event Name] (reached by [X] users)
- Overall Conversion Rate: [X]%
- Average Total Flow Time: [X] minutes
- Median Total Flow Time: [X] minutes

📊 Step-by-Step Performance:

Step 1: [First Event Name]
Users: [X] (100%)
Avg Time: [X] minutes
Median Time: [X] minutes
↓ [Conversion Rate]%

Step 2: [Second Event Name]
Users: [X] ([Y]% of previous step)
Avg Time: [X] minutes
Median Time: [X] minutes
↓ [Conversion Rate]%

[Continue for all steps...]

Final Step: [Last Event Name]
Users: [X] ([Y]% of previous step)
Avg Time: [X] minutes
Median Time: [X] minutes

⚠️ Critical Points:
- Highest Drop-off: [Step Name] ([X]% drop-off)
- Longest Average Time: [Step Name] ([X] minutes)
- Most Common Abandonment Point: [Step Name]

💡 Key Insights:
[3-5 key insights about performance and potential improvements]"""

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