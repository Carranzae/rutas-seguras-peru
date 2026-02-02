"""
Ruta Segura Perú - Payment Service
Business logic for payments with IziPay and commission distribution
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.payment import Payment, PaymentStatus, PaymentMethod, Booking
from app.models.user import User
from app.core.exceptions import NotFoundException, BadRequestException
from app.integrations.izipay_service import izipay_service
from loguru import logger


class PaymentService:
    """
    Payment processing service.
    Handles IziPay integration and commission distribution.
    """
    
    # Commission structure (percentage)
    PLATFORM_COMMISSION = Decimal("15.00")
    AGENCY_COMMISSION = Decimal("70.00")
    GUIDE_COMMISSION = Decimal("15.00")
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def initiate_payment(
        self,
        user: User,
        tour_id: uuid.UUID,
        booking_id: Optional[uuid.UUID],
        amount: float,
        agency_id: uuid.UUID,
        guide_id: Optional[uuid.UUID] = None,
    ) -> dict:
        """
        Initiate a payment and get IziPay checkout token.
        
        Returns form data for frontend to render IziPay form.
        """
        # Create payment record
        payment = Payment(
            user_id=user.id,
            tour_id=tour_id,
            booking_id=booking_id,
            agency_id=agency_id,
            guide_id=guide_id,
            amount=Decimal(str(amount)),
            currency="PEN",
            status=PaymentStatus.PENDING,
            payment_method=PaymentMethod.IZIPAY,
            user_email=user.email,
            user_name=user.full_name,
        )
        
        # Calculate commissions
        payment.calculate_commission()
        
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        
        # Generate IziPay token
        order_id = f"RSP-{str(payment.id)[:8].upper()}"
        payment.transaction_id = order_id
        
        token_data = izipay_service.generate_payment_token(
            amount=amount,
            currency="PEN",
            order_id=order_id,
            customer_email=user.email,
            customer_name=user.full_name,
            description=f"Reserva de Tour - Ruta Segura Perú",
        )
        
        await self.db.flush()
        
        logger.info(
            f"Payment initiated | ID: {payment.id} | "
            f"Amount: {amount} PEN | User: {user.email}"
        )
        
        return {
            "payment_id": str(payment.id),
            "order_id": order_id,
            "amount": amount,
            "izipay": token_data,
            "commission_breakdown": {
                "platform": float(payment.platform_commission),
                "agency": float(payment.agency_amount),
                "guide": float(payment.guide_amount),
            }
        }
    
    async def process_webhook(self, webhook_data: dict, signature: str) -> dict:
        """
        Process IziPay webhook (IPN).
        Updates payment status based on webhook data.
        """
        # Parse webhook
        parsed = izipay_service.parse_webhook(webhook_data)
        
        order_id = parsed.get("order_id")
        if not order_id:
            logger.error("Webhook missing order_id")
            return {"success": False, "error": "Missing order_id"}
        
        # Find payment
        result = await self.db.execute(
            select(Payment).where(Payment.transaction_id == order_id)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            logger.error(f"Payment not found for order: {order_id}")
            return {"success": False, "error": "Payment not found"}
        
        # Update payment based on status
        status = parsed.get("status")
        
        if status == "PAID" or status == "AUTHORISED":
            payment.status = PaymentStatus.COMPLETED
            payment.paid_at = datetime.now(timezone.utc)
            payment.external_id = parsed.get("transaction_id")
            payment.card_last_four = parsed.get("card_last_four")
            payment.card_brand = parsed.get("card_brand")
            
            logger.info(f"Payment completed | Order: {order_id}")
            
        elif status == "CANCELLED" or status == "REFUSED":
            payment.status = PaymentStatus.FAILED
            logger.warning(f"Payment failed | Order: {order_id}")
            
        payment.izipay_response = parsed.get("raw_response")
        
        await self.db.flush()
        
        return {
            "success": True,
            "payment_id": str(payment.id),
            "status": payment.status.value,
        }
    
    async def get_payment(self, payment_id: uuid.UUID) -> Payment:
        """Get payment by ID."""
        result = await self.db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise NotFoundException("Payment not found")
        
        return payment
    
    async def get_user_payments(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Payment], int]:
        """Get payment history for a user."""
        stmt = select(Payment).where(Payment.user_id == user_id)
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(Payment.created_at.desc())
        
        result = await self.db.execute(stmt)
        payments = list(result.scalars().all())
        
        return payments, total
    
    async def get_agency_payments(
        self,
        agency_id: uuid.UUID,
        status: Optional[PaymentStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[List[Payment], int]:
        """Get payments for an agency."""
        stmt = select(Payment).where(Payment.agency_id == agency_id)
        
        if status:
            stmt = stmt.where(Payment.status == status)
        
        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Paginate
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(Payment.created_at.desc())
        
        result = await self.db.execute(stmt)
        payments = list(result.scalars().all())
        
        return payments, total
    
    async def refund_payment(
        self,
        payment_id: uuid.UUID,
        reason: str,
        refunded_by: User,
    ) -> Payment:
        """Process a refund."""
        payment = await self.get_payment(payment_id)
        
        if payment.status != PaymentStatus.COMPLETED:
            raise BadRequestException("Can only refund completed payments")
        
        # Call IziPay refund
        if payment.external_id:
            refund_result = await izipay_service.refund_payment(
                transaction_id=payment.external_id,
                reason=reason,
            )
            
            if not refund_result.get("success"):
                raise BadRequestException(f"Refund failed: {refund_result.get('error')}")
        
        payment.status = PaymentStatus.REFUNDED
        payment.refunded_at = datetime.now(timezone.utc)
        payment.refund_reason = reason
        
        await self.db.flush()
        await self.db.refresh(payment)
        
        logger.info(
            f"Payment refunded | ID: {payment_id} | "
            f"By: {refunded_by.email} | Reason: {reason}"
        )
        
        return payment
    
    async def get_platform_stats(self) -> dict:
        """Get platform-wide payment statistics (super admin)."""
        # Total revenue
        total_result = await self.db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.status == PaymentStatus.COMPLETED
            )
        )
        total_revenue = total_result.scalar() or 0
        
        # Platform earnings
        platform_result = await self.db.execute(
            select(func.sum(Payment.platform_commission)).where(
                Payment.status == PaymentStatus.COMPLETED
            )
        )
        platform_earnings = platform_result.scalar() or 0
        
        # Count transactions
        count_result = await self.db.execute(
            select(func.count(Payment.id)).where(
                Payment.status == PaymentStatus.COMPLETED
            )
        )
        total_transactions = count_result.scalar() or 0
        
        return {
            "total_revenue": float(total_revenue),
            "platform_earnings": float(platform_earnings),
            "total_transactions": total_transactions,
            "pending_payouts": 0,  # TODO: Calculate
        }
