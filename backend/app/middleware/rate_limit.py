"""
Ruta Segura Perú - Rate Limiting Middleware
Prevent brute force attacks on login
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)

# Special limit for login endpoint
login_limit = f"{settings.login_rate_limit_per_minute}/minute"
