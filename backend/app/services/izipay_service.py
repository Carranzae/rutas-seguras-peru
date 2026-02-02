"""
Ruta Segura Perú - Izipay Payment Service
Integration with Izipay payment gateway for Peru
Supports mock mode for testing without credentials
"""
import os
import uuid
import hmac
import hashlib
import base64
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
from loguru import logger
import httpx


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class TransactionType(str, Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    PAYOUT = "payout"


@dataclass
class PaymentRequest:
    """Payment request data"""
    amount: float
    currency: str = "PEN"
    customer_email: str = ""
    customer_name: str = ""
    order_id: str = ""
    description: str = ""
    tour_id: Optional[str] = None
    agency_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class PaymentResult:
    """Payment result from Izipay"""
    success: bool
    transaction_id: str
    status: PaymentStatus
    amount: float
    currency: str
    payment_url: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None


@dataclass
class RefundResult:
    """Refund result from Izipay"""
    success: bool
    refund_id: str
    amount: float
    status: PaymentStatus
    error_message: Optional[str] = None


class IzipayService:
    """
    Izipay Payment Gateway Integration
    
    Supports:
    - Payment form generation
    - Payment status verification
    - Refunds
    - Webhook signature verification
    - Mock mode for testing
    
    Environment variables:
    - IZIPAY_MERCHANT_CODE: Merchant identifier
    - IZIPAY_PUBLIC_KEY: Public key for client-side
    - IZIPAY_PRIVATE_KEY: Private key for server-side
    - IZIPAY_ENDPOINT: API endpoint (sandbox/production)
    - IZIPAY_MOCK_MODE: Set to "true" for testing
    """
    
    SANDBOX_ENDPOINT = "https://sandbox-api-payment.izipay.pe"
    PRODUCTION_ENDPOINT = "https://api-payment.izipay.pe"
    
    # Platform fee percentage (15% by default)
    PLATFORM_FEE_PERCENT = 0.15
    
    def __init__(self):
        self.merchant_code = os.getenv("IZIPAY_MERCHANT_CODE", "")
        self.public_key = os.getenv("IZIPAY_PUBLIC_KEY", "")
        self.private_key = os.getenv("IZIPAY_PRIVATE_KEY", "")
        self.mock_mode = os.getenv("IZIPAY_MOCK_MODE", "true").lower() == "true"
        
        # Use sandbox if no production credentials
        self.endpoint = (
            os.getenv("IZIPAY_ENDPOINT") or 
            (self.SANDBOX_ENDPOINT if not self.merchant_code else self.PRODUCTION_ENDPOINT)
        )
        
        if self.mock_mode:
            logger.warning("Izipay running in MOCK MODE - no real transactions")
        else:
            if not all([self.merchant_code, self.public_key, self.private_key]):
                logger.error("Izipay credentials not configured - switching to mock mode")
                self.mock_mode = True
    
    def _generate_signature(self, data: Dict[str, Any]) -> str:
        """Generate HMAC signature for Izipay API calls"""
        if self.mock_mode:
            return "mock_signature_" + uuid.uuid4().hex[:16]
        
        # Sort keys and create message
        sorted_data = dict(sorted(data.items()))
        message = "&".join(f"{k}={v}" for k, v in sorted_data.items())
        
        # Create HMAC-SHA256 signature
        signature = hmac.new(
            self.private_key.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        
        return base64.b64encode(signature).decode()
    
    def _verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature from Izipay"""
        if self.mock_mode:
            return True
        
        expected = hmac.new(
            self.private_key.encode(),
            payload,
            hashlib.sha256
        ).digest()
        
        return hmac.compare_digest(
            base64.b64decode(signature),
            expected
        )
    
    async def create_payment(self, request: PaymentRequest) -> PaymentResult:
        """
        Create a payment session with Izipay
        
        Returns a payment URL for client-side redirect
        """
        order_id = request.order_id or f"RSP-{uuid.uuid4().hex[:12].upper()}"
        
        if self.mock_mode:
            return self._mock_create_payment(request, order_id)
        
        try:
            # Prepare payment data
            payment_data = {
                "merchantCode": self.merchant_code,
                "orderId": order_id,
                "amount": int(request.amount * 100),  # Amount in cents
                "currency": request.currency,
                "customerEmail": request.customer_email,
                "customerName": request.customer_name,
                "description": request.description or f"Ruta Segura - {order_id}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            
            # Add metadata
            if request.metadata:
                payment_data["metadata"] = json.dumps(request.metadata)
            
            # Generate signature
            payment_data["signature"] = self._generate_signature(payment_data)
            
            # Call Izipay API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/v1/payments/session",
                    json=payment_data,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.public_key}",
                    },
                    timeout=30.0
                )
                
                result = response.json()
                
                if response.status_code == 200 and result.get("success"):
                    return PaymentResult(
                        success=True,
                        transaction_id=result.get("transactionId", order_id),
                        status=PaymentStatus.PENDING,
                        amount=request.amount,
                        currency=request.currency,
                        payment_url=result.get("paymentUrl"),
                        raw_response=result
                    )
                else:
                    return PaymentResult(
                        success=False,
                        transaction_id=order_id,
                        status=PaymentStatus.FAILED,
                        amount=request.amount,
                        currency=request.currency,
                        error_message=result.get("message", "Payment creation failed"),
                        raw_response=result
                    )
                    
        except Exception as e:
            logger.exception(f"Izipay payment creation error: {e}")
            return PaymentResult(
                success=False,
                transaction_id=order_id,
                status=PaymentStatus.FAILED,
                amount=request.amount,
                currency=request.currency,
                error_message=str(e)
            )
    
    def _mock_create_payment(self, request: PaymentRequest, order_id: str) -> PaymentResult:
        """Mock payment for testing"""
        logger.info(f"[MOCK] Creating payment: {order_id} for S/ {request.amount}")
        
        # Simulate payment URL (would redirect to Izipay hosted page)
        mock_payment_url = f"http://localhost:3001/mock-payment?order={order_id}&amount={request.amount}"
        
        return PaymentResult(
            success=True,
            transaction_id=f"mock_{order_id}",
            status=PaymentStatus.PENDING,
            amount=request.amount,
            currency=request.currency,
            payment_url=mock_payment_url,
            raw_response={"mock": True, "orderId": order_id}
        )
    
    async def verify_payment(self, transaction_id: str) -> PaymentResult:
        """Verify payment status with Izipay"""
        if self.mock_mode:
            return self._mock_verify_payment(transaction_id)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.endpoint}/v1/payments/{transaction_id}",
                    headers={
                        "Authorization": f"Bearer {self.private_key}",
                    },
                    timeout=30.0
                )
                
                result = response.json()
                
                if response.status_code == 200:
                    status_map = {
                        "AUTHORIZED": PaymentStatus.AUTHORIZED,
                        "CAPTURED": PaymentStatus.CAPTURED,
                        "PENDING": PaymentStatus.PENDING,
                        "FAILED": PaymentStatus.FAILED,
                        "CANCELLED": PaymentStatus.CANCELLED,
                    }
                    
                    return PaymentResult(
                        success=True,
                        transaction_id=transaction_id,
                        status=status_map.get(result.get("status"), PaymentStatus.PENDING),
                        amount=result.get("amount", 0) / 100,
                        currency=result.get("currency", "PEN"),
                        raw_response=result
                    )
                else:
                    return PaymentResult(
                        success=False,
                        transaction_id=transaction_id,
                        status=PaymentStatus.FAILED,
                        amount=0,
                        currency="PEN",
                        error_message=result.get("message", "Verification failed")
                    )
                    
        except Exception as e:
            logger.exception(f"Izipay verification error: {e}")
            return PaymentResult(
                success=False,
                transaction_id=transaction_id,
                status=PaymentStatus.FAILED,
                amount=0,
                currency="PEN",
                error_message=str(e)
            )
    
    def _mock_verify_payment(self, transaction_id: str) -> PaymentResult:
        """Mock payment verification"""
        logger.info(f"[MOCK] Verifying payment: {transaction_id}")
        
        # Simulate successful payment (for testing)
        return PaymentResult(
            success=True,
            transaction_id=transaction_id,
            status=PaymentStatus.CAPTURED,
            amount=100.0,  # Mock amount
            currency="PEN",
            raw_response={"mock": True, "status": "CAPTURED"}
        )
    
    async def process_refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: str = ""
    ) -> RefundResult:
        """Process a refund for a captured payment"""
        if self.mock_mode:
            return self._mock_refund(transaction_id, amount)
        
        try:
            refund_data = {
                "transactionId": transaction_id,
                "reason": reason,
            }
            
            if amount:
                refund_data["amount"] = int(amount * 100)
            
            refund_data["signature"] = self._generate_signature(refund_data)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/v1/refunds",
                    json=refund_data,
                    headers={
                        "Authorization": f"Bearer {self.private_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=30.0
                )
                
                result = response.json()
                
                if response.status_code == 200 and result.get("success"):
                    return RefundResult(
                        success=True,
                        refund_id=result.get("refundId", ""),
                        amount=result.get("amount", 0) / 100,
                        status=PaymentStatus.REFUNDED
                    )
                else:
                    return RefundResult(
                        success=False,
                        refund_id="",
                        amount=0,
                        status=PaymentStatus.FAILED,
                        error_message=result.get("message", "Refund failed")
                    )
                    
        except Exception as e:
            logger.exception(f"Izipay refund error: {e}")
            return RefundResult(
                success=False,
                refund_id="",
                amount=0,
                status=PaymentStatus.FAILED,
                error_message=str(e)
            )
    
    def _mock_refund(self, transaction_id: str, amount: Optional[float]) -> RefundResult:
        """Mock refund"""
        logger.info(f"[MOCK] Refunding payment: {transaction_id}")
        
        return RefundResult(
            success=True,
            refund_id=f"refund_{uuid.uuid4().hex[:8]}",
            amount=amount or 100.0,
            status=PaymentStatus.REFUNDED
        )
    
    def process_webhook(self, payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """
        Process Izipay webhook notification
        
        Returns parsed data if signature is valid, None otherwise
        """
        if not self._verify_webhook_signature(payload, signature):
            logger.warning("Invalid webhook signature")
            return None
        
        try:
            data = json.loads(payload)
            logger.info(f"Webhook received: {data.get('event')} for {data.get('transactionId')}")
            return data
        except json.JSONDecodeError:
            logger.error("Invalid webhook payload")
            return None
    
    def calculate_split(self, total_amount: float) -> Dict[str, float]:
        """
        Calculate payment split between platform and agency
        
        Returns:
            {
                "platform_fee": amount for platform,
                "agency_amount": amount for agency,
                "total": original total
            }
        """
        platform_fee = round(total_amount * self.PLATFORM_FEE_PERCENT, 2)
        agency_amount = round(total_amount - platform_fee, 2)
        
        return {
            "platform_fee": platform_fee,
            "agency_amount": agency_amount,
            "total": total_amount,
            "fee_percent": self.PLATFORM_FEE_PERCENT * 100
        }


# Singleton instance
izipay_service = IzipayService()
