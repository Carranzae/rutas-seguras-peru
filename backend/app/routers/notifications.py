"""
Ruta Segura Perú - Notifications Router
Handles fetching notification history
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class Notification(BaseModel):
    id: str
    type: str  # alert, tourist, system, safety
    title: str
    message: str
    time: str
    unread: bool

@router.get("/", response_model=List[Notification])
async def get_notifications():
    """
    Get user notifications (Mocked for now)
    """
    # Dynamic times
    now = datetime.now()
    
    return [
        {
            "id": "1",
            "type": "alert",
            "title": "Alerta Meteorológica",
            "message": "Se esperan lluvias fuertes en Machu Picchu a partir de las 2pm. Considere ajustar su horario.",
            "time": "Hace 10 min",
            "unread": True
        },
        {
            "id": "2",
            "type": "tourist",
            "title": "Check-in Requerido",
            "message": "El turista Juan P. no ha reportado ubicación en 15 minutos.",
            "time": "Hace 20 min",
            "unread": True
        },
        {
            "id": "3",
            "type": "system",
            "title": "Recordatorio de Tour",
            "message": "Tu próximo tour 'Valle Sagrado' comienza en 2 horas.",
            "time": "Hace 1 hora",
            "unread": False
        },
        {
            "id": "4",
            "type": "safety",
            "title": "Actualización de Protocolos",
            "message": "Nuevos protocolos de seguridad para Camino Inca publicados.",
            "time": "Hace 3 horas",
            "unread": False
        }
    ]
