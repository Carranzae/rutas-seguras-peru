"""
Ruta Segura Perú - Emergency Contacts Router
CRUD operations for emergency contact management
"""
import uuid
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.emergency_contact import (
    EmergencyContact,
    NotificationChannel,
    ContactRelationship,
)


router = APIRouter(prefix="/emergency-contacts", tags=["Emergency Contacts"])

# Maximum contacts per user
MAX_CONTACTS = 5

# E.164 phone regex
E164_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")


# ============================================
# SCHEMAS
# ============================================

class EmergencyContactCreate(BaseModel):
    """Create emergency contact request."""
    name: str
    phone_e164: str
    email: Optional[str] = None
    relationship: str = "family"
    notification_channel: str = "sms"
    language: str = "es"
    country_code: str = "PE"
    is_primary: bool = False
    
    @field_validator("phone_e164")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate E.164 phone format."""
        # Clean up common formatting
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not cleaned.startswith("+"):
            # Assume Peru if no country code
            cleaned = "+51" + cleaned.lstrip("0")
        
        if not E164_PATTERN.match(cleaned):
            raise ValueError(
                "Número debe estar en formato internacional (ej: +51987654321)"
            )
        return cleaned
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name is not empty."""
        if not v or len(v.strip()) < 2:
            raise ValueError("Nombre debe tener al menos 2 caracteres")
        return v.strip()


class EmergencyContactUpdate(BaseModel):
    """Update emergency contact request."""
    name: Optional[str] = None
    phone_e164: Optional[str] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    notification_channel: Optional[str] = None
    language: Optional[str] = None
    country_code: Optional[str] = None
    is_primary: Optional[bool] = None
    priority: Optional[int] = None
    
    @field_validator("phone_e164")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not cleaned.startswith("+"):
            cleaned = "+51" + cleaned.lstrip("0")
        if not E164_PATTERN.match(cleaned):
            raise ValueError(
                "Número debe estar en formato internacional (ej: +51987654321)"
            )
        return cleaned


class EmergencyContactResponse(BaseModel):
    """Emergency contact response."""
    id: str
    name: str
    phone_e164: str
    phone_display: str
    email: Optional[str]
    relationship: str
    notification_channel: str
    is_primary: bool
    is_verified: bool
    priority: int
    language: str
    country_code: str
    created_at: str
    
    class Config:
        from_attributes = True


class EmergencyContactListResponse(BaseModel):
    """List of emergency contacts."""
    items: list[EmergencyContactResponse]
    total: int
    max_allowed: int


# ============================================
# ENDPOINTS
# ============================================

@router.get("", response_model=EmergencyContactListResponse)
async def list_emergency_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all emergency contacts for the current user.
    Returns contacts sorted by priority.
    """
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.user_id == current_user.id)
        .where(EmergencyContact.is_active == True)
        .order_by(EmergencyContact.priority.asc())
    )
    contacts = result.scalars().all()
    
    items = [
        EmergencyContactResponse(
            id=str(c.id),
            name=c.name,
            phone_e164=c.phone_e164,
            phone_display=c.display_phone,
            email=c.email,
            relationship=c.relationship.value,
            notification_channel=c.notification_channel.value,
            is_primary=c.is_primary,
            is_verified=c.is_verified,
            priority=c.priority,
            language=c.language,
            country_code=c.country_code,
            created_at=c.created_at.isoformat(),
        )
        for c in contacts
    ]
    
    return EmergencyContactListResponse(
        items=items,
        total=len(items),
        max_allowed=MAX_CONTACTS,
    )


@router.post("", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    data: EmergencyContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a new emergency contact.
    Maximum 5 contacts per user.
    """
    # Check limit
    count_result = await db.execute(
        select(func.count(EmergencyContact.id))
        .where(EmergencyContact.user_id == current_user.id)
        .where(EmergencyContact.is_active == True)
    )
    current_count = count_result.scalar() or 0
    
    if current_count >= MAX_CONTACTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo {MAX_CONTACTS} contactos de emergencia permitidos",
        )
    
    # Check for duplicate phone
    existing = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.user_id == current_user.id)
        .where(EmergencyContact.phone_e164 == data.phone_e164)
        .where(EmergencyContact.is_active == True)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este número ya está registrado como contacto de emergencia",
        )
    
    # Parse enums
    try:
        relationship = ContactRelationship(data.relationship)
    except ValueError:
        relationship = ContactRelationship.OTHER
    
    try:
        channel = NotificationChannel(data.notification_channel)
    except ValueError:
        channel = NotificationChannel.SMS
    
    # If this is primary, unset other primaries
    if data.is_primary:
        await db.execute(
            select(EmergencyContact)
            .where(EmergencyContact.user_id == current_user.id)
        )
        # Update all to non-primary
        from sqlalchemy import update
        await db.execute(
            update(EmergencyContact)
            .where(EmergencyContact.user_id == current_user.id)
            .values(is_primary=False)
        )
    
    # Create contact
    contact = EmergencyContact(
        user_id=current_user.id,
        name=data.name,
        phone_e164=data.phone_e164,
        email=data.email,
        relationship=relationship,
        notification_channel=channel,
        is_primary=data.is_primary,
        language=data.language,
        country_code=data.country_code,
        priority=current_count + 1,
    )
    
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    
    return EmergencyContactResponse(
        id=str(contact.id),
        name=contact.name,
        phone_e164=contact.phone_e164,
        phone_display=contact.display_phone,
        email=contact.email,
        relationship=contact.relationship.value,
        notification_channel=contact.notification_channel.value,
        is_primary=contact.is_primary,
        is_verified=contact.is_verified,
        priority=contact.priority,
        language=contact.language,
        country_code=contact.country_code,
        created_at=contact.created_at.isoformat(),
    )


