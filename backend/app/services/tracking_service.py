"""
Ruta Segura Perú - Tracking Service
GPS tracking for tour guides and emergency response
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.models.tracking import TrackingPoint
from app.models.user import User
from app.core.exceptions import NotFoundException
from loguru import logger


class TrackingService:
    """
    GPS tracking service for real-time tour monitoring.
    Handles location updates, history, and live tracking.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def update_location(
        self,
        user_id: uuid.UUID,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
        altitude: Optional[float] = None,
        battery_level: Optional[int] = None,
        tour_id: Optional[uuid.UUID] = None,
    ) -> TrackingPoint:
        """
        Save a location update from a guide or tourist.
        """
        # Create PostGIS point
        point = Point(longitude, latitude)
        
        tracking_point = TrackingPoint(
            user_id=user_id,
            tour_id=tour_id,
            location=from_shape(point, srid=4326),
            accuracy=accuracy,
            speed=speed,
            heading=heading,
            altitude=altitude,
            battery_level=battery_level,
            recorded_at=datetime.now(timezone.utc),
        )
        
        self.db.add(tracking_point)
        await self.db.flush()
        await self.db.refresh(tracking_point)
        
        logger.debug(f"Location saved | User: {user_id} | ({latitude}, {longitude})")
        
        return tracking_point
    
    async def get_user_location_history(
        self,
        user_id: uuid.UUID,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[TrackingPoint]:
        """
        Get location history for a user.
        """
        stmt = select(TrackingPoint).where(TrackingPoint.user_id == user_id)
        
        if start_time:
            stmt = stmt.where(TrackingPoint.recorded_at >= start_time)
        if end_time:
            stmt = stmt.where(TrackingPoint.recorded_at <= end_time)
        
        stmt = stmt.order_by(TrackingPoint.recorded_at.desc()).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_tour_live_locations(
        self,
        tour_id: uuid.UUID,
        since_minutes: int = 5,
    ) -> List[TrackingPoint]:
        """
        Get real-time locations for all participants in a tour.
        Returns only locations from the last N minutes.
        """
        since = datetime.now(timezone.utc) - timedelta(minutes=since_minutes)
        
        stmt = (
            select(TrackingPoint)
            .where(
                and_(
                    TrackingPoint.tour_id == tour_id,
                    TrackingPoint.recorded_at >= since,
                )
            )
            .order_by(TrackingPoint.recorded_at.desc())
        )
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_latest_location(
        self,
        user_id: uuid.UUID,
    ) -> Optional[TrackingPoint]:
        """
        Get the most recent location for a user.
        """
        stmt = (
            select(TrackingPoint)
            .where(TrackingPoint.user_id == user_id)
            .order_by(TrackingPoint.recorded_at.desc())
            .limit(1)
        )
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_tour_route(
        self,
        tour_id: uuid.UUID,
    ) -> List[dict]:
        """
        Get the full route for a tour as coordinate list.
        """
        from geoalchemy2.shape import to_shape
        
        stmt = (
            select(TrackingPoint)
            .where(TrackingPoint.tour_id == tour_id)
            .order_by(TrackingPoint.recorded_at.asc())
        )
        
        result = await self.db.execute(stmt)
        points = list(result.scalars().all())
        
        route = []
        for point in points:
            shape = to_shape(point.location)
            route.append({
                "latitude": shape.y,
                "longitude": shape.x,
                "recorded_at": point.recorded_at.isoformat(),
                "speed": point.speed,
                "altitude": point.altitude,
            })
        
        return route
