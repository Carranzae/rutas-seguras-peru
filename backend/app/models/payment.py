"""
Ruta Segura Perú - Payment Model
Payment transactions with IziPay and commission distribution
"""
from decimal import Decimal
from datetime import datetime
from enum import Enum
from typing import Optional
import uuid

from sqlalchemy import Column, String, Numeric, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    IZIPAY = "izipay"
    YAPE = "yape"
    PLIN = "plin"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"


class Payment(BaseModel):
    """Payment transaction model."""
    __tablename__ = "payments"
    
    # Transaction info
    transaction_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # IziPay transaction ID
    
    # Amount
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="PEN")
    
    # Commission breakdown (15/70/15 model)
    platform_commission: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    agency_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    guide_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    
    # Commission percentages used
    platform_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=15)
    agency_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=70)
    guide_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=15)
    
    # Status
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus), 
        default=PaymentStatus.PENDING
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SQLEnum(PaymentMethod),
        default=PaymentMethod.IZIPAY
    )
    
    # Relationships
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    tour_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tours.id"),
        nullable=True
    )
    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id"),
        nullable=True
    )
    agency_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agencies.id"),
        nullable=True
    )
    guide_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("guides.id"),
        nullable=True
    )
    
    # Timestamps
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    refunded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    izipay_response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    refund_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Card info (masked)
    card_last_four: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    card_brand: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # User info snapshot
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationship to booking
    booking = relationship("Booking", back_populates="payment", uselist=False)
    
    def calculate_commission(self):
        """Calculate commission distribution."""
        amount = float(self.amount)
        
        # Platform takes 15%
        self.platform_commission = Decimal(str(round(amount * 0.15, 2)))
        
        # Agency gets 70%
        self.agency_amount = Decimal(str(round(amount * 0.70, 2)))
        
        # Guide gets 15%
        self.guide_amount = Decimal(str(round(amount * 0.15, 2)))
        
        return {
            "platform": float(self.platform_commission),
            "agency": float(self.agency_amount),
            "guide": float(self.guide_amount),
        }


class Booking(BaseModel):
    """Booking/reservation model."""
    __tablename__ = "bookings"
    
    # Tour and participant
    tour_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tours.id"),
        nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    
    # Booking details
    num_participants: Mapped[int] = mapped_column(Integer, default=1)
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending")
    
    # Contact info
    contact_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Special requests
    special_requests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    tour = relationship("Tour", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)
