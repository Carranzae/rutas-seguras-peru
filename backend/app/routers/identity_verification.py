"""
Ruta Segura Perú - Identity Verification Router
SuperAdmin API for reviewing and approving biometric verifications
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.identity_verification import VerificationStatus, VerificationType
from app.services.identity_verification_service import identity_verification_service
from app.services.ghoscloud_service import ghoscloud_service


router = APIRouter(prefix="/verifications", tags=["Identity Verification"])


# ============================================
# SCHEMAS
# ============================================

class BiometricSubmissionRequest(BaseModel):
    """Request to submit biometric verification."""
    verification_type: str  # biometric_fingerprint, biometric_face, liveness_check
    biometric_hash: str  # Pre-computed hash from device
    device_signature: str
    selfie_url: Optional[str] = None
    liveness_score: Optional[int] = None


class DocumentSubmissionRequest(BaseModel):
    """Request to submit document verification."""
    verification_type: str  # document_dni, document_passport, dircetur_license
    document_url: str
    license_number: Optional[str] = None
    document_score: Optional[int] = None


class CheckRequest(BaseModel):
    """Generic check request."""
    query: str # Can be DNI, Phone, or Name


class ApproveRequest(BaseModel):
    """Request to approve verification."""
    pass  # No additional data needed


class RejectRequest(BaseModel):
    """Request to reject verification."""
    reason: str


class VerificationResponse(BaseModel):
    """Verification record response."""
    id: str
    user_id: str
    verification_type: str
    status: str
    created_at: str
    
    class Config:
        from_attributes = True


class PendingVerificationResponse(BaseModel):
    """Pending verification for admin review."""
    id: str
    user_id: str
    user_name: str
    user_email: str
    user_avatar: Optional[str]
    verification_type: str
    status: str
    selfie_url: Optional[str]
    document_url: Optional[str]
    license_number: Optional[str]
    liveness_score: Optional[int]
    document_score: Optional[int]
    submitted_at: str
    submission_device: Optional[str]


class PaginatedVerificationsResponse(BaseModel):
    """Paginated list of pending verifications."""
    items: list[PendingVerificationResponse]
    total: int
    page: int
    per_page: int


# ============================================
# USER ENDPOINTS (Submit verification)
# ============================================

@router.post("/biometric", response_model=VerificationResponse)
async def submit_biometric_verification(
    request: Request,
    data: BiometricSubmissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit biometric verification from mobile device.
    
    The device should:
    1. Capture biometric using expo-local-authentication
    2. Generate a cryptographic hash of the biometric template
    3. Sign the hash with device's secure enclave
    4. Send hash + signature (NOT raw biometric data)
    """
    try:
        verification_type = VerificationType(data.verification_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification type: {data.verification_type}"
        )
    
    # Get client info for audit
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        verification = await identity_verification_service.submit_biometric_verification(
            db=db,
            user_id=current_user.id,
            verification_type=verification_type,
            biometric_data=data.biometric_hash.encode(),  # Already hashed by device
            device_signature=data.device_signature,
            submission_ip=client_ip,
            submission_device=user_agent,
            selfie_url=data.selfie_url,
            liveness_score=data.liveness_score,
        )
        await db.commit()
        
        return VerificationResponse(
            id=str(verification.id),
            user_id=str(verification.user_id),
            verification_type=verification.verification_type.value,
            status=verification.status.value,
            created_at=verification.created_at.isoformat(),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/document", response_model=VerificationResponse)
async def submit_document_verification(
    request: Request,
    data: DocumentSubmissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit document verification (DNI, Passport, DIRCETUR license)."""
    try:
        verification_type = VerificationType(data.verification_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification type: {data.verification_type}"
        )
    
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    verification = await identity_verification_service.submit_document_verification(
        db=db,
        user_id=current_user.id,
        verification_type=verification_type,
        document_url=data.document_url,
        license_number=data.license_number,
        document_score=data.document_score,
        submission_ip=client_ip,
        submission_device=user_agent,
    )
    await db.commit()
    
    return VerificationResponse(
        id=str(verification.id),
        user_id=str(verification.user_id),
        verification_type=verification.verification_type.value,
        status=verification.status.value,
        created_at=verification.created_at.isoformat(),
    )


# ============================================
# ADMIN ENDPOINTS (Review verifications)
# ============================================

@router.get(
    "/pending",
    response_model=PaginatedVerificationsResponse,
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_pending_verifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all pending identity verifications for SuperAdmin review.
    
    Returns user info, selfie/document URLs, and liveness scores.
    """
    verifications, total = await identity_verification_service.get_pending_verifications(
        db=db,
        page=page,
        per_page=per_page,
    )
    
    return PaginatedVerificationsResponse(
        items=[PendingVerificationResponse(**v) for v in verifications],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post(
    "/{verification_id}/approve",
    response_model=VerificationResponse,
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def approve_verification(
    verification_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve identity verification.
    
    This will:
    - Set verification status to APPROVED
    - Set user's is_verified to True
    - Update guide's biometric_verified if applicable
    - Create immutable audit log with reviewer IP
    - Notify the user
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        verification = await identity_verification_service.approve_verification(
            db=db,
            verification_id=verification_id,
            reviewer_id=current_user.id,
            reviewer_ip=client_ip,
            reviewer_ua=user_agent,
        )
        await db.commit()
        
        return VerificationResponse(
            id=str(verification.id),
            user_id=str(verification.user_id),
            verification_type=verification.verification_type.value,
            status=verification.status.value,
            created_at=verification.created_at.isoformat(),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{verification_id}/reject",
    response_model=VerificationResponse,
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def reject_verification(
    verification_id: uuid.UUID,
    data: RejectRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reject identity verification with reason.
    
    The user will be notified and can submit again.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        verification = await identity_verification_service.reject_verification(
            db=db,
            verification_id=verification_id,
            reviewer_id=current_user.id,
            rejection_reason=data.reason,
            reviewer_ip=client_ip,
            reviewer_ua=user_agent,
        )
        await db.commit()
        
        return VerificationResponse(
            id=str(verification.id),
            user_id=str(verification.user_id),
            verification_type=verification.verification_type.value,
            status=verification.status.value,
            created_at=verification.created_at.isoformat(),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/check-dni-physical",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def check_dni_physical(
    data: CheckRequest,
):
    """Perform Physical DNI check (dnivir)."""
    result = await ghoscloud_service.check_dni_physical(data.query)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result.get("message", "Check failed"))
    return result


@router.post(
    "/check-dni-virtual",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def check_dni_virtual(
    data: CheckRequest,
):
    """Perform Virtual DNI check (dnive)."""
    result = await ghoscloud_service.check_dni_virtual(data.query)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result.get("message", "Check failed"))
    return result


@router.post(
    "/check-name",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def check_name(
    data: CheckRequest,
):
    """Search person by Name (nm)."""
    result = await ghoscloud_service.check_by_name(data.query)
    return result


@router.post(
    "/check-phone",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def check_phone(
    data: CheckRequest,
):
    """Check Phone/DNI (tel)."""
    result = await ghoscloud_service.check_phone(data.query)
    return result


@router.post(
    "/check-background",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def check_background(
    data: CheckRequest,
):
    """Perform Comprehensive Background Check (Police, Penal, Judicial)."""
    result = await ghoscloud_service.check_background_all(data.query)
    return result


# ============================================
# STATUS ENDPOINT (for mobile polling)
# ============================================

class VerificationStatusResponse(BaseModel):
    """Verification status for polling."""
    id: str
    status: str
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[str] = None


@router.get("/{verification_id}/status", response_model=VerificationStatusResponse)
async def get_verification_status(
    verification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get verification status for mobile polling.
    
    The mobile app polls this endpoint to check if verification is approved/rejected.
    """
    verification = await identity_verification_service.get_verification_by_id(
        db=db,
        verification_id=verification_id,
    )
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found"
        )
    
    # Users can only check their own verifications
    if verification.user_id != current_user.id and current_user.role not in ['super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this verification"
        )
    
    return VerificationStatusResponse(
        id=str(verification.id),
        status=verification.status.value,
        rejection_reason=verification.rejection_reason,
        reviewed_at=verification.reviewed_at.isoformat() if verification.reviewed_at else None,
    )


@router.get("/my/status")
async def get_my_verification_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's latest verification status.
    
    Returns all pending/recent verifications for the current user.
    """
    verifications = await identity_verification_service.get_user_verifications(
        db=db,
        user_id=current_user.id,
    )
    
    return {
        "user_id": str(current_user.id),
        "is_verified": current_user.is_verified,
        "verifications": [
            {
                "id": str(v.id),
                "type": v.verification_type.value,
                "status": v.status.value,
                "submitted_at": v.created_at.isoformat(),
                "reviewed_at": v.reviewed_at.isoformat() if v.reviewed_at else None,
                "rejection_reason": v.rejection_reason,
            }
            for v in verifications
        ],
    }

