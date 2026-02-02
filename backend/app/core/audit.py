"""
Ruta Segura Perú - Audit Logging System
Complete audit trail for security and compliance
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from dataclasses import dataclass, asdict
from enum import Enum
import json
from loguru import logger
from functools import wraps


class AuditAction(Enum):
    """Types of auditable actions"""
    # Authentication
    LOGIN = "auth.login"
    LOGOUT = "auth.logout"
    LOGIN_FAILED = "auth.login_failed"
    PASSWORD_CHANGE = "auth.password_change"
    TOKEN_REFRESH = "auth.token_refresh"
    
    # User management
    USER_CREATE = "user.create"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_VERIFY = "user.verify"
    USER_SUSPEND = "user.suspend"
    
    # Agency management
    AGENCY_CREATE = "agency.create"
    AGENCY_UPDATE = "agency.update"
    AGENCY_VERIFY = "agency.verify"
    AGENCY_REJECT = "agency.reject"
    
    # Guide management
    GUIDE_CREATE = "guide.create"
    GUIDE_VERIFY = "guide.verify"
    GUIDE_REJECT = "guide.reject"
    
    # Tour operations
    TOUR_CREATE = "tour.create"
    TOUR_UPDATE = "tour.update"
    TOUR_START = "tour.start"
    TOUR_END = "tour.end"
    TOUR_CANCEL = "tour.cancel"
    
    # Booking operations
    BOOKING_CREATE = "booking.create"
    BOOKING_CONFIRM = "booking.confirm"
    BOOKING_CANCEL = "booking.cancel"
    
    # Payment operations
    PAYMENT_INITIATE = "payment.initiate"
    PAYMENT_COMPLETE = "payment.complete"
    PAYMENT_REFUND = "payment.refund"
    PAYMENT_FAILED = "payment.failed"
    
    # Emergency operations
    SOS_TRIGGER = "emergency.sos_trigger"
    SOS_RESPOND = "emergency.sos_respond"
    SOS_RESOLVE = "emergency.sos_resolve"
    
    # Admin operations
    ADMIN_CONFIG_CHANGE = "admin.config_change"
    ADMIN_DATA_EXPORT = "admin.data_export"
    ADMIN_IMPERSONATE = "admin.impersonate"
    
    # System operations
    SYSTEM_ERROR = "system.error"
    SYSTEM_STARTUP = "system.startup"
    SYSTEM_SHUTDOWN = "system.shutdown"


class AuditSeverity(Enum):
    """Severity levels for audit events"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    """Complete audit event record"""
    id: str
    timestamp: str
    action: str
    severity: str
    actor_id: Optional[str]
    actor_type: Optional[str]  # user, system, api_client
    actor_ip: Optional[str]
    target_type: Optional[str]
    target_id: Optional[str]
    description: str
    metadata: Dict[str, Any]
    success: bool
    duration_ms: Optional[float]
    request_id: Optional[str]
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), default=str)


class AuditLogger:
    """
    Audit logging system for security and compliance.
    
    Features:
    - Structured logging with JSON support
    - Multiple output destinations
    - Correlation IDs for request tracing
    - GDPR-compliant data handling
    """
    
    def __init__(self):
        self._events: list[AuditEvent] = []
        self._max_memory_events = 1000
        
        # Configure loguru for audit logs
        logger.add(
            "logs/audit.log",
            format="{message}",
            rotation="1 day",
            retention="90 days",
            compression="gz",
            filter=lambda record: "audit" in record["extra"],
            serialize=True,
        )
    
    def log(
        self,
        action: AuditAction,
        description: str,
        actor_id: Optional[str] = None,
        actor_type: str = "user",
        actor_ip: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        success: bool = True,
        duration_ms: Optional[float] = None,
        request_id: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.INFO,
    ) -> AuditEvent:
        """Log an audit event"""
        
        # Redact sensitive data from metadata
        safe_metadata = self._redact_sensitive(metadata or {})
        
        event = AuditEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            action=action.value,
            severity=severity.value,
            actor_id=actor_id,
            actor_type=actor_type,
            actor_ip=self._hash_ip(actor_ip) if actor_ip else None,
            target_type=target_type,
            target_id=target_id,
            description=description,
            metadata=safe_metadata,
            success=success,
            duration_ms=duration_ms,
            request_id=request_id,
        )
        
        # Store in memory (circular buffer)
        self._events.append(event)
        if len(self._events) > self._max_memory_events:
            self._events.pop(0)
        
        # Log to file
        log_level = {
            AuditSeverity.DEBUG: "DEBUG",
            AuditSeverity.INFO: "INFO",
            AuditSeverity.WARNING: "WARNING",
            AuditSeverity.CRITICAL: "CRITICAL",
        }.get(severity, "INFO")
        
        logger.bind(audit=True).log(log_level, event.to_json())
        
        return event
    
    def _redact_sensitive(self, data: Dict) -> Dict:
        """Redact sensitive fields from metadata"""
        sensitive_keys = [
            "password", "token", "secret", "api_key", "credit_card",
            "cvv", "pin", "ssn", "dni", "ruc",
        ]
        
        redacted = {}
        for key, value in data.items():
            key_lower = key.lower()
            if any(s in key_lower for s in sensitive_keys):
                redacted[key] = "[REDACTED]"
            elif isinstance(value, dict):
                redacted[key] = self._redact_sensitive(value)
            else:
                redacted[key] = value
        
        return redacted
    
    def _hash_ip(self, ip: str) -> str:
        """Hash IP for privacy compliance (GDPR)"""
        import hashlib
        # Keep last octet for debugging, hash the rest
        parts = ip.split(".")
        if len(parts) == 4:
            hashed = hashlib.sha256(".".join(parts[:3]).encode()).hexdigest()[:8]
            return f"{hashed}.{parts[3]}"
        return ip
    
    def get_recent_events(
        self,
        limit: int = 100,
        action_filter: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> list[AuditEvent]:
        """Get recent audit events with optional filters"""
        events = self._events.copy()
        
        if action_filter:
            events = [e for e in events if action_filter in e.action]
        
        if actor_id:
            events = [e for e in events if e.actor_id == actor_id]
        
        return events[-limit:]
    
    def get_stats(self) -> Dict:
        """Get audit statistics"""
        from collections import Counter
        
        if not self._events:
            return {"total": 0}
        
        actions = Counter(e.action for e in self._events)
        severities = Counter(e.severity for e in self._events)
        success_rate = sum(1 for e in self._events if e.success) / len(self._events)
        
        return {
            "total": len(self._events),
            "success_rate": f"{success_rate:.2%}",
            "by_action": dict(actions.most_common(10)),
            "by_severity": dict(severities),
        }


# Decorator for auditing function calls
def audited(
    action: AuditAction,
    target_type: Optional[str] = None,
    severity: AuditSeverity = AuditSeverity.INFO,
):
    """
    Decorator to automatically audit function calls.
    
    Usage:
        @audited(AuditAction.TOUR_CREATE, target_type="tour")
        async def create_tour(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = __import__("time").time()
            
            try:
                result = await func(*args, **kwargs)
                
                duration = (__import__("time").time() - start_time) * 1000
                audit_log.log(
                    action=action,
                    description=f"{func.__name__} executed successfully",
                    target_type=target_type,
                    metadata={"function": func.__name__},
                    success=True,
                    duration_ms=duration,
                    severity=severity,
                )
                
                return result
            except Exception as e:
                duration = (__import__("time").time() - start_time) * 1000
                audit_log.log(
                    action=action,
                    description=f"{func.__name__} failed: {str(e)}",
                    target_type=target_type,
                    metadata={"function": func.__name__, "error": str(e)},
                    success=False,
                    duration_ms=duration,
                    severity=AuditSeverity.WARNING,
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = __import__("time").time()
            
            try:
                result = func(*args, **kwargs)
                
                duration = (__import__("time").time() - start_time) * 1000
                audit_log.log(
                    action=action,
                    description=f"{func.__name__} executed successfully",
                    target_type=target_type,
                    metadata={"function": func.__name__},
                    success=True,
                    duration_ms=duration,
                    severity=severity,
                )
                
                return result
            except Exception as e:
                duration = (__import__("time").time() - start_time) * 1000
                audit_log.log(
                    action=action,
                    description=f"{func.__name__} failed: {str(e)}",
                    target_type=target_type,
                    metadata={"function": func.__name__, "error": str(e)},
                    success=False,
                    duration_ms=duration,
                    severity=AuditSeverity.WARNING,
                )
                raise
        
        if __import__("asyncio").iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Global audit logger
audit_log = AuditLogger()
