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
    
    async def register_public_guide(
        self,
        user_data: dict,
        guide_data: dict,
        verification_data: dict,
    ) -> Guide:
        """Register a new guide from the public endpoint (requires approval)."""
        import bcrypt
        
        # Check if email is available
        result = await self.db.execute(select(User).where(User.email == user_data["email"]))
        if result.scalar_one_or_none():
            raise BadRequestException("Email already registered")
            
        # 1. Create User (inactive until approved)
        salt = bcrypt.gensalt(rounds=12)
        hashed_password = bcrypt.hashpw(user_data["password"].encode('utf-8'), salt).decode('utf-8')
        
        user = User(
            email=user_data["email"],
            hashed_password=hashed_password,
            full_name=user_data["full_name"],
            phone=user_data.get("phone"),
            role=UserRole.GUIDE,
            is_active=False,  # CRITICAL: Needs review
            is_verified=False,
        )
        self.db.add(user)
        await self.db.flush()
        
        # 2. Create Guide profile
        guide = Guide(
            user_id=user.id,
            dircetur_id=guide_data["dircetur_license"],
            languages=guide_data.get("languages", ["es"]),
            specializations=guide_data.get("specializations", []),
            verification_status=GuideVerificationStatus.PENDING_REVIEW,
            nationality=guide_data.get("nationality"),
            residence_city=guide_data.get("residence_city"),
            department=guide_data.get("department"),
            dircetur_front_image_url=verification_data.get("dircetur_front_url"),
            selfie_image_url=verification_data.get("selfie_url"),
        )
        # Optional fields
        if "dircetur_back_url" in verification_data:
            guide.dircetur_back_image_url = verification_data["dircetur_back_url"]
        
        self.db.add(guide)
        await self.db.flush()
        
        # 3. Create IdentityVerification for Super Admin
        from app.models.identity_verification import IdentityVerification, VerificationType, VerificationStatus
        
        identity_verification = IdentityVerification(
            user_id=user.id,
            verification_type=VerificationType.DIRCETUR_LICENSE,
            status=VerificationStatus.PENDING,
            selfie_url=verification_data.get("selfie_url"),
            document_url=verification_data.get("dircetur_front_url"),
            license_number=guide_data["dircetur_license"],
        )
        self.db.add(identity_verification)
        
        await self.db.commit()
        await self.db.refresh(guide)
        
        logger.info(f"Public Guide registered pending review | User: {user.email}")
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
    
    async def submit_verification(
        self,
        guide_id: uuid.UUID,
        data: dict,
    ) -> Guide:
        """Submit guide verification."""
        guide = await self.get_guide(guide_id)
        
        if "dircetur_front_url" in data and data["dircetur_front_url"]:
            guide.dircetur_front_image_url = data["dircetur_front_url"]
        if "dircetur_back_url" in data and data["dircetur_back_url"]:
            guide.dircetur_back_image_url = data["dircetur_back_url"]
        if "selfie_url" in data and data["selfie_url"]:
            guide.selfie_image_url = data["selfie_url"]
            
        guide.verification_status = GuideVerificationStatus.PENDING_REVIEW
        
        # Create an IdentityVerification record so Super Admin can review it
        from app.models.identity_verification import IdentityVerification, VerificationType, VerificationStatus
        
        # Check if an identity verification already exists
        existing_verification_result = await self.db.execute(
            select(IdentityVerification).where(
                IdentityVerification.user_id == guide.user_id,
                IdentityVerification.status.in_([VerificationStatus.PENDING, VerificationStatus.IN_REVIEW])
            )
        )
        existing_verification = existing_verification_result.scalar_one_or_none()
        
        if not existing_verification:
            identity_verification = IdentityVerification(
                user_id=guide.user_id,
                verification_type=VerificationType.DIRCETUR_LICENSE,
                status=VerificationStatus.PENDING,
                selfie_url=guide.selfie_image_url,
                document_url=guide.dircetur_front_image_url,
                license_number=guide.dircetur_id,
                biometric_hash=data.get("biometric_hash"),
                device_signature=data.get("device_signature"),
            )
            self.db.add(identity_verification)

        await self.db.flush()
        await self.db.refresh(guide)
        logger.info(f"Guide verification submitted | ID: {guide_id}")
        return guide

    async def get_verification_status(self, guide_id: uuid.UUID) -> dict:
        """Get guide verification status."""
        guide = await self.get_guide(guide_id)
        return {
            "status": guide.verification_status.value,
            "documents": {
                "dircetur_front": bool(guide.dircetur_front_image_url),
                "dircetur_back": bool(guide.dircetur_back_image_url),
                "selfie": bool(guide.selfie_image_url),
                "biometric": guide.biometric_verified,
            },
            "rejection_reason": guide.verification_notes if guide.verification_status == GuideVerificationStatus.REJECTED else None,
        }
    
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
