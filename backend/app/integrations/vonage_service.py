"""
Ruta Segura Perú - Vonage Communication Service
SMS, WhatsApp and Voice Call integration for emergencies
"""
import vonage
from vonage.sms import Sms
from typing import Optional
from loguru import logger
import httpx

from app.config import settings


class VonageService:
    """
    Vonage (Nexmo) service for emergency communications.
    Supports SMS, WhatsApp, and Voice calls with TTS.
    """
    
    def __init__(self):
        self._client: Optional[vonage.Client] = None
        self._sms: Optional[Sms] = None
        self._initialized = False
    
    def _initialize(self) -> bool:
        """Lazy initialization of Vonage client."""
        if self._initialized:
            return True
        
        if not settings.vonage_api_key or settings.vonage_api_key == "your-vonage-api-key":
            logger.warning("Vonage credentials not configured - SMS/calls disabled")
            return False
        
        try:
            self._client = vonage.Client(
                key=settings.vonage_api_key,
                secret=settings.vonage_api_secret,
            )
            self._sms = Sms(self._client)
            self._initialized = True
            logger.info("Vonage client initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Vonage: {e}")
            return False
    
    def _generate_google_maps_link(self, latitude: float, longitude: float) -> str:
        """Generate Google Maps link for location."""
        return f"https://www.google.com/maps?q={latitude},{longitude}"
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number (remove + and spaces)."""
        phone = phone.replace(" ", "").replace("-", "").replace("+", "")
        # Add Peru country code if not present
        if not phone.startswith("51") and len(phone) == 9:
            phone = f"51{phone}"
        return phone
    
    async def send_emergency_sms(
        self,
        phone_numbers: list[str],
        tourist_name: str,
        latitude: float,
        longitude: float,
        incident_type: str = "SOS",
    ) -> dict:
        """
        Send emergency SMS to multiple contacts via Vonage.
        
        Args:
            phone_numbers: List of phone numbers (E.164 format)
            tourist_name: Name of the tourist in distress
            latitude: GPS latitude
            longitude: GPS longitude
            incident_type: Type of incident
        
        Returns:
            dict with success status and message_ids for audit
        """
        if not self._initialize():
            logger.warning("Vonage not initialized - SMS not sent")
            return {
                "success": False,
                "error": "SMS service not configured",
                "fallback_required": True,
            }
        
        maps_link = self._generate_google_maps_link(latitude, longitude)
        
        message = (
            f"🚨 ALERTA SOS - RUTA SEGURA PERÚ\n"
            f"Turista: {tourist_name}\n"
            f"Tipo: {incident_type}\n"
            f"📍 Ubicación: {maps_link}\n"
            f"Verifique inmediatamente."
        )
        
        results = {
            "success": True,
            "sent": [],
            "failed": [],
            "message_ids": [],
        }
        
        for phone in phone_numbers:
            try:
                normalized_phone = self._normalize_phone(phone)
                
                response = self._sms.send_message({
                    "from": settings.vonage_from_number or "RutaSegura",
                    "to": normalized_phone,
                    "text": message,
                })
                
                if response["messages"][0]["status"] == "0":
                    message_id = response["messages"][0].get("message-id")
                    
                    logger.info(
                        f"SMS sent via Vonage | To: {normalized_phone} | "
                        f"ID: {message_id} | Tourist: {tourist_name}"
                    )
                    
                    results["sent"].append(normalized_phone)
                    results["message_ids"].append({
                        "phone": normalized_phone,
                        "message_id": message_id,
                    })
                else:
                    error = response["messages"][0].get("error-text", "Unknown error")
                    logger.error(f"Vonage SMS failed to {normalized_phone}: {error}")
                    results["failed"].append({"phone": phone, "error": error})
                
            except Exception as e:
                logger.error(f"Unexpected SMS error to {phone}: {e}")
                results["failed"].append({"phone": phone, "error": str(e)})
        
        if results["failed"] and not results["sent"]:
            results["success"] = False
            results["fallback_required"] = True
        
        return results
    
    async def send_whatsapp_message(
        self,
        phone_number: str,
        tourist_name: str,
        latitude: float,
        longitude: float,
        incident_type: str = "SOS",
    ) -> dict:
        """
        Send emergency WhatsApp message via Vonage Messages API.
        
        Args:
            phone_number: WhatsApp number (E.164 format)
            tourist_name: Name of the tourist
            latitude: GPS latitude
            longitude: GPS longitude
            incident_type: Type of incident
        
        Returns:
            dict with success status
        """
        if not settings.vonage_api_key:
            return {"success": False, "error": "Vonage not configured"}
        
        maps_link = self._generate_google_maps_link(latitude, longitude)
        normalized_phone = self._normalize_phone(phone_number)
        
        message = (
            f"🚨 *ALERTA SOS - RUTA SEGURA PERÚ*\n\n"
            f"*Turista:* {tourist_name}\n"
            f"*Tipo:* {incident_type}\n"
            f"📍 *Ubicación:* {maps_link}\n\n"
            f"⚠️ Verifique inmediatamente."
        )
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://messages-sandbox.nexmo.com/v1/messages",
                    auth=(settings.vonage_api_key, settings.vonage_api_secret),
                    json={
                        "from": settings.vonage_whatsapp_number or "14157386102",
                        "to": normalized_phone,
                        "message_type": "text",
                        "text": message,
                        "channel": "whatsapp",
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                )
                
                if response.status_code in [200, 202]:
                    data = response.json()
                    message_uuid = data.get("message_uuid")
                    
                    logger.info(
                        f"WhatsApp sent via Vonage | To: {normalized_phone} | "
                        f"UUID: {message_uuid}"
                    )
                    
                    return {
                        "success": True,
                        "message_uuid": message_uuid,
                        "phone": normalized_phone,
                    }
                else:
                    error = response.text
                    logger.error(f"WhatsApp failed: {error}")
                    return {"success": False, "error": error}
                    
        except Exception as e:
            logger.error(f"WhatsApp error: {e}")
            return {"success": False, "error": str(e)}
    
    async def make_emergency_call(
        self,
        phone_number: str,
        tourist_name: str,
        latitude: float,
        longitude: float,
        incident_type: str = "emergencia",
        location_name: str = "ubicación desconocida",
    ) -> dict:
        """
        Make an automated voice call with TTS message via Vonage Voice API.
        
        Args:
            phone_number: Phone to call (E.164 format)
            tourist_name: Name of tourist
            latitude: GPS latitude
            longitude: GPS longitude
            incident_type: Type of incident
            location_name: Human-readable location name
        
        Returns:
            dict with success status and call_uuid
        """
        if not settings.vonage_api_key:
            return {"success": False, "error": "Vonage not configured", "fallback_required": True}
        
        normalized_phone = self._normalize_phone(phone_number)
        
        # NCCO (Nexmo Call Control Object) for TTS
        ncco = [
            {
                "action": "talk",
                "language": "es-ES",
                "style": 0,
                "premium": False,
                "text": (
                    f"Atención. Se ha activado una alerta de emergencia de Ruta Segura Perú. "
                    f"El turista {tourist_name} necesita ayuda urgente. "
                    f"Tipo de incidente: {incident_type}. "
                    f"Ubicación aproximada: latitud {latitude:.4f}, longitud {longitude:.4f}. "
                    f"Por favor verifique el sistema inmediatamente. "
                    f"Repito, {tourist_name} ha activado el botón de pánico."
                ),
            }
        ]
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.nexmo.com/v1/calls",
                    auth=(settings.vonage_api_key, settings.vonage_api_secret),
                    json={
                        "from": {
                            "type": "phone",
                            "number": settings.vonage_from_number or "12345678901",
                        },
                        "to": [
                            {
                                "type": "phone",
                                "number": normalized_phone,
                            }
                        ],
                        "ncco": ncco,
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    call_uuid = data.get("uuid")
                    
                    logger.info(
                        f"Voice call initiated via Vonage | To: {normalized_phone} | "
                        f"UUID: {call_uuid} | Tourist: {tourist_name}"
                    )
                    
                    return {
                        "success": True,
                        "call_uuid": call_uuid,
                        "phone": normalized_phone,
                    }
                else:
                    error = response.text
                    logger.error(f"Vonage voice call failed: {error}")
                    return {"success": False, "error": error, "fallback_required": True}
                    
        except Exception as e:
            logger.error(f"Voice call error: {e}")
            return {"success": False, "error": str(e), "fallback_required": True}
    
    def generate_ncco(self, message: str, language: str = "es-ES") -> list:
        """
        Generate NCCO (Nexmo Call Control Object) for voice calls.
        
        Args:
            message: Text to speak
            language: Language code (default Spanish)
        
        Returns:
            NCCO list for Vonage Voice API
        """
        return [
            {
                "action": "talk",
                "language": language,
                "style": 0,
                "premium": False,
                "text": message,
            }
        ]


# Singleton instance
vonage_service = VonageService()
