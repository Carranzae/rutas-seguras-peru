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


# ============================================
# ADMIN SEED ENDPOINT (For Railway deployment)
# ============================================
import os
from pydantic import BaseModel


class SeedAdminRequest(BaseModel):
    """Request body for seeding admin"""
    email: str = "admin@rutaseguraperu.com"
    password: str = "RutaSegura2024!"
    name: str = "Super Admin"
    secret_key: str  # Must match JWT_SECRET_KEY for security


@router.post(
    "/seed-admin",
    response_model=dict,
    summary="Create or reset Super Admin (deployment use only)",
    description="Create Super Admin or reset password if exists. Requires JWT_SECRET_KEY as secret_key.",
)
async def seed_super_admin(
    data: SeedAdminRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create Super Admin or reset password.
    """
    from fastapi import HTTPException
    from app.config import settings
    from uuid import uuid4
    from sqlalchemy import text
    from datetime import datetime
    
    try:
        # Verify secret key matches JWT secret
        if data.secret_key != settings.jwt_secret_key:
            logger.warning(f"Invalid seed-admin attempt with wrong secret key")
            raise HTTPException(
                status_code=403,
                detail="Invalid secret key. Use JWT_SECRET_KEY from Railway variables."
            )
        
        # Hash password with bcrypt
        import bcrypt
        salt = bcrypt.gensalt(rounds=12)
        hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')
        
        # Check if user exists
        result = await db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": data.email}
        )
        existing = result.fetchone()
        
        if existing:
            # Update existing user password
            await db.execute(
                text("""
                    UPDATE users 
                    SET hashed_password = :password, 
                        role = 'SUPER_ADMIN',
                        is_active = true,
                        is_verified = true,
                        updated_at = :now
                    WHERE email = :email
                """),
                {
                    "password": hashed_password,
                    "email": data.email,
                    "now": datetime.utcnow(),
                }
            )
            await db.commit()
            logger.info(f"Super Admin password reset: {data.email}")
            return {
                "status": "updated",
                "message": f"Super Admin password has been reset",
                "email": data.email,
            }
        else:
            # Create new admin
            user_id = str(uuid4())
            await db.execute(
                text("""
                    INSERT INTO users (
                        id, email, hashed_password, full_name, 
                        role, is_active, is_verified, language, created_at, updated_at
                    ) VALUES (
                        :id, :email, :password, :name,
                        'SUPER_ADMIN', true, true, 'es', :now, :now
                    )
                """),
                {
                    "id": user_id,
                    "email": data.email,
                    "password": hashed_password,
                    "name": data.name,
                    "now": datetime.utcnow(),
                }
            )
            await db.commit()
            logger.info(f"Super Admin created: {data.email} | ID: {user_id}")
            return {
                "status": "created",
                "message": "Super Admin created successfully",
                "email": data.email,
                "id": user_id,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Seed admin error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


