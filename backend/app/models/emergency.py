"""
Ruta Segura Perú - Emergency Model
SOS alerts and emergency tracking
"""
import enum
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.tour import Tour


class EmergencySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EmergencyStatus(str, enum.Enum):
    ACTIVE = "active"
    RESPONDING = "responding"
    RESOLVED = "resolved"
    FALSE_ALARM = "false_alarm"
    ESCALATED = "escalated"


class Emergency(BaseModel):
    """SOS emergency alert with geolocation."""
    __tablename__ = "emergencies"
    
    # Location (PostGIS Point)
    location: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    
    # Severity & Status
    severity: Mapped[EmergencySeverity] = mapped_column(
        Enum(EmergencySeverity),
        default=EmergencySeverity.HIGH,
        nullable=False,
    )
    status: Mapped[EmergencyStatus] = mapped_column(
        Enum(EmergencyStatus),
        default=EmergencyStatus.ACTIVE,
        nullable=False,
    )
    
    # Details
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Response
    responder_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    # Device info at time of emergency
    battery_level: Mapped[Optional[int]] = mapped_column(nullable=True)
    
    # Foreign Keys
    triggered_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    tour_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="SET NULL"),
        nullable=True,
    )
    responder_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Relationships
    triggered_by: Mapped["User"] = relationship("User", foreign_keys=[triggered_by_id])
    responder: Mapped[Optional["User"]] = relationship("User", foreign_keys=[responder_id])
    tour: Mapped[Optional["Tour"]] = relationship("Tour", back_populates="emergencies")
