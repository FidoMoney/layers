from typing import Dict, Any, Optional
from app.services.openai_service import OpenAIService

class BasePromptHandler:
    def __init__(self, openai_service: OpenAIService):
        self.openai_service = openai_service
        self.system_message = self._get_system_message()
    
    def _get_system_message(self) -> str:
        """Override this method to provide a specific system message for each handler."""
        raise NotImplementedError
    
    async def generate(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate a response using the OpenAI service.
        
        Args:
            prompt: The main prompt text
            context: Optional context to include in the system message
            temperature: Optional temperature for response generation
            max_tokens: Optional maximum tokens for the response
        """
        system_message = self.system_message
        if context:
            system_message += f"\nContext: {self._format_context(context)}"
            
        return await self.openai_service.generate_completion(
            prompt=prompt,
            system_message=system_message,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format the context dictionary into a string."""
        return ", ".join(f"{k}: {v}" for k, v in context.items()) 