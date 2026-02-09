"""
Ruta Segura Perú - Claude AI Copilot Service
Intelligent assistant for user filtering, anomaly detection, and decision support
"""
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    logger.warning("anthropic package not installed")


class ClaudeCopilotService:
    """
    Anthropic Claude AI service for intelligent decision support.
    
    Features:
    - Suspicious user profile detection
    - Route deviation analysis
    - Error log interpretation
    - Predictive safety alerts
    """
    
    MODEL = "claude-sonnet-4-20250514"
    
    def __init__(self):
        self._client: Optional[anthropic.Anthropic] = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Anthropic client"""
        if not ANTHROPIC_AVAILABLE:
            logger.warning("Anthropic not available")
            return
        
        api_key = os.getenv("CLAUDE_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            self._client = anthropic.Anthropic(api_key=api_key)
            logger.info("Claude Copilot initialized")
        else:
            logger.warning("CLAUDE_API_KEY not configured")
    
    def is_available(self) -> bool:
        return self._client is not None
    
    async def analyze_user_profiles(
        self,
        users: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Analyze user profiles for suspicious patterns or incomplete data.
        
        Args:
            users: List of user dicts with id, full_name, email, dni, phone, etc.
        
        Returns:
            Analysis with suspicious users and recommendations
        """
        if not self.is_available():
            return {"error": "Claude not configured", "suspicious_users": []}
        
        # Prepare user summary for Claude
        user_summary = []
        for u in users[:50]:  # Limit to 50 for context window
            user_summary.append({
                "id": u.get("id"),
                "name": u.get("full_name"),
                "email": u.get("email"),
                "dni": u.get("dni"),
                "phone": u.get("phone"),
                "role": u.get("role"),
                "is_verified": u.get("is_verified", False),
                "created_at": str(u.get("created_at", "")),
            })
        
        try:
            response = self._client.messages.create(
                model=self.MODEL,
                max_tokens=1024,
                system="""Eres un analista de seguridad para Ruta Segura Perú, una plataforma de turismo.
Tu tarea es identificar perfiles de usuario sospechosos o incompletos.

Criterios de alerta:
- DNI inválido (no 8 dígitos para Perú)
- Email temporal/desechable (guerrillamail, temp-mail, etc.)
- Nombre con caracteres extraños
- Teléfono con formato inválido
- Patrón de creación de cuenta sospechoso

Responde en JSON con esta estructura:
{
  "suspicious_users": [{"id": "...", "reason": "...", "severity": "high|medium|low"}],
  "summary": "Resumen breve del análisis",
  "recommendations": ["acción recomendada 1", ...]
}""",
                messages=[
                    {
                        "role": "user",
                        "content": f"Analiza estos perfiles de usuario:\n{user_summary}"
                    }
                ],
            )
            
            # Parse JSON response
            import json
            try:
                result = json.loads(response.content[0].text)
            except json.JSONDecodeError:
                result = {
                    "suspicious_users": [],
                    "summary": response.content[0].text,
                    "recommendations": []
                }
            
            logger.info(f"Profile analysis complete: {len(result.get('suspicious_users', []))} alerts")
            return result
            
        except Exception as e:
            logger.error(f"Profile analysis failed: {e}")
            return {"error": str(e), "suspicious_users": []}
    
    async def analyze_route_deviation(
        self,
        guide_name: str,
        expected_route: List[Dict[str, float]],
        current_position: Dict[str, float],
        deviation_meters: float,
        tour_name: str,
    ) -> Dict[str, Any]:
        """
        Analyze route deviation and provide intelligent recommendations.
        
        Returns:
            Analysis with severity, suggested actions, and alert message
        """
        if not self.is_available():
            return {
                "severity": "medium",
                "suggestion": "Contactar al guía para verificar situación",
                "alert": f"Desviación de {deviation_meters:.0f}m detectada",
            }
        
        try:
            response = self._client.messages.create(
                model=self.MODEL,
                max_tokens=512,
                system="""Eres un asistente de seguridad para tours en Perú.
Analiza desviaciones de ruta y proporciona recomendaciones.
Considera factores como:
- Terreno (montaña, selva, ciudad)
- Distancia de desviación
- Posibles razones legítimas (foto, baño, emergencia médica)

Responde en JSON:
{
  "severity": "critical|high|medium|low",
  "likely_cause": "razón más probable",
  "suggestion": "acción recomendada para el operador",
  "alert_message": "mensaje corto para mostrar en dashboard"
}""",
                messages=[
                    {
                        "role": "user",
                        "content": f"""
Tour: {tour_name}
Guía: {guide_name}
Posición actual: lat {current_position.get('latitude')}, lon {current_position.get('longitude')}
Desviación: {deviation_meters}m de la ruta planificada
"""
                    }
                ],
            )
            
            import json
            try:
                result = json.loads(response.content[0].text)
            except json.JSONDecodeError:
                result = {
                    "severity": "medium",
                    "suggestion": response.content[0].text[:200],
                    "alert_message": f"Desviación de {deviation_meters:.0f}m",
                }
            
            logger.info(f"Route deviation analysis: {result.get('severity')}")
            return result
            
        except Exception as e:
            logger.error(f"Route analysis failed: {e}")
            return {
                "severity": "medium",
                "suggestion": "Contactar al guía vía Walkie-Talkie",
                "alert_message": f"Desviación de {deviation_meters:.0f}m detectada",
            }
    
    async def analyze_error_log(
        self,
        error_message: str,
        stack_trace: str,
        endpoint: str,
    ) -> Dict[str, Any]:
        """
        Analyze server error and provide human-readable explanation and fix.
        Used when Railway throws 500 errors.
        """
        if not self.is_available():
            return {
                "explanation": "Error del servidor",
                "technical_cause": error_message,
                "suggested_fix": "Revisar logs del servidor",
            }
        
        try:
            response = self._client.messages.create(
                model=self.MODEL,
                max_tokens=512,
                system="""Eres un ingeniero DevOps que explica errores de servidor.
Analiza el error y proporciona:
1. Explicación simple para el administrador (no técnico)
2. Causa técnica probable
3. Pasos para solucionarlo

Responde en JSON:
{
  "explanation": "explicación simple en español",
  "technical_cause": "causa técnica",
  "suggested_fix": "pasos para solucionarlo",
  "severity": "critical|high|medium|low"
}""",
                messages=[
                    {
                        "role": "user",
                        "content": f"""
Endpoint: {endpoint}
Error: {error_message}
Stack trace (últimas 500 chars):
{stack_trace[-500:]}
"""
                    }
                ],
            )
            
            import json
            try:
                result = json.loads(response.content[0].text)
            except json.JSONDecodeError:
                result = {
                    "explanation": response.content[0].text[:200],
                    "technical_cause": error_message,
                    "suggested_fix": "Revisar configuración del servidor",
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Error analysis failed: {e}")
            return {
                "explanation": "Error del servidor detectado",
                "technical_cause": error_message,
                "suggested_fix": "Contactar soporte técnico",
            }
    
    async def generate_safety_alert(
        self,
        user_name: str,
        situation: str,
        location: Dict[str, float],
        battery_level: Optional[int] = None,
        speed: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Generate intelligent safety alert with recommendations.
        Used by the safety monitoring system.
        """
        if not self.is_available():
            return {
                "alert_level": "warning",
                "message": f"Alerta: {situation}",
                "action": "Verificar estado del usuario",
            }
        
        try:
            context = f"""
Usuario: {user_name}
Situación: {situation}
Ubicación: lat {location.get('latitude')}, lon {location.get('longitude')}
"""
            if battery_level is not None:
                context += f"Batería: {battery_level}%\n"
            if speed is not None:
                context += f"Velocidad: {speed} m/s\n"
            
            response = self._client.messages.create(
                model=self.MODEL,
                max_tokens=256,
                system="""Genera alertas de seguridad concisas para turismo en Perú.
Responde en JSON:
{
  "alert_level": "critical|high|medium|low",
  "message": "mensaje corto para mostrar",
  "action": "acción recomendada",
  "urgency": "inmediato|pronto|cuando sea posible"
}""",
                messages=[{"role": "user", "content": context}],
            )
            
            import json
            try:
                return json.loads(response.content[0].text)
            except json.JSONDecodeError:
                return {
                    "alert_level": "warning",
                    "message": response.content[0].text[:100],
                    "action": "Verificar estado",
                }
            
        except Exception as e:
            logger.error(f"Safety alert generation failed: {e}")
            return {
                "alert_level": "warning",
                "message": f"Alerta: {situation}",
                "action": "Verificar estado del usuario",
            }


# Singleton
claude_copilot = ClaudeCopilotService()
