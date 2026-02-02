"""
Ruta Segura Perú - Auth Service
Business logic for authentication
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import ConflictException, UnauthorizedException, BadRequestException


class AuthService:
    """Authentication service with business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def register(self, data: RegisterRequest) -> User:
        """Register a new user."""
        # Check if email exists
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if result.scalar_one_or_none():
            raise ConflictException("Email already registered")
        
        # Validate role
        try:
            role = UserRole(data.role)
        except ValueError:
            role = UserRole.TOURIST
        
        # Create user
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=role,
            language=data.language,
            is_active=True,
            is_verified=False,
        )
        
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        
        return user
    
    async def login(self, data: LoginRequest) -> TokenResponse:
        """Authenticate user and return tokens."""
        from app.schemas.auth import UserInToken
        
        # Find user
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")
        
        # Generate tokens
        access_token = create_access_token(
            subject=str(user.id),
            extra_data={"role": user.role.value, "email": user.email}
        )
        refresh_token = create_refresh_token(subject=str(user.id))
        
        # Create user data for response
        user_data = UserInToken(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            is_verified=user.is_verified,
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_data,
        )
    
    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token."""
        from app.core.security import verify_token_type
        
        user_id = verify_token_type(refresh_token, "refresh")
        if not user_id:
            raise UnauthorizedException("Invalid refresh token")
        
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")
        
        access_token = create_access_token(
            subject=str(user.id),
            extra_data={"role": user.role.value, "email": user.email}
        )
        new_refresh_token = create_refresh_token(subject=str(user.id))
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )
