"""
Ruta Segura Perú - Booking Service
Business logic for tour reservations
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.payment import Booking
from app.models.tour import Tour
from app.models.user import User
from app.core.exceptions import NotFoundException, BadRequestException
from loguru import logger


class BookingService:
    """
    Booking management service.
    Handles tour reservations and booking lifecycle.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_booking(
        self,
        user: User,
        tour_id: uuid.UUID,
        num_participants: int,
        scheduled_date: datetime,
        contact_name: str,
        contact_phone: str,
        contact_email: str,
        special_requests: Optional[str] = None,
    ) -> Booking:
        """Create a new tour booking."""
        # Get tour
        tour_result = await self.db.execute(
            select(Tour).where(Tour.id == tour_id)
        )
        tour = tour_result.scalar_one_or_none()
        
        if not tour:
            raise NotFoundException("Tour not found")
        
        # Check availability
        if num_participants > tour.max_participants:
            raise BadRequestException(
                f"Maximum {tour.max_participants} participants allowed"
            )
        
        booking = Booking(
            tour_id=tour_id,
            user_id=user.id,
            num_participants=num_participants,
            scheduled_date=scheduled_date,
            status="pending",
            contact_name=contact_name,
            contact_phone=contact_phone,
            contact_email=contact_email,
            special_requests=special_requests,
        )
        
        self.db.add(booking)
        await self.db.flush()
        await self.db.refresh(booking)
        
        logger.info(
            f"Booking created | ID: {booking.id} | "
            f"Tour: {tour_id} | User: {user.email}"
        )
        
        return booking
    
    async def get_booking(self, booking_id: uuid.UUID) -> Booking:
        """Get booking by ID."""
        result = await self.db.execute(
            select(Booking)
            .options(selectinload(Booking.tour), selectinload(Booking.user))
            .where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        
        if not booking:
            raise NotFoundException("Booking not found")
        
        return booking
    
    async def get_user_bookings(
        self,
        user_id: uuid.UUID,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Booking], int]:
        """Get bookings for a user."""
        stmt = select(Booking).where(Booking.user_id == user_id)
        
        if status:
            stmt = stmt.where(Booking.status == status)
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = (
            stmt
            .options(selectinload(Booking.tour))
            .offset(offset)
            .limit(per_page)
            .order_by(Booking.created_at.desc())
        )
        
        result = await self.db.execute(stmt)
        bookings = list(result.scalars().all())
        
        return bookings, total
    
    async def get_tour_bookings(
        self,
        tour_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Booking], int]:
        """Get bookings for a tour."""
        stmt = select(Booking).where(Booking.tour_id == tour_id)
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = (
            stmt
            .options(selectinload(Booking.user))
            .offset(offset)
            .limit(per_page)
            .order_by(Booking.scheduled_date.asc())
        )
        
        result = await self.db.execute(stmt)
        bookings = list(result.scalars().all())
        
        return bookings, total
    
    async def get_all_bookings(
        self,
        status: Optional[str] = None,
        agency_id: Optional[uuid.UUID] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Booking], int]:
        """Get all bookings (admin)."""
        stmt = select(Booking).options(
            selectinload(Booking.tour),
            selectinload(Booking.user),
        )
        
        if status:
            stmt = stmt.where(Booking.status == status)
        
        if agency_id:
            # Filter by agency through tour
            stmt = stmt.join(Tour).where(Tour.agency_id == agency_id)
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(Booking.created_at.desc())
        
        result = await self.db.execute(stmt)
        bookings = list(result.scalars().all())
        
        return bookings, total
    
    async def update_booking_status(
        self,
        booking_id: uuid.UUID,
        new_status: str,
        updated_by: User,
    ) -> Booking:
        """Update booking status."""
        booking = await self.get_booking(booking_id)
        
        valid_statuses = ["pending", "confirmed", "paid", "cancelled", "completed"]
        if new_status not in valid_statuses:
            raise BadRequestException(f"Invalid status: {new_status}")
        
        booking.status = new_status
        
        await self.db.flush()
        await self.db.refresh(booking)
        
        logger.info(
            f"Booking status updated | ID: {booking_id} | "
            f"Status: {new_status} | By: {updated_by.email}"
        )
        
        return booking
    
    async def cancel_booking(
        self,
        booking_id: uuid.UUID,
        cancelled_by: User,
        reason: Optional[str] = None,
    ) -> Booking:
        """Cancel a booking."""
        booking = await self.get_booking(booking_id)
        
        if booking.status in ["cancelled", "completed"]:
            raise BadRequestException("Cannot cancel this booking")
        
        booking.status = "cancelled"
        
        await self.db.flush()
        await self.db.refresh(booking)
        
        logger.info(
            f"Booking cancelled | ID: {booking_id} | "
            f"By: {cancelled_by.email} | Reason: {reason}"
        )
        
        return booking
    
    async def get_booking_stats(self) -> dict:
        """Get booking statistics for admin dashboard."""
        # Total bookings
        total_result = await self.db.execute(select(func.count(Booking.id)))
        total = total_result.scalar() or 0
        
        # By status
        stats_by_status = {}
        for status in ["pending", "confirmed", "paid", "cancelled", "completed"]:
            result = await self.db.execute(
                select(func.count(Booking.id)).where(Booking.status == status)
            )
            stats_by_status[status] = result.scalar() or 0
        
        # Today's bookings
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        today_result = await self.db.execute(
            select(func.count(Booking.id)).where(Booking.created_at >= today_start)
        )
        today_count = today_result.scalar() or 0
        
        return {
            "total": total,
            "by_status": stats_by_status,
            "today": today_count,
        }
