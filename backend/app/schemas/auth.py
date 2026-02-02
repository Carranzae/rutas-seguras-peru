"""
Ruta Segura Perú - Auth Schemas
Pydantic schemas for authentication
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserInToken(BaseModel):
    """User data included in token response."""
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool = True
    is_verified: bool = False


class TokenResponse(BaseModel):
    """Response with access and refresh tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserInToken] = None


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str
    exp: int
    type: str


class LoginRequest(BaseModel):
    """Login request body."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)


class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: str = "tourist"
    language: str = "es"


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request."""
    token: str
    new_password: str = Field(min_length=8, max_length=100)


class ChangePasswordRequest(BaseModel):
    """Change password request."""
    current_password: str
    new_password: str = Field(min_length=8, max_length=100)
