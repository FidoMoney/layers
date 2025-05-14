from typing import Optional, Dict, Any
from openai import OpenAI
from app.core.config import get_settings

class OpenAIService:
    def __init__(self):
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.OPENAI_API_KEY)

    async def generate_completion(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        additional_params: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate a completion using OpenAI's API.
        
        Args:
            prompt: The user's input prompt
            system_message: Optional system message to set context
            temperature: Optional temperature for response generation
            max_tokens: Optional maximum tokens for the response
            additional_params: Optional additional parameters for the API call
            
        Returns:
            The generated text response
        """
        messages = []
        
        if system_message:
            messages.append({"role": "system", "content": system_message})
            
        messages.append({"role": "user", "content": prompt})
        
        params = {
            "model": self.settings.OPENAI_MODEL,
            "messages": messages,
            "temperature": temperature or self.settings.OPENAI_TEMPERATURE,
            "max_tokens": max_tokens or self.settings.OPENAI_MAX_TOKENS,
        }
        
        if additional_params:
            params.update(additional_params)
            
        response = self.client.chat.completions.create(**params)
        return response.choices[0].message.content

    async def analyze_text(
        self,
        text: str,
        analysis_type: str,
        context: Optional[str] = None
    ) -> str:
        """
        Analyze text with a specific purpose.
        
        Args:
            text: The text to analyze
            analysis_type: The type of analysis to perform
            context: Optional context for the analysis
            
        Returns:
            The analysis result
        """
        system_message = f"You are an AI assistant specialized in {analysis_type}."
        if context:
            system_message += f" Context: {context}"
            
        prompt = f"Please analyze the following text:\n\n{text}"
        
        return await self.generate_completion(
            prompt=prompt,
            system_message=system_message
        ) 