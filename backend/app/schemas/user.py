"""
Ruta Segura Perú - User Schemas
Pydantic schemas for user operations
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = None
    language: str = "es"


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(min_length=8, max_length=100)
    role: UserRole = UserRole.TOURIST


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None


class UserResponse(UserBase):
    """User response schema."""
    id: uuid.UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Paginated user list response."""
    items: list[UserResponse]
    total: int
    page: int
    per_page: int
