"""
Ruta Segura Perú - Guides Router
Guide management and verification endpoints
"""
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.guide_service import GuideService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole
from app.models.guide import GuideVerificationStatus
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(prefix="/guides", tags=["Guides"])


# Schemas
class GuideCreate(BaseModel):
    dircetur_code: Optional[str] = None
    license_number: Optional[str] = None
    languages: List[str] = Field(default=["es"])
    specializations: List[str] = Field(default_factory=list)
    bio: Optional[str] = None
    years_experience: int = Field(default=0, ge=0)


class GuideUpdate(BaseModel):
    languages: Optional[List[str]] = None
    specializations: Optional[List[str]] = None
    bio: Optional[str] = None
    years_experience: Optional[int] = None


class GuideResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    agency_id: Optional[uuid.UUID] = None
    dircetur_id: Optional[str] = None
    biometric_verified: bool = False
    languages: List[str] = []
    specializations: List[str] = []
    average_rating: float = 0
    verification_status: str
    created_at: datetime
    
    # User info
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True


class GuideListResponse(BaseModel):
    items: List[GuideResponse]
    total: int
    page: int
    per_page: int


def _guide_to_response(guide) -> GuideResponse:
    return GuideResponse(
        id=guide.id,
        user_id=guide.user_id,
        agency_id=guide.agency_id,
        dircetur_id=guide.dircetur_id,
        biometric_verified=guide.biometric_verified or False,
        languages=guide.languages or [],
        specializations=guide.specializations or [],
        average_rating=guide.average_rating or 0,
        verification_status=guide.verification_status.value if guide.verification_status else "pending_documents",
        created_at=guide.created_at,
        full_name=guide.user.full_name if hasattr(guide, 'user') and guide.user else None,
        email=guide.user.email if hasattr(guide, 'user') and guide.user else None,
        phone=guide.user.phone if hasattr(guide, 'user') and guide.user else None,
    )


@router.get(
    "",
    response_model=GuideListResponse,
    summary="List guides",
)
async def list_guides(
    agency_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """List guides with filters."""
    service = GuideService(db)
    
    # If agency admin, only show their guides
    if current_user and current_user.role == UserRole.AGENCY_ADMIN and current_user.agency_id:
        agency_id = current_user.agency_id
    
    status_enum = GuideVerificationStatus(status) if status else None
    guides, total = await service.get_agency_guides(
        agency_id=agency_id,
        status=status_enum,
        page=page,
        per_page=per_page,
    )
    
    return GuideListResponse(
        items=[_guide_to_response(g) for g in guides],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/available",
    response_model=List[GuideResponse],
    summary="Get available guides",
)
async def get_available_guides(
    agency_id: Optional[uuid.UUID] = Query(None),
    language: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get available verified guides."""
    service = GuideService(db)
    guides = await service.get_available_guides(
        agency_id=agency_id,
        language=language,
    )
    return [_guide_to_response(g) for g in guides]


@router.get(
    "/me",
    response_model=GuideResponse,
    summary="Get my guide profile",
    dependencies=[Depends(require_roles(UserRole.GUIDE))],
)
async def get_my_guide_profile(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get current user's guide profile."""
    service = GuideService(db)
    guide = await service.get_guide_by_user(current_user.id)
    if not guide:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Guide profile not found")
    return _guide_to_response(guide)


@router.get(
    "/{guide_id}",
    response_model=GuideResponse,
    summary="Get guide details",
)
async def get_guide(
    guide_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get guide details by ID."""
    service = GuideService(db)
    guide = await service.get_guide(guide_id)
    return _guide_to_response(guide)


@router.post(
    "",
    response_model=GuideResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create guide profile",
)
async def create_guide(
    data: GuideCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Create a new guide profile."""
    service = GuideService(db)
    guide = await service.create_guide(
        user_id=current_user.id,
        agency_id=current_user.agency_id,
        data=data.model_dump(),
    )
    return _guide_to_response(guide)


@router.patch(
    "/{guide_id}",
    response_model=GuideResponse,
    summary="Update guide profile",
)
async def update_guide(
    guide_id: uuid.UUID,
    data: GuideUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update guide profile."""
    service = GuideService(db)
    guide = await service.update_guide(
        guide_id=guide_id,
        data=data.model_dump(exclude_unset=True),
        updated_by=current_user,
    )
    return _guide_to_response(guide)


@router.post(
    "/{guide_id}/verify-dircetur",
    response_model=GuideResponse,
    summary="Verify DIRCETUR credentials",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN))],
)
async def verify_dircetur(
    guide_id: uuid.UUID,
    approved: bool = True,
    notes: Optional[str] = None,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Verify guide's DIRCETUR credentials."""
    service = GuideService(db)
    guide = await service.verify_dircetur(
        guide_id=guide_id,
        verified_by=current_user,
        dircetur_verified=approved,
        verification_notes=notes,
    )
    return _guide_to_response(guide)


    service = GuideService(db)
    guide = await service.verify_biometric(
        guide_id=guide_id,
        biometric_data={},
    )
    return _guide_to_response(guide)


@router.get(
    "/me/stats",
    summary="Get my stats",
    dependencies=[Depends(require_roles(UserRole.GUIDE))],
)
async def get_my_stats(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for the current guide."""
    service = GuideService(db)
    # This calls a service method to aggregate stats
    stats = await service.get_guide_stats(current_user.id)
    return stats
