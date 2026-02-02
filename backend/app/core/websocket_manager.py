"""
Ruta Segura Perú - WebSocket Manager
Manages real-time connections for GPS tracking and emergency alerts
"""
from typing import Dict, List, Optional, Set, Any
from fastapi import WebSocket
import json
from datetime import datetime
import asyncio
from loguru import logger


class ConnectionManager:
    """
    Manages WebSocket connections for real-time tracking.
    Supports multiple connection types: guides, tourists, admins
    """
    
    def __init__(self):
        # Active connections by type
        self.admin_connections: List[WebSocket] = []
        self.guide_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        self.tourist_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        
        # Track which tours each connection is monitoring
        self.tour_subscribers: Dict[str, Set[WebSocket]] = {}  # tour_id -> set of admin websockets
        
        # Last known locations (cache for immediate response)
        self.locations: Dict[str, dict] = {}  # user_id -> location data
        
    async def connect_admin(self, websocket: WebSocket, admin_id: str):
        """Connect an admin dashboard"""
        await websocket.accept()
        self.admin_connections.append(websocket)
        logger.info(f"Admin connected: {admin_id} | Total admins: {len(self.admin_connections)}")
        
        # Send current state
        await self.send_initial_state(websocket)
        
    async def connect_guide(self, websocket: WebSocket, user_id: str, tour_id: Optional[str] = None):
        """Connect a guide's mobile app"""
        await websocket.accept()
        self.guide_connections[user_id] = websocket
        logger.info(f"Guide connected: {user_id} | Tour: {tour_id}")
        
    async def connect_tourist(self, websocket: WebSocket, user_id: str, tour_id: Optional[str] = None):
        """Connect a tourist's mobile app"""
        await websocket.accept()
        self.tourist_connections[user_id] = websocket
        logger.info(f"Tourist connected: {user_id} | Tour: {tour_id}")
        
    def disconnect_admin(self, websocket: WebSocket):
        """Disconnect an admin"""
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)
            logger.info(f"Admin disconnected | Total admins: {len(self.admin_connections)}")
            
    def disconnect_guide(self, user_id: str):
        """Disconnect a guide"""
        if user_id in self.guide_connections:
            del self.guide_connections[user_id]
            if user_id in self.locations:
                del self.locations[user_id]
            logger.info(f"Guide disconnected: {user_id}")
            
    def disconnect_tourist(self, user_id: str):
        """Disconnect a tourist"""
        if user_id in self.tourist_connections:
            del self.tourist_connections[user_id]
            if user_id in self.locations:
                del self.locations[user_id]
            logger.info(f"Tourist disconnected: {user_id}")
    
    async def send_initial_state(self, websocket: WebSocket):
        """Send current tracking state to new admin connection"""
        state = {
            "type": "INITIAL_STATE",
            "data": {
                "active_guides": len(self.guide_connections),
                "active_tourists": len(self.tourist_connections),
                "locations": list(self.locations.values()),
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_json(state)
    
    async def broadcast_to_admins(self, message: dict):
        """Send message to all admin connections"""
        disconnected = []
        for connection in self.admin_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to admin: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.disconnect_admin(conn)
    
    async def broadcast_location_update(
        self,
        user_id: str,
        user_type: str,  # 'guide' or 'tourist'
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
        altitude: Optional[float] = None,
        battery: Optional[int] = None,
        tour_id: Optional[str] = None,
        user_name: Optional[str] = None,
    ):
        """
        Process and broadcast a location update to all admins
        """
        location_data = {
            "user_id": user_id,
            "user_type": user_type,
            "user_name": user_name or f"User {user_id[:8]}",
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "speed": speed,
            "heading": heading,
            "altitude": altitude,
            "battery": battery,
            "tour_id": tour_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": self._determine_status(speed, battery),
        }
        
        # Cache location
        self.locations[user_id] = location_data
        
        # Broadcast to admins
        message = {
            "type": "LOCATION_UPDATE",
            "data": location_data,
        }
        await self.broadcast_to_admins(message)
        
        logger.debug(f"Location broadcast | {user_type}: {user_id} | ({latitude}, {longitude})")
    
    async def broadcast_alert(
        self,
        alert_type: str,  # 'sos', 'low_battery', 'no_signal', 'deviation', 'speed'
        user_id: str,
        user_name: str,
        message: str,
        severity: str = 'warning',  # 'critical', 'warning', 'info'
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        tour_id: Optional[str] = None,
    ):
        """Broadcast an alert to all admins"""
        alert_data = {
            "id": f"alert-{datetime.utcnow().timestamp()}",
            "type": alert_type,
            "user_id": user_id,
            "user_name": user_name,
            "message": message,
            "severity": severity,
            "latitude": latitude,
            "longitude": longitude,
            "tour_id": tour_id,
            "timestamp": datetime.utcnow().isoformat(),
            "acknowledged": False,
        }
        
        message_obj = {
            "type": "ALERT",
            "data": alert_data,
        }
        await self.broadcast_to_admins(message_obj)
        
        logger.warning(f"Alert broadcast | {alert_type} | {user_name}: {message}")
    
    async def send_command_to_guide(
        self,
        user_id: str,
        command: str,  # 'REQUEST_LOCATION', 'SEND_ALERT', 'SEND_MESSAGE', 'ACTIVATE_SOS'
        data: Optional[dict] = None,
    ) -> bool:
        """Send a command to a specific guide's app"""
        if user_id not in self.guide_connections:
            logger.warning(f"Guide not connected: {user_id}")
            return False
        
        try:
            message = {
                "type": "COMMAND",
                "command": command,
                "data": data or {},
                "timestamp": datetime.utcnow().isoformat(),
            }
            await self.guide_connections[user_id].send_json(message)
            logger.info(f"Command sent to guide {user_id}: {command}")
            return True
        except Exception as e:
            logger.error(f"Error sending command to {user_id}: {e}")
            self.disconnect_guide(user_id)
            return False
    
    async def send_message_to_user(
        self,
        user_id: str,
        message_text: str,
        sender: str = "Central de Control",
    ) -> bool:
        """Send a text message to a user (guide or tourist)"""
        websocket = self.guide_connections.get(user_id) or self.tourist_connections.get(user_id)
        
        if not websocket:
            return False
        
        try:
            message = {
                "type": "MESSAGE",
                "data": {
                    "from": sender,
                    "text": message_text,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            }
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending message to {user_id}: {e}")
            return False
    
    def _determine_status(self, speed: Optional[float], battery: Optional[int]) -> str:
        """Determine user status based on metrics"""
        if battery is not None and battery < 10:
            return 'low_battery'
        if speed is not None and speed > 0.5:
            return 'active'
        if speed is not None and speed <= 0.5:
            return 'idle'
        return 'active'
    
    def get_stats(self) -> dict:
        """Get current connection statistics"""
        return {
            "admin_connections": len(self.admin_connections),
            "guide_connections": len(self.guide_connections),
            "tourist_connections": len(self.tourist_connections),
            "active_locations": len(self.locations),
            "guides_online": list(self.guide_connections.keys()),
            "tourists_online": list(self.tourist_connections.keys()),
        }


# Global manager instance
manager = ConnectionManager()
