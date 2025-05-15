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

1. Overall Metrics:
   - Total number of users who started the flow
   - Total number of users who completed the flow
   - Overall conversion rate (completed/started * 100)
   - Average time to complete the flow
   - Median time to complete the flow
   - Average funnel completion time (time from first to last event) for users who completed the entire flow
   - Median funnel completion time for users who completed the entire flow

2. Funnel Analysis:
   - For each step in the flow:
     * Number of users who reached this step
     * Percentage of users who reached this step (compared to total users)
     * Drop-off rate from previous step
     * Average time spent on this step
     * Median time spent on this step

3. Critical Drop-off Points:
   - Identify the step with the highest drop-off rate
   - Calculate the percentage of users lost at this step
   - Analyze potential reasons for the drop-off

Please format your response exactly as follows:

📊 Overall Performance:
- Total Users: [X]
- Completed Flow: [X] users
- Overall Conversion Rate: [X]%
- Average Completion Time: [X] minutes
- Median Completion Time: [X] minutes
- Average Funnel Time (First to Last): [X] minutes
- Median Funnel Time (First to Last): [X] minutes

📈 Funnel Analysis:

Step 1: [First Event Name]
Users: [X] ([Y]% of total)
Avg Time: [X] minutes
Median Time: [X] minutes
↓ [Drop-off Rate]%

Step 2: [Second Event Name]
Users: [X] ([Y]% of total)
Avg Time: [X] minutes
Median Time: [X] minutes
↓ [Drop-off Rate]%

[Continue for all steps...]

Final Step: [Last Event Name]
Users: [X] ([Y]% of total)
Avg Time: [X] minutes
Median Time: [X] minutes

⚠️ Critical Drop-off Points:
1. Highest Drop-off: [Step Name]
   - [X]% of users dropped at this step
   - Potential reasons: [List 2-3 potential reasons]
   - Suggested improvements: [List 2-3 specific improvements]

2. Second Highest Drop-off: [Step Name]
   - [X]% of users dropped at this step
   - Potential reasons: [List 2-3 potential reasons]
   - Suggested improvements: [List 2-3 specific improvements]

💡 Key Insights:
1. [Main insight about overall performance]
2. [Main insight about user behavior]
3. [Main insight about timing/engagement]
4. [Main insight about potential improvements]"""

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