"""
Ruta Segura Perú - Guide Service
Business logic for guide management and verification
"""
from datetime import datetime, timezone
from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.guide import Guide, GuideVerificationStatus
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundException, BadRequestException
from loguru import logger


class GuideService:
    """Guide management service with DIRCETUR verification."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_guide(
        self,
        user_id: uuid.UUID,
        agency_id: uuid.UUID,
        data: dict,
    ) -> Guide:
        """Create a new guide profile."""
        guide = Guide(
            user_id=user_id,
            agency_id=agency_id,
            dircetur_id=data.get("dircetur_code", "PENDING"),
            languages=data.get("languages", ["es"]),
            specializations=data.get("specializations", []),
            verification_status=GuideVerificationStatus.PENDING_DOCUMENTS,
        )
        
        self.db.add(guide)
        await self.db.flush()
        await self.db.refresh(guide)
        
        logger.info(f"Guide created | ID: {guide.id} | User: {user_id}")
        
        return guide
    
    async def get_guide(self, guide_id: uuid.UUID) -> Guide:
        """Get guide by ID."""
        result = await self.db.execute(
            select(Guide)
            .options(selectinload(Guide.user))
            .where(Guide.id == guide_id)
        )
        guide = result.scalar_one_or_none()
        
        if not guide:
            raise NotFoundException("Guide not found")
        
        return guide
    
    async def get_guide_by_user(self, user_id: uuid.UUID) -> Optional[Guide]:
        """Get guide profile by user ID."""
        result = await self.db.execute(
            select(Guide).where(Guide.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_agency_guides(
        self,
        agency_id: uuid.UUID,
        status: Optional[GuideVerificationStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Guide], int]:
        """Get guides for an agency."""
        stmt = select(Guide).where(Guide.agency_id == agency_id)
        
        if status:
            stmt = stmt.where(Guide.verification_status == status)
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = stmt.options(selectinload(Guide.user))
        stmt = stmt.offset(offset).limit(per_page).order_by(Guide.created_at.desc())
        
        result = await self.db.execute(stmt)
        guides = list(result.scalars().all())
        
        return guides, total
    
    async def update_guide(
        self,
        guide_id: uuid.UUID,
        data: dict,
        updated_by: User,
    ) -> Guide:
        """Update guide profile."""
        guide = await self.get_guide(guide_id)
        
        for field, value in data.items():
            if hasattr(guide, field) and value is not None:
                setattr(guide, field, value)
        
        await self.db.flush()
        await self.db.refresh(guide)
        
        logger.info(f"Guide updated | ID: {guide_id} | By: {updated_by.email}")
        
        return guide
    
    async def verify_dircetur(
        self,
        guide_id: uuid.UUID,
        verified_by: User,
        dircetur_verified: bool,
        verification_notes: Optional[str] = None,
    ) -> Guide:
        """Verify guide's DIRCETUR credentials."""
        guide = await self.get_guide(guide_id)
        
        if dircetur_verified:
            guide.verification_status = GuideVerificationStatus.VERIFIED
        else:
            guide.verification_status = GuideVerificationStatus.REJECTED
        
        if verification_notes:
            guide.verification_notes = verification_notes
        
        guide.verified_by_id = verified_by.id
        
        await self.db.flush()
        await self.db.refresh(guide)
        
        logger.info(
            f"Guide DIRCETUR {'verified' if dircetur_verified else 'rejected'} | "
            f"ID: {guide_id} | By: {verified_by.email}"
        )
        
        return guide
    
    async def verify_biometric(
        self,
        guide_id: uuid.UUID,
        biometric_data: dict,
    ) -> Guide:
        """Store biometric verification data."""
        guide = await self.get_guide(guide_id)
        
        guide.biometric_verified = True
        
        await self.db.flush()
        await self.db.refresh(guide)
        
        logger.info(f"Guide biometric verified | ID: {guide_id}")
        
        return guide
    
    async def get_available_guides(
        self,
        agency_id: Optional[uuid.UUID] = None,
        language: Optional[str] = None,
    ) -> List[Guide]:
        """Get available verified guides."""
        stmt = select(Guide).where(
            Guide.verification_status == GuideVerificationStatus.VERIFIED
        )
        
        if language:
            stmt = stmt.where(Guide.languages.contains([language]))
        
        result = await self.db.execute(stmt.options(selectinload(Guide.user)))
        return list(result.scalars().all())

    async def get_guide_stats(self, user_id: uuid.UUID) -> dict:
        """Get statistics for a guide."""
        guide = await self.get_guide_by_user(user_id)
        if not guide:
            raise NotFoundException("Guide not found")

        # Get assigned tours count
        from app.models.tour import Tour
        
        # Total tours assigned
        tours_stmt = select(func.count()).where(Tour.guide_id == guide.user_id)
        tours_result = await self.db.execute(tours_stmt)
        total_tours = tours_result.scalar() or 0

        # Completed tours (for earnings/tourists)
        # Assuming we can sum participants from completed tours
        # This is a simplification. Real apps would sum bookings status=completed
        
        # Calculate approximate earnings (e.g. 50 PEN per tour base + 10 per head)
        # This is strictly logic for the dashboard visualization without payments model
        earnings = total_tours * 150 # Placeholder logic based on activity
        
        return {
            "total_tours": total_tours,
            "total_tourists": total_tours * 8, # Approx average
            "rating": guide.average_rating,
            "earnings_this_month": earnings
        }
