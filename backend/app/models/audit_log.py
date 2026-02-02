"""
Ruta Segura Perú - Audit Log Model
Immutable audit trail for security-critical actions
FIXED: Renamed 'metadata' to 'context_data' (metadata is SQLAlchemy reserved)
"""
import enum
import uuid
from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, Text, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class AuditAction(str, enum.Enum):
    """Types of auditable actions."""
    # Identity verification
    IDENTITY_SUBMITTED = "identity_submitted"
    IDENTITY_APPROVED = "identity_approved"
    IDENTITY_REJECTED = "identity_rejected"
    
    # User management
    USER_CREATED = "user_created"
    USER_ROLE_CHANGED = "user_role_changed"
    USER_DEACTIVATED = "user_deactivated"
    USER_REACTIVATED = "user_reactivated"
    
    # Emergency
    EMERGENCY_SOS = "emergency_sos"
    SOS_ACTIVATED = "sos_activated"
    SOS_RESPONDED = "sos_responded"
    SOS_RESOLVED = "sos_resolved"
    SOS_FALSE_ALARM = "sos_false_alarm"
    
    # Agency/Guide
    AGENCY_VERIFIED = "agency_verified"
    AGENCY_SUSPENDED = "agency_suspended"
    GUIDE_VERIFIED = "guide_verified"
    GUIDE_SUSPENDED = "guide_suspended"
    
    # Financial
    PAYMENT_PROCESSED = "payment_processed"
    REFUND_ISSUED = "refund_issued"
    PAYOUT_INITIATED = "payout_initiated"
    
    # Security
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGED = "password_changed"
    TOKEN_REVOKED = "token_revoked"


class AuditLog(BaseModel):
    """
    Immutable audit log for security and compliance.
    Once created, records cannot be modified or deleted.
    """
    __tablename__ = "audit_logs"
    
    # Actor (who performed the action)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Action type
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction),
        nullable=False,
        index=True,
    )
    
    # Target entity (what was acted upon)
    target_type: Mapped[str] = mapped_column(
        String(50),  # user, agency, guide, emergency, payment
        nullable=False,
    )
    target_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    
    # Human-readable description
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    
    # Additional context as JSON
    # RENAMED FROM 'metadata' - that's a reserved SQLAlchemy attribute
    context_data: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
    )
    
    # Request context
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),  # IPv6 max
        nullable=True,
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Geolocation if available
    latitude: Mapped[Optional[float]] = mapped_column(nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(nullable=True)
    
    # Result of action
    success: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Relationships
    actor: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[actor_id],
    )
    
    # Indexes for querying
    __table_args__ = (
        Index("ix_audit_log_actor_action", "actor_id", "action"),
        Index("ix_audit_log_target", "target_type", "target_id"),
        Index("ix_audit_log_created", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog {self.action.value} by {self.actor_id}>"


# Helper function to create audit log
async def create_audit_log(
    db,
    action: AuditAction,
    target_type: str = "system",
    description: str = "",
    actor_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,  # Alias for actor_id
    target_id: Optional[uuid.UUID] = None,
    details: Optional[dict] = None,  # Alias for context_data
    context_data: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    success: bool = True,
    error_message: Optional[str] = None,
) -> AuditLog:
    """
    Create an immutable audit log entry.
    
    Args:
        db: Database session
        action: The audit action type
        target_type: Type of entity being acted upon (user, agency, etc.)
        description: Human-readable description (auto-generated if empty)
        actor_id: ID of user performing action
        user_id: Alias for actor_id (for convenience)
        target_id: ID of target entity
        details: Additional context data (alias for context_data)
        context_data: Additional context as JSON
        ip_address: Request IP address
        user_agent: Browser/client user agent
        success: Whether action succeeded
        error_message: Error message if failed
    
    Returns:
        Created AuditLog instance
    """
    # Handle aliases
    final_actor_id = actor_id or user_id
    final_context = context_data or details
    
    # Auto-generate description if not provided
    if not description:
        description = f"Action: {action.value}"
    
    log = AuditLog(
        actor_id=final_actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        description=description,
        context_data=final_context,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
        error_message=error_message,
    )
    db.add(log)
    await db.flush()
    return log
