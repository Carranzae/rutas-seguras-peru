"""
Ruta Segura Perú - JWT Blacklist Middleware
Intercepts requests to check if token has been invalidated
"""
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from loguru import logger

from app.config import settings
from app.services.redis_service import redis_service


class JWTBlacklistMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check if JWT tokens are blacklisted.
    Rejected tokens receive 401 before reaching any route.
    """
    
    # Paths that don't require token validation
    EXCLUDED_PATHS = {
        "/",
        "/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
        "/api/v1/tracking/",  # Public tracking pages
    }
    
    async def dispatch(
        self, 
        request: Request, 
        call_next: Callable
    ) -> Response:
        """Check token blacklist before processing request."""
        
        # Skip excluded paths
        path = request.url.path
        if self._is_excluded_path(path):
            return await call_next(request)
        
        # Skip if no Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return await call_next(request)
        
        token = auth_header.split(" ")[1]
        
        try:
            # Decode token to get claims
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
                options={"verify_exp": False}  # We check exp separately
            )
            
            jti = payload.get("jti")
            user_id = payload.get("sub")
            iat = payload.get("iat", 0)
            
            # Check if token is blacklisted
            if jti and await redis_service.is_token_blacklisted(jti):
                logger.warning(f"Blacklisted token used: {jti[:8]}... from IP {request.client.host}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Token has been invalidated"}
                )
            
            # Check if user has done a global logout
            if user_id and await redis_service.is_token_issued_before_logout(user_id, iat):
                logger.warning(f"Pre-logout token used by user {user_id}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Session expired. Please login again."}
                )
            
        except JWTError as e:
            # Let the actual auth route handle invalid tokens
            logger.debug(f"JWT decode failed in blacklist middleware: {e}")
            pass
        except Exception as e:
            logger.error(f"Blacklist middleware error: {e}")
            pass
        
        return await call_next(request)
    
    def _is_excluded_path(self, path: str) -> bool:
        """Check if path should skip blacklist check."""
        for excluded in self.EXCLUDED_PATHS:
            if path.startswith(excluded):
                return True
        return False
