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
        """Lazy initialization of Firebase Admin SDK.
        
        Supports two modes:
        1. JSON string from env var (for Railway/cloud): FIREBASE_CREDENTIALS_JSON
        2. File path (for local dev): FIREBASE_CREDENTIALS_PATH
        """
        if self._initialized:
            return
        
        try:
            import json
            import firebase_admin
            from firebase_admin import credentials
            
            cred = None
            
            # Try JSON string first (for cloud deployments like Railway)
            if settings.firebase_credentials_json:
                cred_dict = json.loads(settings.firebase_credentials_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Firebase using credentials from environment variable")
            # Fall back to file path (for local development)
            elif settings.firebase_credentials_path:
                import os
                if os.path.exists(settings.firebase_credentials_path):
                    cred = credentials.Certificate(settings.firebase_credentials_path)
                    logger.info("Firebase using credentials from file")
            
            if cred:
                self._app = firebase_admin.initialize_app(cred)
                self._initialized = True
                logger.info("Firebase Admin SDK initialized successfully")
            else:
                logger.warning("No Firebase credentials found (JSON or file)")
                
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
