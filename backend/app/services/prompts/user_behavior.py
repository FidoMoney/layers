from typing import Dict, Any, List
from datetime import datetime, timedelta

class UserBehaviorPrompt:
    """Prompt template for analyzing individual user behavior."""

    @staticmethod
    def generate_prompt(user_data: Dict[str, Any]) -> str:
        """
        Generate a prompt for analyzing individual user behavior.
        
        Args:
            user_data: Dictionary containing user_id and events data
            
        Returns:
            str: Formatted prompt for user behavior analysis
        """
        user_id = user_data.get('user_id', '')
        events = user_data.get('events', [])
        
        # Generate the prompt
        prompt = f"""You are an expert in analyzing user behavior in mobile apps.

I will provide you with the complete event history for user {user_id}, and I need you to perform a detailed behavioral analysis.

Here's the user's event data:

{events}

Please analyze this data and provide a comprehensive behavioral analysis following these steps:

1. Session Identification:
   - Identify all user sessions (30-minute inactivity threshold)
   - For each session, provide:
     * Start and end timestamps
     * Total duration
     * All flows interacted with
     * Success/failure status of each flow

2. Flow Analysis per Session:
   For each session, analyze:
   - Which flows were started
   - Which flows were completed
   - Which flows were abandoned
   - Time spent in each flow
   - Any retry attempts within the session

3. Cross-Session Behavior:
   - Time between sessions
   - Flow retry patterns across sessions
   - Failed flow completion attempts
   - Most common session patterns

4. User Behavior Summary:
   - Session frequency and duration patterns
   - Most engaged with flows
   - Most problematic flows
   - Overall success/failure patterns
   - Time-of-day patterns
   - Flow completion rates

Please format your response exactly as follows:

👤 User {user_id} Behavior Analysis

📅 Session Analysis:
[For each session]
- Session [N]:
  * Start: [timestamp]
  * End: [timestamp]
  * Duration: [X] minutes
  * Flows: [list of flows]
  * Status: [completed/abandoned flows]

🔄 Flow Analysis:
[For each unique flow]
- Flow: [name]
  * Started: [N] times
  * Completed: [N] times
  * Failed: [N] times
  * Average time: [X] minutes
  * Retry rate: [X]%

⏱️ Time Patterns:
- Average session duration: [X] minutes
- Average time between sessions: [X] hours
- Most active time: [time range]
- Most successful time: [time range]

📊 Overall Behavior:
- Total sessions: [N]
- Most used flow: [name] ([N] times)
- Most problematic flow: [name] ([X]% failure rate)
- Overall completion rate: [X]%

💡 Key Insights:
[3-5 key behavioral patterns or insights]"""

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