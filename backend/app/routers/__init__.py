"""Ruta Segura Perú - Routers Package"""
from app.routers.auth import router as auth_router
from app.routers.emergencies import router as emergencies_router
from app.routers.vonage import router as vonage_router
from app.routers.tours import router as tours_router
from app.routers.agencies import router as agencies_router
from app.routers.guides import router as guides_router
from app.routers.payments import router as payments_router
from app.routers.tracking import router as tracking_router
from app.routers.admin import router as admin_router
from app.routers.bookings import router as bookings_router
from app.routers.reviews import router as reviews_router
from app.routers.identity_verification import router as identity_verification_router
from app.routers.emergency_contacts import router as emergency_contacts_router
from app.routers.public_tracking import router as public_tracking_router
from app.routers.uploads import router as uploads_router
from app.routers.izipay import router as izipay_router
from app.routers import websocket

__all__ = [
    "auth_router",
    "emergencies_router",
    "vonage_router",
    "tours_router",
    "agencies_router",
    "guides_router",
    "payments_router",
    "tracking_router",
    "admin_router",
    "bookings_router",
    "reviews_router",
    "identity_verification_router",
    "emergency_contacts_router",
    "public_tracking_router",
    "uploads_router",
    "izipay_router",
    "websocket",
]


