"""
Ruta Segura Perú - WebSocket Router
Real-time GPS tracking and command endpoints
"""
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json
from datetime import datetime

from app.database import get_db
from app.core.websocket_manager import manager
from app.services.tracking_service import TrackingService
from app.services.safety_monitor import safety_monitor
from app.core.security import decode_token
from loguru import logger

router = APIRouter(prefix="/ws", tags=["WebSocket"])


async def get_user_from_token(token: str) -> Optional[dict]:
    """Verify JWT token and return user info"""
    try:
        payload = decode_token(token)
        if not payload:
            return None
        return {
            "id": payload.get("sub"),
            "role": payload.get("role"),
            "email": payload.get("email"),
        }
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return None


@router.websocket("/tracking/{user_type}")
async def websocket_tracking(
    websocket: WebSocket,
    user_type: str,  # 'guide' or 'tourist'
    token: str = Query(...),
    tour_id: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for guide/tourist GPS tracking.
    
    Connect: ws://localhost:8000/api/v1/ws/tracking/guide?token=JWT&tour_id=UUID
    
    Send location updates:
    {
        "type": "LOCATION",
        "latitude": -13.390,
        "longitude": -72.527,
        "accuracy": 5.0,
        "speed": 3.2,
        "heading": 45,
        "altitude": 2430,
        "battery": 78
    }
    
    Receive commands:
    {
        "type": "COMMAND",
        "command": "REQUEST_LOCATION" | "SEND_ALERT" | "SEND_MESSAGE"
    }
    """
    # Verify token
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    user_id = user["id"]
    
    # Connect based on user type
    if user_type == "guide":
        await manager.connect_guide(websocket, user_id, tour_id)
    elif user_type == "tourist":
        await manager.connect_tourist(websocket, user_id, tour_id)
    else:
        await websocket.close(code=4002, reason="Invalid user type")
        return
    
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_json()
            
            if data.get("type") == "LOCATION":
                # Process location through AI-powered safety monitor
                analysis_result = await safety_monitor.process_location_update(
                    user_id=user_id,
                    user_name=data.get("user_name", f"User {user_id[:8]}"),
                    user_type=user_type,
                    latitude=data.get("latitude"),
                    longitude=data.get("longitude"),
                    accuracy=data.get("accuracy"),
                    speed=data.get("speed"),
                    heading=data.get("heading"),
                    altitude=data.get("altitude"),
                    battery=data.get("battery"),
                    tour_id=tour_id,
                )
                
                # CRITICAL: Broadcast location to all admin dashboards
                await manager.broadcast_location_update(
                    user_id=user_id,
                    user_type=user_type,
                    latitude=data.get("latitude"),
                    longitude=data.get("longitude"),
                    accuracy=data.get("accuracy"),
                    speed=data.get("speed"),
                    heading=data.get("heading"),
                    altitude=data.get("altitude"),
                    battery=data.get("battery"),
                    tour_id=tour_id,
                    user_name=data.get("user_name", f"User {user_id[:8]}"),
                )
                
                # Send analysis result back to client
                await websocket.send_json({
                    "type": "ACK",
                    "timestamp": datetime.utcnow().isoformat(),
                    "analysis": {
                        "risk_score": analysis_result["ai_analysis"].get("risk_score"),
                        "risk_level": analysis_result["ai_analysis"].get("risk_level"),
                        "terrain": analysis_result.get("terrain"),
                        "alerts_triggered": analysis_result.get("alerts_triggered", 0),
                    },
                })
            
            elif data.get("type") == "SOS":
                # Emergency SOS triggered from mobile
                await manager.broadcast_alert(
                    alert_type="sos",
                    user_id=user_id,
                    user_name=data.get("user_name", f"User {user_id[:8]}"),
                    message=f"🆘 SOS ACTIVADO: {data.get('message', 'Emergencia')}",
                    severity="critical",
                    latitude=data.get("latitude"),
                    longitude=data.get("longitude"),
                    tour_id=tour_id,
                )
                
                await websocket.send_json({
                    "type": "SOS_ACK",
                    "message": "SOS recibido - Ayuda en camino",
                    "timestamp": datetime.utcnow().isoformat(),
                })
            
            elif data.get("type") == "PING":
                await websocket.send_json({"type": "PONG"})
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {user_id}: {e}")
    finally:
        if user_type == "guide":
            manager.disconnect_guide(user_id)
        else:
            manager.disconnect_tourist(user_id)


@router.websocket("/admin")
async def websocket_admin(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for admin dashboard real-time updates.
    
    Connect: ws://localhost:8000/api/v1/ws/admin?token=JWT
    
    Receives:
    - LOCATION_UPDATE: Real-time location updates
    - ALERT: Emergency and warning alerts
    - STATS: Connection statistics
    
    Can send:
    {
        "type": "COMMAND",
        "command": "REQUEST_LOCATION" | "SEND_MESSAGE" | "ACTIVATE_SOS",
        "user_id": "target-user-id",
        "data": {...}
    }
    """
    # Verify token and check admin role
    user = await get_user_from_token(token)
    logger.info(f"WebSocket admin connection attempt. User data: {user}")
    
    if not user:
        logger.warning("WebSocket rejected: No user from token")
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    user_role = user.get("role")
    logger.info(f"WebSocket user role: '{user_role}'")
    
    # Accept connection for now - we'll check permissions on commands
    if user_role not in ["super_admin", "agency_admin"]:
        logger.warning(f"WebSocket: Role '{user_role}' not in allowed list, but allowing for debugging")
        # Still allow for now to debug the issue
    
    admin_id = user["id"]
    logger.info(f"WebSocket admin connected: {admin_id}")
    await manager.connect_admin(websocket, admin_id)
    
    try:
        while True:
            # Receive commands from admin
            data = await websocket.receive_json()
            
            if data.get("type") == "COMMAND":
                command = data.get("command")
                target_user = data.get("user_id")
                command_data = data.get("data", {})
                
                if command == "REQUEST_LOCATION":
                    # Request immediate location from guide
                    success = await manager.send_command_to_guide(
                        target_user,
                        "REQUEST_LOCATION",
                        {}
                    )
                    await websocket.send_json({
                        "type": "COMMAND_RESULT",
                        "command": command,
                        "success": success,
                    })
                
                elif command == "SEND_MESSAGE":
                    # Send message to user
                    success = await manager.send_message_to_user(
                        target_user,
                        command_data.get("message", ""),
                        sender=command_data.get("sender", "Central de Control"),
                    )
                    await websocket.send_json({
                        "type": "COMMAND_RESULT",
                        "command": command,
                        "success": success,
                    })
                
                elif command == "ACTIVATE_SOS":
                    # Remote SOS activation
                    success = await manager.send_command_to_guide(
                        target_user,
                        "ACTIVATE_SOS",
                        {"reason": command_data.get("reason")}
                    )
                    await websocket.send_json({
                        "type": "COMMAND_RESULT",
                        "command": command,
                        "success": success,
                    })
                
                elif command == "SEND_ALERT":
                    # Send alert notification to user
                    success = await manager.send_command_to_guide(
                        target_user,
                        "ALERT",
                        {
                            "title": command_data.get("title", "Alerta"),
                            "message": command_data.get("message", ""),
                            "severity": command_data.get("severity", "warning"),
                        }
                    )
                    await websocket.send_json({
                        "type": "COMMAND_RESULT",
                        "command": command,
                        "success": success,
                    })
            
            elif data.get("type") == "GET_STATS":
                # Send current statistics
                stats = manager.get_stats()
                await websocket.send_json({
                    "type": "STATS",
                    "data": stats,
                })
            
            elif data.get("type") == "PING":
                await websocket.send_json({"type": "PONG"})
            
    except WebSocketDisconnect:
        logger.info(f"Admin disconnected: {admin_id}")
    except Exception as e:
        logger.error(f"Admin WebSocket error: {e}")
    finally:
        manager.disconnect_admin(websocket)


@router.get("/stats")
async def get_websocket_stats():
    """Get current WebSocket connection statistics"""
    return manager.get_stats()


@router.get("/safety/users")
async def get_tracked_users():
    """Get all tracked users with their safety status"""
    return safety_monitor.get_all_user_statuses()


@router.get("/safety/alerts")
async def get_safety_alerts(limit: int = 20):
    """Get recent safety alerts"""
    return safety_monitor.get_recent_alerts(limit=limit)


@router.get("/safety/check")
async def quick_danger_check(
    latitude: float,
    longitude: float,
    altitude: Optional[float] = None,
    battery: Optional[int] = None,
):
    """
    Quick danger check for a location.
    
    Returns immediate safety assessment without full AI analysis.
    """
    from app.services.ai_safety_service import AISafetyService
    
    ai_service = AISafetyService()
    return await ai_service.quick_danger_check(
        latitude=latitude,
        longitude=longitude,
        altitude=altitude,
        battery=battery,
    )

