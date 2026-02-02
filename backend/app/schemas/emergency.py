"""
Ruta Segura Perú - Emergency Schemas
Pydantic schemas for SOS and emergencies
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.emergency import EmergencySeverity, EmergencyStatus


class LocationData(BaseModel):
    """GPS location data."""
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    altitude: Optional[float] = None
    accuracy: Optional[float] = None


class SOSRequest(BaseModel):
    """SOS trigger request."""
    location: LocationData
    description: Optional[str] = Field(None, max_length=1000)
    severity: EmergencySeverity = EmergencySeverity.HIGH
    battery_level: Optional[int] = Field(None, ge=0, le=100)
    tour_id: Optional[uuid.UUID] = None
    
    # Coercion PIN flag - when True, this is a silent alarm
    # UI shows fake error, but backend alerts authorities
    is_silent: bool = Field(
        default=False,
        description="Silent alarm mode - triggered by coercion PIN. Notifies only authorities."
    )


class EmergencyUpdate(BaseModel):
    """Update emergency status/notes."""
    status: Optional[EmergencyStatus] = None
    severity: Optional[EmergencySeverity] = None
    responder_notes: Optional[str] = None


class EmergencyResponse(BaseModel):
    """Emergency response schema."""
    id: uuid.UUID
    location: dict  # GeoJSON Point
    severity: EmergencySeverity
    status: EmergencyStatus
    description: Optional[str] = None
    battery_level: Optional[int] = None
    triggered_by_id: uuid.UUID
    triggered_by_name: Optional[str] = None
    tour_id: Optional[uuid.UUID] = None
    responder_id: Optional[uuid.UUID] = None
    responder_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class EmergencyListResponse(BaseModel):
    """Paginated emergency list."""
    items: list[EmergencyResponse]
    total: int
    active_count: int
