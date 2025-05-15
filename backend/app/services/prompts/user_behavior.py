from typing import Dict, Any, List
from datetime import datetime, timedelta

class UserBehaviorPrompt:
    """Prompt template for analyzing individual user behavior."""

    @staticmethod
    def generate_prompt(user_data: Dict[str, Any]) -> str:
        """
        Generate a prompt for analyzing individual user behavior.
        
        Args:
            user_data: Dictionary containing user_id, user_name, and events data
            
        Returns:
            str: Formatted prompt for user behavior analysis
        """
        user_id = user_data.get('user_id', '')
        user_name = user_data.get('user_name', 'Unknown User')
        events = user_data.get('events', [])
        
        # Generate the prompt
        prompt = f"""You are an expert in analyzing user behavior in mobile apps.

I will provide you with the complete event history for {user_name}, and I need you to perform a detailed behavioral analysis.

Here's the user's event data:

{events}

Please analyze this data and provide a comprehensive behavioral analysis following these steps:

1. User Story:
   - When did the user first onboard the app
   - What was their initial journey like
   - Have they taken any loans with us
   - How engaged are they with the app
   - What are their main activities/interests in the app

2. Session Analysis:
   - Total number of sessions
   - Average session duration
   - Most active time periods
   - Session frequency patterns

3. Key Activities:
   - Most frequent actions
   - Loan-related activities (if any)
   - Feature engagement levels
   - Success/failure patterns

Please format your response exactly as follows:

👤 {user_name}'s Journey

📖 User Story:
[Write a concise story about the user's journey, including:
- When they joined
- Their initial experience
- Loan history (if any)
- Overall engagement level
- Main interests/activities]

📊 Key Metrics:
- Total Sessions: [N]
- Average Session Duration: [X] minutes
- Most Active Time: [time range]
- Engagement Level: [High/Medium/Low]

🎯 Main Activities:
- Most Used Features: [list top 3]
- Loan Status: [Active/None/Previous]
- Success Rate: [X]%

💡 Key Insights:
[2-3 key insights about the user's behavior and potential opportunities]"""

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