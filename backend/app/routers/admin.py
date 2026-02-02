"""
Ruta Segura Perú - Admin Router
Super Admin dashboard and management endpoints
"""
import uuid
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import User, UserRole
from app.models.agency import Agency, AgencyStatus
from app.models.guide import Guide, GuideVerificationStatus
from app.models.tour import Tour, TourStatus
from app.models.emergency import Emergency
from app.models.payment import Payment, PaymentStatus
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])


# Schemas
class DashboardStats(BaseModel):
    total_users: int
    total_agencies: int
    total_guides: int
    total_tours: int
    total_emergencies: int
    total_revenue: float
    platform_earnings: float
    pending_verifications: int
    active_emergencies: int


class RecentActivity(BaseModel):
    type: str
    description: str
    timestamp: str
    user_id: Optional[str] = None


class UserSummary(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime
    is_active: bool


class AgencyPendingVerification(BaseModel):
    id: uuid.UUID
    business_name: str
    ruc: str
    email: str
    created_at: datetime


class GuidePendingVerification(BaseModel):
    id: uuid.UUID
    user_name: Optional[str] = None
    dircetur_id: str
    created_at: datetime


@router.get(
    "/dashboard/stats",
    response_model=DashboardStats,
    summary="Get dashboard statistics",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get comprehensive dashboard statistics for super admin."""
    
    # Total users
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0
    
    # Total agencies
    agencies_result = await db.execute(select(func.count(Agency.id)))
    total_agencies = agencies_result.scalar() or 0
    
    # Total guides
    guides_result = await db.execute(select(func.count(Guide.id)))
    total_guides = guides_result.scalar() or 0
    
    # Total tours
    tours_result = await db.execute(select(func.count(Tour.id)))
    total_tours = tours_result.scalar() or 0
    
    # Total emergencies
    emergencies_result = await db.execute(select(func.count(Emergency.id)))
    total_emergencies = emergencies_result.scalar() or 0
    
    # Revenue stats
    revenue_result = await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.COMPLETED)
    )
    total_revenue = float(revenue_result.scalar() or 0)
    
    platform_result = await db.execute(
        select(func.sum(Payment.platform_commission)).where(Payment.status == PaymentStatus.COMPLETED)
    )
    platform_earnings = float(platform_result.scalar() or 0)
    
    # Pending verifications
    pending_agencies = await db.execute(
        select(func.count(Agency.id)).where(Agency.status == AgencyStatus.PENDING)
    )
    pending_guides = await db.execute(
        select(func.count(Guide.id)).where(
            Guide.verification_status == GuideVerificationStatus.PENDING_REVIEW
        )
    )
    pending_verifications = (pending_agencies.scalar() or 0) + (pending_guides.scalar() or 0)
    
    # Active emergencies
    active_result = await db.execute(
        select(func.count(Emergency.id)).where(Emergency.status == "active")
    )
    active_emergencies = active_result.scalar() or 0
    
    return DashboardStats(
        total_users=total_users,
        total_agencies=total_agencies,
        total_guides=total_guides,
        total_tours=total_tours,
        total_emergencies=total_emergencies,
        total_revenue=total_revenue,
        platform_earnings=platform_earnings,
        pending_verifications=pending_verifications,
        active_emergencies=active_emergencies,
    )


@router.get(
    "/users",
    summary="List all users",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def list_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all users with filters."""
    stmt = select(User)
    
    if role:
        stmt = stmt.where(User.role == UserRole(role))
    
    if search:
        stmt = stmt.where(
            User.email.ilike(f"%{search}%") |
            User.full_name.ilike(f"%{search}%")
        )
    
    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page).order_by(User.created_at.desc())
    
    result = await db.execute(stmt)
    users = list(result.scalars().all())
    
    return {
        "items": [
            UserSummary(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=u.role.value,
                created_at=u.created_at,
                is_active=u.is_active,
            )
            for u in users
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get(
    "/verifications/pending",
    summary="Get pending verifications",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_pending_verifications(
    db: AsyncSession = Depends(get_db),
):
    """Get all pending agency and guide verifications."""
    
    # Pending agencies
    agencies_result = await db.execute(
        select(Agency).where(Agency.status == AgencyStatus.PENDING)
    )
    pending_agencies = list(agencies_result.scalars().all())
    
    # Pending guides
    from sqlalchemy.orm import selectinload
    guides_result = await db.execute(
        select(Guide)
        .options(selectinload(Guide.user))
        .where(
            Guide.verification_status.in_([
                GuideVerificationStatus.PENDING_DOCUMENTS,
                GuideVerificationStatus.PENDING_BIOMETRIC,
                GuideVerificationStatus.PENDING_REVIEW,
            ])
        )
    )
    pending_guides = list(guides_result.scalars().all())
    
    return {
        "agencies": [
            AgencyPendingVerification(
                id=a.id,
                business_name=a.business_name,
                ruc=a.ruc,
                email=a.email,
                created_at=a.created_at,
            )
            for a in pending_agencies
        ],
        "guides": [
            GuidePendingVerification(
                id=g.id,
                user_name=g.user.full_name if g.user else None,
                dircetur_id=g.dircetur_id,
                created_at=g.created_at,
            )
            for g in pending_guides
        ],
    }


@router.get(
    "/emergencies/active",
    summary="Get active emergencies",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_active_emergencies(
    db: AsyncSession = Depends(get_db),
):
    """Get all active/unresolved emergencies."""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Emergency)
        .options(selectinload(Emergency.user))
        .where(Emergency.status == "active")
        .order_by(Emergency.created_at.desc())
        .limit(50)
    )
    emergencies = list(result.scalars().all())
    
    return [
        {
            "id": str(e.id),
            "user_name": e.user.full_name if e.user else "Unknown",
            "user_email": e.user.email if e.user else None,
            "severity": e.severity.value if e.severity else "medium",
            "created_at": e.created_at.isoformat(),
        }
        for e in emergencies
    ]


@router.get(
    "/payments/recent",
    summary="Get recent payments",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_recent_payments(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get most recent payments."""
    result = await db.execute(
        select(Payment)
        .order_by(Payment.created_at.desc())
        .limit(limit)
    )
    payments = list(result.scalars().all())
    
    return [
        {
            "id": str(p.id),
            "amount": float(p.amount),
            "status": p.status.value,
            "user_email": p.user_email,
            "created_at": p.created_at.isoformat(),
            "platform_commission": float(p.platform_commission or 0),
        }
        for p in payments
    ]


@router.post(
    "/user/{user_id}/toggle-active",
    summary="Toggle user active status",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def toggle_user_active(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    await db.flush()
    
    return {"id": str(user.id), "is_active": user.is_active}


# ==================== PAYMENT MANAGEMENT ====================

class PaymentConfirmRequest(BaseModel):
    notes: Optional[str] = None


class PaymentRejectRequest(BaseModel):
    reason: str


@router.post(
    "/payments/{payment_id}/confirm",
    summary="Confirm a pending payment",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def confirm_payment(
    payment_id: uuid.UUID,
    request: Optional[PaymentConfirmRequest] = None,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm a pending payment. This will:
    - Update payment status to COMPLETED
    - Credit agency wallet (pending funds)
    - Record platform commission
    """
    from fastapi import HTTPException
    
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot confirm payment with status: {payment.status.value}"
        )
    
    # Update payment status
    payment.status = PaymentStatus.COMPLETED
    payment.confirmed_by_id = current_user.id if current_user else None
    payment.confirmed_at = datetime.now(timezone.utc)
    
    # TODO: Add funds to agency wallet (escrow)
    # TODO: Send notification to agency
    
    await db.flush()
    
    return {
        "success": True,
        "payment_id": str(payment.id),
        "status": payment.status.value,
        "message": "Payment confirmed successfully"
    }


@router.post(
    "/payments/{payment_id}/reject",
    summary="Reject a pending payment",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def reject_payment(
    payment_id: uuid.UUID,
    request: PaymentRejectRequest,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Reject a pending payment. This will:
    - Update payment status to FAILED
    - Initiate refund if applicable
    - Notify user of rejection
    """
    from fastapi import HTTPException
    
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status not in [PaymentStatus.PENDING, PaymentStatus.PROCESSING]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject payment with status: {payment.status.value}"
        )
    
    # Update payment status
    payment.status = PaymentStatus.FAILED
    payment.rejection_reason = request.reason
    payment.rejected_by_id = current_user.id if current_user else None
    
    # TODO: Initiate refund via Izipay if funds were captured
    # TODO: Send notification to user
    
    await db.flush()
    
    return {
        "success": True,
        "payment_id": str(payment.id),
        "status": payment.status.value,
        "message": "Payment rejected"
    }


@router.get(
    "/payments",
    summary="List all payments",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def list_payments(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all payments with filters for super admin."""
    stmt = select(Payment)
    
    if status:
        stmt = stmt.where(Payment.status == PaymentStatus(status))
    
    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page).order_by(Payment.created_at.desc())
    
    result = await db.execute(stmt)
    payments = list(result.scalars().all())
    
    return {
        "items": [
            {
                "id": str(p.id),
                "booking_id": str(p.booking_id) if p.booking_id else None,
                "amount": float(p.amount),
                "platform_fee": float(p.platform_commission or 0),
                "agency_amount": float(p.agency_amount or 0),
                "guide_amount": float(p.guide_amount or 0),
                "status": p.status.value,
                "payment_method": p.payment_method or "izipay",
                "created_at": p.created_at.isoformat(),
            }
            for p in payments
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get(
    "/payments/stats",
    summary="Payment statistics",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_payment_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get payment statistics for dashboard."""
    
    # Total completed revenue
    revenue_result = await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.COMPLETED)
    )
    total_revenue = float(revenue_result.scalar() or 0)
    
    # Platform fees
    fees_result = await db.execute(
        select(func.sum(Payment.platform_commission)).where(Payment.status == PaymentStatus.COMPLETED)
    )
    platform_fees = float(fees_result.scalar() or 0)
    
    # Count
    count_result = await db.execute(
        select(func.count(Payment.id)).where(Payment.status == PaymentStatus.COMPLETED)
    )
    count = count_result.scalar() or 0
    
    return {
        "total": total_revenue,
        "platform_fees": platform_fees,
        "count": count,
    }

