"""
Ruta Segura Perú - Agency Model
Tourism agency with RUC and geolocation
"""
import enum
import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.guide import Guide
    from app.models.tour import Tour


class AgencyStatus(str, enum.Enum):
    """Agency verification status."""
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class Agency(BaseModel):
    """
    Tourism agency model.
    Multi-tenant entity that can have multiple guides and tours.
    """
    __tablename__ = "agencies"
    
    # Business Information
    ruc: Mapped[str] = mapped_column(
        String(11),
        unique=True,
        index=True,
        nullable=False,
    )
    business_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    trade_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # Contact
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    website: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Address
    address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    region: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    
    # Geolocation (PostGIS Point)
    headquarters_location: Mapped[Optional[str]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=True,
    )
    
    # Documents
    operating_certificate_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    business_license_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Status
    status: Mapped[AgencyStatus] = mapped_column(
        Enum(AgencyStatus),
        default=AgencyStatus.PENDING,
        nullable=False,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Admin User (FK)
    admin_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Relationships
    admin: Mapped["User"] = relationship(
        "User",
        back_populates="agency",
        foreign_keys=[admin_user_id],
    )
    guides: Mapped[List["Guide"]] = relationship(
        "Guide",
        back_populates="agency",
    )
    tours: Mapped[List["Tour"]] = relationship(
        "Tour",
        back_populates="agency",
    )
    
    def __repr__(self) -> str:
        return f"<Agency {self.business_name} ({self.ruc})>"
    
    @property
    def is_verified(self) -> bool:
        return self.status == AgencyStatus.VERIFIED
