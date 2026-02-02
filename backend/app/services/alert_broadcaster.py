"""
Ruta Segura Perú - Alert Broadcaster Service
Automated cascade notification system for SOS emergencies
Target: First contact notified in <5 seconds
"""
import asyncio
import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
from loguru import logger

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.emergency_contact import EmergencyContact, NotificationChannel
from app.models.emergency import Emergency, EmergencyStatus
from app.models.user import User
from app.models.audit_log import AuditAction, create_audit_log
from app.integrations.firebase import firebase_provider
from app.integrations.vonage import vonage_provider
from app.core.websocket_manager import manager as ws_manager
from app.config import settings


@dataclass
class TrackingLink:
    """Generated tracking link for emergency contacts."""
    token: str
    url: str
    expires_at: datetime
    emergency_id: uuid.UUID


@dataclass
class BroadcastResult:
    """Result of broadcast operation."""
    emergency_id: uuid.UUID
    total_contacts: int
    sms_sent: int
    whatsapp_sent: int
    push_sent: int
    failed: int
    tracking_link: str
    elapsed_ms: int


class AlertBroadcaster:
    """
    Automated alert broadcasting system for SOS emergencies.
    
    Features:
    - Parallel notification dispatch to all contacts
    - Multi-channel delivery (SMS, WhatsApp, Push)
    - Dynamic tracking link generation with TTL
    - Resilient error handling (continue on failure)
    - Sub-5-second first notification target
    """
    
    # Tracking link tokens (in production, use Redis)
    _active_tokens: dict[str, TrackingLink] = {}
    
    # Token TTL (24 hours default)
    TOKEN_TTL_HOURS = 24
    
    # Base URL for tracking links
    TRACKING_BASE_URL = "https://rutasegura.pe/tracking"
    
    async def broadcast_sos(
        self,
        db: AsyncSession,
        emergency_id: uuid.UUID,
        user_id: uuid.UUID,
        location: Optional[dict] = None,
    ) -> BroadcastResult:
        """
        Broadcast SOS alert to all emergency contacts.
        
        This is the main entry point called when /sos/trigger is hit.
        Executes in parallel for maximum speed.
        
        Args:
            db: Database session
            emergency_id: The emergency record ID
            user_id: Tourist user ID who triggered SOS
            location: Current GPS location {lat, lng}
        
        Returns:
            BroadcastResult with delivery statistics
        """
        start_time = datetime.utcnow()
        
        # Step 1: Get user info
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Step 2: Get all active emergency contacts
        contacts_result = await db.execute(
            select(EmergencyContact)
            .where(EmergencyContact.user_id == user_id)
            .where(EmergencyContact.is_active == True)
            .order_by(EmergencyContact.priority.asc())
        )
        contacts = contacts_result.scalars().all()
        
        if not contacts:
            logger.warning(f"No emergency contacts for user {user_id}")
            return BroadcastResult(
                emergency_id=emergency_id,
                total_contacts=0,
                sms_sent=0,
                whatsapp_sent=0,
                push_sent=0,
                failed=0,
                tracking_link="",
                elapsed_ms=0,
            )
        
        # Step 3: Generate tracking link
        tracking_link = self._generate_tracking_link(emergency_id, user_id)
        
        # Step 4: Prepare notification content
        message = self._build_alert_message(
            tourist_name=user.full_name,
            tracking_url=tracking_link.url,
            location=location,
        )
        
        # Step 5: Dispatch notifications in parallel
        tasks = []
        for contact in contacts:
            tasks.append(
                self._notify_contact(
                    db=db,
                    contact=contact,
                    message=message,
                    tourist_name=user.full_name,
                    emergency_id=emergency_id,
                    tracking_url=tracking_link.url,
                )
            )
        
        # Wait for all notifications with timeout
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Step 6: Calculate statistics
        sms_sent = sum(1 for r in results if isinstance(r, dict) and r.get("sms"))
        whatsapp_sent = sum(1 for r in results if isinstance(r, dict) and r.get("whatsapp"))
        push_sent = sum(1 for r in results if isinstance(r, dict) and r.get("push"))
        failed = sum(1 for r in results if isinstance(r, Exception) or (isinstance(r, dict) and r.get("failed")))
        
        elapsed_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Step 7: Create audit log
        await create_audit_log(
            db=db,
            action=AuditAction.SOS_ACTIVATED,
            target_type="emergency",
            target_id=emergency_id,
            description=f"SOS broadcast to {len(contacts)} contacts in {elapsed_ms}ms",
            actor_id=user_id,
            metadata={
                "contacts_notified": len(contacts),
                "sms_sent": sms_sent,
                "whatsapp_sent": whatsapp_sent,
                "push_sent": push_sent,
                "failed": failed,
                "elapsed_ms": elapsed_ms,
            },
        )
        
        logger.info(
            f"SOS Broadcast complete: {len(contacts)} contacts, "
            f"SMS={sms_sent}, WhatsApp={whatsapp_sent}, Push={push_sent}, "
            f"Failed={failed}, Time={elapsed_ms}ms"
        )
        
        return BroadcastResult(
            emergency_id=emergency_id,
            total_contacts=len(contacts),
            sms_sent=sms_sent,
            whatsapp_sent=whatsapp_sent,
            push_sent=push_sent,
            failed=failed,
            tracking_link=tracking_link.url,
            elapsed_ms=elapsed_ms,
        )
    
    async def _notify_contact(
        self,
        db: AsyncSession,
        contact: EmergencyContact,
        message: str,
        tourist_name: str,
        emergency_id: uuid.UUID,
        tracking_url: str,
    ) -> dict:
        """
        Notify a single emergency contact via their preferred channels.
        Resilient: logs errors but doesn't raise.
        """
        result = {"sms": False, "whatsapp": False, "push": False, "failed": False}
        
        try:
            # SMS notification
            if contact.notification_channel in (NotificationChannel.SMS, NotificationChannel.BOTH):
                try:
                    sms_success = await vonage_provider.send_sms(
                        to=contact.phone_e164,
                        message=message,
                    )
                    result["sms"] = sms_success
                    if sms_success:
                        logger.info(f"SMS sent to {contact.name}")
                except Exception as e:
                    logger.error(f"SMS failed for {contact.name}: {e}")
            
            # WhatsApp notification
            if contact.notification_channel in (NotificationChannel.WHATSAPP, NotificationChannel.BOTH):
                try:
                    wa_success = await self._send_whatsapp_alert(
                        to=contact.phone_e164,
                        tourist_name=tourist_name,
                        tracking_url=tracking_url,
                        language=contact.language,
                    )
                    result["whatsapp"] = wa_success
                    if wa_success:
                        logger.info(f"WhatsApp sent to {contact.name}")
                except Exception as e:
                    logger.error(f"WhatsApp failed for {contact.name}: {e}")
            
            # Push notification (if contact has the app)
            if contact.fcm_token:
                try:
                    push_success = await firebase_provider.send_push(
                        recipient_token=contact.fcm_token,
                        title=f"🚨 ALERTA SOS: {tourist_name}",
                        body=f"{tourist_name} ha activado el botón de pánico. Toca para ver su ubicación.",
                        data={
                            "type": "SOS_ALERT",
                            "emergency_id": str(emergency_id),
                            "tracking_url": tracking_url,
                            "sound": "siren",
                            "priority": "critical",
                        },
                    )
                    result["push"] = push_success
                except Exception as e:
                    logger.error(f"Push failed for {contact.name}: {e}")
            
            # Mark as failed if nothing succeeded
            if not any([result["sms"], result["whatsapp"], result["push"]]):
                result["failed"] = True
                
        except Exception as e:
            logger.error(f"Contact notification failed for {contact.name}: {e}")
            result["failed"] = True
        
        return result
    
    async def _send_whatsapp_alert(
        self,
        to: str,
        tourist_name: str,
        tracking_url: str,
        language: str = "es",
    ) -> bool:
        """
        Send WhatsApp alert using pre-approved template.
        Template must be approved by Meta for transactional safety alerts.
        """
        # WhatsApp template parameters
        # Template name: "sos_emergency_alert" (must be pre-registered with Meta)
        template_params = {
            "tourist_name": tourist_name,
            "tracking_url": tracking_url,
        }
        
        try:
            success = await vonage_provider.send_whatsapp(
                to=to,
                template_name="sos_emergency_alert",
                template_params=template_params,
                language=language,
            )
            return success
        except Exception as e:
            logger.error(f"WhatsApp template send failed: {e}")
            return False
    
    def _build_alert_message(
        self,
        tourist_name: str,
        tracking_url: str,
        location: Optional[dict] = None,
    ) -> str:
        """Build the SMS alert message."""
        message = (
            f"🚨 ALERTA SOS: {tourist_name} ha activado su botón de pánico. "
            f"Sigue su ubicación en vivo: {tracking_url}"
        )
        
        if location:
            lat = location.get("lat", location.get("latitude"))
            lng = location.get("lng", location.get("longitude"))
            if lat and lng:
                message += f" (Última ubicación: {lat:.6f}, {lng:.6f})"
        
        # Ensure message fits in SMS (160 chars)
        if len(message) > 160:
            message = (
                f"🚨 ALERTA SOS: {tourist_name} necesita ayuda. "
                f"Ver ubicación: {tracking_url}"
            )
        
        return message
    
    def _generate_tracking_link(
        self,
        emergency_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> TrackingLink:
        """
        Generate a secure, time-limited tracking link.
        Token expires when emergency is resolved or after TTL.
        """
        # Generate cryptographically secure token
        token = secrets.token_urlsafe(32)
        
        tracking_link = TrackingLink(
            token=token,
            url=f"{self.TRACKING_BASE_URL}/{token}",
            expires_at=datetime.utcnow() + timedelta(hours=self.TOKEN_TTL_HOURS),
            emergency_id=emergency_id,
        )
        
        # Store token (in production, use Redis with TTL)
        self._active_tokens[token] = tracking_link
        
        return tracking_link
    
    def validate_tracking_token(self, token: str) -> Optional[TrackingLink]:
        """
        Validate a tracking token.
        Returns TrackingLink if valid, None if expired/invalid.
        """
        link = self._active_tokens.get(token)
        
        if not link:
            return None
        
        if datetime.utcnow() > link.expires_at:
            # Token expired
            del self._active_tokens[token]
            return None
        
        return link
    
    async def expire_tracking_link(
        self,
        db: AsyncSession,
        emergency_id: uuid.UUID,
    ):
        """
        Expire all tracking links for a resolved emergency.
        Called when SOS is resolved or cancelled.
        """
        # Find and remove all tokens for this emergency
        tokens_to_remove = [
            token for token, link in self._active_tokens.items()
            if link.emergency_id == emergency_id
        ]
        
        for token in tokens_to_remove:
            del self._active_tokens[token]
        
        logger.info(f"Expired {len(tokens_to_remove)} tracking links for emergency {emergency_id}")
    
    async def notify_emergency_resolved(
        self,
        db: AsyncSession,
        emergency_id: uuid.UUID,
        user_id: uuid.UUID,
    ):
        """
        Notify all contacts that the emergency has been resolved.
        """
        # Get contacts
        contacts_result = await db.execute(
            select(EmergencyContact)
            .where(EmergencyContact.user_id == user_id)
            .where(EmergencyContact.is_active == True)
        )
        contacts = contacts_result.scalars().all()
        
        # Get user name
        user_result = await db.execute(
            select(User.full_name).where(User.id == user_id)
        )
        user_name = user_result.scalar() or "Usuario"
        
        message = f"✅ EMERGENCIA RESUELTA: {user_name} está a salvo. Gracias por tu apoyo."
        
        # Notify all contacts
        for contact in contacts:
            if contact.notification_channel in (NotificationChannel.SMS, NotificationChannel.BOTH):
                try:
                    await vonage_provider.send_sms(
                        to=contact.phone_e164,
                        message=message,
                    )
                except Exception as e:
                    logger.warning(f"Resolution SMS failed for {contact.name}: {e}")
            
            if contact.fcm_token:
                try:
                    await firebase_provider.send_push(
                        recipient_token=contact.fcm_token,
                        title="✅ Emergencia Resuelta",
                        body=f"{user_name} está a salvo.",
                        data={"type": "SOS_RESOLVED", "emergency_id": str(emergency_id)},
                    )
                except Exception:
                    pass
        
        # Expire tracking links
        await self.expire_tracking_link(db, emergency_id)


# Singleton instance
alert_broadcaster = AlertBroadcaster()
