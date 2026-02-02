"""
Ruta Segura Perú - Vonage Provider Alias
Alias module for backwards compatibility
"""
from app.integrations.vonage_service import VonageService, vonage_service

# Provide the vonage_provider alias expected by notification_middleware
vonage_provider = vonage_service

__all__ = ["vonage_provider", "vonage_service", "VonageService"]
