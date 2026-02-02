"""
Ruta Segura Perú - Tracking Model
Real-time geolocation tracking points
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.tour import Tour


class TrackingPoint(BaseModel):
    """
    Real-time tracking point model.
    Stores GPS coordinates with metadata for route tracking.
    Uses PostGIS Point geometry.
    """
    __tablename__ = "tracking_points"
    
    # Location (PostGIS Point)
    location: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    
    # GPS Metadata
    altitude: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    speed: Mapped[Optional[float]] = mapped_column(
        Float,  # km/h
        nullable=True,
    )
    heading: Mapped[Optional[float]] = mapped_column(
        Float,  # degrees 0-360
        nullable=True,
    )
    accuracy: Mapped[Optional[float]] = mapped_column(
        Float,  # meters
        nullable=True,
    )
    
    # Device Info
    battery_level: Mapped[Optional[int]] = mapped_column(
        Integer,  # 0-100
        nullable=True,
    )
    
    # Timestamp (when the point was recorded on device)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    
    # Foreign Keys
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tour_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    tour: Mapped[Optional["Tour"]] = relationship(
        "Tour",
        back_populates="tracking_points",
    )
    
    def __repr__(self) -> str:
        return f"<TrackingPoint user={self.user_id} at {self.recorded_at}>"
