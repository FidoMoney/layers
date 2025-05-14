from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class User(BaseModel):
    """User model representing a user in the system."""
    user_id: str = Field(..., description="Unique identifier for the user")
    name: str = Field(..., description="Full name of the user")
    phone_number: str = Field(..., description="User's phone number")
    country: str = Field(..., description="User's country code (e.g., US)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the user was created")
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
        
    @classmethod
    def from_mongo(cls, data: dict) -> 'User':
        """Create a User instance from MongoDB document."""
        if not data:
            return None
        # Convert MongoDB's _id to string if it exists
        if '_id' in data:
            data['_id'] = str(data['_id'])
        return cls(**data)
    
    def to_mongo(self) -> dict:
        """Convert User instance to MongoDB document format."""
        return self.dict(exclude_none=True) 