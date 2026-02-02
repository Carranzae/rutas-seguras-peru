"""
Ruta Segura Perú - Health Monitoring System
Comprehensive health checks for all system components
"""
import asyncio
import time
import psutil
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
from loguru import logger


class HealthStatus(Enum):
    """Health status levels"""
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class ComponentHealth:
    """Health status of a component"""
    name: str
    status: HealthStatus
    latency_ms: Optional[float]
    message: str
    details: Dict[str, Any]
    checked_at: str


class HealthMonitor:
    """
    System health monitoring.
    
    Monitors:
    - Database connectivity
    - Redis/Cache availability
    - External APIs (Claude, Vonage, IziPay)
    - System resources (CPU, Memory, Disk)
    - Application metrics
    """
    
    def __init__(self):
        self._last_check = None
        self._components_cache: Dict[str, ComponentHealth] = {}
        self._check_interval = 30  # seconds
    
    async def check_database(self) -> ComponentHealth:
        """Check database connectivity"""
        start = time.time()
        try:
            from app.database import engine
            from sqlalchemy import text
            
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                result.fetchone()
            
            latency = (time.time() - start) * 1000
            
            return ComponentHealth(
                name="database",
                status=HealthStatus.HEALTHY if latency < 100 else HealthStatus.DEGRADED,
                latency_ms=latency,
                message="PostgreSQL connected",
                details={"type": "postgresql"},
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as e:
            return ComponentHealth(
                name="database",
                status=HealthStatus.UNHEALTHY,
                latency_ms=None,
                message=f"Database error: {str(e)}",
                details={"error": str(e)},
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
    
    async def check_cache(self) -> ComponentHealth:
        """Check cache system"""
        start = time.time()
        try:
            from app.core.cache import app_cache
            
            # Test set and get
            test_key = "_health_check_"
            app_cache.set(test_key, "ok", ttl=10)
            value = app_cache.get(test_key)
            app_cache.delete(test_key)
            
            latency = (time.time() - start) * 1000
            
            if value == "ok":
                return ComponentHealth(
                    name="cache",
                    status=HealthStatus.HEALTHY,
                    latency_ms=latency,
                    message="In-memory cache operational",
                    details=app_cache.stats,
                    checked_at=datetime.now(timezone.utc).isoformat(),
                )
            else:
                return ComponentHealth(
                    name="cache",
                    status=HealthStatus.DEGRADED,
                    latency_ms=latency,
                    message="Cache read/write mismatch",
                    details={},
                    checked_at=datetime.now(timezone.utc).isoformat(),
                )
        except Exception as e:
            return ComponentHealth(
                name="cache",
                status=HealthStatus.UNHEALTHY,
                latency_ms=None,
                message=f"Cache error: {str(e)}",
                details={"error": str(e)},
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
    
    async def check_external_api(self, name: str, url: str) -> ComponentHealth:
        """Check external API availability"""
        start = time.time()
        try:
            import httpx
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.head(url)
            
            latency = (time.time() - start) * 1000
            
            if response.status_code < 400:
                return ComponentHealth(
                    name=name,
                    status=HealthStatus.HEALTHY if latency < 500 else HealthStatus.DEGRADED,
                    latency_ms=latency,
                    message=f"API reachable (HTTP {response.status_code})",
                    details={"url": url, "status_code": response.status_code},
                    checked_at=datetime.now(timezone.utc).isoformat(),
                )
            else:
                return ComponentHealth(
                    name=name,
                    status=HealthStatus.DEGRADED,
                    latency_ms=latency,
                    message=f"API returned error (HTTP {response.status_code})",
                    details={"url": url, "status_code": response.status_code},
                    checked_at=datetime.now(timezone.utc).isoformat(),
                )
        except Exception as e:
            return ComponentHealth(
                name=name,
                status=HealthStatus.UNHEALTHY,
                latency_ms=None,
                message=f"API unreachable: {str(e)}",
                details={"url": url, "error": str(e)},
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
    
    def check_system_resources(self) -> ComponentHealth:
        """Check system resources (CPU, Memory, Disk)"""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            
            # Thresholds
            cpu_critical = cpu_percent > 90
            memory_critical = memory.percent > 90
            disk_critical = disk.percent > 90
            
            if cpu_critical or memory_critical or disk_critical:
                status = HealthStatus.UNHEALTHY
            elif cpu_percent > 70 or memory.percent > 80 or disk.percent > 80:
                status = HealthStatus.DEGRADED
            else:
                status = HealthStatus.HEALTHY
            
            return ComponentHealth(
                name="system",
                status=status,
                latency_ms=None,
                message=f"CPU: {cpu_percent:.1f}%, RAM: {memory.percent:.1f}%, Disk: {disk.percent:.1f}%",
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free / (1024**3),
                },
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as e:
            return ComponentHealth(
                name="system",
                status=HealthStatus.UNKNOWN,
                latency_ms=None,
                message=f"Could not check system: {str(e)}",
                details={"error": str(e)},
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
    
    def check_websocket(self) -> ComponentHealth:
        """Check WebSocket status"""
        try:
            from app.core.websocket_manager import manager
            
            stats = manager.get_stats()
            
            return ComponentHealth(
                name="websocket",
                status=HealthStatus.HEALTHY,
                latency_ms=None,
                message=f"WebSocket active: {stats.get('total_connections', 0)} connections",
                details=stats,
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as e:
            return ComponentHealth(
                name="websocket",
                status=HealthStatus.UNKNOWN,
                latency_ms=None,
                message=f"Could not check WebSocket: {str(e)}",
                details={"error": str(e)},
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
    
    async def full_health_check(self) -> Dict[str, Any]:
        """Run all health checks"""
        start = time.time()
        
        # Run checks concurrently
        checks = await asyncio.gather(
            self.check_database(),
            self.check_cache(),
            self.check_external_api("anthropic", "https://api.anthropic.com"),
            return_exceptions=True,
        )
        
        # Add sync checks
        checks.append(self.check_system_resources())
        checks.append(self.check_websocket())
        
        # Process results
        components = {}
        overall_status = HealthStatus.HEALTHY
        
        for check in checks:
            if isinstance(check, Exception):
                logger.error(f"Health check error: {check}")
                continue
            
            components[check.name] = {
                "status": check.status.value,
                "latency_ms": check.latency_ms,
                "message": check.message,
                "details": check.details,
            }
            
            # Overall status is worst of all
            if check.status == HealthStatus.UNHEALTHY:
                overall_status = HealthStatus.UNHEALTHY
            elif check.status == HealthStatus.DEGRADED and overall_status != HealthStatus.UNHEALTHY:
                overall_status = HealthStatus.DEGRADED
        
        total_time = (time.time() - start) * 1000
        self._last_check = datetime.now(timezone.utc)
        
        return {
            "status": overall_status.value,
            "timestamp": self._last_check.isoformat(),
            "check_duration_ms": total_time,
            "components": components,
            "version": "1.0.0",
        }
    
    def quick_check(self) -> Dict[str, str]:
        """Quick liveness check"""
        return {
            "status": "alive",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# Global health monitor
health_monitor = HealthMonitor()
