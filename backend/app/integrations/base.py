"""
Ruta Segura Perú - External Integrations Base
Abstract interfaces for external service providers
"""
from abc import ABC, abstractmethod
from typing import Any, Optional


class NotificationProvider(ABC):
    """Abstract interface for push notifications."""
    
    @abstractmethod
    async def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[dict[str, Any]] = None,
    ) -> bool:
        """Send push notification to a single recipient."""
        pass
    
    @abstractmethod
    async def send_bulk(
        self,
        recipient_tokens: list[str],
        title: str,
        body: str,
        data: Optional[dict[str, Any]] = None,
    ) -> int:
        """Send push notification to multiple recipients. Returns success count."""
        pass


class SMSProvider(ABC):
    """Abstract interface for SMS and voice calls."""
    
    @abstractmethod
    async def send_sms(
        self,
        phone_number: str,
        message: str,
    ) -> bool:
        """Send SMS message."""
        pass
    
    @abstractmethod
    async def make_call(
        self,
        phone_number: str,
        message: str,
    ) -> bool:
        """Make voice call with text-to-speech message."""
        pass


class TranslationProvider(ABC):
    """Abstract interface for translation services."""
    
    @abstractmethod
    async def translate_text(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        """Translate text between languages."""
        pass
    
    @abstractmethod
    async def translate_audio(
        self,
        audio_bytes: bytes,
        source_lang: str,
        target_lang: str,
    ) -> bytes:
        """Translate audio between languages."""
        pass
