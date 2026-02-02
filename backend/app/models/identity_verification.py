"""
Ruta Segura Perú - Identity Verification Model
Biometric verification and identity management for guides/agencies
"""
import enum
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Text, Enum, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class VerificationStatus(str, enum.Enum):
    """Identity verification status."""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class VerificationType(str, enum.Enum):
    """Type of identity verification."""
    BIOMETRIC_FINGERPRINT = "biometric_fingerprint"
    BIOMETRIC_FACE = "biometric_face"
    LIVENESS_CHECK = "liveness_check"
    DOCUMENT_DNI = "document_dni"
    DOCUMENT_PASSPORT = "document_passport"
    DIRCETUR_LICENSE = "dircetur_license"


class IdentityVerification(BaseModel):
    """
    Identity verification records for guides and agencies.
    Stores cryptographic hashes, NOT raw biometric data (security requirement).
    SuperAdmin reviews and approves/rejects.
    """
    __tablename__ = "identity_verifications"
    
    # User being verified
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Verification type and status
    verification_type: Mapped[VerificationType] = mapped_column(
        Enum(VerificationType),
        nullable=False,
    )
    status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus),
        default=VerificationStatus.PENDING,
        nullable=False,
        index=True,
    )
    
    # Cryptographic hash of biometric data (NOT raw data)
    # SHA-256 hash of fingerprint/face template from device
    biometric_hash: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
    )
    
    # Device signature for verification integrity
    device_signature: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )
    
    # Liveness selfie URL (encrypted S3/storage reference)
    selfie_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Document image URL (encrypted)
    document_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # DIRCETUR license number for guides
    license_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    
    # Liveness confidence score (0-100)
    liveness_score: Mapped[Optional[int]] = mapped_column(
        nullable=True,
    )
    
    # Document validation score (0-100)
    document_score: Mapped[Optional[int]] = mapped_column(
        nullable=True,
    )
    
    # Review information
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Audit: IP and device info from submission
    submission_ip: Mapped[Optional[str]] = mapped_column(
        String(45),  # IPv6 max length
        nullable=True,
    )
    submission_device: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # Expiration for time-limited verifications
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        backref="identity_verifications",
    )
    reviewer: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[reviewed_by],
    )
    
    # Indexes for performance
    __table_args__ = (
        Index("ix_identity_verification_user_status", "user_id", "status"),
        Index("ix_identity_verification_pending", "status", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<IdentityVerification {self.user_id} - {self.verification_type.value} ({self.status.value})>"
    
    @property
    def is_approved(self) -> bool:
        return self.status == VerificationStatus.APPROVED
    
    @property
    def is_pending(self) -> bool:
        return self.status in (VerificationStatus.PENDING, VerificationStatus.IN_REVIEW)
    
    @property
    def is_expired(self) -> bool:
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        return self.status == VerificationStatus.EXPIRED
