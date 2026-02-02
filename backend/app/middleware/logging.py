"""
Ruta Segura Perú - Logging Middleware
Request logging with Loguru
"""
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging all HTTP requests."""
    
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        
        # Log request
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} - Started"
        )
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = round((time.time() - start_time) * 1000, 2)
            
            # Log response
            log_func = logger.info if response.status_code < 400 else logger.warning
            log_func(
                f"[{request_id}] {request.method} {request.url.path} - "
                f"{response.status_code} ({duration}ms)"
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} - "
                f"Error: {str(e)} ({duration}ms)"
            )
            raise
