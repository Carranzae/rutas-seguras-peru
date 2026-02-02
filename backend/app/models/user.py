"""
Ruta Segura Perú - User Model
Core user entity with roles and emergency contact
"""
import enum
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.agency import Agency
    from app.models.guide import Guide


class UserRole(str, enum.Enum):
    """User roles in the system."""
    SUPER_ADMIN = "super_admin"
    AGENCY_ADMIN = "agency_admin"
    GUIDE = "guide"
    TOURIST = "tourist"


class User(BaseModel):
    """
    User model for authentication and authorization.
    Supports multiple roles: SuperAdmin, AgencyAdmin, Guide, Tourist.
    """
    __tablename__ = "users"
    
    # Authentication
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    # Profile
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Role & Status
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.TOURIST,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    # Emergency Contact
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    emergency_contact_relationship: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    
    # FCM Token for push notifications
    fcm_token: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Preferred language
    language: Mapped[str] = mapped_column(
        String(10),
        default="es",
        nullable=False,
    )
    
    # Relationships
    agency: Mapped[Optional["Agency"]] = relationship(
        "Agency",
        back_populates="admin",
        uselist=False,
    )
    guide_profile: Mapped[Optional["Guide"]] = relationship(
        "Guide",
        back_populates="user",
        uselist=False,
        primaryjoin="User.id == Guide.user_id",
        foreign_keys="Guide.user_id",
    )
    bookings: Mapped[list] = relationship(
        "Booking",
        back_populates="user",
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return self.role in (UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN)
    
    @property
    def is_super_admin(self) -> bool:
        """Check if user is super admin."""
        return self.role == UserRole.SUPER_ADMIN
