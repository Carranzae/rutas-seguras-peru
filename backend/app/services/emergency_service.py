"""
Ruta Segura Perú - Emergency Service
Business logic for SOS and emergencies with Plivo/Firebase integration
"""
from datetime import datetime, timezone
from typing import Optional
import uuid
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.models.emergency import Emergency, EmergencyStatus, EmergencySeverity
from app.models.user import User
from app.schemas.emergency import SOSRequest, EmergencyUpdate
from app.core.exceptions import NotFoundException
from app.integrations.vonage_service import vonage_service
from app.integrations.firebase import firebase_provider
from loguru import logger


class EmergencyService:
    """Emergency/SOS service with Plivo and Firebase integration."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def trigger_sos(
        self,
        user: User,
        data: SOSRequest,
    ) -> dict:
        """
        Trigger an SOS emergency alert.
        
        Flow:
        1. Save emergency to database with PostGIS location
        2. Send SMS to emergency contacts via Plivo
        3. Make voice call to guide/agency via Plivo
        4. Send push notification via Firebase
        5. Return status to frontend for UI feedback
        """
        # Create PostGIS Point from coordinates
        point = Point(data.location.longitude, data.location.latitude)
        location = from_shape(point, srid=4326)
        
        # 1. Save emergency to database
        emergency = Emergency(
            location=location,
            severity=data.severity,
            status=EmergencyStatus.ACTIVE,
            description=data.description,
            battery_level=data.battery_level,
            triggered_by_id=user.id,
            tour_id=data.tour_id,
        )
        
        self.db.add(emergency)
        await self.db.flush()
        await self.db.refresh(emergency)
        
        # Log critical emergency
        logger.critical(
            f"🚨 SOS TRIGGERED | User: {user.email} | Name: {user.full_name} | "
            f"Location: ({data.location.latitude}, {data.location.longitude}) | "
            f"Severity: {data.severity.value} | Emergency ID: {emergency.id}"
        )
        
        # 2. Trigger notifications in background (don't block response)
        notification_results = await self._send_all_notifications(
            emergency=emergency,
            user=user,
            latitude=data.location.latitude,
            longitude=data.location.longitude,
            incident_type=data.description or "SOS",
        )
        
        return {
            "emergency": emergency,
            "notifications": notification_results,
        }
    
    async def _send_all_notifications(
        self,
        emergency: Emergency,
        user: User,
        latitude: float,
        longitude: float,
        incident_type: str,
    ) -> dict:
        """Send SMS, calls, and push notifications."""
        results = {
            "sms": {"sent": False},
            "call": {"sent": False},
            "push": {"sent": False},
            "fallback_required": False,
        }
        
        # Get emergency contacts
        contacts = self._get_emergency_contacts(user)
        
        # Run notifications concurrently
        try:
            tasks = []
            
            # SMS to emergency contacts
            if contacts["sms_numbers"]:
                tasks.append(self._send_sms_notifications(
                    phone_numbers=contacts["sms_numbers"],
                    tourist_name=user.full_name,
                    latitude=latitude,
                    longitude=longitude,
                    incident_type=incident_type,
                ))
            
            # Voice call to primary contact (guide or agency)
            if contacts["call_number"]:
                tasks.append(self._make_emergency_call(
                    phone_number=contacts["call_number"],
                    tourist_name=user.full_name,
                    latitude=latitude,
                    longitude=longitude,
                    incident_type=incident_type,
                ))
            
            # Push notification to admins
            if contacts["fcm_tokens"]:
                tasks.append(self._send_push_notifications(
                    tokens=contacts["fcm_tokens"],
                    tourist_name=user.full_name,
                    emergency_id=str(emergency.id),
                    latitude=latitude,
                    longitude=longitude,
                ))
            
            # Execute all in parallel
            if tasks:
                notification_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results
                for i, result in enumerate(notification_results):
                    if isinstance(result, Exception):
                        logger.error(f"Notification task {i} failed: {result}")
                        results["fallback_required"] = True
                    elif isinstance(result, dict):
                        if "sms" in str(tasks[i]):
                            results["sms"] = result
                        elif "call" in str(tasks[i]):
                            results["call"] = result
                        elif "push" in str(tasks[i]):
                            results["push"] = result
            
        except Exception as e:
            logger.error(f"Failed to send notifications: {e}")
            results["fallback_required"] = True
        
        return results
    
    def _get_emergency_contacts(self, user: User) -> dict:
        """Get emergency contacts for a user."""
        contacts = {
            "sms_numbers": [],
            "call_number": None,
            "fcm_tokens": [],
        }
        
        # User's emergency contact
        if user.emergency_contact_phone:
            contacts["sms_numbers"].append(user.emergency_contact_phone)
            contacts["call_number"] = user.emergency_contact_phone
        
        # User's own phone for SMS confirmation
        if user.phone:
            contacts["sms_numbers"].append(user.phone)
        
        # TODO: Get guide/agency contacts if on tour
        # TODO: Get admin FCM tokens for push
        
        return contacts
    
    async def _send_sms_notifications(
        self,
        phone_numbers: list[str],
        tourist_name: str,
        latitude: float,
        longitude: float,
        incident_type: str,
    ) -> dict:
        """Send SMS via Vonage."""
        try:
            result = await vonage_service.send_emergency_sms(
                phone_numbers=phone_numbers,
                tourist_name=tourist_name,
                latitude=latitude,
                longitude=longitude,
                incident_type=incident_type,
            )
            
            logger.info(
                f"SMS notification result | Sent: {len(result.get('sent', []))} | "
                f"Failed: {len(result.get('failed', []))}"
            )
            
            return {"sent": True, **result}
        
        except Exception as e:
            logger.error(f"SMS notification failed: {e}")
            return {"sent": False, "error": str(e)}
    
    async def _make_emergency_call(
        self,
        phone_number: str,
        tourist_name: str,
        latitude: float,
        longitude: float,
        incident_type: str,
    ) -> dict:
        """Make voice call via Vonage."""
        try:
            result = await vonage_service.make_emergency_call(
                phone_number=phone_number,
                tourist_name=tourist_name,
                latitude=latitude,
                longitude=longitude,
                incident_type=incident_type,
            )
            
            logger.info(f"Voice call result | Success: {result.get('success')}")
            
            return {"sent": True, **result}
        
        except Exception as e:
            logger.error(f"Voice call failed: {e}")
            return {"sent": False, "error": str(e)}
    
    async def _send_push_notifications(
        self,
        tokens: list[str],
        tourist_name: str,
        emergency_id: str,
        latitude: float,
        longitude: float,
    ) -> dict:
        """Send push notification via Firebase."""
        try:
            count = await firebase_provider.send_bulk(
                recipient_tokens=tokens,
                title="🚨 ALERTA SOS",
                body=f"{tourist_name} necesita ayuda urgente",
                data={
                    "type": "sos",
                    "emergency_id": emergency_id,
                    "latitude": str(latitude),
                    "longitude": str(longitude),
                },
            )
            
            logger.info(f"Push notification sent to {count} devices")
            
            return {"sent": True, "count": count}
        
        except Exception as e:
            logger.error(f"Push notification failed: {e}")
            return {"sent": False, "error": str(e)}
    
    async def get_active_emergencies(
        self,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Emergency], int, int]:
        """Get all active emergencies (for admins)."""
        active_count_result = await self.db.execute(
            select(func.count(Emergency.id)).where(
                Emergency.status.in_([EmergencyStatus.ACTIVE, EmergencyStatus.RESPONDING])
            )
        )
        active_count = active_count_result.scalar() or 0
        
        total_result = await self.db.execute(select(func.count(Emergency.id)))
        total = total_result.scalar() or 0
        
        offset = (page - 1) * per_page
        result = await self.db.execute(
            select(Emergency)
            .order_by(Emergency.created_at.desc())
            .offset(offset)
            .limit(per_page)
        )
        emergencies = list(result.scalars().all())
        
        return emergencies, total, active_count
    
    async def get_emergency(self, emergency_id: uuid.UUID) -> Emergency:
        """Get emergency by ID."""
        result = await self.db.execute(
            select(Emergency).where(Emergency.id == emergency_id)
        )
        emergency = result.scalar_one_or_none()
        
        if not emergency:
            raise NotFoundException("Emergency not found")
        
        return emergency
    
    async def update_emergency(
        self,
        emergency_id: uuid.UUID,
        data: EmergencyUpdate,
        responder: User,
    ) -> Emergency:
        """Update emergency status/notes."""
        emergency = await self.get_emergency(emergency_id)
        
        if data.status:
            emergency.status = data.status
            if data.status == EmergencyStatus.RESOLVED:
                emergency.resolved_at = datetime.now(timezone.utc)
        
        if data.severity:
            emergency.severity = data.severity
        
        if data.responder_notes:
            emergency.responder_notes = data.responder_notes
            emergency.responder_id = responder.id
        
        await self.db.flush()
        await self.db.refresh(emergency)
        
        logger.info(
            f"Emergency updated | ID: {emergency_id} | "
            f"Status: {emergency.status.value} | By: {responder.email}"
        )
        
        return emergency
    
    async def resolve_emergency(
        self,
        emergency_id: uuid.UUID,
        responder: User,
        notes: Optional[str] = None,
    ) -> Emergency:
        """Mark emergency as resolved."""
        return await self.update_emergency(
            emergency_id,
            EmergencyUpdate(
                status=EmergencyStatus.RESOLVED,
                responder_notes=notes,
            ),
            responder,
        )

