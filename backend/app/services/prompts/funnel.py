from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
from .base import BasePromptHandler

class FunnelCreationHandler(BasePromptHandler):
    def _get_system_message(self) -> str:
        return """You are an AI model responsible for creating user funnels based on behavior events from a mobile app. The user will provide a **starting event** (e.g., 'user_sign_up'), a **time frame** (e.g., 'last 7 days'), and a **conversion window** (e.g., '24 hours').

Your responsibilities include:

1. **First Event (Starting Point)**: When the user specifies the first event, check if it has multiple attributes (e.g., 'BeforeKYC' or 'BeforeSurvey'). If so, ask for clarification about which event description and intent to use.

2. **Last Event Deduction**: Once the starting event is confirmed, automatically deduce the last event in the flow based on typical user behavior. Use the user's specified last event if provided.

3. **Time Frame & Conversion Window**: Consider both the time frame (when users must start the funnel) and conversion window (how long after the starting event users have to complete the final event).

4. **Subsequent Events**: Automatically deduce the sequence of events that typically follow the first event, up to the last event.

5. **Unique Users**: Focus on distinct users who performed the first event within the time frame and completed the last event within the conversion window.

6. **Output Format**: Present the funnel with:
   - The main user flow with user counts at each step
   - Conversion rates between events
   - Alternative funnels based on different paths
   - Bar chart format representation

Always ask for clarification when needed, especially for events with multiple attributes or intents."""

    def _prepare_events_for_analysis(
        self,
        events: List[Dict[str, Any]],
        time_frame: str,
        conversion_window: str
    ) -> Dict[str, Any]:
        """
        Prepare and aggregate event data for OpenAI analysis.
        
        Args:
            events: List of event dictionaries
            time_frame: Time frame string (e.g., "last 7 days")
            conversion_window: Conversion window string (e.g., "24 hours")
            
        Returns:
            Aggregated and formatted event data suitable for OpenAI analysis
        """
        # Parse time frame and conversion window
        time_frame_days = self._parse_time_to_days(time_frame)
        conversion_window_hours = self._parse_time_to_hours(conversion_window)
        
        # Calculate time boundaries
        end_time = datetime.now()
        start_time = end_time - timedelta(days=time_frame_days)
        
        # Convert to milliseconds for comparison
        start_ms = int(start_time.timestamp() * 1000)
        end_ms = int(end_time.timestamp() * 1000)
        
        # Filter events within time frame
        filtered_events = [
            event for event in events
            if start_ms <= event['timestamp'] <= end_ms
        ]
        
        # Group events by user
        user_events = defaultdict(list)
        for event in filtered_events:
            user_events[event['user_id']].append(event)
        
        # Sort events by timestamp for each user
        for user_id in user_events:
            user_events[user_id].sort(key=lambda x: x['timestamp'])
        
        # Aggregate event counts and calculate conversion rates
        event_counts = defaultdict(int)
        event_sequences = defaultdict(int)
        
        for user_id, events in user_events.items():
            # Count individual events
            for event in events:
                event_counts[event['name']] += 1
            
            # Count event sequences (up to 3 events in sequence)
            for i in range(len(events) - 1):
                seq = f"{events[i]['name']} → {events[i+1]['name']}"
                event_sequences[seq] += 1
                
                if i < len(events) - 2:
                    seq = f"{events[i]['name']} → {events[i+1]['name']} → {events[i+2]['name']}"
                    event_sequences[seq] += 1
        
        # Prepare the final data structure
        analysis_data = {
            "time_frame": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "duration_days": time_frame_days
            },
            "conversion_window": {
                "hours": conversion_window_hours
            },
            "total_users": len(user_events),
            "event_counts": dict(event_counts),
            "event_sequences": dict(event_sequences),
            "summary": {
                "total_events": len(filtered_events),
                "unique_events": len(event_counts),
                "avg_events_per_user": len(filtered_events) / len(user_events) if user_events else 0
            }
        }
        
        return analysis_data

    def _parse_time_to_days(self, time_str: str) -> int:
        """Convert time frame string to days."""
        import re
        if not time_str:
            return 7  # default to 7 days
            
        match = re.search(r'(\d+)\s+(day|week|month|year)s?', time_str.lower())
        if not match:
            return 7
            
        num, unit = match.groups()
        num = int(num)
        
        multipliers = {
            'day': 1,
            'week': 7,
            'month': 30,
            'year': 365
        }
        
        return num * multipliers.get(unit, 1)

    def _parse_time_to_hours(self, time_str: str) -> int:
        """Convert conversion window string to hours."""
        import re
        if not time_str:
            return 24  # default to 24 hours
            
        match = re.search(r'(\d+)\s+(hour|day|week|month)s?', time_str.lower())
        if not match:
            return 24
            
        num, unit = match.groups()
        num = int(num)
        
        multipliers = {
            'hour': 1,
            'day': 24,
            'week': 168,
            'month': 720
        }
        
        return num * multipliers.get(unit, 1)

    async def create_funnel(
        self,
        description: str,
        events: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a funnel based on the provided description and events.
        
        Args:
            description: Description of the desired funnel
            events: List of event dictionaries
            context: Optional context about available events and their attributes
        """
        # Extract key components from the description
        components = self._parse_funnel_components(description)
        
        # Check if we need clarification for the starting event
        if components.get('needs_clarification'):
            return self._generate_clarification_request(components)
        
        # Prepare events for analysis
        analysis_data = self._prepare_events_for_analysis(
            events,
            components['time_frame'],
            components['conversion_window']
        )
        
        # Add analysis data to context
        if context is None:
            context = {}
        context['analysis_data'] = analysis_data
        
        # Create the main funnel prompt
        prompt = self._create_funnel_prompt(components)
        
        # Generate the funnel analysis
        return await self.generate(prompt, context)

    def _parse_funnel_components(self, description: str) -> Dict[str, Any]:
        """Parse the funnel description to extract key components."""
        import re
        from typing import Optional, Tuple

        def extract_time_frame(text: str) -> Optional[str]:
            """Extract time frame from text (e.g., 'last 7 days', 'past 3 months')."""
            patterns = [
                r'last\s+(\d+)\s+(day|week|month|year)s?',
                r'past\s+(\d+)\s+(day|week|month|year)s?',
                r'(\d+)\s+(day|week|month|year)s?\s+ago'
            ]
            for pattern in patterns:
                if match := re.search(pattern, text.lower()):
                    num, unit = match.groups()
                    return f"last {num} {unit}s"
            return None

        def extract_conversion_window(text: str) -> Optional[str]:
            """Extract conversion window from text (e.g., '24 hours', '1 week')."""
            patterns = [
                r'(\d+)\s+(hour|day|week|month)s?',
                r'conversion\s+window\s+(?:of\s+)?(\d+)\s+(hour|day|week|month)s?'
            ]
            for pattern in patterns:
                if match := re.search(pattern, text.lower()):
                    num, unit = match.groups()
                    return f"{num} {unit}s"
            return None

        def extract_events(text: str) -> Tuple[Optional[str], Optional[str]]:
            """Extract starting and last events from text."""
            # Look for patterns like "starting with 'event_name'" or "from 'event_name'"
            start_patterns = [
                r"starting\s+with\s+['\"]([^'\"]+)['\"]",
                r"from\s+['\"]([^'\"]+)['\"]",
                r"beginning\s+with\s+['\"]([^'\"]+)['\"]"
            ]
            
            # Look for patterns like "ending with 'event_name'" or "to 'event_name'"
            end_patterns = [
                r"ending\s+with\s+['\"]([^'\"]+)['\"]",
                r"to\s+['\"]([^'\"]+)['\"]",
                r"until\s+['\"]([^'\"]+)['\"]"
            ]

            starting_event = None
            last_event = None

            for pattern in start_patterns:
                if match := re.search(pattern, text.lower()):
                    starting_event = match.group(1)
                    break

            for pattern in end_patterns:
                if match := re.search(pattern, text.lower()):
                    last_event = match.group(1)
                    break

            return starting_event, last_event

        def check_event_attributes(event: str, context: Optional[Dict[str, Any]] = None) -> bool:
            """Check if an event has multiple attributes that need clarification."""
            if not context or 'available_events' not in context:
                return False
                
            available_events = context.get('available_events', {})
            if event in available_events:
                event_data = available_events[event]
                # Check if the event has multiple descriptions or intents
                return (
                    len(event_data.get('descriptions', [])) > 1 or
                    len(event_data.get('intents', [])) > 1
                )
            return False

        # Extract components
        starting_event, last_event = extract_events(description)
        time_frame = extract_time_frame(description)
        conversion_window = extract_conversion_window(description)

        components = {
            'starting_event': starting_event,
            'time_frame': time_frame,
            'conversion_window': conversion_window,
            'last_event': last_event,
            'needs_clarification': False
        }

        # Check if we need clarification for the starting event
        if starting_event and context:
            components['needs_clarification'] = check_event_attributes(starting_event, context)

        return components

    def _generate_clarification_request(self, components: Dict[str, Any]) -> str:
        """Generate a request for clarification about event attributes."""
        event = components['starting_event']
        return f"""The event '{event}' has multiple attributes. Please clarify:

1. Event Description: Which description would you like to use?
2. Event Intent: Which intent should be considered (e.g., 'view', 'action', 'start', 'end')?

Please provide these details to create an accurate funnel."""

    def _create_funnel_prompt(self, components: Dict[str, Any]) -> str:
        """Create a detailed prompt for funnel generation."""
        prompt = f"""Create a detailed funnel analysis with the following parameters:

Starting Event: {components['starting_event']}
Time Frame: {components['time_frame']}
Conversion Window: {components['conversion_window']}
Last Event: {components.get('last_event', 'auto-deduced')}

Please provide:
1. Main funnel flow with user counts and conversion rates
2. Alternative funnels based on different user paths
3. Bar chart representation of the data
4. Key insights and recommendations

Format the output in a clear, structured way that can be easily visualized."""
        
        return prompt