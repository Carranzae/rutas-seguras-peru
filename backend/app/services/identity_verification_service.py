"""
Ruta Segura Perú - Identity Verification Service
Biometric verification and liveness detection with SuperAdmin approval
"""
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from loguru import logger

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity_verification import (
    IdentityVerification,
    VerificationStatus,
    VerificationType,
)
from app.models.audit_log import AuditLog, AuditAction, create_audit_log
from app.models.user import User
from app.models.guide import Guide
from app.services.notification_middleware import notification_middleware, NotificationPriority


class IdentityVerificationService:
    """
    Service for handling biometric identity verification.
    
    Security principles:
    - Never store raw biometric data
    - Use cryptographic hashes for comparison
    - Immutable audit trail for all actions
    - SuperAdmin is the final validator
    """
    
    # Verification expiry days
    VERIFICATION_EXPIRY_DAYS = 365
    
    # Minimum liveness score to auto-pass initial check
    MIN_LIVENESS_SCORE = 75
    
    async def submit_biometric_verification(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        verification_type: VerificationType,
        biometric_data: bytes,
        device_signature: str,
        submission_ip: str,
        submission_device: str,
        selfie_url: Optional[str] = None,
        liveness_score: Optional[int] = None,
    ) -> IdentityVerification:
        """
        Submit biometric verification from mobile device.
        
        Args:
            user_id: User requesting verification
            verification_type: Type of biometric (fingerprint/face)
            biometric_data: Raw biometric template from device (will be hashed)
            device_signature: Signature from device's secure enclave
            submission_ip: Client IP address for audit
            submission_device: Device info for audit
            selfie_url: URL to liveness selfie (encrypted storage)
            liveness_score: Liveness detection confidence (0-100)
        
        Returns:
            Created verification record
        """
        # Generate cryptographic hash of biometric data
        # We NEVER store raw biometric data
        biometric_hash = self._generate_biometric_hash(biometric_data, device_signature)
        
        # Check for existing pending verification
        existing = await db.execute(
            select(IdentityVerification)
            .where(IdentityVerification.user_id == user_id)
            .where(IdentityVerification.verification_type == verification_type)
            .where(IdentityVerification.status.in_([
                VerificationStatus.PENDING,
                VerificationStatus.IN_REVIEW,
            ]))
        )
        if existing.scalar_one_or_none():
            raise ValueError("Existing verification in progress")
        
        # Create verification record
        verification = IdentityVerification(
            user_id=user_id,
            verification_type=verification_type,
            status=VerificationStatus.PENDING,
            biometric_hash=biometric_hash,
            device_signature=device_signature,
            selfie_url=selfie_url,
            liveness_score=liveness_score,
            submission_ip=submission_ip,
            submission_device=submission_device,
            expires_at=datetime.utcnow() + timedelta(days=self.VERIFICATION_EXPIRY_DAYS),
        )
        
        db.add(verification)
        await db.flush()
        
        # Create audit log
        await create_audit_log(
            db=db,
            action=AuditAction.IDENTITY_SUBMITTED,
            target_type="identity_verification",
            target_id=verification.id,
            description=f"Biometric verification submitted: {verification_type.value}",
            actor_id=user_id,
            ip_address=submission_ip,
            metadata={
                "verification_type": verification_type.value,
                "liveness_score": liveness_score,
                "device": submission_device,
            },
        )
        
        # Notify SuperAdmins of new verification
        await self._notify_admins_new_verification(db, verification)
        
        logger.info(f"Biometric verification submitted: {verification.id}")
        return verification
    
    async def submit_document_verification(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        verification_type: VerificationType,
        document_url: str,
        license_number: Optional[str] = None,
        document_score: Optional[int] = None,
        submission_ip: str = None,
        submission_device: str = None,
    ) -> IdentityVerification:
        """Submit document verification (DNI, Passport, DIRCETUR license)."""
        verification = IdentityVerification(
            user_id=user_id,
            verification_type=verification_type,
            status=VerificationStatus.PENDING,
            document_url=document_url,
            license_number=license_number,
            document_score=document_score,
            submission_ip=submission_ip,
            submission_device=submission_device,
            expires_at=datetime.utcnow() + timedelta(days=self.VERIFICATION_EXPIRY_DAYS),
        )
        
        db.add(verification)
        await db.flush()
        
        await create_audit_log(
            db=db,
            action=AuditAction.IDENTITY_SUBMITTED,
            target_type="identity_verification",
            target_id=verification.id,
            description=f"Document verification submitted: {verification_type.value}",
            actor_id=user_id,
            ip_address=submission_ip,
        )
        
        await self._notify_admins_new_verification(db, verification)
        
        return verification
    
    async def get_pending_verifications(
        self,
        db: AsyncSession,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        """
        Get all pending verifications for SuperAdmin review.
        
        Returns:
            Tuple of (verifications list, total count)
        """
        # Count total
        count_result = await db.execute(
            select(func.count(IdentityVerification.id))
            .where(IdentityVerification.status.in_([
                VerificationStatus.PENDING,
                VerificationStatus.IN_REVIEW,
            ]))
        )
        total = count_result.scalar() or 0
        
        # Get paginated results with user info
        result = await db.execute(
            select(IdentityVerification, User)
            .join(User, IdentityVerification.user_id == User.id)
            .where(IdentityVerification.status.in_([
                VerificationStatus.PENDING,
                VerificationStatus.IN_REVIEW,
            ]))
            .order_by(IdentityVerification.created_at.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        
        verifications = []
        for verification, user in result.fetchall():
            verifications.append({
                "id": str(verification.id),
                "user_id": str(verification.user_id),
                "user_name": user.full_name,
                "user_email": user.email,
                "user_avatar": user.avatar_url,
                "verification_type": verification.verification_type.value,
                "status": verification.status.value,
                "selfie_url": verification.selfie_url,
                "document_url": verification.document_url,
                "license_number": verification.license_number,
                "liveness_score": verification.liveness_score,
                "document_score": verification.document_score,
                "submitted_at": verification.created_at.isoformat(),
                "submission_device": verification.submission_device,
            })
        
        return verifications, total
    
    async def approve_verification(
        self,
        db: AsyncSession,
        verification_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        reviewer_ip: str,
        reviewer_ua: str,
    ) -> IdentityVerification:
        """
        Approve identity verification (SuperAdmin action).
        
        Also updates the user's is_verified flag and guide status if applicable.
        """
        # Get verification
        result = await db.execute(
            select(IdentityVerification)
            .where(IdentityVerification.id == verification_id)
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            raise ValueError("Verification not found")
        
        if verification.status not in (VerificationStatus.PENDING, VerificationStatus.IN_REVIEW):
            raise ValueError("Verification already processed")
        
        # Update verification
        verification.status = VerificationStatus.APPROVED
        verification.reviewed_by = reviewer_id
        verification.reviewed_at = datetime.utcnow()
        
        # Update user's verified status
        await db.execute(
            select(User).where(User.id == verification.user_id)
        )
        user_result = await db.execute(
            select(User).where(User.id == verification.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.is_verified = True
        
        # If guide, update biometric verification status
        if verification.verification_type in (
            VerificationType.BIOMETRIC_FINGERPRINT,
            VerificationType.BIOMETRIC_FACE,
        ):
            guide_result = await db.execute(
                select(Guide).where(Guide.user_id == verification.user_id)
            )
            guide = guide_result.scalar_one_or_none()
            if guide:
                guide.biometric_verified = True
        
        # Audit log
        await create_audit_log(
            db=db,
            action=AuditAction.IDENTITY_APPROVED,
            target_type="identity_verification",
            target_id=verification_id,
            description=f"Identity verification approved for user {verification.user_id}",
            actor_id=reviewer_id,
            ip_address=reviewer_ip,
            user_agent=reviewer_ua,
            metadata={
                "verification_type": verification.verification_type.value,
                "user_id": str(verification.user_id),
            },
        )
        
        # Notify user
        await notification_middleware.notify_user(
            db=db,
            user_id=verification.user_id,
            title="¡Verificación Aprobada!",
            body="Tu identidad ha sido verificada exitosamente. Ya puedes operar como guía verificado.",
            priority=NotificationPriority.HIGH,
            data={"action": "verification_approved"},
        )
        
        logger.info(f"Verification {verification_id} approved by {reviewer_id}")
        return verification
    
    async def reject_verification(
        self,
        db: AsyncSession,
        verification_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        rejection_reason: str,
        reviewer_ip: str,
        reviewer_ua: str,
    ) -> IdentityVerification:
        """Reject identity verification with reason."""
        result = await db.execute(
            select(IdentityVerification)
            .where(IdentityVerification.id == verification_id)
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            raise ValueError("Verification not found")
        
        verification.status = VerificationStatus.REJECTED
        verification.reviewed_by = reviewer_id
        verification.reviewed_at = datetime.utcnow()
        verification.rejection_reason = rejection_reason
        
        # Audit log
        await create_audit_log(
            db=db,
            action=AuditAction.IDENTITY_REJECTED,
            target_type="identity_verification",
            target_id=verification_id,
            description=f"Identity verification rejected: {rejection_reason}",
            actor_id=reviewer_id,
            ip_address=reviewer_ip,
            user_agent=reviewer_ua,
            metadata={
                "rejection_reason": rejection_reason,
            },
        )
        
        # Notify user
        await notification_middleware.notify_user(
            db=db,
            user_id=verification.user_id,
            title="Verificación No Aprobada",
            body=f"Tu verificación fue rechazada: {rejection_reason}. Por favor, intenta de nuevo.",
            priority=NotificationPriority.MEDIUM,
            data={"action": "verification_rejected"},
        )
        
        logger.info(f"Verification {verification_id} rejected by {reviewer_id}")
        return verification
    
    def _generate_biometric_hash(self, biometric_data: bytes, device_signature: str) -> str:
        """
        Generate secure hash of biometric data.
        Uses SHA-256 with device signature as salt.
        """
        salted_data = biometric_data + device_signature.encode()
        return hashlib.sha256(salted_data).hexdigest()
    
    async def _notify_admins_new_verification(
        self,
        db: AsyncSession,
        verification: IdentityVerification,
    ):
        """Notify all SuperAdmins of new verification pending review."""
        from app.models.user import UserRole
        
        result = await db.execute(
            select(User.id)
            .where(User.role == UserRole.SUPER_ADMIN)
            .where(User.is_active == True)
        )
        admin_ids = [row[0] for row in result.fetchall()]
        
        if admin_ids:
            await notification_middleware.notify_multiple(
                db=db,
                user_ids=admin_ids,
                title="Nueva Verificación Pendiente",
                body=f"Un usuario ha enviado documentos para verificación.",
                priority=NotificationPriority.MEDIUM,
                data={
                    "action": "review_verification",
                    "verification_id": str(verification.id),
                },
            )
    
    async def get_verification_by_id(
        self,
        db: AsyncSession,
        verification_id: uuid.UUID,
    ) -> Optional[IdentityVerification]:
        """Get a verification by ID."""
        result = await db.execute(
            select(IdentityVerification)
            .where(IdentityVerification.id == verification_id)
        )
        return result.scalar_one_or_none()
    
    async def get_user_verifications(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 10,
    ) -> list[IdentityVerification]:
        """Get all verifications for a user, ordered by most recent."""
        result = await db.execute(
            select(IdentityVerification)
            .where(IdentityVerification.user_id == user_id)
            .order_by(IdentityVerification.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()


# Singleton instance
identity_verification_service = IdentityVerificationService()
