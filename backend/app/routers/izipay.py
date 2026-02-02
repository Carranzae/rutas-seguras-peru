"""
Ruta Segura Perú - Izipay Payment Router
API endpoints for payment processing with Izipay
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.services.izipay_service import (
    izipay_service,
    PaymentRequest,
    PaymentStatus,
)


router = APIRouter(prefix="/payments/izipay", tags=["Payments - Izipay"])


# ============================================
# SCHEMAS
# ============================================

class CreatePaymentRequest(BaseModel):
    """Request to create a payment session"""
    amount: float = Field(..., gt=0, description="Amount in PEN")
    booking_id: Optional[UUID] = Field(None, description="Related booking ID")
    tour_id: Optional[UUID] = Field(None, description="Tour being purchased")
    description: Optional[str] = Field(None, max_length=200)
    
    class Config:
        json_schema_extra = {
            "example": {
                "amount": 450.00,
                "booking_id": "123e4567-e89b-12d3-a456-426614174000",
                "tour_id": "123e4567-e89b-12d3-a456-426614174001",
                "description": "Machu Picchu Tour - 2 personas"
            }
        }


class PaymentResponse(BaseModel):
    """Payment session response"""
    success: bool
    transaction_id: str
    payment_url: Optional[str]
    status: str
    amount: float
    currency: str
    message: Optional[str] = None


class PaymentSplitResponse(BaseModel):
    """Payment split calculation"""
    total: float
    platform_fee: float
    agency_amount: float
    fee_percent: float


class VerifyPaymentRequest(BaseModel):
    """Request to verify payment status"""
    transaction_id: str


class RefundRequest(BaseModel):
    """Request a refund"""
    transaction_id: str
    amount: Optional[float] = None  # Partial refund amount, or None for full
    reason: str = ""


class WebhookPayload(BaseModel):
    """Izipay webhook payload structure"""
    event: str
    transaction_id: str
    status: str
    amount: int
    currency: str
    order_id: str
    metadata: Optional[dict] = None


# ============================================
# ENDPOINTS
# ============================================

@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    request: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a payment session with Izipay
    
    Returns a payment URL for redirect to Izipay hosted checkout
    """
    try:
        # Create payment request
        payment_req = PaymentRequest(
            amount=request.amount,
            currency="PEN",
            customer_email=current_user.email,
            customer_name=current_user.full_name or "",
            order_id=f"RSP-{uuid.uuid4().hex[:8].upper()}",
            description=request.description or f"Ruta Segura - Reserva",
            tour_id=str(request.tour_id) if request.tour_id else None,
            metadata={
                "user_id": str(current_user.id),
                "booking_id": str(request.booking_id) if request.booking_id else None,
                "tour_id": str(request.tour_id) if request.tour_id else None,
            }
        )
        
        result = await izipay_service.create_payment(payment_req)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.error_message or "Payment creation failed"
            )
        
        # TODO: Save payment record to database
        
        return PaymentResponse(
            success=True,
            transaction_id=result.transaction_id,
            payment_url=result.payment_url,
            status=result.status.value,
            amount=result.amount,
            currency=result.currency
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Payment creation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating payment"
        )


@router.post("/verify", response_model=PaymentResponse)
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify the status of a payment
    """
    result = await izipay_service.verify_payment(request.transaction_id)
    
    return PaymentResponse(
        success=result.success,
        transaction_id=result.transaction_id,
        payment_url=None,
        status=result.status.value,
        amount=result.amount,
        currency=result.currency,
        message=result.error_message
    )


@router.post("/refund")
async def process_refund(
    request: RefundRequest,
    current_user: User = Depends(require_roles(["admin", "agency_admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Process a refund for a payment (admin/agency only)
    """
    result = await izipay_service.process_refund(
        transaction_id=request.transaction_id,
        amount=request.amount,
        reason=request.reason
    )
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error_message or "Refund failed"
        )
    
    return {
        "success": True,
        "refund_id": result.refund_id,
        "amount": result.amount,
        "status": result.status.value
    }


@router.get("/calculate-split", response_model=PaymentSplitResponse)
async def calculate_payment_split(amount: float):
    """
    Calculate the payment split between platform and agency
    
    - Platform receives 15% fee
    - Agency receives 85%
    """
    split = izipay_service.calculate_split(amount)
    return PaymentSplitResponse(**split)


@router.post("/webhook")
async def izipay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Izipay webhook endpoint for payment notifications
    
    Izipay will call this endpoint when payment status changes
    """
    try:
        # Get raw body and signature
        body = await request.body()
        signature = request.headers.get("X-Izipay-Signature", "")
        
        # Verify and parse webhook
        data = izipay_service.process_webhook(body, signature)
        
        if data is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )
        
        event = data.get("event")
        transaction_id = data.get("transaction_id")
        payment_status = data.get("status")
        
        logger.info(f"Webhook: {event} - {transaction_id} - {payment_status}")
        
        # TODO: Update payment record in database
        # TODO: If status is CAPTURED:
        #   - Mark booking as confirmed
        #   - Add funds to agency wallet (escrow)
        #   - Send confirmation notifications
        
        return {"received": True, "event": event}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Webhook processing error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


@router.get("/status")
async def get_izipay_status():
    """
    Get Izipay integration status
    
    Returns configuration status (does not expose credentials)
    """
    return {
        "configured": not izipay_service.mock_mode,
        "mock_mode": izipay_service.mock_mode,
        "platform_fee_percent": izipay_service.PLATFORM_FEE_PERCENT * 100,
        "endpoint": "sandbox" if "sandbox" in izipay_service.endpoint else "production"
    }
