from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.data_access.interfaces import UserDataAccess
from app.models.user import User
from app.dependencies import get_user_dao

router = APIRouter()

@router.get("/search", response_model=Optional[User])
async def search_user(
    query: str,
    user_dao: UserDataAccess = Depends(get_user_dao)
):
    """
    Search for a user by ID or phone number.
    
    Args:
        query: The search query (user_id or phone_number)
        user_dao: The user data access object
        
    Returns:
        The user if found, None otherwise
    """
    # Try to find by user_id first
    user = await user_dao.get_user_by_id(query)
    if user:
        return user
        
    # If not found by ID, try phone number
    user = await user_dao.get_user_by_phone(query)
    if user:
        return user
        
    # If not found at all, return None (which will be converted to 404 by FastAPI)
    raise HTTPException(status_code=404, detail="User not found") 