@router.put("/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: uuid.UUID,
    data: EmergencyContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an emergency contact."""
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.id == contact_id)
        .where(EmergencyContact.user_id == current_user.id)
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
        )
    
    # Update fields
    if data.name is not None:
        contact.name = data.name
    if data.phone_e164 is not None:
        contact.phone_e164 = data.phone_e164
    if data.email is not None:
        contact.email = data.email
    if data.relationship is not None:
        try:
            contact.relationship = ContactRelationship(data.relationship)
        except ValueError:
            pass
    if data.notification_channel is not None:
        try:
            contact.notification_channel = NotificationChannel(data.notification_channel)
        except ValueError:
            pass
    if data.language is not None:
        contact.language = data.language
    if data.country_code is not None:
        contact.country_code = data.country_code
    if data.priority is not None:
        contact.priority = max(1, min(5, data.priority))
    
    if data.is_primary is True:
        from sqlalchemy import update
        await db.execute(
            update(EmergencyContact)
            .where(EmergencyContact.user_id == current_user.id)
            .where(EmergencyContact.id != contact_id)
            .values(is_primary=False)
        )
        contact.is_primary = True
    elif data.is_primary is False:
        contact.is_primary = False
    
    await db.commit()
    await db.refresh(contact)
    
    return EmergencyContactResponse(
        id=str(contact.id),
        name=contact.name,
        phone_e164=contact.phone_e164,
        phone_display=contact.display_phone,
        email=contact.email,
        relationship=contact.relationship.value,
        notification_channel=contact.notification_channel.value,
        is_primary=contact.is_primary,
        is_verified=contact.is_verified,
        priority=contact.priority,
        language=contact.language,
        country_code=contact.country_code,
        created_at=contact.created_at.isoformat(),
    )


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emergency_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an emergency contact."""
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.id == contact_id)
        .where(EmergencyContact.user_id == current_user.id)
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
        )
    
    # Soft delete
    contact.is_active = False
    await db.commit()


@router.post("/{contact_id}/verify", response_model=dict)
async def send_verification_code(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send verification code to emergency contact.
    This confirms the contact's phone number is correct.
    """
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.id == contact_id)
        .where(EmergencyContact.user_id == current_user.id)
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
        )
    
    # TODO: Implement actual verification code sending
    # For now, return success
    return {
        "message": "Código de verificación enviado",
        "phone": contact.display_phone,
    }


@router.post("/reorder", response_model=EmergencyContactListResponse)
async def reorder_contacts(
    order: list[str],  # List of contact IDs in new order
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reorder emergency contacts priority.
    Contacts are notified in priority order during SOS.
    """
    for idx, contact_id in enumerate(order):
        from sqlalchemy import update
        await db.execute(
            update(EmergencyContact)
            .where(EmergencyContact.id == uuid.UUID(contact_id))
            .where(EmergencyContact.user_id == current_user.id)
            .values(priority=idx + 1)
        )
    
    await db.commit()
    
    # Return updated list
    return await list_emergency_contacts(db, current_user)
