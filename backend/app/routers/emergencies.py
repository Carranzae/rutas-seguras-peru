"""
Ruta Segura Perú - Emergencies Router
SOS and emergency management endpoints with Plivo integration
"""
import uuid
from fastapi import APIRouter, Depends, status, Query, Response, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.emergency import (
    SOSRequest,
    EmergencyUpdate,
    EmergencyResponse,
    EmergencyListResponse,
)
from app.services.emergency_service import EmergencyService
from app.core.dependencies import CurrentUser, require_roles
from app.models.user import UserRole

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])


@router.post(
    "/sos",
    status_code=status.HTTP_201_CREATED,
    summary="Trigger SOS Alert",
    description="Trigger an emergency SOS alert with location data. Rate limited to prevent abuse.",
)
async def trigger_sos(
    request: Request,
    data: SOSRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger an SOS emergency alert.
    
    Flow:
    1. Saves emergency to database with PostGIS location
    2. Sends SMS to emergency contacts via Plivo
    3. Makes voice call to guide/agency via Plivo
    4. Sends push notification via Firebase
    
    Coercion Mode (is_silent=True):
    - Notifies ONLY SuperAdmin and authorities
    - Returns fake "error" response to deceive attacker
    - Records alert in Redis for immediate response
    
    Returns:
        Emergency ID, status, and notification results
    """
    from app.services.redis_service import redis_service
    from app.models import AuditLog, AuditAction, create_audit_log
    from loguru import logger
    
    service = EmergencyService(db)
    
    # Handle Silent/Coercion SOS
    if data.is_silent:
        logger.critical(f"🚨 COERCION ALERT: User {current_user.full_name} triggered silent SOS")
        
        # Record to Redis for immediate SuperAdmin visibility
        await redis_service.record_coercion_alert(
            user_id=str(current_user.id),
            location={
                "latitude": data.location.latitude,
                "longitude": data.location.longitude,
            },
            metadata={
                "user_name": current_user.full_name,
                "user_phone": current_user.phone,
                "description": data.description,
                "ip_address": request.client.host,
            }
        )
        
        # Create audit log for security team
        await create_audit_log(
            db=db,
            action=AuditAction.EMERGENCY_SOS,
            user_id=current_user.id,
            details={
                "type": "COERCION_ALERT",
                "is_silent": True,
                "location": {
                    "lat": data.location.latitude,
                    "lng": data.location.longitude,
                },
            },
            ip_address=request.client.host,
        )
        await db.commit()
        
        # Trigger silent notification ONLY to SuperAdmin
        result = await service.trigger_sos(
            current_user, 
            data, 
            silent_mode=True  # Only notify authorities
        )
        
        # Return FAKE ERROR to deceive attacker
        # The frontend should show "Connection error, please try again"
        return {
            "id": None,
            "status": "error",
            "severity": None,
            "message": "Error de conexión. Por favor intente nuevamente.",
            "error": True,
            "error_code": "NETWORK_TIMEOUT",
            "notifications": {
                "sms_sent": False,
                "call_sent": False,
                "push_sent": False,
                "fallback_required": False,
            },
            "triggered_by": None,
            "created_at": None,
        }
    
    # Normal SOS flow
    result = await service.trigger_sos(current_user, data)
    
    emergency = result["emergency"]
    notifications = result["notifications"]
    
    return {
        "id": str(emergency.id),
        "status": emergency.status.value,
        "severity": emergency.severity.value,
        "message": "SOS activado - Ayuda en camino",
        "location": {
            "type": "Point",
            "coordinates": [data.location.longitude, data.location.latitude]
        },
        "notifications": {
            "sms_sent": notifications.get("sms", {}).get("sent", False),
            "call_sent": notifications.get("call", {}).get("sent", False),
            "push_sent": notifications.get("push", {}).get("sent", False),
            "fallback_required": notifications.get("fallback_required", False),
        },
        "triggered_by": current_user.full_name,
        "created_at": emergency.created_at.isoformat(),
    }


@router.get(
    "/active",
    response_model=EmergencyListResponse,
    summary="Get active emergencies",
    description="Get all active emergencies (admin only).",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN))],
)
async def get_active_emergencies(
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Get all active emergencies for admins."""
    service = EmergencyService(db)
    emergencies, total, active_count = await service.get_active_emergencies(page, per_page)
    
    items = []
    for e in emergencies:
        items.append(EmergencyResponse(
            id=e.id,
            location={"type": "Point", "coordinates": [0, 0]},  # Would extract from PostGIS
            severity=e.severity,
            status=e.status,
            description=e.description,
            battery_level=e.battery_level,
            triggered_by_id=e.triggered_by_id,
            tour_id=e.tour_id,
            responder_id=e.responder_id,
            responder_notes=e.responder_notes,
            resolved_at=e.resolved_at,
            created_at=e.created_at,
        ))
    
    return EmergencyListResponse(
        items=items,
        total=total,
        active_count=active_count,
    )


@router.get(
    "/{emergency_id}",
    response_model=EmergencyResponse,
    summary="Get emergency details",
)
async def get_emergency(
    emergency_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get emergency by ID."""
    service = EmergencyService(db)
    emergency = await service.get_emergency(emergency_id)
    
    return EmergencyResponse(
        id=emergency.id,
        location={"type": "Point", "coordinates": [0, 0]},
        severity=emergency.severity,
        status=emergency.status,
        description=emergency.description,
        battery_level=emergency.battery_level,
        triggered_by_id=emergency.triggered_by_id,
        tour_id=emergency.tour_id,
        responder_id=emergency.responder_id,
        responder_notes=emergency.responder_notes,
        resolved_at=emergency.resolved_at,
        created_at=emergency.created_at,
    )


@router.patch(
    "/{emergency_id}",
    response_model=EmergencyResponse,
    summary="Update emergency",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN))],
)
async def update_emergency(
    emergency_id: uuid.UUID,
    data: EmergencyUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update emergency status/notes (admin only)."""
    service = EmergencyService(db)
    emergency = await service.update_emergency(emergency_id, data, current_user)
    
    return EmergencyResponse(
        id=emergency.id,
        location={"type": "Point", "coordinates": [0, 0]},
        severity=emergency.severity,
        status=emergency.status,
        description=emergency.description,
        battery_level=emergency.battery_level,
        triggered_by_id=emergency.triggered_by_id,
        tour_id=emergency.tour_id,
        responder_id=emergency.responder_id,
        responder_notes=emergency.responder_notes,
        resolved_at=emergency.resolved_at,
        created_at=emergency.created_at,
    )


@router.post(
    "/{emergency_id}/resolve",
    response_model=EmergencyResponse,
    summary="Resolve emergency",
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN))],
)
async def resolve_emergency(
    emergency_id: uuid.UUID,
    notes: str = None,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Mark emergency as resolved (admin only)."""
    service = EmergencyService(db)
    emergency = await service.resolve_emergency(emergency_id, current_user, notes)
    
    return EmergencyResponse(
        id=emergency.id,
        location={"type": "Point", "coordinates": [0, 0]},
        severity=emergency.severity,
        status=emergency.status,
        description=emergency.description,
        battery_level=emergency.battery_level,
        triggered_by_id=emergency.triggered_by_id,
        tour_id=emergency.tour_id,
        responder_id=emergency.responder_id,
        responder_notes=emergency.responder_notes,
        resolved_at=emergency.resolved_at,
        created_at=emergency.created_at,
    )
