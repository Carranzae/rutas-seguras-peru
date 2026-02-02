"""
Ruta Segura Perú - Bookings Router
Tour reservations endpoints
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.booking_service import BookingService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole
from pydantic import BaseModel, Field, EmailStr

router = APIRouter(prefix="/bookings", tags=["Bookings"])


# Schemas
class BookingCreate(BaseModel):
    tour_id: uuid.UUID
    num_participants: int = Field(..., ge=1, le=50)
    scheduled_date: datetime
    contact_name: str = Field(..., min_length=2, max_length=200)
    contact_phone: str = Field(..., min_length=6, max_length=20)
    contact_email: EmailStr
    special_requests: Optional[str] = None


class BookingResponse(BaseModel):
    id: uuid.UUID
    tour_id: uuid.UUID
    user_id: uuid.UUID
    num_participants: int
    scheduled_date: datetime
    status: str
    contact_name: str
    contact_phone: str
    contact_email: str
    special_requests: Optional[str] = None
    created_at: datetime
    
    # Relations
    tour_name: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    items: List[BookingResponse]
    total: int
    page: int
    per_page: int


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|paid|cancelled|completed)$")


def _booking_to_response(booking) -> BookingResponse:
    return BookingResponse(
        id=booking.id,
        tour_id=booking.tour_id,
        user_id=booking.user_id,
        num_participants=booking.num_participants,
        scheduled_date=booking.scheduled_date,
        status=booking.status,
        contact_name=booking.contact_name,
        contact_phone=booking.contact_phone,
        contact_email=booking.contact_email,
        special_requests=booking.special_requests,
        created_at=booking.created_at,
        tour_name=booking.tour.name if hasattr(booking, 'tour') and booking.tour else None,
        user_name=booking.user.full_name if hasattr(booking, 'user') and booking.user else None,
        user_email=booking.user.email if hasattr(booking, 'user') and booking.user else None,
    )


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create booking",
)
async def create_booking(
    data: BookingCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Create a new tour booking."""
    service = BookingService(db)
    booking = await service.create_booking(
        user=current_user,
        tour_id=data.tour_id,
        num_participants=data.num_participants,
        scheduled_date=data.scheduled_date,
        contact_name=data.contact_name,
        contact_phone=data.contact_phone,
        contact_email=data.contact_email,
        special_requests=data.special_requests,
    )
    return _booking_to_response(booking)


@router.get(
    "/my",
    response_model=BookingListResponse,
    summary="Get my bookings",
)
async def get_my_bookings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Get current user's bookings."""
    service = BookingService(db)
    bookings, total = await service.get_user_bookings(
        user_id=current_user.id,
        status=status,
        page=page,
        per_page=per_page,
    )
    
    return BookingListResponse(
        items=[_booking_to_response(b) for b in bookings],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/tour/{tour_id}",
    response_model=BookingListResponse,
    summary="Get tour bookings",
    dependencies=[Depends(require_roles(UserRole.GUIDE, UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def get_tour_bookings(
    tour_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookings for a tour."""
    service = BookingService(db)
    bookings, total = await service.get_tour_bookings(
        tour_id=tour_id,
        page=page,
        per_page=per_page,
    )
    
    return BookingListResponse(
        items=[_booking_to_response(b) for b in bookings],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "",
    response_model=BookingListResponse,
    summary="Get all bookings",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def get_all_bookings(
    status: Optional[str] = Query(None),
    agency_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookings (admin)."""
    service = BookingService(db)
    bookings, total = await service.get_all_bookings(
        status=status,
        agency_id=agency_id,
        page=page,
        per_page=per_page,
    )
    
    return BookingListResponse(
        items=[_booking_to_response(b) for b in bookings],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/stats",
    summary="Get booking statistics",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_booking_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get booking statistics for admin dashboard."""
    service = BookingService(db)
    return await service.get_booking_stats()


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Get booking details",
)
async def get_booking(
    booking_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get booking details by ID."""
    service = BookingService(db)
    booking = await service.get_booking(booking_id)
    
    # Check access
    if booking.user_id != current_user.id and current_user.role == UserRole.TOURIST:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    
    return _booking_to_response(booking)


@router.patch(
    "/{booking_id}/status",
    response_model=BookingResponse,
    summary="Update booking status",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def update_booking_status(
    booking_id: uuid.UUID,
    data: BookingStatusUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update booking status."""
    service = BookingService(db)
    booking = await service.update_booking_status(
        booking_id=booking_id,
        new_status=data.status,
        updated_by=current_user,
    )
    return _booking_to_response(booking)


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    summary="Cancel booking",
)
async def cancel_booking(
    booking_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Cancel a booking."""
    service = BookingService(db)
    
    # Check permission
    booking = await service.get_booking(booking_id)
    if booking.user_id != current_user.id and current_user.role == UserRole.TOURIST:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    
    booking = await service.cancel_booking(
        booking_id=booking_id,
        cancelled_by=current_user,
    )
    return _booking_to_response(booking)


class AssignGuideRequest(BaseModel):
    """Request to assign a guide to a booking."""
    guide_id: uuid.UUID


@router.post(
    "/{booking_id}/assign",
    response_model=BookingResponse,
    summary="Assign guide to booking",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def assign_guide_to_booking(
    booking_id: uuid.UUID,
    data: AssignGuideRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Assign a guide to a booking.
    
    This will:
    - Update the booking with the assigned guide
    - Set status to 'assigned'
    - Notify the tourist via email/push
    - Notify the guide via push notification
    """
    service = BookingService(db)
    booking = await service.assign_guide(
        booking_id=booking_id,
        guide_id=data.guide_id,
        assigned_by=current_user,
    )
    return _booking_to_response(booking)
