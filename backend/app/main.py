"""
Ruta Segura Perú - FastAPI Application
Main entry point with configuration and routing
"""
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import init_db, close_db
from app.middleware import LoggingMiddleware, limiter, JWTBlacklistMiddleware
from app.services.redis_service import redis_service
from app.routers import (
    auth_router,
    emergencies_router,
    vonage_router,
    tours_router,
    agencies_router,
    guides_router,
    payments_router,
    tracking_router,
    admin_router,
    bookings_router,
    reviews_router,
    identity_verification_router,
    emergency_contacts_router,
    public_tracking_router,
    uploads_router,
    public_tracking_router,
    websocket as websocket_router,
)
from app.routers import ai as ai_router
from app.routers import notifications as notifications_router
from app.routers.analytics import router as analytics_router
from app.core.exceptions import AppException


# Configure logging
def setup_logging():
    """Configure Loguru for application logging."""
    logger.remove()
    
    # Console output
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.log_level,
        colorize=True,
    )
    
    # File output
    log_path = Path(settings.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.add(
        settings.log_file,
        rotation="10 MB",
        retention="7 days",
        compression="gz",
        level=settings.log_level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    )
    
    logger.info(f"Logging configured: {settings.log_level}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    setup_logging()
    logger.info(f"Starting {settings.app_name} ({settings.app_env})")
    
    # Startup
    await redis_service.connect()
    logger.info("Redis connected")
    
    if settings.is_development:
        try:
            await init_db()
            logger.info("Database tables initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            # Verify DB connection settings
            logger.debug(f"DB URL: {settings.database_url}")
    
    yield
    
    # Shutdown
    await redis_service.disconnect()
    await close_db()
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="API de Seguridad Turística Nacional del Perú",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ============ MIDDLEWARE ============

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging
app.add_middleware(LoggingMiddleware)

# JWT Blacklist check (after CORS, before routes)
app.add_middleware(JWTBlacklistMiddleware)


# ============ EXCEPTION HANDLERS ============

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ============ ROUTERS ============

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(emergencies_router, prefix=settings.api_v1_prefix)
app.include_router(vonage_router, prefix=settings.api_v1_prefix)
app.include_router(tours_router, prefix=settings.api_v1_prefix)
app.include_router(agencies_router, prefix=settings.api_v1_prefix)
app.include_router(guides_router, prefix=settings.api_v1_prefix)
app.include_router(payments_router, prefix=settings.api_v1_prefix)
app.include_router(tracking_router, prefix=settings.api_v1_prefix)
app.include_router(admin_router, prefix=settings.api_v1_prefix)
app.include_router(bookings_router, prefix=settings.api_v1_prefix)
app.include_router(reviews_router, prefix=settings.api_v1_prefix)
app.include_router(identity_verification_router, prefix=settings.api_v1_prefix)
app.include_router(emergency_contacts_router, prefix=settings.api_v1_prefix)
app.include_router(public_tracking_router, prefix=settings.api_v1_prefix)
app.include_router(uploads_router, prefix=settings.api_v1_prefix)
app.include_router(websocket_router.router, prefix=settings.api_v1_prefix)
app.include_router(ai_router.router, prefix=settings.api_v1_prefix)
app.include_router(notifications_router.router, prefix=settings.api_v1_prefix)
app.include_router(analytics_router, prefix=settings.api_v1_prefix)

# Cloud Services Routers
from app.routers import media as media_router
from app.routers import translation as translation_router
from app.routers import ai_copilot as ai_copilot_router

app.include_router(media_router.router, prefix=settings.api_v1_prefix)
app.include_router(translation_router.router, prefix=settings.api_v1_prefix)
app.include_router(ai_copilot_router.router, prefix=settings.api_v1_prefix)

# ============ STATIC FILES ============
from fastapi.staticfiles import StaticFiles
import os

# Serve uploaded files
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ============ HEALTH CHECK ============

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.app_name,
        "description": "Sistema de Seguridad Turística Nacional",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development,
    )
