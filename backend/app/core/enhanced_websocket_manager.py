"""
Ruta Segura Perú - Enhanced WebSocket Manager with Redis
Real-time tracking with channel subscriptions and battery optimization
"""
from typing import Dict, List, Optional, Set, Any
from fastapi import WebSocket
import json
from datetime import datetime
import asyncio
from loguru import logger

from app.services.redis_location_cache import location_cache


class EnhancedConnectionManager:
    """
    Enhanced WebSocket manager with:
    - Redis-backed location caching
    - Tour channel subscriptions (Uber-style broadcaster)
    - Movement-based update filtering (battery saver)
    """
    
    # Minimum distance (meters) to trigger update broadcast
    MIN_MOVEMENT_THRESHOLD = 5.0  # 5 meters
    
    def __init__(self):
        # Active connections by type
        self.admin_connections: Dict[str, WebSocket] = {}  # admin_id -> websocket
        self.guide_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        self.tourist_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        
        # Tour channel subscriptions
        self.tour_channels: Dict[str, Set[str]] = {}  # tour_id -> set of user_ids
        
        # Agency subscriptions (for agency admins)
        self.agency_channels: Dict[str, Set[str]] = {}  # agency_id -> set of admin_ids
        
        # Last known locations (for movement filtering)
        self._last_positions: Dict[str, tuple] = {}  # user_id -> (lat, lng)
    
    async def initialize(self):
        """Initialize Redis connection"""
        await location_cache.connect()
    
    async def shutdown(self):
        """Clean shutdown"""
        await location_cache.disconnect()
    
    # ==========================================
    # CONNECTION MANAGEMENT
    # ==========================================
    
    async def connect_admin(
        self,
        websocket: WebSocket,
        admin_id: str,
        agency_id: Optional[str] = None,
    ):
        """Connect an admin dashboard"""
        await websocket.accept()
        self.admin_connections[admin_id] = websocket
        
        # Subscribe to agency channel
        if agency_id:
            if agency_id not in self.agency_channels:
                self.agency_channels[agency_id] = set()
            self.agency_channels[agency_id].add(admin_id)
        
        logger.info(f"Admin connected: {admin_id} | Agency: {agency_id}")
        
        # Send current state from Redis
        await self._send_initial_state(websocket)
    
    async def connect_guide(
        self,
        websocket: WebSocket,
        user_id: str,
        tour_id: Optional[str] = None,
        user_name: Optional[str] = None,
    ):
        """Connect a guide's mobile app"""
        await websocket.accept()
        self.guide_connections[user_id] = websocket
        
        # Subscribe to tour channel
        if tour_id:
            await self._subscribe_to_tour(user_id, tour_id)
        
        logger.info(f"Guide connected: {user_id} | Tour: {tour_id}")
    
    async def connect_tourist(
        self,
        websocket: WebSocket,
        user_id: str,
        tour_id: Optional[str] = None,
        user_name: Optional[str] = None,
    ):
        """Connect a tourist's mobile app"""
        await websocket.accept()
        self.tourist_connections[user_id] = websocket
        
        # Subscribe to tour channel
        if tour_id:
            await self._subscribe_to_tour(user_id, tour_id)
        
        logger.info(f"Tourist connected: {user_id} | Tour: {tour_id}")
    
    def disconnect_admin(self, admin_id: str):
        """Disconnect an admin"""
        if admin_id in self.admin_connections:
            del self.admin_connections[admin_id]
            
            # Remove from agency channels
            for agency_id, admins in self.agency_channels.items():
                admins.discard(admin_id)
            
            logger.info(f"Admin disconnected: {admin_id}")
    
    async def disconnect_guide(self, user_id: str):
        """Disconnect a guide"""
        if user_id in self.guide_connections:
            del self.guide_connections[user_id]
            self._unsubscribe_from_tours(user_id)
            await location_cache.remove_user(user_id)
            if user_id in self._last_positions:
                del self._last_positions[user_id]
            logger.info(f"Guide disconnected: {user_id}")
    
    async def disconnect_tourist(self, user_id: str):
        """Disconnect a tourist"""
        if user_id in self.tourist_connections:
            del self.tourist_connections[user_id]
            self._unsubscribe_from_tours(user_id)
            await location_cache.remove_user(user_id)
            if user_id in self._last_positions:
                del self._last_positions[user_id]
            logger.info(f"Tourist disconnected: {user_id}")
    
    # ==========================================
    # TOUR CHANNEL SUBSCRIPTIONS
    # ==========================================
    
    async def _subscribe_to_tour(self, user_id: str, tour_id: str):
        """Subscribe user to a tour channel"""
        if tour_id not in self.tour_channels:
            self.tour_channels[tour_id] = set()
        self.tour_channels[tour_id].add(user_id)
        logger.debug(f"User {user_id} subscribed to tour {tour_id}")
    
    def _unsubscribe_from_tours(self, user_id: str):
        """Remove user from all tour channels"""
        for tour_id, users in self.tour_channels.items():
            users.discard(user_id)
    
    async def broadcast_to_tour(self, tour_id: str, message: dict, exclude_user: Optional[str] = None):
        """
        Broadcast message to all users in a tour channel.
        This is the Uber-style broadcaster - instant retransmission to subscribers.
        """
        if tour_id not in self.tour_channels:
            return
        
        disconnected = []
        for user_id in self.tour_channels[tour_id]:
            if user_id == exclude_user:
                continue
            
            websocket = (
                self.guide_connections.get(user_id) or
                self.tourist_connections.get(user_id)
            )
            
            if websocket:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    disconnected.append(user_id)
        
        # Clean up disconnected
        for user_id in disconnected:
            self.tour_channels[tour_id].discard(user_id)
    
    # ==========================================
    # LOCATION UPDATES WITH MOVEMENT FILTER
    # ==========================================
    
    def _has_significant_movement(
        self,
        user_id: str,
        latitude: float,
        longitude: float,
    ) -> bool:
        """
        Check if user has moved significantly (battery saver).
        Only broadcasts if movement > MIN_MOVEMENT_THRESHOLD meters.
        """
        if user_id not in self._last_positions:
            self._last_positions[user_id] = (latitude, longitude)
            return True
        
        last_lat, last_lng = self._last_positions[user_id]
        
        # Quick distance calculation (Haversine approximation)
        from math import radians, sin, cos, sqrt, atan2
        R = 6371000  # Earth radius in meters
        
        lat1, lat2 = radians(last_lat), radians(latitude)
        dLat = radians(latitude - last_lat)
        dLng = radians(longitude - last_lng)
        
        a = sin(dLat/2)**2 + cos(lat1) * cos(lat2) * sin(dLng/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        if distance >= self.MIN_MOVEMENT_THRESHOLD:
            self._last_positions[user_id] = (latitude, longitude)
            return True
        
        return False
    
    async def process_location_update(
        self,
        user_id: str,
        user_type: str,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
        altitude: Optional[float] = None,
        battery: Optional[int] = None,
        tour_id: Optional[str] = None,
        agency_id: Optional[str] = None,
        user_name: Optional[str] = None,
    ) -> dict:
        """
        Process and broadcast a location update.
        - Caches in Redis
        - Broadcasts to tour channel (instant)
        - Broadcasts to admins
        - Respects movement threshold for battery saving
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
            "agency_id": agency_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": self._determine_status(speed, battery),
        }
        
        # Cache in Redis
        await location_cache.set_location(
            user_id=user_id,
            user_type=user_type,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            speed=speed,
            heading=heading,
            altitude=altitude,
            battery=battery,
            tour_id=tour_id,
            agency_id=agency_id,
            user_name=user_name,
        )
        
        # Check movement threshold
        should_broadcast = self._has_significant_movement(user_id, latitude, longitude)
        
        if should_broadcast or battery is not None and battery < 20:  # Always broadcast low battery
            message = {
                "type": "LOCATION_UPDATE",
                "data": location_data,
            }
            
            # Broadcast to tour subscribers (instant retransmission)
            if tour_id:
                await self.broadcast_to_tour(tour_id, message, exclude_user=user_id)
            
            # Broadcast to admins
            await self._broadcast_to_admins(message, agency_id=agency_id)
        
        return location_data
    
    # ==========================================
    # ADMIN BROADCASTING
    # ==========================================
    
    async def _broadcast_to_admins(self, message: dict, agency_id: Optional[str] = None):
        """Broadcast to relevant admins"""
        disconnected = []
        
        # If agency_id is specified, only broadcast to that agency's admins
        target_admins = set(self.admin_connections.keys())
        
        if agency_id and agency_id in self.agency_channels:
            # Filter to only agency admins (super admins see everything)
            agency_admins = self.agency_channels[agency_id]
            target_admins = target_admins.intersection(agency_admins) or target_admins
        
        for admin_id in target_admins:
            websocket = self.admin_connections.get(admin_id)
            if websocket:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to admin {admin_id}: {e}")
                    disconnected.append(admin_id)
        
        for admin_id in disconnected:
            self.disconnect_admin(admin_id)
    
    async def broadcast_emergency(
        self,
        user_id: str,
        user_name: str,
        latitude: float,
        longitude: float,
        message: str,
        tour_id: Optional[str] = None,
        agency_id: Optional[str] = None,
    ):
        """Broadcast an SOS emergency to all relevant parties"""
        emergency_data = {
            "id": f"sos-{datetime.utcnow().timestamp()}",
            "user_id": user_id,
            "user_name": user_name,
            "message": message,
            "latitude": latitude,
            "longitude": longitude,
            "tour_id": tour_id,
            "agency_id": agency_id,
            "timestamp": datetime.utcnow().isoformat(),
            "severity": "critical",
        }
        
        # Cache emergency
        await location_cache.set_emergency(user_id, emergency_data)
        
        alert_message = {
            "type": "EMERGENCY",
            "data": emergency_data,
        }
        
        # Broadcast to ALL admins (emergencies go everywhere)
        for admin_id, websocket in self.admin_connections.items():
            try:
                await websocket.send_json(alert_message)
            except Exception:
                pass
        
        # Broadcast to tour
        if tour_id:
            await self.broadcast_to_tour(tour_id, alert_message)
        
        logger.critical(f"🆘 EMERGENCY broadcast: {user_name} at ({latitude}, {longitude})")
    
    # ==========================================
    # HELPER METHODS
    # ==========================================
    
    async def _send_initial_state(self, websocket: WebSocket):
        """Send current state to new admin connection from Redis"""
        locations = await location_cache.get_all_locations()
        emergencies = await location_cache.get_emergencies()
        
        state = {
            "type": "INITIAL_STATE",
            "data": {
                "active_guides": len([l for l in locations if l.get("user_type") == "guide"]),
                "active_tourists": len([l for l in locations if l.get("user_type") == "tourist"]),
                "locations": locations,
                "emergencies": emergencies,
                "connections": {
                    "admins": len(self.admin_connections),
                    "guides": len(self.guide_connections),
                    "tourists": len(self.tourist_connections),
                },
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
        await websocket.send_json(state)
    
    def _determine_status(self, speed: Optional[float], battery: Optional[int]) -> str:
        """Determine user status based on metrics"""
        if battery is not None and battery < 10:
            return "low_battery"
        if speed is not None and speed > 0.5:
            return "active"
        if speed is not None and speed <= 0.5:
            return "idle"
        return "active"
    
    async def find_nearby_guides(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
    ) -> List[dict]:
        """Find guides within radius using Redis geo queries"""
        users = await location_cache.find_users_nearby(latitude, longitude, radius_km)
        return [u for u in users if u.get("user_type") == "guide"]
    
    def get_stats(self) -> dict:
        """Get current connection statistics"""
        return {
            "admin_connections": len(self.admin_connections),
            "guide_connections": len(self.guide_connections),
            "tourist_connections": len(self.tourist_connections),
            "active_tours": len(self.tour_channels),
            "tour_subscriptions": {
                tour_id: len(users)
                for tour_id, users in self.tour_channels.items()
            },
        }


# Global enhanced manager instance
enhanced_manager = EnhancedConnectionManager()
