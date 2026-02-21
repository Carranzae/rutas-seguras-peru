"""
Ruta Segura Perú - Guides Router
Guide management and verification endpoints
"""
import uuid
from typing import Optional, List
import json
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.guide_service import GuideService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole
from app.models.guide import GuideVerificationStatus
from pydantic import BaseModel, Field
from datetime import datetime
from fastapi import UploadFile, File, Form
from app.routers.uploads import save_file, validate_file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE

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


@router.post(
    "/public/register",
    response_model=GuideResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new guide publicly (Requires Approval)",
)
async def public_register_guide(
    # User Data
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    phone: Optional[str] = Form(None),
    # Guide Data
    dircetur_license: str = Form(...),
    dni_number: str = Form(...),
    birth_date: str = Form(...),
    experience_years: str = Form("0"),
    specialties: str = Form(""),
    nationality: Optional[str] = Form(None),
    residence_city: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    # Files
    dni_photo: UploadFile = File(...),
    certificate_photo: UploadFile = File(...),
    selfie_photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint to register a guide with documents. Account remains inactive until Super Admin approval."""
    service = GuideService(db)
    
    # Validate files
    validate_file(dni_photo, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    validate_file(certificate_photo, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    validate_file(selfie_photo, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    
    # Process files
    # Note: we don't have the guide ID yet, so we use a temporary session folder or email hash
    import hashlib
    email_hash = hashlib.md5(email.encode()).hexdigest()
    base_dir = f"guides/pending/{email_hash}"
    
    dni_url = save_file(dni_photo, f"{base_dir}/dni")
    cert_url = save_file(certificate_photo, f"{base_dir}/cert")
    selfie_url = save_file(selfie_photo, f"{base_dir}/selfie")
    
    user_data = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "phone": phone,
    }
    
    guide_data = {
        "dircetur_license": dircetur_license,
        "dni_number": dni_number,
        "birth_date": birth_date,
        "experience_years": int(experience_years) if experience_years.isdigit() else 0,
        "specialties": [s.strip() for s in specialties.split(",") if s.strip()] if specialties else [],
        "nationality": nationality,
        "residence_city": residence_city,
        "department": department,
    }
    
    verification_data = {
        "dircetur_front_url": cert_url,
        "dircetur_back_url": dni_url,  # storing DNI as backup doc for now since model allows back
        "selfie_url": selfie_url,
    }
    
    try:
        guide = await service.register_public_guide(user_data, guide_data, verification_data)
        return _guide_to_response(guide)
    except Exception as e:
        # Avoid orphan files if db transaction fails (optional cleanup)
        # For a robust solution, you'd delete the uploaded files here.
        raise HTTPException(status_code=400, detail=str(e))



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


@router.post(
    "/{guide_id}/documents",
    response_model=dict,
    summary="Upload guide document",
)
async def upload_guide_document(
    guide_id: uuid.UUID,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Upload a document for a guide."""
    service = GuideService(db)
    # Ensure guide exists
    guide = await service.get_guide(guide_id)
    
    validate_file(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE)
    
    # Save file
    subdir = f"guides/{guide_id}/{document_type}"
    url = save_file(file, subdir)
    
    # Update guide document URL
    if document_type == "dircetur_front":
        guide.dircetur_front_image_url = url
    elif document_type == "dircetur_back":
        guide.dircetur_back_image_url = url
    elif document_type == "selfie":
        guide.selfie_image_url = url
        
    await db.commit()
    
    return {"url": url}

@router.post(
    "/{guide_id}/verify-biometric",
    response_model=dict,
    summary="Verify biometric data",
)
async def verify_biometric_data(
    guide_id: uuid.UUID,
    data: dict,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Verify biometric data for a guide."""
    service = GuideService(db)
    guide = await service.verify_biometric(
        guide_id=guide_id,
        biometric_data=data,
    )
    await db.commit()
    return {"status": "success"}

@router.post(
    "/{guide_id}/submit-verification",
    response_model=GuideResponse,
    summary="Submit complete verification",
)
async def submit_verification(
    guide_id: uuid.UUID,
    data: dict,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Submit guide verification."""
    service = GuideService(db)
    guide = await service.submit_verification(
        guide_id=guide_id,
        data=data,
    )
    await db.commit()
    return _guide_to_response(guide)

@router.get(
    "/{guide_id}/verification-status",
    response_model=dict,
    summary="Get verification status",
)
async def get_verification_status(
    guide_id: uuid.UUID,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Get guide verification status."""
    service = GuideService(db)
    status = await service.get_verification_status(guide_id)
    return status

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
