from typing import Dict, Any, Optional
from app.services.openai_service import OpenAIService
from abc import ABC, abstractmethod

class BasePrompt(ABC):
    """Base class for all prompt handlers."""
    
    def __init__(self):
        """Initialize the base prompt handler."""
        pass
    
    @abstractmethod
    async def generate_prompt(self, **kwargs) -> str:
        """Generate a prompt based on the provided parameters."""
        pass
    
    @abstractmethod
    async def process_response(self, response: str, **kwargs) -> Any:
        """Process the response from the language model."""
        pass
    
    async def execute(self, **kwargs) -> Any:
        """Execute the prompt and process the response."""
        prompt = await self.generate_prompt(**kwargs)
        # Here you would typically call your language model
        # For now, we'll just return the prompt
        return await self.process_response(prompt, **kwargs)

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