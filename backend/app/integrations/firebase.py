"""
Ruta Segura Perú - Firebase Integration
FCM push notifications
"""
from typing import Any, Optional
from loguru import logger

from app.integrations.base import NotificationProvider
from app.config import settings


class FirebaseNotificationProvider(NotificationProvider):
    """Firebase Cloud Messaging implementation."""
    
    def __init__(self):
        self._initialized = False
        self._app = None
    
    def _initialize(self):
        """Lazy initialization of Firebase Admin SDK."""
        if self._initialized:
            return
        
        try:
            import firebase_admin
            from firebase_admin import credentials
            
            cred = credentials.Certificate(settings.firebase_credentials_path)
            self._app = firebase_admin.initialize_app(cred)
            self._initialized = True
            logger.info("Firebase Admin SDK initialized")
        except Exception as e:
            logger.warning(f"Firebase initialization failed: {e}")
    
    async def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[dict[str, Any]] = None,
    ) -> bool:
        """Send push notification to a single device."""
        self._initialize()
        
        if not self._initialized:
            logger.warning("Firebase not initialized, skipping push")
            return False
        
        try:
            from firebase_admin import messaging
            
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                token=recipient_token,
            )
            
            response = messaging.send(message)
            logger.info(f"FCM sent: {response}")
            return True
            
        except Exception as e:
            logger.error(f"FCM error: {e}")
            return False
    
    async def send_bulk(
        self,
        recipient_tokens: list[str],
        title: str,
        body: str,
        data: Optional[dict[str, Any]] = None,
    ) -> int:
        """Send push notification to multiple devices."""
        self._initialize()
        
        if not self._initialized or not recipient_tokens:
            return 0
        
        try:
            from firebase_admin import messaging
            
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                tokens=recipient_tokens,
            )
            
            response = messaging.send_multicast(message)
            logger.info(f"FCM bulk: {response.success_count}/{len(recipient_tokens)}")
            return response.success_count
            
        except Exception as e:
            logger.error(f"FCM bulk error: {e}")
            return 0


# Singleton instance
firebase_provider = FirebaseNotificationProvider()
