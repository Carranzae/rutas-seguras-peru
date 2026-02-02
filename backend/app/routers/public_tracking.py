"""
Ruta Segura Perú - Public Tracking Router
Web view for emergency contacts to track tourist in real-time
"""
import uuid
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.emergency import Emergency, EmergencyStatus
from app.models.user import User
from app.models.tracking import TrackingPoint
from app.services.alert_broadcaster import alert_broadcaster


router = APIRouter(prefix="/tracking", tags=["Public Tracking"])


# ============================================
# SCHEMAS
# ============================================

class TrackingDataResponse(BaseModel):
    """Real-time tracking data for emergency contacts."""
    is_valid: bool
    is_active: bool
    tourist_name: str
    emergency_type: Optional[str]
    last_location: Optional[dict]
    battery_level: Optional[int]
    last_update: Optional[str]
    emergency_numbers: dict
    agency_phone: Optional[str]


# ============================================
# ENDPOINTS
# ============================================

@router.get("/{token}", response_class=HTMLResponse)
async def tracking_page(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Public web page for emergency contacts to view tourist location.
    No app installation required - works in any browser.
    """
    # Validate token
    tracking_link = alert_broadcaster.validate_tracking_token(token)
    
    if not tracking_link:
        return get_expired_page()
    
    # Get emergency info
    emergency_result = await db.execute(
        select(Emergency).where(Emergency.id == tracking_link.emergency_id)
    )
    emergency = emergency_result.scalar_one_or_none()
    
    if not emergency:
        return get_expired_page()
    
    # Check if emergency is still active
    if emergency.status not in (EmergencyStatus.ACTIVE, EmergencyStatus.RESPONDING):
        return get_resolved_page()
    
    # Get tourist info
    user_result = await db.execute(
        select(User).where(User.id == emergency.user_id)
    )
    user = user_result.scalar_one_or_none()
    tourist_name = user.full_name if user else "Turista"
    
    return get_tracking_page(
        token=token,
        tourist_name=tourist_name,
        emergency_type=emergency.severity.value if emergency.severity else "SOS",
        lat=emergency.latitude or -12.0464,
        lng=emergency.longitude or -77.0428,
    )


@router.get("/{token}/data", response_model=TrackingDataResponse)
async def get_tracking_data(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    AJAX endpoint for real-time location updates.
    Called every 5 seconds by the tracking page.
    """
    tracking_link = alert_broadcaster.validate_tracking_token(token)
    
    if not tracking_link:
        return TrackingDataResponse(
            is_valid=False,
            is_active=False,
            tourist_name="",
            emergency_type=None,
            last_location=None,
            battery_level=None,
            last_update=None,
            emergency_numbers={},
            agency_phone=None,
        )
    
    # Get emergency
    emergency_result = await db.execute(
        select(Emergency).where(Emergency.id == tracking_link.emergency_id)
    )
    emergency = emergency_result.scalar_one_or_none()
    
    if not emergency:
        return TrackingDataResponse(
            is_valid=False,
            is_active=False,
            tourist_name="",
            emergency_type=None,
            last_location=None,
            battery_level=None,
            last_update=None,
            emergency_numbers={},
            agency_phone=None,
        )
    
    is_active = emergency.status in (EmergencyStatus.ACTIVE, EmergencyStatus.RESPONDING)
    
    # Get user
    user_result = await db.execute(
        select(User).where(User.id == emergency.user_id)
    )
    user = user_result.scalar_one_or_none()
    
    # Get latest tracking point
    tracking_result = await db.execute(
        select(TrackingPoint)
        .where(TrackingPoint.user_id == emergency.user_id)
        .order_by(TrackingPoint.created_at.desc())
        .limit(1)
    )
    latest_point = tracking_result.scalar_one_or_none()
    
    last_location = None
    if latest_point:
        last_location = {
            "lat": latest_point.latitude,
            "lng": latest_point.longitude,
            "accuracy": latest_point.accuracy,
        }
    elif emergency.latitude and emergency.longitude:
        last_location = {
            "lat": emergency.latitude,
            "lng": emergency.longitude,
            "accuracy": 50,
        }
    
    return TrackingDataResponse(
        is_valid=True,
        is_active=is_active,
        tourist_name=user.full_name if user else "Turista",
        emergency_type=emergency.severity.value if emergency.severity else "SOS",
        last_location=last_location,
        battery_level=None,  # TODO: Get from tracking data
        last_update=latest_point.created_at.isoformat() if latest_point else None,
        emergency_numbers={
            "police": "105",
            "fire": "116",
            "ambulance": "117",
            "general": "911",
            "tourist_police": "(01) 460-1060",
        },
        agency_phone=None,  # TODO: Get from booking/tour
    )


# ============================================
# HTML TEMPLATES
# ============================================

def get_tracking_page(token: str, tourist_name: str, emergency_type: str, lat: float, lng: float) -> str:
    """Generate the tracking HTML page."""
    return f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚨 Alerta SOS - Ruta Segura</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: white;
            min-height: 100vh;
        }}
        .header {{
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            padding: 20px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 18px;
            margin-bottom: 5px;
        }}
        .header p {{
            font-size: 14px;
            opacity: 0.9;
        }}
        .alert-banner {{
            background: #ff5252;
            padding: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.7; }}
        }}
        .alert-banner span {{ font-size: 24px; }}
        .alert-banner p {{ font-weight: 600; }}
        #map {{
            height: 50vh;
            width: 100%;
        }}
        .info-panel {{
            padding: 20px;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #333;
        }}
        .info-label {{ color: #888; font-size: 14px; }}
        .info-value {{ font-weight: 600; }}
        .emergency-buttons {{
            padding: 20px;
            display: grid;
            gap: 12px;
        }}
        .emergency-btn {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            color: white;
        }}
        .btn-police {{ background: #2196F3; }}
        .btn-ambulance {{ background: #4CAF50; }}
        .btn-fire {{ background: #FF9800; }}
        .status-active {{
            display: inline-block;
            background: #ff5252;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 5px;
        }}
        .last-update {{
            text-align: center;
            padding: 10px;
            color: #888;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Ruta Segura Perú</h1>
        <p>Seguimiento de Emergencia en Tiempo Real</p>
    </div>
    
    <div class="alert-banner">
        <span>🚨</span>
        <div>
            <p>ALERTA SOS ACTIVA</p>
            <span class="status-active">● EN VIVO</span>
        </div>
    </div>
    
    <div id="map"></div>
    
    <div class="info-panel">
        <div class="info-row">
            <span class="info-label">Persona en Emergencia</span>
            <span class="info-value" id="tourist-name">{tourist_name}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Tipo de Emergencia</span>
            <span class="info-value" id="emergency-type">{emergency_type}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Coordenadas</span>
            <span class="info-value" id="coordinates">Cargando...</span>
        </div>
    </div>
    
    <p class="last-update">Última actualización: <span id="last-update">--</span></p>
    
    <div class="emergency-buttons">
        <a href="tel:105" class="emergency-btn btn-police">
            📞 Llamar Policía (105)
        </a>
        <a href="tel:117" class="emergency-btn btn-ambulance">
            🚑 Llamar Ambulancia (117)
        </a>
        <a href="tel:01-460-1060" class="emergency-btn btn-fire">
            👮 Policía de Turismo
        </a>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const TOKEN = "{token}";
        const INITIAL_LAT = {lat};
        const INITIAL_LNG = {lng};
        
        // Initialize map
        const map = L.map('map').setView([INITIAL_LAT, INITIAL_LNG], 16);
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            attribution: '© OpenStreetMap'
        }}).addTo(map);
        
        // Emergency marker
        const emergencyIcon = L.divIcon({{
            className: 'emergency-marker',
            html: '<div style="background:#ff5252;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(255,82,82,0.5);animation:pulse 1s infinite;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        }});
        
        let marker = L.marker([INITIAL_LAT, INITIAL_LNG], {{ icon: emergencyIcon }}).addTo(map);
        
        // Update location every 5 seconds
        async function updateLocation() {{
            try {{
                const response = await fetch('/api/v1/tracking/' + TOKEN + '/data');
                const data = await response.json();
                
                if (!data.is_valid || !data.is_active) {{
                    document.querySelector('.alert-banner').innerHTML = 
                        '<span>✅</span><p>EMERGENCIA RESUELTA</p>';
                    document.querySelector('.alert-banner').style.background = '#4CAF50';
                    return;
                }}
                
                if (data.last_location) {{
                    const {{ lat, lng }} = data.last_location;
                    marker.setLatLng([lat, lng]);
                    map.panTo([lat, lng]);
                    document.getElementById('coordinates').textContent = 
                        lat.toFixed(6) + ', ' + lng.toFixed(6);
                }}
                
                if (data.last_update) {{
                    const date = new Date(data.last_update);
                    document.getElementById('last-update').textContent = 
                        date.toLocaleTimeString('es-PE');
                }}
            }} catch (error) {{
                console.error('Update failed:', error);
            }}
        }}
        
        // Initial update and interval
        updateLocation();
        setInterval(updateLocation, 5000);
    </script>
</body>
</html>
"""


def get_expired_page() -> str:
    """Page shown when tracking link has expired."""
    return """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enlace Expirado - Ruta Segura</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #1a1a2e;
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
        }
        .container { max-width: 400px; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 24px; margin-bottom: 10px; }
        p { color: #888; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⏱️</div>
        <h1>Enlace Expirado</h1>
        <p>Este enlace de seguimiento ya no es válido. 
           El enlace expira automáticamente por seguridad después de 24 horas 
           o cuando la emergencia es resuelta.</p>
    </div>
</body>
</html>
"""


def get_resolved_page() -> str:
    """Page shown when emergency has been resolved."""
    return """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emergencia Resuelta - Ruta Segura</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #1a1a2e;
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
        }
        .container { max-width: 400px; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 24px; margin-bottom: 10px; color: #4CAF50; }
        p { color: #888; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Emergencia Resuelta</h1>
        <p>La situación de emergencia ha sido resuelta exitosamente. 
           El turista está a salvo. Gracias por tu apoyo.</p>
    </div>
</body>
</html>
"""
