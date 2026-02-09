"""
Ruta Segura Perú - Firebase Cloud Messaging Service
High-priority push notifications for SOS, alerts, and real-time updates
"""
import os
import json
from typing import Optional, List, Dict, Any
from loguru import logger

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase-admin not installed - FCM disabled")


class FCMService:
    """
    Firebase Cloud Messaging service for push notifications.
    Handles SOS alerts, guide assignments, and system notifications.
    """
    
    def __init__(self):
        self._initialized = False
        self._initialize()
    
    def _initialize(self):
        """Initialize Firebase Admin SDK"""
        if not FIREBASE_AVAILABLE:
            return
        
        try:
            # Check if already initialized
            try:
                firebase_admin.get_app()
                self._initialized = True
                logger.info("Firebase already initialized")
                return
            except ValueError:
                pass
            
            # Try JSON string from environment (Railway)
            creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
            if creds_json:
                creds_dict = json.loads(creds_json)
                cred = credentials.Certificate(creds_dict)
                firebase_admin.initialize_app(cred)
                self._initialized = True
                logger.info("Firebase initialized from FIREBASE_CREDENTIALS_JSON")
                return
            
            # Try file path
            creds_file = os.getenv("FIREBASE_CREDENTIALS_FILE", "firebase-credentials.json")
            if os.path.exists(creds_file):
                cred = credentials.Certificate(creds_file)
                firebase_admin.initialize_app(cred)
                self._initialized = True
                logger.info(f"Firebase initialized from: {creds_file}")
                return
            
            logger.warning("Firebase credentials not found")
            
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
    
    def is_available(self) -> bool:
        return self._initialized and FIREBASE_AVAILABLE
    
    async def send_sos_alert(
        self,
        fcm_tokens: List[str],
        user_name: str,
        latitude: float,
        longitude: float,
        sos_id: str,
        message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send HIGH PRIORITY SOS alert.
        Wakes up the device even if app is closed.
        """
        if not self.is_available():
            logger.warning("FCM not available - SOS alert not sent")
            return {"success": False, "reason": "FCM not configured"}
        
        try:
            # High priority message to wake device
            android_config = messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    title="🚨 ALERTA SOS",
                    body=f"{user_name} ha activado SOS" + (f": {message}" if message else ""),
                    icon="ic_sos",
                    color="#FF073A",
                    channel_id="sos_alerts",
                    sound="sos_alarm.wav",
                    default_vibrate_timings=False,
                    vibrate_timings=[0, 500, 250, 500, 250, 500],
                    priority="max",
                    visibility="public",
                ),
                ttl=300,  # 5 minutes TTL
            )
            
            apns_config = messaging.APNSConfig(
                headers={
                    "apns-priority": "10",  # Immediate delivery
                    "apns-push-type": "alert",
                },
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title="🚨 ALERTA SOS",
                            body=f"{user_name} ha activado SOS",
                        ),
                        badge=1,
                        sound=messaging.CriticalSound(
                            name="sos_alarm.wav",
                            critical=True,
                            volume=1.0
                        ),
                        content_available=True,
                        mutable_content=True,
                    ),
                ),
            )
            
            data_payload = {
                "type": "SOS_ALERT",
                "sos_id": sos_id,
                "user_name": user_name,
                "latitude": str(latitude),
                "longitude": str(longitude),
                "message": message or "",
                "timestamp": str(int(__import__("time").time())),
            }
            
            # Send to multiple tokens
            message_obj = messaging.MulticastMessage(
                tokens=fcm_tokens,
                data=data_payload,
                android=android_config,
                apns=apns_config,
            )
            
            response = messaging.send_each_for_multicast(message_obj)
            
            logger.info(
                f"SOS alert sent | Success: {response.success_count} | "
                f"Failures: {response.failure_count}"
            )
            
            return {
                "success": True,
                "success_count": response.success_count,
                "failure_count": response.failure_count,
            }
            
        except Exception as e:
            logger.error(f"SOS alert failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_guide_assignment(
        self,
        guide_fcm_token: str,
        tourist_name: str,
        tour_name: str,
        booking_id: str,
    ) -> bool:
        """Notify guide of new tourist assignment"""
        if not self.is_available():
            return False
        
        try:
            message = messaging.Message(
                token=guide_fcm_token,
                notification=messaging.Notification(
                    title="🎒 Nueva Asignación",
                    body=f"{tourist_name} te ha sido asignado para {tour_name}",
                ),
                data={
                    "type": "GUIDE_ASSIGNMENT",
                    "booking_id": booking_id,
                    "tourist_name": tourist_name,
                    "tour_name": tour_name,
                },
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        channel_id="assignments",
                        color="#00F5FF",
                    )
                ),
            )
            
            messaging.send(message)
            logger.info(f"Guide assignment sent: {booking_id}")
            return True
            
        except Exception as e:
            logger.error(f"Guide assignment notification failed: {e}")
            return False
    
    async def send_admin_notification(
        self,
        admin_fcm_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        priority: str = "high",
    ) -> Dict[str, Any]:
        """Send notification to Super Admin users"""
        if not self.is_available():
            return {"success": False}
        
        try:
            message = messaging.MulticastMessage(
                tokens=admin_fcm_tokens,
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                android=messaging.AndroidConfig(
                    priority=priority,
                    notification=messaging.AndroidNotification(
                        channel_id="admin_alerts",
                        color="#A855F7",
                    )
                ),
            )
            
            response = messaging.send_each_for_multicast(message)
            return {
                "success": True,
                "success_count": response.success_count,
                "failure_count": response.failure_count,
            }
            
        except Exception as e:
            logger.error(f"Admin notification failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_new_registration_alert(
        self,
        admin_fcm_tokens: List[str],
        user_email: str,
        user_role: str,
    ) -> bool:
        """Alert admins when a new user registers"""
        if not admin_fcm_tokens:
            return False
        
        result = await self.send_admin_notification(
            admin_fcm_tokens=admin_fcm_tokens,
            title="👤 Nuevo Registro",
            body=f"Nuevo {user_role}: {user_email}",
            data={
                "type": "NEW_REGISTRATION",
                "email": user_email,
                "role": user_role,
            },
            priority="normal",
        )
        return result.get("success", False)
    
    async def send_route_deviation_alert(
        self,
        admin_fcm_tokens: List[str],
        guide_name: str,
        deviation_meters: float,
        suggestion: str,
    ) -> bool:
        """Alert admins of route deviation (triggered by Claude)"""
        result = await self.send_admin_notification(
            admin_fcm_tokens=admin_fcm_tokens,
            title="⚠️ Desviación de Ruta",
            body=f"{guide_name} se ha desviado {deviation_meters:.0f}m",
            data={
                "type": "ROUTE_DEVIATION",
                "guide_name": guide_name,
                "deviation": str(deviation_meters),
                "suggestion": suggestion,
            },
            priority="high",
        )
        return result.get("success", False)


# Singleton instance
fcm_service = FCMService()
