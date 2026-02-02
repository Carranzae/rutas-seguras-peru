"""
Ruta Segura Perú - Agencies Router
Agency management endpoints
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.agency_service import AgencyService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole
from app.models.agency import AgencyStatus
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

router = APIRouter(prefix="/agencies", tags=["Agencies"])


# Schemas
class AgencyCreate(BaseModel):
    business_name: str = Field(..., min_length=3)
    legal_name: Optional[str] = None
    ruc: str = Field(..., min_length=11, max_length=11)
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None


class AgencyUpdate(BaseModel):
    business_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None


class AgencyResponse(BaseModel):
    id: uuid.UUID
    business_name: str
    legal_name: Optional[str] = None
    ruc: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    status: str
    created_at: datetime
    verified_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AgencyListResponse(BaseModel):
    items: List[AgencyResponse]
    total: int
    page: int
    per_page: int


@router.get(
    "",
    response_model=AgencyListResponse,
    summary="List agencies",
)
async def list_agencies(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all agencies with filters."""
    service = AgencyService(db)
    status_enum = AgencyStatus(status) if status else None
    agencies, total = await service.get_all_agencies(
        status=status_enum,
        search=search,
        page=page,
        per_page=per_page,
    )
    
    return AgencyListResponse(
        items=[AgencyResponse.model_validate(a) for a in agencies],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/{agency_id}",
    response_model=AgencyResponse,
    summary="Get agency details",
)
async def get_agency(
    agency_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get agency details by ID."""
    service = AgencyService(db)
    agency = await service.get_agency(agency_id)
    return AgencyResponse.model_validate(agency)


@router.post(
    "",
    response_model=AgencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register agency",
)
async def register_agency(
    data: AgencyCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Register a new agency."""
    service = AgencyService(db)
    agency = await service.create_agency(data.model_dump(), current_user)
    return AgencyResponse.model_validate(agency)


@router.patch(
    "/{agency_id}",
    response_model=AgencyResponse,
    summary="Update agency",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN))],
)
async def update_agency(
    agency_id: uuid.UUID,
    data: AgencyUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update agency details."""
    service = AgencyService(db)
    agency = await service.update_agency(
        agency_id=agency_id,
        data=data.model_dump(exclude_unset=True),
        updated_by=current_user,
    )
    return AgencyResponse.model_validate(agency)


@router.post(
    "/{agency_id}/verify",
    response_model=AgencyResponse,
    summary="Verify agency",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def verify_agency(
    agency_id: uuid.UUID,
    approved: bool = True,
    notes: Optional[str] = None,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Verify/approve an agency (super admin only)."""
    service = AgencyService(db)
    agency = await service.verify_agency(
        agency_id=agency_id,
        verified_by=current_user,
        approved=approved,
        notes=notes,
    )
    return AgencyResponse.model_validate(agency)


@router.get(
    "/{agency_id}/stats",
    summary="Get agency statistics",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def get_agency_stats(
    agency_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get agency statistics."""
    service = AgencyService(db)
    return await service.get_agency_stats(agency_id)
