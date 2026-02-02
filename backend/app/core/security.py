"""
Ruta Segura Perú - Security Core
Password hashing and JWT token management
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from passlib.context import CryptContext
from jose import jwt, JWTError

from app.config import settings

# Password hashing context with Argon2
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
    argon2__rounds=settings.password_hash_rounds,
)


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    extra_data: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    to_encode = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    if extra_data:
        to_encode.update(extra_data)
    
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(subject: str) -> str:
    """Create a JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    to_encode = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        return None


def verify_token_type(token: str, expected_type: str) -> Optional[str]:
    """Verify token type and return subject if valid."""
    payload = decode_token(token)
    if payload and payload.get("type") == expected_type:
        return payload.get("sub")
    return None


def verify_token(token: str) -> Optional[str]:
    """
    Verify a JWT token and return the user_id (subject) if valid.
    
    Returns:
        str: The user_id from the token if valid
        None: If token is invalid or expired
    """
    payload = decode_token(token)
    if payload:
        return payload.get("sub")
    return None


def get_password_hash(password: str) -> str:
    """Alias for hash_password for compatibility."""
    return hash_password(password)

