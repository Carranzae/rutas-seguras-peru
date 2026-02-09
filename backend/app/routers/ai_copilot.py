"""
Ruta Segura Perú - AI Copilot Router
Claude-powered intelligent analysis endpoints for Super Admin
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from loguru import logger

from app.services.claude_copilot import claude_copilot

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


class UserProfile(BaseModel):
    """User profile for analysis"""
    id: str
    full_name: Optional[str] = None
    email: str
    dni: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_verified: bool = False
    created_at: Optional[str] = None


class ProfileAnalysisRequest(BaseModel):
    """Request for profile analysis"""
    users: List[UserProfile]


class RouteDeviationRequest(BaseModel):
    """Request for route deviation analysis"""
    guide_name: str
    tour_name: str
    expected_route: List[dict]  # [{lat, lon}, ...]
    current_position: dict  # {latitude, longitude}
    deviation_meters: float


class ErrorLogRequest(BaseModel):
    """Request for error log analysis"""
    error_message: str
    stack_trace: str
    endpoint: str


class SafetyAlertRequest(BaseModel):
    """Request for safety alert generation"""
    user_name: str
    situation: str
    location: dict  # {latitude, longitude}
    battery_level: Optional[int] = None
    speed: Optional[float] = None


@router.post(
    "/analyze-profiles",
    summary="Analyze user profiles for suspicious patterns",
    description="Uses Claude to identify incomplete or suspicious user profiles.",
)
async def analyze_profiles(request: ProfileAnalysisRequest):
    """
    Analyze user profiles and flag suspicious ones.
    
    Claude checks for:
    - Invalid DNI format
    - Disposable emails
    - Strange character patterns
    - Invalid phone formats
    """
    if not claude_copilot.is_available():
        raise HTTPException(
            status_code=503,
            detail="Copiloto AI no configurado. Configure CLAUDE_API_KEY."
        )
    
    users_data = [u.model_dump() for u in request.users]
    result = await claude_copilot.analyze_user_profiles(users_data)
    
    logger.info(f"Profile analysis: {len(result.get('suspicious_users', []))} flags")
    return result


@router.post(
    "/analyze-route-deviation",
    summary="Analyze route deviation with AI",
    description="Get intelligent analysis and recommendations for guide route deviations.",
)
async def analyze_route_deviation(request: RouteDeviationRequest):
    """
    Analyze a route deviation and get recommendations.
    
    Returns severity, likely cause, and suggested action.
    """
    if not claude_copilot.is_available():
        # Fallback without Claude
        return {
            "severity": "medium",
            "likely_cause": "Desconocido",
            "suggestion": "Contactar al guía vía Walkie-Talkie",
            "alert_message": f"Desviación de {request.deviation_meters:.0f}m detectada",
        }
    
    result = await claude_copilot.analyze_route_deviation(
        guide_name=request.guide_name,
        expected_route=request.expected_route,
        current_position=request.current_position,
        deviation_meters=request.deviation_meters,
        tour_name=request.tour_name,
    )
    
    return result


@router.post(
    "/analyze-error",
    summary="Analyze server error with AI",
    description="Get human-readable explanation of server errors for non-technical admins.",
)
async def analyze_error(request: ErrorLogRequest):
    """
    Analyze a server error and provide:
    - Simple explanation for admin
    - Technical cause
    - Suggested fix steps
    """
    if not claude_copilot.is_available():
        return {
            "explanation": "Error en el servidor",
            "technical_cause": request.error_message,
            "suggested_fix": "Revisar logs del servidor en Railway",
            "severity": "high",
        }
    
    result = await claude_copilot.analyze_error_log(
        error_message=request.error_message,
        stack_trace=request.stack_trace,
        endpoint=request.endpoint,
    )
    
    logger.warning(f"Error analyzed | Severity: {result.get('severity')}")
    return result


@router.post(
    "/generate-safety-alert",
    summary="Generate intelligent safety alert",
    description="AI-powered safety alert with recommendations based on context.",
)
async def generate_safety_alert(request: SafetyAlertRequest):
    """
    Generate an intelligent safety alert.
    
    Considers:
    - User situation
    - Location context
    - Battery level
    - Movement speed
    """
    result = await claude_copilot.generate_safety_alert(
        user_name=request.user_name,
        situation=request.situation,
        location=request.location,
        battery_level=request.battery_level,
        speed=request.speed,
    )
    
    return result


@router.get(
    "/status",
    summary="Check AI Copilot status",
)
async def get_ai_status():
    """Check if Claude AI Copilot is available"""
    return {
        "available": claude_copilot.is_available(),
        "model": claude_copilot.MODEL if claude_copilot.is_available() else None,
    }
