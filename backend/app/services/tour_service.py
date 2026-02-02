"""
Ruta Segura Perú - Tours Service
Business logic for tour management, search, and reservations
"""
from datetime import datetime, timezone
from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.tour import Tour, TourStatus
from app.models.agency import Agency
from app.models.guide import Guide
from app.models.user import User
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from loguru import logger


class TourService:
    """Tour management service with search and booking capabilities."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_tour(
        self,
        agency_id: uuid.UUID,
        data: dict,
        created_by: User,
    ) -> Tour:
        """Create a new tour."""
        tour = Tour(
            name=data["name"],
            description=data.get("description"),
            agency_id=agency_id,
            guide_id=data.get("guide_id"),
            price=data["price"],
            currency=data.get("currency", "PEN"),
            duration_hours=data.get("duration_hours"),
            max_participants=data.get("max_participants", 10),
            difficulty_level=data.get("difficulty_level", "moderate"),
            included_services=data.get("included_services", []),
            meeting_point=data.get("meeting_point"),
            status=TourStatus.DRAFT,
        )
        
        self.db.add(tour)
        await self.db.flush()
        await self.db.refresh(tour)
        
        logger.info(f"Tour created | ID: {tour.id} | Agency: {agency_id} | Name: {tour.name}")
        
        return tour
    
    async def get_tour(self, tour_id: uuid.UUID) -> Tour:
        """Get tour by ID with related data."""
        result = await self.db.execute(
            select(Tour)
            .options(selectinload(Tour.agency), selectinload(Tour.guide))
            .where(Tour.id == tour_id)
        )
        tour = result.scalar_one_or_none()
        
        if not tour:
            raise NotFoundException("Tour not found")
        
        return tour
    
    async def search_tours(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        difficulty: Optional[str] = None,
        guide_id: Optional[uuid.UUID] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Tour], int]:
        """Search tours with filters."""
        # By default only published, but if guide_id is present we might show others?
        # For now strict to PUBLISHED unless we want assigned upcoming which could be published
        stmt = select(Tour).where(Tour.status != TourStatus.CANCELLED)
        
        if guide_id:
             stmt = stmt.where(Tour.guide_id == guide_id)
        else:
             stmt = stmt.where(Tour.status == TourStatus.PUBLISHED)
        
        # Text search
        if query:
            search_filter = or_(
                Tour.name.ilike(f"%{query}%"),
                Tour.description.ilike(f"%{query}%"),
            )
            stmt = stmt.where(search_filter)
        
        # Price filter
        if min_price is not None:
            stmt = stmt.where(Tour.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Tour.price <= max_price)
        
        # Difficulty filter
        if difficulty:
            stmt = stmt.where(Tour.difficulty_level == difficulty)
        
        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(Tour.created_at.desc())
        
        result = await self.db.execute(stmt)
        tours = list(result.scalars().all())
        
        return tours, total
    
    async def get_agency_tours(
        self,
        agency_id: uuid.UUID,
        status: Optional[TourStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Tour], int]:
        """Get tours for a specific agency."""
        stmt = select(Tour).where(Tour.agency_id == agency_id)
        
        if status:
            stmt = stmt.where(Tour.status == status)
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(Tour.created_at.desc())
        
        result = await self.db.execute(stmt)
        tours = list(result.scalars().all())
        
        return tours, total

    async def update_tour_status(
        self,
        tour_id: uuid.UUID,
        status: str,
        updated_by: User,
    ) -> Tour:
        """Update tour status (e.g., complete a tour)."""
        tour = await self.get_tour(tour_id)
        
        # Add logic here for validating transitions if needed
        tour.status = status
        
        await self.db.flush()
        await self.db.refresh(tour)
        
        logger.info(f"Tour status updated | ID: {tour_id} | Status: {status} | By: {updated_by.email}")
        return tour
    
    async def update_tour(
        self,
        tour_id: uuid.UUID,
        data: dict,
        updated_by: User,
    ) -> Tour:
        """Update tour details."""
        tour = await self.get_tour(tour_id)
        
        # Update fields
        for field, value in data.items():
            if hasattr(tour, field) and value is not None:
                setattr(tour, field, value)
        
        await self.db.flush()
        await self.db.refresh(tour)
        
        logger.info(f"Tour updated | ID: {tour_id} | By: {updated_by.email}")
        
        return tour
    
    async def publish_tour(self, tour_id: uuid.UUID, published_by: User) -> Tour:
        """Publish a tour (make it visible to tourists)."""
        tour = await self.get_tour(tour_id)
        
        if tour.status == TourStatus.PUBLISHED:
            raise BadRequestException("Tour is already published")
        
        tour.status = TourStatus.PUBLISHED
        await self.db.flush()
        await self.db.refresh(tour)
        
        logger.info(f"Tour published | ID: {tour_id} | By: {published_by.email}")
        
        return tour
    
    async def delete_tour(self, tour_id: uuid.UUID, deleted_by: User) -> None:
        """Soft delete a tour."""
        tour = await self.get_tour(tour_id)
        tour.status = TourStatus.CANCELLED
        await self.db.flush()
        
        logger.info(f"Tour deleted | ID: {tour_id} | By: {deleted_by.email}")
    
    async def get_featured_tours(self, limit: int = 10) -> List[Tour]:
        """Get featured/popular tours for homepage."""
        result = await self.db.execute(
            select(Tour)
            .where(Tour.status == TourStatus.PUBLISHED)
            .order_by(Tour.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
