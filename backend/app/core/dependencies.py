"""
Ruta Segura Perú - Dependencies
FastAPI dependency injection for auth and database
"""
from typing import Annotated
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User, UserRole


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException("User not found")
    
    if not user.is_active:
        raise ForbiddenException("User account is deactivated")
    
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure user is active."""
    if not current_user.is_active:
        raise ForbiddenException("Inactive user")
    return current_user


def require_roles(*roles: UserRole):
    """Dependency factory to require specific roles."""
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise ForbiddenException(
                f"Role {current_user.role.value} not allowed. Required: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


# Common role dependencies
RequireSuperAdmin = Depends(require_roles(UserRole.SUPER_ADMIN))
RequireAgencyAdmin = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN))
RequireGuide = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.AGENCY_ADMIN, UserRole.GUIDE))
RequireAuthenticated = Depends(get_current_active_user)

# Type aliases for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current user and verify they are a super admin."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise ForbiddenException("Admin access required")
    return current_user


async def get_current_token_payload(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """
    Get the current token's payload without fetching the user.
    Useful for logout where we only need the JTI.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    
    if not payload:
        raise UnauthorizedException("Invalid or expired token")
    
    return payload
