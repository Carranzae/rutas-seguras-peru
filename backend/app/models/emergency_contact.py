"""
Ruta Segura Perú - Emergency Contacts Model
Trusted circle of emergency contacts for cascade notifications
"""
import enum
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Enum, ForeignKey, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class NotificationChannel(str, enum.Enum):
    """Preferred notification channel."""
    SMS = "sms"
    WHATSAPP = "whatsapp"
    BOTH = "both"


class ContactRelationship(str, enum.Enum):
    """Relationship types for emergency contacts."""
    FAMILY = "family"
    FRIEND = "friend"
    SPOUSE = "spouse"
    PARENT = "parent"
    SIBLING = "sibling"
    COWORKER = "coworker"
    EMBASSY = "embassy"
    OTHER = "other"


class EmergencyContact(BaseModel):
    """
    Emergency contacts for cascade notification during SOS.
    Maximum 5 contacts per user enforced at application level.
    Phone numbers stored in E.164 format for international compatibility.
    """
    __tablename__ = "emergency_contacts"
    
    # Owner
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Contact info
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    # Phone number in E.164 format (e.g., +51987654321)
    phone_e164: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    
    # Optional email
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # Contact relationship type (renamed from 'relationship' to avoid SQLAlchemy conflict)
    contact_relationship: Mapped[ContactRelationship] = mapped_column(
        Enum(ContactRelationship),
        default=ContactRelationship.FAMILY,
        nullable=False,
    )
    
    # Notification preferences
    notification_channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel),
        default=NotificationChannel.SMS,
        nullable=False,
    )
    
    # Is this the primary contact? (notified first)
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    # Is this contact verified? (confirmed their number)
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    # Contact's FCM token (if they have the app)
    fcm_token: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Priority order (1-5)
    priority: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
    )
    
    # Language preference for notifications
    language: Mapped[str] = mapped_column(
        String(10),
        default="es",
        nullable=False,
    )
    
    # Country code for regional formatting
    country_code: Mapped[str] = mapped_column(
        String(5),
        default="PE",
        nullable=False,
    )
    
    # Active status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    # Relationships (use aliased import to avoid name conflict)
    user: Mapped["User"] = orm_relationship(
        "User",
        backref="emergency_contacts",
    )
    
    # Indexes and constraints
    __table_args__ = (
        Index("ix_emergency_contact_user_active", "user_id", "is_active"),
        Index("ix_emergency_contact_priority", "user_id", "priority"),
        CheckConstraint("priority >= 1 AND priority <= 5", name="check_priority_range"),
    )
    
    def __repr__(self) -> str:
        return f"<EmergencyContact {self.name} ({self.phone_e164})>"
    
    @property
    def display_phone(self) -> str:
        """Format phone for display."""
        if len(self.phone_e164) > 10:
            # Format as +XX XXX XXX XXX
            return f"{self.phone_e164[:3]} {self.phone_e164[3:6]} {self.phone_e164[6:9]} {self.phone_e164[9:]}"
        return self.phone_e164
