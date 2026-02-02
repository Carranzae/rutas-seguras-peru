"""
Ruta Segura Perú - Tour Schemas
Pydantic models for tour validation
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class TourStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class TourBase(BaseModel):
    """Base tour schema."""
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    currency: str = Field(default="PEN", max_length=3)
    duration_hours: Optional[float] = None
    max_participants: int = Field(default=10, ge=1, le=100)
    difficulty_level: str = Field(default="moderate")
    meeting_point: Optional[str] = None
    included_services: List[str] = Field(default_factory=list)


class TourCreate(TourBase):
    """Schema for creating a tour."""
    guide_id: Optional[UUID] = None


class TourUpdate(BaseModel):
    """Schema for updating a tour."""
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    duration_hours: Optional[float] = None
    max_participants: Optional[int] = Field(None, ge=1, le=100)
    difficulty_level: Optional[str] = None
    meeting_point: Optional[str] = None
    included_services: Optional[List[str]] = None
    guide_id: Optional[UUID] = None


class TourResponse(TourBase):
    """Schema for tour response."""
    id: UUID
    agency_id: UUID
    guide_id: Optional[UUID] = None
    status: TourStatus
    created_at: datetime
    
    # Media
    cover_image_url: Optional[str] = None
    gallery_urls: List[str] = []
    
    # Ratings
    rating: Optional[float] = None
    reviews_count: int = 0
    is_featured: bool = False
    
    # Nested info
    agency_name: Optional[str] = None
    guide_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class TourListResponse(BaseModel):
    """Schema for paginated tour list."""
    items: List[TourResponse]
    total: int
    page: int
    per_page: int


class TourSearchParams(BaseModel):
    """Schema for tour search parameters."""
    query: Optional[str] = None
    location: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    difficulty: Optional[str] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
