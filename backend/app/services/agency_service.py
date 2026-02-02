"""
Ruta Segura Perú - Agency Service
Business logic for agency management
"""
from datetime import datetime, timezone
from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.agency import Agency, AgencyStatus
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundException, BadRequestException
from loguru import logger


class AgencyService:
    """Agency management service."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_agency(self, data: dict, owner: User) -> Agency:
        """Create a new agency."""
        agency = Agency(
            business_name=data["business_name"],
            legal_name=data.get("legal_name"),
            ruc=data["ruc"],
            email=data["email"],
            phone=data.get("phone"),
            address=data.get("address"),
            city=data.get("city"),
            department=data.get("department"),
            description=data.get("description"),
            website=data.get("website"),
            status=AgencyStatus.PENDING,
        )
        
        self.db.add(agency)
        await self.db.flush()
        
        # Link owner to agency
        owner.agency_id = agency.id
        owner.role = UserRole.AGENCY_ADMIN
        
        await self.db.refresh(agency)
        
        logger.info(f"Agency created | ID: {agency.id} | Name: {agency.business_name}")
        
        return agency
    
    async def get_agency(self, agency_id: uuid.UUID) -> Agency:
        """Get agency by ID."""
        result = await self.db.execute(
            select(Agency).where(Agency.id == agency_id)
        )
        agency = result.scalar_one_or_none()
        
        if not agency:
            raise NotFoundException("Agency not found")
        
        return agency
    
    async def get_all_agencies(
        self,
        status: Optional[AgencyStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Agency], int]:
        """Get all agencies with filters."""
        stmt = select(Agency)
        
        if status:
            stmt = stmt.where(Agency.status == status)
        
        if search:
            stmt = stmt.where(
                Agency.business_name.ilike(f"%{search}%") |
                Agency.ruc.ilike(f"%{search}%")
            )
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(Agency.created_at.desc())
        
        result = await self.db.execute(stmt)
        agencies = list(result.scalars().all())
        
        return agencies, total
    
    async def update_agency(
        self,
        agency_id: uuid.UUID,
        data: dict,
        updated_by: User,
    ) -> Agency:
        """Update agency details."""
        agency = await self.get_agency(agency_id)
        
        for field, value in data.items():
            if hasattr(agency, field) and value is not None:
                setattr(agency, field, value)
        
        await self.db.flush()
        await self.db.refresh(agency)
        
        logger.info(f"Agency updated | ID: {agency_id} | By: {updated_by.email}")
        
        return agency
    
    async def verify_agency(
        self,
        agency_id: uuid.UUID,
        verified_by: User,
        approved: bool,
        notes: Optional[str] = None,
    ) -> Agency:
        """Verify/approve an agency (super admin only)."""
        agency = await self.get_agency(agency_id)
        
        if approved:
            agency.status = AgencyStatus.VERIFIED
            agency.verified_at = datetime.now(timezone.utc)
        else:
            agency.status = AgencyStatus.REJECTED
        
        if notes:
            agency.verification_notes = notes
        
        await self.db.flush()
        await self.db.refresh(agency)
        
        logger.info(
            f"Agency {'verified' if approved else 'rejected'} | "
            f"ID: {agency_id} | By: {verified_by.email}"
        )
        
        return agency
    
    async def get_agency_stats(self, agency_id: uuid.UUID) -> dict:
        """Get agency statistics."""
        from app.models.tour import Tour
        from app.models.guide import Guide
        
        # Count tours
        tours_result = await self.db.execute(
            select(func.count(Tour.id)).where(Tour.agency_id == agency_id)
        )
        total_tours = tours_result.scalar() or 0
        
        # Count guides
        guides_result = await self.db.execute(
            select(func.count(Guide.id)).where(Guide.agency_id == agency_id)
        )
        total_guides = guides_result.scalar() or 0
        
        return {
            "total_tours": total_tours,
            "total_guides": total_guides,
            "active_tours": 0,  # TODO: Count active
            "total_bookings": 0,  # TODO: Count bookings
            "total_revenue": 0,  # TODO: Sum payments
        }
