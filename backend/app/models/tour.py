"""
Ruta Segura Perú - Tour Model
Tour routes with PostGIS LineString geometry
"""
import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Integer, Float, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.agency import Agency
    from app.models.guide import Guide
    from app.models.tracking import TrackingPoint
    from app.models.emergency import Emergency
    from app.models.payment import Booking


class TourStatus(str, enum.Enum):
    """Tour lifecycle status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Tour(BaseModel):
    """
    Tour model with geographic route data.
    Uses PostGIS LineString for route geometry.
    """
    __tablename__ = "tours"
    
    # Basic Info
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    short_description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Media
    cover_image_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    gallery_urls: Mapped[List[str]] = mapped_column(
        ARRAY(String(500)),
        default=list,
        nullable=False,
    )
    
    # Geography (PostGIS)
    route: Mapped[Optional[str]] = mapped_column(
        Geometry(geometry_type="LINESTRING", srid=4326),
        nullable=True,
    )
    start_point: Mapped[Optional[str]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=True,
    )
    end_point: Mapped[Optional[str]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=True,
    )
    start_address: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    end_address: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Pricing
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="USD",
        nullable=False,
    )
    
    # Logistics
    duration_hours: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )
    distance_km: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    difficulty: Mapped[str] = mapped_column(
        String(20),
        default="moderate",
        nullable=False,
    )
    
    # Capacity
    max_capacity: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
    )
    current_bookings: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Status
    status: Mapped[TourStatus] = mapped_column(
        Enum(TourStatus),
        default=TourStatus.DRAFT,
        nullable=False,
    )
    
    # Scheduling
    scheduled_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    scheduled_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    actual_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    actual_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Foreign Keys
    agency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agencies.id", ondelete="CASCADE"),
        nullable=False,
    )
    guide_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("guides.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Relationships
    agency: Mapped["Agency"] = relationship(
        "Agency",
        back_populates="tours",
    )
    guide: Mapped[Optional["Guide"]] = relationship(
        "Guide",
        back_populates="tours",
    )
    tracking_points: Mapped[List["TrackingPoint"]] = relationship(
        "TrackingPoint",
        back_populates="tour",
    )
    emergencies: Mapped[List["Emergency"]] = relationship(
        "Emergency",
        back_populates="tour",
    )
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="tour",
    )
    
    def __repr__(self) -> str:
        return f"<Tour {self.name}>"
    
    @property
    def is_active(self) -> bool:
        return self.status == TourStatus.IN_PROGRESS
    
    @property
    def available_spots(self) -> int:
        return max(0, self.max_capacity - self.current_bookings)
