"""
Ruta Segura Perú - Reviews Router
Tour reviews endpoints for tourists
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.dependencies import CurrentUser
from pydantic import BaseModel, Field

router = APIRouter(prefix="/reviews", tags=["Reviews"])


# Simple in-memory storage for reviews (would use proper model in production)
# For now, return empty list to avoid 404 errors

class ReviewCreate(BaseModel):
    tour_id: uuid.UUID
    booking_id: Optional[uuid.UUID] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=10, max_length=1000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    tour_id: uuid.UUID
    user_id: uuid.UUID
    booking_id: Optional[uuid.UUID] = None
    rating: int
    comment: str
    created_at: datetime
    
    # Populated from relations
    tour_name: Optional[str] = None
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    items: List[ReviewResponse]
    total: int
    page: int
    per_page: int


@router.get(
    "/my",
    response_model=ReviewListResponse,
    summary="Get my reviews",
)
async def get_my_reviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Get current user's reviews."""
    # For now, return empty list until Review model is implemented
    # This prevents 404 errors in the mobile app
    return ReviewListResponse(
        items=[],
        total=0,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/tour/{tour_id}",
    response_model=ReviewListResponse,
    summary="Get tour reviews",
)
async def get_tour_reviews(
    tour_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get all reviews for a specific tour."""
    # Return empty list until Review model is implemented
    return ReviewListResponse(
        items=[],
        total=0,
        page=page,
        per_page=per_page,
    )


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create review",
)
async def create_review(
    data: ReviewCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Create a new tour review."""
    # Placeholder - would create actual review
    # For now, just return a mock response
    return ReviewResponse(
        id=uuid.uuid4(),
        tour_id=data.tour_id,
        user_id=current_user.id,
        booking_id=data.booking_id,
        rating=data.rating,
        comment=data.comment,
        created_at=datetime.utcnow(),
        tour_name="Tour",
        user_name=current_user.full_name,
    )
