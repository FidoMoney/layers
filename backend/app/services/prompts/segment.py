from typing import Dict, Any, Optional
from .base import BasePromptHandler

class SegmentCreationHandler(BasePromptHandler):
    def _get_system_message(self) -> str:
        return """You are an expert in user segmentation and behavioral analysis.
Your task is to help create effective user segments based on behavior patterns and characteristics.
You should consider:
- User behavior patterns
- Demographic information
- Engagement levels
- Purchase history
- Feature usage
- Time-based patterns

Provide clear, actionable segment definitions that can be implemented in analytics tools."""

    async def create_segment(
        self,
        description: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a user segment based on the provided description.
        
        Args:
            description: Description of the desired user segment
            context: Optional context about the business, users, or existing segments
        """
        prompt = f"Create a detailed user segment definition based on this description:\n\n{description}"
        return await self.generate(prompt, context) 