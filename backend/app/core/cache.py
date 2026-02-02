"""
Ruta Segura Perú - Intelligent Cache System
LRU Cache with TTL dynamics and intelligent invalidation
"""
import asyncio
import time
from typing import Any, Optional, Dict, Callable, TypeVar, Generic
from dataclasses import dataclass, field
from collections import OrderedDict
from functools import wraps
from enum import Enum
import hashlib
import json


class CachePriority(Enum):
    """Cache priority levels determine TTL and eviction order"""
    CRITICAL = "critical"    # Emergency data, safety info - Long TTL
    HIGH = "high"           # User sessions, active tours - Medium TTL
    NORMAL = "normal"       # General data - Standard TTL
    LOW = "low"             # Metrics, logs - Short TTL


@dataclass
class CacheEntry:
    """Individual cache entry with metadata"""
    value: Any
    created_at: float
    expires_at: float
    priority: CachePriority
    hits: int = 0
    last_accessed: float = field(default_factory=time.time)
    
    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at
    
    @property
    def ttl_remaining(self) -> float:
        return max(0, self.expires_at - time.time())
    
    def touch(self):
        """Update last accessed time and increment hits"""
        self.last_accessed = time.time()
        self.hits += 1


class SmartCache:
    """
    Intelligent LRU cache with:
    - Dynamic TTL based on priority
    - Automatic eviction of expired entries
    - Cache statistics
    - Async support
    """
    
    # Default TTLs in seconds by priority
    DEFAULT_TTLS = {
        CachePriority.CRITICAL: 3600,    # 1 hour
        CachePriority.HIGH: 900,         # 15 minutes
        CachePriority.NORMAL: 300,       # 5 minutes
        CachePriority.LOW: 60,           # 1 minute
    }
    
    def __init__(
        self,
        max_size: int = 1000,
        default_ttl: int = 300,
        cleanup_interval: int = 60,
    ):
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._cleanup_interval = cleanup_interval
        
        # Statistics
        self._stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "expirations": 0,
        }
        
        # Start cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate a unique cache key from arguments"""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(
        self,
        key: str,
        default: Any = None,
    ) -> Any:
        """Get value from cache"""
        entry = self._cache.get(key)
        
        if entry is None:
            self._stats["misses"] += 1
            return default
        
        if entry.is_expired:
            del self._cache[key]
            self._stats["expirations"] += 1
            self._stats["misses"] += 1
            return default
        
        # Move to end (most recently used)
        self._cache.move_to_end(key)
        entry.touch()
        self._stats["hits"] += 1
        
        return entry.value
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        priority: CachePriority = CachePriority.NORMAL,
    ) -> None:
        """Set value in cache"""
        # Determine TTL
        if ttl is None:
            ttl = self.DEFAULT_TTLS.get(priority, self._default_ttl)
        
        # Evict if at capacity
        while len(self._cache) >= self._max_size:
            self._evict_one()
        
        # Create entry
        now = time.time()
        entry = CacheEntry(
            value=value,
            created_at=now,
            expires_at=now + ttl,
            priority=priority,
        )
        
        # Add to cache
        self._cache[key] = entry
        self._cache.move_to_end(key)
    
    def delete(self, key: str) -> bool:
        """Delete entry from cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching a pattern"""
        keys_to_delete = [k for k in self._cache.keys() if pattern in k]
        for key in keys_to_delete:
            del self._cache[key]
        return len(keys_to_delete)
    
    def _evict_one(self) -> None:
        """Evict one entry (LRU or lowest priority)"""
        if not self._cache:
            return
        
        # First evict expired
        for key, entry in list(self._cache.items()):
            if entry.is_expired:
                del self._cache[key]
                self._stats["expirations"] += 1
                return
        
        # Then evict by priority (lowest first) then by LRU
        priorities = [CachePriority.LOW, CachePriority.NORMAL, CachePriority.HIGH, CachePriority.CRITICAL]
        
        for priority in priorities:
            for key, entry in list(self._cache.items()):
                if entry.priority == priority:
                    del self._cache[key]
                    self._stats["evictions"] += 1
                    return
    
    def cleanup(self) -> int:
        """Remove all expired entries"""
        expired_keys = [k for k, v in self._cache.items() if v.is_expired]
        for key in expired_keys:
            del self._cache[key]
        self._stats["expirations"] += len(expired_keys)
        return len(expired_keys)
    
    async def start_cleanup_loop(self):
        """Start background cleanup task"""
        async def cleanup_loop():
            while True:
                await asyncio.sleep(self._cleanup_interval)
                self.cleanup()
        
        self._cleanup_task = asyncio.create_task(cleanup_loop())
    
    def stop_cleanup_loop(self):
        """Stop background cleanup task"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
    
    @property
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self._stats["hits"] + self._stats["misses"]
        hit_rate = self._stats["hits"] / total_requests if total_requests > 0 else 0
        
        return {
            **self._stats,
            "size": len(self._cache),
            "max_size": self._max_size,
            "hit_rate": f"{hit_rate:.2%}",
            "memory_entries": len(self._cache),
        }
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()


# Decorator for caching function results
T = TypeVar('T')


def cached(
    cache: SmartCache,
    ttl: Optional[int] = None,
    priority: CachePriority = CachePriority.NORMAL,
    key_prefix: str = "",
):
    """
    Decorator to cache function results.
    
    Usage:
        @cached(cache, ttl=300, priority=CachePriority.HIGH)
        async def get_user(user_id: str):
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            # Generate cache key
            key = f"{key_prefix}{func.__name__}:{cache._generate_key(*args, **kwargs)}"
            
            # Try to get from cache
            result = cache.get(key)
            if result is not None:
                return result
            
            # Call function
            result = await func(*args, **kwargs)
            
            # Store in cache
            cache.set(key, result, ttl=ttl, priority=priority)
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            # Generate cache key
            key = f"{key_prefix}{func.__name__}:{cache._generate_key(*args, **kwargs)}"
            
            # Try to get from cache
            result = cache.get(key)
            if result is not None:
                return result
            
            # Call function
            result = func(*args, **kwargs)
            
            # Store in cache
            cache.set(key, result, ttl=ttl, priority=priority)
            
            return result
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Global cache instance
app_cache = SmartCache(max_size=5000, default_ttl=300)


# Specialized caches
user_cache = SmartCache(max_size=1000, default_ttl=900)      # 15 min
location_cache = SmartCache(max_size=10000, default_ttl=30)  # 30 sec
analytics_cache = SmartCache(max_size=500, default_ttl=60)   # 1 min
