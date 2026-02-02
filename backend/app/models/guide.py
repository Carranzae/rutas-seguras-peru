"""
Ruta Segura Perú - Guide Model
Licensed tour guide with DIRCETUR verification
"""
import enum
import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Enum, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.agency import Agency
    from app.models.tour import Tour


class GuideVerificationStatus(str, enum.Enum):
    """Guide verification status."""
    PENDING_DOCUMENTS = "pending_documents"
    PENDING_BIOMETRIC = "pending_biometric"
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class Guide(BaseModel):
    """
    Tour guide model.
    Linked to a user account and optionally to an agency.
    Requires DIRCETUR verification.
    """
    __tablename__ = "guides"
    
    # User Link
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    
    # Agency (optional - can be independent)
    agency_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agencies.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # DIRCETUR Information
    dircetur_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    dircetur_expiry_date: Mapped[Optional[str]] = mapped_column(
        String(10),  # YYYY-MM-DD format
        nullable=True,
    )
    
    # Document Images
    dircetur_front_image_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    dircetur_back_image_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Biometric Verification
    selfie_image_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    biometric_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    biometric_score: Mapped[Optional[float]] = mapped_column(
        nullable=True,
    )
    
    # Verification Status
    verification_status: Mapped[GuideVerificationStatus] = mapped_column(
        Enum(GuideVerificationStatus),
        default=GuideVerificationStatus.PENDING_DOCUMENTS,
        nullable=False,
    )
    verification_notes: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    verified_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Skills
    languages: Mapped[List[str]] = mapped_column(
        ARRAY(String(50)),
        default=list,
        nullable=False,
    )
    specializations: Mapped[List[str]] = mapped_column(
        ARRAY(String(100)),
        default=list,
        nullable=False,
    )
    
    # Rating
    average_rating: Mapped[float] = mapped_column(
        default=0.0,
        nullable=False,
    )
    total_reviews: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )
    total_tours_completed: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="guide_profile",
        foreign_keys=[user_id],
    )
    agency: Mapped[Optional["Agency"]] = relationship(
        "Agency",
        back_populates="guides",
    )
    tours: Mapped[List["Tour"]] = relationship(
        "Tour",
        back_populates="guide",
    )
    
    def __repr__(self) -> str:
        return f"<Guide {self.dircetur_id}>"
    
    @property
    def is_verified(self) -> bool:
        return self.verification_status == GuideVerificationStatus.VERIFIED
    
    @property
    def is_independent(self) -> bool:
        return self.agency_id is None
