"""
Ruta Segura Perú - Auth Router
Authentication endpoints with rate limiting and secure logout
"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.database import get_db
from app.schemas.auth import (
    TokenResponse,
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.redis_service import redis_service
from app.core.dependencies import CurrentUser, get_current_token_payload
from app.middleware import limiter, login_limit

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account. Default role is tourist.",
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    service = AuthService(db)
    user = await service.register(data)
    
    # Notify all connected admins about new registration
    from app.core.websocket_manager import manager
    await manager.broadcast_new_user(
        user_id=str(user.id),
        email=user.email,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        full_name=user.full_name,
        phone=user.phone,
    )
    
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate with email and password to get access tokens. Rate limited to 5 attempts/minute.",
)
@limiter.limit(login_limit)
async def login(
    request: Request,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate and get access tokens.
    
    Rate limited to prevent brute force attacks:
    - 5 attempts per minute per IP address
    - After 5 failures, wait 1 minute before retrying
    """
    service = AuthService(db)
    logger.info(f"Login attempt for: {data.email} from IP: {request.client.host}")
    return await service.login(data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh tokens",
    description="Get new access token using refresh token.",
)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token."""
    service = AuthService(db)
    return await service.refresh_tokens(data.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's profile.",
)
async def get_me(current_user: CurrentUser):
    """Get current authenticated user."""
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (invalidate token)",
    description="Invalidate current access token. Token will be rejected on future requests.",
)
async def logout(
    token_payload: dict = Depends(get_current_token_payload),
):
    """
    Logout and invalidate current token.
    
    The token's JTI is added to Redis blacklist.
    Any subsequent requests with this token will be rejected.
    """
    jti = token_payload.get("jti")
    exp = token_payload.get("exp", 0)
    user_id = token_payload.get("sub")
    
    if jti:
        import time
        # Calculate remaining TTL
        remaining_ttl = max(0, exp - int(time.time()))
        
        await redis_service.blacklist_token(jti, remaining_ttl)
        logger.info(f"User {user_id} logged out, token {jti[:8]}... blacklisted")
    
    return None


@router.post(
    "/logout-all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout all devices",
    description="Invalidate all tokens for current user across all devices.",
)
async def logout_all_devices(
    current_user: CurrentUser,
    token_payload: dict = Depends(get_current_token_payload),
):
    """
    Logout from all devices.
    
    All tokens issued before this moment will be rejected.
    User must login again on all devices.
    """
    user_id = str(current_user.id)
    
    await redis_service.blacklist_all_user_tokens(user_id)
    logger.info(f"User {user_id} logged out from all devices")
    
    return None
