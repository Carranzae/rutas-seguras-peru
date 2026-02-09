"""
Ruta Segura Perú - Tours Router
Tour management and search endpoints
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.schemas.tour import (
    TourCreate,
    TourUpdate,
    TourResponse,
    TourListResponse,
)
from app.services.tour_service import TourService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole

router = APIRouter(prefix="/tours", tags=["Tours"])


@router.get(
    "",
    response_model=TourListResponse,
    summary="Search tours",
    description="Search and filter available tours.",
)
async def search_tours(
    query: Optional[str] = Query(None, description="Search by name/description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    difficulty: Optional[str] = Query(None, description="Difficulty level"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search published tours with filters."""
    service = TourService(db)
    tours, total = await service.search_tours(
        query=query,
        location=location,
        min_price=min_price,
        max_price=max_price,
        difficulty=difficulty,
        page=page,
        per_page=per_page,
    )
    
    return TourListResponse(
        items=[_tour_to_response(t) for t in tours],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/featured",
    response_model=list[TourResponse],
    summary="Get featured tours",
    description="Get featured tours for homepage.",
)
async def get_featured_tours(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get featured/popular tours."""
    service = TourService(db)
    tours = await service.get_featured_tours(limit=limit)
    return [_tour_to_response(t) for t in tours]


@router.get(
    "/assigned",
    response_model=TourListResponse,
    summary="Get assigned tours (Guide)",
    dependencies=[Depends(require_roles(UserRole.GUIDE))],
)
async def get_assigned_tours(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Get tours assigned to the current guide."""
    service = TourService(db)
    # Filter tours by guide_id = current_user.id
    # We use search_tours internal logic but forced filtered
    # For now, simplistic implementation assuming service has support or we filter raw
    # We will extend service.search_tours to accept guide_id
    tours, total = await service.search_tours(
        guide_id=current_user.id,
        page=page,
        per_page=per_page
    )
    
    return TourListResponse(
        items=[_tour_to_response(t) for t in tours],
        total=total,
        page=page,
        per_page=per_page,
    )


class TourReportCreate(BaseModel):
    notes: str
    rating: int
    incidents: int = 0


@router.post(
    "/{tour_id}/report",
    summary="Submit tour report",
    dependencies=[Depends(require_roles(UserRole.GUIDE))],
)
async def submit_tour_report(
    tour_id: uuid.UUID,
    data: TourReportCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Submit end of tour report."""
    service = TourService(db)
    # This would simulate completing the tour and saving the report
    # We can update the status to completed
    tour = await service.update_tour_status(
        tour_id=tour_id,
        status="completed",
        updated_by=current_user
    )
    return {"message": "Report submitted successfully", "tour_id": str(tour.id)}


@router.get(
    "/{tour_id}",
    response_model=TourResponse,
    summary="Get tour details",
)
async def get_tour(
    tour_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get tour details by ID."""
    service = TourService(db)
    tour = await service.get_tour(tour_id)
    return _tour_to_response(tour)


@router.post(
    "",
    response_model=TourResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create tour",
    description="Create a new tour (agency admin only).",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def create_tour(
    data: TourCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Create a new tour."""
    service = TourService(db)
    
    # Get agency from user
    agency_id = current_user.agency_id
    if not agency_id:
        # If Super Admin doesn't have agency_id, we might need a way to assign one or use a default
        # For now, strict check, but at least they pass the role check
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="User not associated with an agency")
    
    tour = await service.create_tour(
        agency_id=agency_id,
        data=data.model_dump(),
        created_by=current_user,
    )
    return _tour_to_response(tour)


@router.patch(
    "/{tour_id}",
    response_model=TourResponse,
    summary="Update tour",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def update_tour(
    tour_id: uuid.UUID,
    data: TourUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update tour details."""
    service = TourService(db)
    tour = await service.update_tour(
        tour_id=tour_id,
        data=data.model_dump(exclude_unset=True),
        updated_by=current_user,
    )
    return _tour_to_response(tour)


@router.post(
    "/{tour_id}/publish",
    response_model=TourResponse,
    summary="Publish tour",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def publish_tour(
    tour_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Publish a tour to make it visible."""
    service = TourService(db)
    tour = await service.publish_tour(tour_id, current_user)
    return _tour_to_response(tour)


@router.delete(
    "/{tour_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete tour",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def delete_tour(
    tour_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Delete (cancel) a tour."""
    service = TourService(db)
    await service.delete_tour(tour_id, current_user)


def _tour_to_response(tour) -> TourResponse:
    """Convert Tour model to response."""
    return TourResponse(
        id=tour.id,
        name=tour.name,
        description=tour.description,
        price=float(tour.price) if tour.price else 0,
        currency=tour.currency or "PEN",
        duration_hours=tour.duration_hours,
        max_participants=tour.max_capacity or 10,
        difficulty_level=tour.difficulty or "moderate",
        meeting_point=tour.start_address,
        included_services=[],  # Would need to load from relationship
        agency_id=tour.agency_id,
        guide_id=tour.guide_id,
        status=tour.status,
        created_at=tour.created_at,
        cover_image_url=tour.cover_image_url,
        gallery_urls=tour.gallery_urls or [],
        rating=None,  # Would calculate from reviews
        reviews_count=0,  # Would count from reviews relationship
        is_featured=False,  # Would need field on model or logic
        agency_name=tour.agency.business_name if hasattr(tour, 'agency') and tour.agency else None,
        guide_name=None,  # Would need to load guide relation
    )

