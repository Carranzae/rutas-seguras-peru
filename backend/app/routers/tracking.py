"""
Ruta Segura Perú - Tracking Router
GPS tracking endpoints for real-time tour monitoring
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.tracking_service import TrackingService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole
from pydantic import BaseModel, Field
from geoalchemy2.shape import to_shape

router = APIRouter(prefix="/tracking", tags=["Tracking"])


# Schemas
class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = Field(None, ge=0)
    speed: Optional[float] = Field(None, ge=0)
    heading: Optional[float] = Field(None, ge=0, le=360)
    altitude: Optional[float] = None
    battery_level: Optional[int] = Field(None, ge=0, le=100)
    tour_id: Optional[uuid.UUID] = None


class LocationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    altitude: Optional[float] = None
    recorded_at: datetime
    tour_id: Optional[uuid.UUID] = None
    
    class Config:
        from_attributes = True


class RoutePoint(BaseModel):
    latitude: float
    longitude: float
    recorded_at: str
    speed: Optional[float] = None
    altitude: Optional[float] = None


def _point_to_response(point) -> LocationResponse:
    """Convert TrackingPoint to response with lat/lon extracted from PostGIS."""
    shape = to_shape(point.location)
    return LocationResponse(
        id=point.id,
        user_id=point.user_id,
        latitude=shape.y,
        longitude=shape.x,
        accuracy=point.accuracy,
        speed=point.speed,
        heading=point.heading,
        altitude=point.altitude,
        recorded_at=point.recorded_at,
        tour_id=point.tour_id,
    )


@router.post(
    "/location",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Update location",
    description="Send current GPS location update.",
)
async def update_location(
    data: LocationUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Send a GPS location update."""
    service = TrackingService(db)
    point = await service.update_location(
        user_id=current_user.id,
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy=data.accuracy,
        speed=data.speed,
        heading=data.heading,
        altitude=data.altitude,
        battery_level=data.battery_level,
        tour_id=data.tour_id,
    )
    return _point_to_response(point)


@router.get(
    "/history",
    response_model=List[LocationResponse],
    summary="Get location history",
)
async def get_location_history(
    limit: int = Query(100, ge=1, le=1000),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Get current user's location history."""
    service = TrackingService(db)
    points = await service.get_user_location_history(
        user_id=current_user.id,
        limit=limit,
    )
    return [_point_to_response(p) for p in points]


@router.get(
    "/latest",
    response_model=Optional[LocationResponse],
    summary="Get latest location",
)
async def get_latest_location(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get user's most recent location."""
    service = TrackingService(db)
    point = await service.get_latest_location(current_user.id)
    if point:
        return _point_to_response(point)
    return None


@router.get(
    "/tour/{tour_id}/live",
    response_model=List[LocationResponse],
    summary="Get live tour locations",
)
async def get_tour_live_locations(
    tour_id: uuid.UUID,
    since_minutes: int = Query(5, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
):
    """Get real-time locations for tour participants."""
    service = TrackingService(db)
    points = await service.get_tour_live_locations(
        tour_id=tour_id,
        since_minutes=since_minutes,
    )
    return [_point_to_response(p) for p in points]


@router.get(
    "/tour/{tour_id}/route",
    response_model=List[RoutePoint],
    summary="Get tour route",
)
async def get_tour_route(
    tour_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get the full route/path for a tour."""
    service = TrackingService(db)
    return await service.get_tour_route(tour_id)


@router.get(
    "/user/{user_id}/latest",
    response_model=Optional[LocationResponse],
    summary="Get user's latest location",
    dependencies=[Depends(require_roles(UserRole.GUIDE, UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def get_user_latest_location(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get another user's latest location (for guides/admins)."""
    service = TrackingService(db)
    point = await service.get_latest_location(user_id)
    if point:
        return _point_to_response(point)
    return None
