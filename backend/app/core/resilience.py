"""
Ruta Segura Perú - Resilience Patterns
Circuit Breaker, Retry with Exponential Backoff, Fallback
"""
import asyncio
import time
from typing import Callable, Any, Optional, TypeVar, Generic
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
import random
from loguru import logger


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"       # Normal operation
    OPEN = "open"           # Failing, reject calls
    HALF_OPEN = "half_open" # Testing if service recovered


@dataclass
class CircuitStats:
    """Statistics for circuit breaker"""
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    rejected_calls: int = 0
    last_failure_time: Optional[float] = None
    consecutive_failures: int = 0
    consecutive_successes: int = 0


class CircuitBreaker:
    """
    Circuit Breaker pattern implementation.
    
    Prevents cascading failures by:
    1. Tracking failure rates
    2. Opening circuit when threshold reached
    3. Allowing recovery attempts after timeout
    
    States:
    - CLOSED: Normal operation, track failures
    - OPEN: Reject all calls, wait for reset timeout
    - HALF_OPEN: Allow one test call to check recovery
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        reset_timeout: float = 30.0,
        half_open_max_calls: int = 1,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.reset_timeout = reset_timeout
        self.half_open_max_calls = half_open_max_calls
        
        self._state = CircuitState.CLOSED
        self._stats = CircuitStats()
        self._last_state_change = time.time()
        self._half_open_calls = 0
    
    @property
    def state(self) -> CircuitState:
        """Get current state, auto-transition to HALF_OPEN if timeout expired"""
        if self._state == CircuitState.OPEN:
            if time.time() - self._last_state_change >= self.reset_timeout:
                self._transition_to(CircuitState.HALF_OPEN)
        return self._state
    
    @property
    def stats(self) -> CircuitStats:
        return self._stats
    
    def _transition_to(self, new_state: CircuitState) -> None:
        """Transition to new state"""
        old_state = self._state
        self._state = new_state
        self._last_state_change = time.time()
        
        if new_state == CircuitState.HALF_OPEN:
            self._half_open_calls = 0
        
        logger.info(f"Circuit '{self.name}' transitioned: {old_state.value} -> {new_state.value}")
    
    def allow_request(self) -> bool:
        """Check if request should be allowed"""
        current_state = self.state  # This may trigger OPEN -> HALF_OPEN
        
        if current_state == CircuitState.CLOSED:
            return True
        
        if current_state == CircuitState.OPEN:
            self._stats.rejected_calls += 1
            return False
        
        # HALF_OPEN: allow limited calls
        if self._half_open_calls < self.half_open_max_calls:
            self._half_open_calls += 1
            return True
        
        self._stats.rejected_calls += 1
        return False
    
    def record_success(self) -> None:
        """Record successful call"""
        self._stats.total_calls += 1
        self._stats.successful_calls += 1
        self._stats.consecutive_successes += 1
        self._stats.consecutive_failures = 0
        
        if self._state == CircuitState.HALF_OPEN:
            if self._stats.consecutive_successes >= self.success_threshold:
                self._transition_to(CircuitState.CLOSED)
    
    def record_failure(self) -> None:
        """Record failed call"""
        self._stats.total_calls += 1
        self._stats.failed_calls += 1
        self._stats.consecutive_failures += 1
        self._stats.consecutive_successes = 0
        self._stats.last_failure_time = time.time()
        
        if self._state == CircuitState.HALF_OPEN:
            self._transition_to(CircuitState.OPEN)
        elif self._state == CircuitState.CLOSED:
            if self._stats.consecutive_failures >= self.failure_threshold:
                self._transition_to(CircuitState.OPEN)
    
    def reset(self) -> None:
        """Reset circuit breaker to initial state"""
        self._state = CircuitState.CLOSED
        self._stats = CircuitStats()
        self._last_state_change = time.time()
        self._half_open_calls = 0


class CircuitOpenError(Exception):
    """Raised when circuit is open"""
    pass


def with_circuit_breaker(
    circuit: CircuitBreaker,
    fallback: Optional[Callable[..., Any]] = None,
):
    """
    Decorator to wrap function with circuit breaker.
    
    Usage:
        @with_circuit_breaker(api_circuit, fallback=get_cached_data)
        async def call_external_api():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            if not circuit.allow_request():
                if fallback:
                    return await fallback(*args, **kwargs) if asyncio.iscoroutinefunction(fallback) else fallback(*args, **kwargs)
                raise CircuitOpenError(f"Circuit '{circuit.name}' is OPEN")
            
            try:
                result = await func(*args, **kwargs)
                circuit.record_success()
                return result
            except Exception as e:
                circuit.record_failure()
                if fallback:
                    return await fallback(*args, **kwargs) if asyncio.iscoroutinefunction(fallback) else fallback(*args, **kwargs)
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            if not circuit.allow_request():
                if fallback:
                    return fallback(*args, **kwargs)
                raise CircuitOpenError(f"Circuit '{circuit.name}' is OPEN")
            
            try:
                result = func(*args, **kwargs)
                circuit.record_success()
                return result
            except Exception:
                circuit.record_failure()
                if fallback:
                    return fallback(*args, **kwargs)
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: tuple = (Exception,),
):
    """
    Retry function with exponential backoff.
    
    Delay formula: min(max_delay, base_delay * (exponential_base ^ attempt))
    With optional jitter: delay * random(0.5, 1.5)
    """
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            if asyncio.iscoroutinefunction(func):
                return await func()
            return func()
        except retryable_exceptions as e:
            last_exception = e
            
            if attempt == max_retries:
                break
            
            # Calculate delay
            delay = min(max_delay, base_delay * (exponential_base ** attempt))
            
            if jitter:
                delay *= random.uniform(0.5, 1.5)
            
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {delay:.2f}s - Error: {e}")
            await asyncio.sleep(delay)
    
    raise last_exception


# Global circuit breakers for external services
claude_circuit = CircuitBreaker("claude_api", failure_threshold=3, reset_timeout=60)
vonage_circuit = CircuitBreaker("vonage_api", failure_threshold=5, reset_timeout=120)
izipay_circuit = CircuitBreaker("izipay_api", failure_threshold=3, reset_timeout=60)
