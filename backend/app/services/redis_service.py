"""
Ruta Segura Perú - Redis Service
Token blacklist, caching, and real-time data
"""
import asyncio
from datetime import timedelta
from typing import Optional, Any
import json

import redis.asyncio as redis
from loguru import logger

from app.config import settings


class RedisService:
    """
    Redis service for token blacklist and caching.
    Implements secure logout via JWT blacklisting.
    """
    
    _instance: Optional["RedisService"] = None
    _pool: Optional[redis.ConnectionPool] = None
    _client: Optional[redis.Redis] = None
    
    # Key prefixes
    TOKEN_BLACKLIST_PREFIX = "blacklist:token:"
    RATE_LIMIT_PREFIX = "ratelimit:"
    COERCION_ALERT_PREFIX = "coercion:alert:"
    TRACKING_CACHE_PREFIX = "tracking:"
    
    def __new__(cls) -> "RedisService":
        """Singleton pattern for Redis connection."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def connect(self) -> None:
        """Initialize Redis connection pool."""
        if self._client is not None:
            return
        
        try:
            self._pool = redis.ConnectionPool.from_url(
                settings.redis_url,
                decode_responses=True,
                max_connections=20,
            )
            self._client = redis.Redis(connection_pool=self._pool)
            
            # Test connection
            await self._client.ping()
            logger.info(f"Redis connected successfully: {settings.redis_url}")
            
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Operating in degraded mode.")
            self._client = None
    
    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            self._client = None
        if self._pool:
            await self._pool.disconnect()
            self._pool = None
        logger.info("Redis disconnected")
    
    @property
    def is_connected(self) -> bool:
        """Check if Redis is available."""
        return self._client is not None
    
    # =====================================
    # JWT TOKEN BLACKLIST
    # =====================================
    
    async def blacklist_token(
        self, 
        token_jti: str, 
        expires_in: int = None
    ) -> bool:
        """
        Add JWT token to blacklist.
        
        Args:
            token_jti: JWT token ID (jti claim)
            expires_in: Seconds until expiry (defaults to token TTL)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_connected:
            logger.warning("Redis unavailable - token blacklist skipped")
            return False
        
        try:
            key = f"{self.TOKEN_BLACKLIST_PREFIX}{token_jti}"
            ttl = expires_in or (settings.access_token_expire_minutes * 60)
            
            await self._client.setex(key, ttl, "blacklisted")
            logger.info(f"Token blacklisted: {token_jti[:8]}... (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False
    
    async def is_token_blacklisted(self, token_jti: str) -> bool:
        """
        Check if JWT token is in blacklist.
        
        Args:
            token_jti: JWT token ID (jti claim)
        
        Returns:
            True if blacklisted, False otherwise
        """
        if not self.is_connected:
            # In degraded mode, assume not blacklisted
            return False
        
        try:
            key = f"{self.TOKEN_BLACKLIST_PREFIX}{token_jti}"
            return await self._client.exists(key) > 0
            
        except Exception as e:
            logger.error(f"Failed to check token blacklist: {e}")
            return False
    
    async def blacklist_all_user_tokens(
        self, 
        user_id: str, 
        expires_in: int = None
    ) -> bool:
        """
        Blacklist all tokens for a user (force logout all devices).
        
        We store a "logout timestamp" - any token issued before this
        timestamp is considered invalid.
        """
        if not self.is_connected:
            return False
        
        try:
            import time
            key = f"user:logout:{user_id}"
            ttl = expires_in or (settings.refresh_token_expire_days * 86400)
            
            await self._client.setex(key, ttl, str(int(time.time())))
            logger.info(f"All tokens invalidated for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to invalidate user tokens: {e}")
            return False
    
    async def is_token_issued_before_logout(
        self, 
        user_id: str, 
        token_issued_at: int
    ) -> bool:
        """
        Check if token was issued before user's last logout.
        
        Args:
            user_id: User ID
            token_issued_at: Token's "iat" claim (Unix timestamp)
        
        Returns:
            True if token was issued before logout (invalid), False otherwise
        """
        if not self.is_connected:
            return False
        
        try:
            key = f"user:logout:{user_id}"
            logout_time = await self._client.get(key)
            
            if logout_time is None:
                return False
            
            return token_issued_at < int(logout_time)
            
        except Exception as e:
            logger.error(f"Failed to check token validity: {e}")
            return False
    
    # =====================================
    # COERCION ALERT TRACKING
    # =====================================
    
    async def record_coercion_alert(
        self, 
        user_id: str, 
        location: dict,
        metadata: dict = None
    ) -> str:
        """
        Record a coercion (silent alarm) alert.
        
        Returns:
            Alert ID for tracking
        """
        if not self.is_connected:
            logger.error("Redis unavailable - coercion alert not recorded!")
            return None
        
        try:
            import uuid
            import time
            
            alert_id = str(uuid.uuid4())
            key = f"{self.COERCION_ALERT_PREFIX}{alert_id}"
            
            alert_data = {
                "user_id": user_id,
                "location": location,
                "timestamp": int(time.time()),
                "status": "active",
                "metadata": metadata or {},
            }
            
            # Store for 72 hours
            await self._client.setex(key, 72 * 3600, json.dumps(alert_data))
            
            # Also add to active alerts list
            await self._client.lpush("coercion:active", alert_id)
            
            logger.critical(f"🚨 COERCION ALERT RECORDED: {alert_id} for user {user_id}")
            return alert_id
            
        except Exception as e:
            logger.error(f"Failed to record coercion alert: {e}")
            return None
    
    async def get_active_coercion_alerts(self) -> list:
        """Get all active coercion alerts for SuperAdmin dashboard."""
        if not self.is_connected:
            return []
        
        try:
            alert_ids = await self._client.lrange("coercion:active", 0, -1)
            alerts = []
            
            for alert_id in alert_ids:
                key = f"{self.COERCION_ALERT_PREFIX}{alert_id}"
                data = await self._client.get(key)
                if data:
                    alert = json.loads(data)
                    alert["id"] = alert_id
                    alerts.append(alert)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Failed to get coercion alerts: {e}")
            return []
    
    # =====================================
    # GENERIC CACHE OPERATIONS
    # =====================================
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        expires_in: int = 300
    ) -> bool:
        """Set a cached value."""
        if not self.is_connected:
            return False
        
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await self._client.setex(key, expires_in, value)
            return True
        except Exception as e:
            logger.error(f"Redis set failed: {e}")
            return False
    
    async def get(self, key: str) -> Optional[str]:
        """Get a cached value."""
        if not self.is_connected:
            return None
        
        try:
            return await self._client.get(key)
        except Exception as e:
            logger.error(f"Redis get failed: {e}")
            return None
    
    async def delete(self, key: str) -> bool:
        """Delete a cached value."""
        if not self.is_connected:
            return False
        
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete failed: {e}")
            return False


# Singleton instance
redis_service = RedisService()
