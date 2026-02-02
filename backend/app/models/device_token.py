"""
Ruta Segura Perú - Device Token Model
Multi-device FCM token support for push notifications
"""
import enum
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Enum, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class DevicePlatform(str, enum.Enum):
    """Device platform types."""
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"


class DeviceToken(BaseModel):
    """
    FCM/Push notification tokens per device.
    Supports multiple devices per user for instant SOS alerts.
    """
    __tablename__ = "device_tokens"
    
    # Owner
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # FCM Token (unique across all devices)
    fcm_token: Mapped[str] = mapped_column(
        String(500),
        unique=True,
        nullable=False,
        index=True,
    )
    
    # Device info
    platform: Mapped[DevicePlatform] = mapped_column(
        Enum(DevicePlatform),
        nullable=False,
    )
    device_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    device_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    device_model: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # App version for compatibility
    app_version: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    # Last successful push
    last_push_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Push delivery confirmation timestamp
    last_confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Failed push count (for cleanup)
    failed_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        backref="device_tokens",
    )
    
    # Indexes
    __table_args__ = (
        Index("ix_device_token_user_active", "user_id", "is_active"),
    )
    
    def __repr__(self) -> str:
        return f"<DeviceToken {self.user_id} - {self.platform.value}>"
    
    def mark_push_success(self):
        """Mark successful push delivery."""
        self.last_push_at = datetime.utcnow()
        self.failed_count = 0
    
    def mark_push_failed(self):
        """Increment failed count. Deactivate after 3 failures."""
        self.failed_count += 1
        if self.failed_count >= 3:
            self.is_active = False
