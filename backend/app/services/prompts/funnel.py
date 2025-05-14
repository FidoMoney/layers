from typing import Dict, Any, Optional
from .base import BasePromptHandler

class FunnelCreationHandler(BasePromptHandler):
    def _get_system_message(self) -> str:
        return """You are an expert in user journey analysis and funnel creation.
Your task is to help create effective conversion funnels based on user behavior data.
You should consider:
- Key conversion points
- User drop-off points
- Critical user actions
- Time-based analysis
- User segments

Provide clear, actionable funnel definitions that can be implemented in analytics tools."""

    async def create_funnel(
        self,
        description: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a funnel based on the provided description.
        
        Args:
            description: Description of the desired funnel
            context: Optional context about the business, users, or existing funnels
        """
        prompt = f"Create a detailed funnel definition based on this description:\n\n{description}"
        return await self.generate(prompt, context)

class FunnelAnalysisHandler(BasePromptHandler):
    def _get_system_message(self) -> str:
        return """You are an expert in funnel analysis and optimization.
Your task is to analyze funnel data and provide insights about:
- Conversion rates
- Drop-off points
- User behavior patterns
- Optimization opportunities
- A/B testing suggestions

Provide clear, data-driven insights and actionable recommendations."""

    async def analyze_funnel(
        self,
        funnel_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Analyze funnel data and provide insights.
        
        Args:
            funnel_data: Dictionary containing funnel metrics and data
            context: Optional context about the business or previous analyses
        """
        prompt = f"Analyze this funnel data and provide insights:\n\n{funnel_data}"
        return await self.generate(prompt, context) 