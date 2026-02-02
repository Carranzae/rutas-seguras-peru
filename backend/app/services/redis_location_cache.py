"""
Ruta Segura Perú - Redis Location Cache
High-performance real-time location caching using Redis
"""
import json
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import redis.asyncio as redis
from loguru import logger

from app.config import settings


class RedisLocationCache:
    """
    Redis-based location cache for instant location retrieval.
    Uses Redis for sub-millisecond access to current positions.
    """
    
    # Key prefixes
    LOCATION_PREFIX = "loc:"
    TOUR_PREFIX = "tour:"
    AGENCY_PREFIX = "agency:"
    EMERGENCY_KEY = "emergencies:active"
    
    # TTL for location data (seconds)
    LOCATION_TTL = 300  # 5 minutes
    
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
        self._initialized = False
    
    async def connect(self):
        """Initialize Redis connection"""
        if self._initialized:
            return
        
        try:
            self.redis = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await self.redis.ping()
            self._initialized = True
            logger.info("Redis location cache connected")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using in-memory fallback.")
            self.redis = None
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            self._initialized = False
    
    async def set_location(
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
    ) -> bool:
        """
        Cache a user's current location.
        Uses Redis GEOADD for geospatial queries.
        """
        if not self.redis:
            return False
        
        try:
            location_data = {
                "user_id": user_id,
                "user_type": user_type,
                "user_name": user_name,
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
            }
            
            key = f"{self.LOCATION_PREFIX}{user_id}"
            
            # Use pipeline for atomic operations
            async with self.redis.pipeline() as pipe:
                # Store location data
                await pipe.hset(key, mapping={
                    k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) if v is not None else ""
                    for k, v in location_data.items()
                })
                await pipe.expire(key, self.LOCATION_TTL)
                
                # Add to geo index for spatial queries
                await pipe.geoadd("geo:users", (longitude, latitude, user_id))
                
                # Track by tour
                if tour_id:
                    await pipe.sadd(f"{self.TOUR_PREFIX}{tour_id}", user_id)
                    await pipe.expire(f"{self.TOUR_PREFIX}{tour_id}", self.LOCATION_TTL)
                
                # Track by agency
                if agency_id:
                    await pipe.sadd(f"{self.AGENCY_PREFIX}{agency_id}", user_id)
                    await pipe.expire(f"{self.AGENCY_PREFIX}{agency_id}", self.LOCATION_TTL)
                
                await pipe.execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Redis set_location error: {e}")
            return False
    
    async def get_location(self, user_id: str) -> Optional[Dict]:
        """Get a user's current cached location"""
        if not self.redis:
            return None
        
        try:
            data = await self.redis.hgetall(f"{self.LOCATION_PREFIX}{user_id}")
            if not data:
                return None
            
            # Parse values
            return {
                "user_id": data.get("user_id"),
                "user_type": data.get("user_type"),
                "user_name": data.get("user_name"),
                "latitude": float(data.get("latitude", 0)),
                "longitude": float(data.get("longitude", 0)),
                "accuracy": float(data.get("accuracy")) if data.get("accuracy") else None,
                "speed": float(data.get("speed")) if data.get("speed") else None,
                "heading": float(data.get("heading")) if data.get("heading") else None,
                "altitude": float(data.get("altitude")) if data.get("altitude") else None,
                "battery": int(data.get("battery")) if data.get("battery") else None,
                "tour_id": data.get("tour_id") or None,
                "agency_id": data.get("agency_id") or None,
                "timestamp": data.get("timestamp"),
            }
        except Exception as e:
            logger.error(f"Redis get_location error: {e}")
            return None
    
    async def get_all_locations(self) -> List[Dict]:
        """Get all active user locations"""
        if not self.redis:
            return []
        
        try:
            # Get all location keys
            keys = []
            async for key in self.redis.scan_iter(f"{self.LOCATION_PREFIX}*"):
                keys.append(key)
            
            # Fetch all locations
            locations = []
            for key in keys:
                user_id = key.replace(self.LOCATION_PREFIX, "")
                loc = await self.get_location(user_id)
                if loc:
                    locations.append(loc)
            
            return locations
            
        except Exception as e:
            logger.error(f"Redis get_all_locations error: {e}")
            return []
    
    async def find_users_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        limit: int = 50,
    ) -> List[Dict]:
        """
        Find users within a radius using Redis GEORADIUS.
        Sub-millisecond performance for Uber-style matching.
        """
        if not self.redis:
            return []
        
        try:
            # Use Redis GEOSEARCH (radius in meters)
            results = await self.redis.geosearch(
                "geo:users",
                longitude=longitude,
                latitude=latitude,
                radius=radius_km * 1000,  # km to meters
                unit="m",
                withdist=True,
                withcoord=True,
                count=limit,
                sort="ASC",
            )
            
            users = []
            for result in results:
                user_id = result[0]
                distance_m = result[1]
                coords = result[2]
                
                # Get full location data
                loc = await self.get_location(user_id)
                if loc:
                    loc["distance_meters"] = distance_m
                    users.append(loc)
            
            return users
            
        except Exception as e:
            logger.error(f"Redis find_users_nearby error: {e}")
            return []
    
    async def get_tour_users(self, tour_id: str) -> List[Dict]:
        """Get all users subscribed to a tour"""
        if not self.redis:
            return []
        
        try:
            user_ids = await self.redis.smembers(f"{self.TOUR_PREFIX}{tour_id}")
            
            users = []
            for user_id in user_ids:
                loc = await self.get_location(user_id)
                if loc:
                    users.append(loc)
            
            return users
            
        except Exception as e:
            logger.error(f"Redis get_tour_users error: {e}")
            return []
    
    async def set_emergency(self, user_id: str, emergency_data: Dict):
        """Register an active emergency"""
        if not self.redis:
            return
        
        try:
            await self.redis.hset(
                self.EMERGENCY_KEY,
                user_id,
                json.dumps(emergency_data)
            )
        except Exception as e:
            logger.error(f"Redis set_emergency error: {e}")
    
    async def get_emergencies(self) -> List[Dict]:
        """Get all active emergencies"""
        if not self.redis:
            return []
        
        try:
            data = await self.redis.hgetall(self.EMERGENCY_KEY)
            return [json.loads(v) for v in data.values()]
        except Exception as e:
            logger.error(f"Redis get_emergencies error: {e}")
            return []
    
    async def clear_emergency(self, user_id: str):
        """Clear an emergency"""
        if not self.redis:
            return
        
        try:
            await self.redis.hdel(self.EMERGENCY_KEY, user_id)
        except Exception as e:
            logger.error(f"Redis clear_emergency error: {e}")
    
    async def remove_user(self, user_id: str):
        """Remove a user from the cache (on disconnect)"""
        if not self.redis:
            return
        
        try:
            async with self.redis.pipeline() as pipe:
                await pipe.delete(f"{self.LOCATION_PREFIX}{user_id}")
                await pipe.zrem("geo:users", user_id)
                await pipe.execute()
        except Exception as e:
            logger.error(f"Redis remove_user error: {e}")


# Global cache instance
location_cache = RedisLocationCache()
