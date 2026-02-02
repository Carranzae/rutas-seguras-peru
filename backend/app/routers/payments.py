"""
Ruta Segura Perú - Payments Router
Payment processing endpoints with IziPay
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status, Query, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.payment_service import PaymentService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole
from app.models.payment import PaymentStatus
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

router = APIRouter(prefix="/payments", tags=["Payments"])


# Schemas
class PaymentInitiate(BaseModel):
    tour_id: uuid.UUID
    booking_id: Optional[uuid.UUID] = None
    amount: float = Field(..., gt=0)
    agency_id: uuid.UUID
    guide_id: Optional[uuid.UUID] = None


class PaymentResponse(BaseModel):
    id: uuid.UUID
    transaction_id: Optional[str] = None
    amount: float
    currency: str = "PEN"
    status: str
    payment_method: str
    user_email: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    
    # Commission breakdown
    platform_commission: float = 0
    agency_amount: float = 0
    guide_amount: float = 0
    
    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    per_page: int


class RefundRequest(BaseModel):
    reason: str = Field(..., min_length=10)


def _payment_to_response(payment) -> PaymentResponse:
    return PaymentResponse(
        id=payment.id,
        transaction_id=payment.transaction_id,
        amount=float(payment.amount),
        currency=payment.currency,
        status=payment.status.value,
        payment_method=payment.payment_method.value if hasattr(payment.payment_method, 'value') else str(payment.payment_method),
        user_email=payment.user_email,
        created_at=payment.created_at,
        paid_at=payment.paid_at,
        platform_commission=float(payment.platform_fee or payment.platform_commission or 0),
        agency_amount=float(payment.agency_amount or 0),
        guide_amount=float(payment.guide_amount or 0),
    )


@router.get(
    "/",
    response_model=PaymentListResponse,
    summary="List all payments (admin)",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def list_all_payments(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all payments for super admin."""
    from sqlalchemy import select, func
    from app.models.payment import Payment
    
    query = select(Payment)
    
    if status:
        try:
            status_enum = PaymentStatus(status)
            query = query.where(Payment.status == status_enum)
        except ValueError:
            pass
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get paginated results
    query = query.order_by(Payment.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return PaymentListResponse(
        items=[_payment_to_response(p) for p in payments],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post(
    "/initiate",
    summary="Initiate payment",
    description="Create a payment and get IziPay checkout form data.",
)
async def initiate_payment(
    data: PaymentInitiate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Initiate a payment for tour booking."""
    service = PaymentService(db)
    result = await service.initiate_payment(
        user=current_user,
        tour_id=data.tour_id,
        booking_id=data.booking_id,
        amount=data.amount,
        agency_id=data.agency_id,
        guide_id=data.guide_id,
    )
    return result


@router.post(
    "/webhook/izipay",
    summary="IziPay webhook",
    description="Handle IziPay IPN notifications.",
    include_in_schema=False,
)
async def izipay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Process IziPay webhook (IPN)."""
    try:
        body = await request.body()
        data = await request.json()
        signature = request.headers.get("X-IziPay-Signature", "")
        
        service = PaymentService(db)
        result = await service.process_webhook(data, signature)
        
        return result
    except Exception as e:
        from loguru import logger
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get(
    "/my",
    response_model=PaymentListResponse,
    summary="Get my payments",
)
async def get_my_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Get current user's payment history."""
    service = PaymentService(db)
    payments, total = await service.get_user_payments(
        user_id=current_user.id,
        page=page,
        per_page=per_page,
    )
    
    return PaymentListResponse(
        items=[_payment_to_response(p) for p in payments],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/agency/{agency_id}",
    response_model=PaymentListResponse,
    summary="Get agency payments",
    dependencies=[Depends(require_roles(UserRole.AGENCY_ADMIN, UserRole.SUPER_ADMIN))],
)
async def get_agency_payments(
    agency_id: uuid.UUID,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get payments for an agency."""
    service = PaymentService(db)
    status_enum = PaymentStatus(status) if status else None
    payments, total = await service.get_agency_payments(
        agency_id=agency_id,
        status=status_enum,
        page=page,
        per_page=per_page,
    )
    
    return PaymentListResponse(
        items=[_payment_to_response(p) for p in payments],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Get payment details",
)
async def get_payment(
    payment_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get payment details by ID."""
    service = PaymentService(db)
    payment = await service.get_payment(payment_id)
    
    # Check access
    if payment.user_id != current_user.id and current_user.role == UserRole.TOURIST:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return _payment_to_response(payment)


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentResponse,
    summary="Refund payment",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN))],
)
async def refund_payment(
    payment_id: uuid.UUID,
    data: RefundRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Process a refund."""
    service = PaymentService(db)
    payment = await service.refund_payment(
        payment_id=payment_id,
        reason=data.reason,
        refunded_by=current_user,
    )
    return _payment_to_response(payment)


@router.get(
    "/stats/platform",
    summary="Get platform payment stats",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))],
)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide payment statistics (super admin only)."""
    service = PaymentService(db)
    return await service.get_platform_stats()
