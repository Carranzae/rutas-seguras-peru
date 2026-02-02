"""
Ruta Segura Perú - IziPay Integration Service
Payment processing with IziPay gateway
"""
import hmac
import hashlib
import base64
import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Dict, Any
import uuid
import httpx
from loguru import logger

from app.config import settings


class IziPayService:
    """
    IziPay payment gateway integration.
    
    Supports:
    - Payment token generation
    - Transaction processing
    - Webhook verification
    - Refunds
    """
    
    def __init__(self):
        self._initialized = False
    
    def _check_config(self) -> bool:
        """Verify IziPay configuration."""
        if not settings.izipay_merchant_code:
            logger.warning("IziPay not configured - payments disabled")
            return False
        return True
    
    def generate_payment_token(
        self,
        amount: float,
        currency: str = "PEN",
        order_id: str = None,
        customer_email: str = None,
        customer_name: str = None,
        description: str = "Reserva de Tour - Ruta Segura Perú",
    ) -> Dict[str, Any]:
        """
        Generate payment token for IziPay checkout.
        
        Args:
            amount: Payment amount
            currency: Currency code (PEN, USD)
            order_id: Unique order ID
            customer_email: Customer email
            customer_name: Customer name
            description: Payment description
        
        Returns:
            dict with formToken and other payment data
        """
        if not self._check_config():
            return {"success": False, "error": "IziPay not configured"}
        
        order_id = order_id or str(uuid.uuid4())[:20]
        
        # Amount in cents (IziPay uses smallest currency unit)
        amount_cents = int(amount * 100)
        
        # Generate signature
        signature_data = f"{settings.izipay_merchant_code}{order_id}{amount_cents}{currency}"
        signature = self._generate_signature(signature_data)
        
        # Payment form data
        payment_data = {
            "amount": amount_cents,
            "currency": currency,
            "orderId": order_id,
            "customer": {
                "email": customer_email,
                "billingDetails": {
                    "firstName": customer_name.split()[0] if customer_name else "",
                    "lastName": " ".join(customer_name.split()[1:]) if customer_name else "",
                }
            },
            "transactionOptions": {
                "cardOptions": {
                    "paymentSource": "EC"
                }
            }
        }
        
        logger.info(f"IziPay token generated | Order: {order_id} | Amount: {amount} {currency}")
        
        return {
            "success": True,
            "orderId": order_id,
            "amount": amount,
            "currency": currency,
            "merchantCode": settings.izipay_merchant_code,
            "publicKey": settings.izipay_public_key,
            "signature": signature,
            "formData": payment_data,
        }
    
    async def process_payment(
        self,
        token: str,
        order_id: str,
        amount: float,
    ) -> Dict[str, Any]:
        """
        Process payment using IziPay token.
        
        In production, this would call IziPay API.
        For development, use sandbox mode.
        """
        if not self._check_config():
            return {"success": False, "error": "IziPay not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.izipay_endpoint}/api-payment/V4/Charge/CreatePayment",
                    headers={
                        "Authorization": f"Basic {self._get_auth_header()}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "paymentMethodToken": token,
                        "amount": int(amount * 100),
                        "currency": "PEN",
                        "orderId": order_id,
                    },
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    logger.info(
                        f"IziPay payment processed | Order: {order_id} | "
                        f"Status: {data.get('status')}"
                    )
                    
                    return {
                        "success": True,
                        "transactionId": data.get("answer", {}).get("transactionId"),
                        "status": data.get("status"),
                        "response": data,
                    }
                else:
                    logger.error(f"IziPay payment failed: {response.text}")
                    return {
                        "success": False,
                        "error": response.text,
                    }
                    
        except Exception as e:
            logger.error(f"IziPay payment error: {e}")
            return {"success": False, "error": str(e)}
    
    def verify_webhook(
        self,
        payload: str,
        signature: str,
    ) -> bool:
        """
        Verify IziPay webhook signature.
        
        Args:
            payload: Raw webhook payload
            signature: Signature from IziPay header
        
        Returns:
            True if signature is valid
        """
        if not settings.izipay_webhook_secret:
            logger.warning("IziPay webhook secret not configured")
            return False
        
        expected_signature = hmac.new(
            settings.izipay_webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    
    def parse_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse IziPay webhook data.
        
        Returns normalized payment information.
        """
        answer = data.get("answer", {})
        transaction = answer.get("transactions", [{}])[0] if answer.get("transactions") else {}
        
        return {
            "order_id": answer.get("orderDetails", {}).get("orderId"),
            "transaction_id": transaction.get("uuid"),
            "status": answer.get("orderStatus"),
            "amount": answer.get("orderDetails", {}).get("orderTotalAmount", 0) / 100,
            "currency": answer.get("orderDetails", {}).get("orderCurrency"),
            "card_last_four": transaction.get("transactionDetails", {}).get("cardDetails", {}).get("pan", "")[-4:],
            "card_brand": transaction.get("transactionDetails", {}).get("cardDetails", {}).get("effectiveBrand"),
            "customer_email": answer.get("customer", {}).get("email"),
            "raw_response": data,
        }
    
    async def refund_payment(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: str = "Refund requested",
    ) -> Dict[str, Any]:
        """
        Process a refund.
        
        Args:
            transaction_id: Original transaction ID
            amount: Refund amount (None for full refund)
            reason: Refund reason
        """
        if not self._check_config():
            return {"success": False, "error": "IziPay not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "uuid": transaction_id,
                    "comment": reason,
                }
                if amount:
                    payload["amount"] = int(amount * 100)
                
                response = await client.post(
                    f"{settings.izipay_endpoint}/api-payment/V4/Transaction/CancelOrRefund",
                    headers={
                        "Authorization": f"Basic {self._get_auth_header()}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"IziPay refund processed | Transaction: {transaction_id}")
                    return {"success": True, "response": data}
                else:
                    logger.error(f"IziPay refund failed: {response.text}")
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            logger.error(f"IziPay refund error: {e}")
            return {"success": False, "error": str(e)}
    
    def _generate_signature(self, data: str) -> str:
        """Generate HMAC-SHA256 signature."""
        if not settings.izipay_private_key:
            return ""
        
        return hmac.new(
            settings.izipay_private_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def _get_auth_header(self) -> str:
        """Get Basic auth header for IziPay API."""
        credentials = f"{settings.izipay_merchant_code}:{settings.izipay_private_key}"
        return base64.b64encode(credentials.encode()).decode()


# Singleton instance
izipay_service = IziPayService()
