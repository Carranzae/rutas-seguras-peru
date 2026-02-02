"""
Ruta Segura Perú - AI Safety Service
Intelligent danger detection using Claude AI
"""
import os
import json
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, asdict
from loguru import logger

from app.services.gps_calculator import (
    GPSCalculator,
    GeoPoint,
    SafetyAnalysis,
    TerrainType,
)


@dataclass
class AIRiskAssessment:
    """AI-generated risk assessment"""
    risk_score: int              # 0-100
    risk_level: str              # 'low', 'medium', 'high', 'critical'
    confidence: float            # 0.0-1.0
    detected_risks: List[str]    # List of identified risks
    recommendations: List[str]   # AI recommendations
    immediate_action: bool       # Requires immediate response
    predicted_issues: List[str]  # Potential future issues
    analysis_reasoning: str      # AI's reasoning


class AISafetyService:
    """
    AI-powered safety analysis service using Claude.
    Analyzes GPS data, movement patterns, and context to predict dangers.
    """
    
    # Claude API endpoint
    CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
    
    # Risk thresholds
    RISK_THRESHOLDS = {
        "low": 30,
        "medium": 60,
        "high": 80,
        "critical": 100,
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize with Claude API key."""
        from app.config import settings
        self.api_key = api_key or settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY", "")
        self.gps_calculator = GPSCalculator()
        
        if not self.api_key:
            logger.warning("ANTHROPIC_API_KEY not set - AI analysis will use fallback rules")
    
    async def analyze_tourist_safety(
        self,
        tourist_id: str,
        tourist_name: str,
        current_location: GeoPoint,
        location_history: List[GeoPoint],
        battery_level: Optional[int] = None,
        tour_id: Optional[str] = None,
        tour_name: Optional[str] = None,
        guide_location: Optional[GeoPoint] = None,
        route_points: Optional[List[GeoPoint]] = None,
        weather_data: Optional[Dict] = None,
    ) -> AIRiskAssessment:
        """
        Perform comprehensive AI-powered safety analysis.
        
        Combines GPS calculations with AI reasoning for intelligent danger detection.
        """
        # First, perform rule-based calculation
        current_time = datetime.utcnow()
        base_analysis = GPSCalculator.comprehensive_safety_analysis(
            current_point=current_location,
            history=location_history,
            route_points=route_points,
            battery_level=battery_level,
            current_time=current_time,
        )
        
        # Prepare context for AI analysis
        context = self._prepare_ai_context(
            tourist_name=tourist_name,
            current_location=current_location,
            base_analysis=base_analysis,
            battery_level=battery_level,
            tour_name=tour_name,
            guide_location=guide_location,
            location_history=location_history,
            weather_data=weather_data,
            current_time=current_time,
        )
        
        # Try AI analysis, fallback to rule-based if API fails
        try:
            if self.api_key:
                ai_result = await self._call_claude_api(context)
                return self._merge_analysis(base_analysis, ai_result)
            else:
                return self._convert_to_ai_assessment(base_analysis)
        except Exception as e:
            logger.error(f"AI analysis failed, using fallback: {e}")
            return self._convert_to_ai_assessment(base_analysis)
    
    def _prepare_ai_context(
        self,
        tourist_name: str,
        current_location: GeoPoint,
        base_analysis: SafetyAnalysis,
        battery_level: Optional[int],
        tour_name: Optional[str],
        guide_location: Optional[GeoPoint],
        location_history: List[GeoPoint],
        weather_data: Optional[Dict],
        current_time: datetime,
    ) -> Dict:
        """Prepare context data for Claude AI analysis."""
        
        # Calculate distance from guide if available
        guide_distance = None
        if guide_location:
            guide_distance = GPSCalculator.haversine_distance(current_location, guide_location)
        
        # Movement analysis
        movement = GPSCalculator.analyze_movement_pattern(location_history)
        
        # Danger zones nearby
        danger_zones = GPSCalculator.check_danger_zones(current_location)
        
        context = {
            "tourist_name": tourist_name,
            "tour_name": tour_name or "Tour independiente",
            "current_time": current_time.strftime("%H:%M"),
            "date": current_time.strftime("%Y-%m-%d"),
            "location": {
                "latitude": current_location.latitude,
                "longitude": current_location.longitude,
                "altitude_m": current_location.altitude,
            },
            "terrain_type": base_analysis.terrain_type.value,
            "battery_level": battery_level,
            "guide_distance_m": guide_distance,
            "movement": {
                "avg_speed_kmh": movement.get("avg_speed_kmh", 0),
                "max_speed_kmh": movement.get("max_speed_kmh", 0),
                "stopped_minutes": movement.get("stopped_duration_s", 0) / 60,
                "total_distance_m": movement.get("total_distance_m", 0),
                "pattern": movement.get("pattern", "unknown"),
            },
            "nearby_danger_zones": [
                {
                    "name": zone.zone_name,
                    "type": zone.zone_type,
                    "distance_m": zone.distance_meters,
                    "danger_level": zone.danger_level,
                }
                for zone in danger_zones
            ],
            "weather": weather_data or {"conditions": "unknown"},
            "sunset_minutes": base_analysis.estimated_sunset_minutes,
            "base_risk_score": base_analysis.risk_score,
            "base_risk_factors": base_analysis.factors,
        }
        
        return context
    
    async def _call_claude_api(self, context: Dict) -> Dict:
        """Call Claude API for intelligent risk analysis."""
        
        system_prompt = """You are a tourist safety AI assistant for Peru. 
        Analyze tourist location data and identify potential dangers.
        Consider: terrain, altitude, weather, time of day, battery level, movement patterns.
        Respond ONLY with valid JSON in this exact format:
        {
            "risk_score": <0-100>,
            "risk_level": "<low|medium|high|critical>",
            "confidence": <0.0-1.0>,
            "detected_risks": ["risk1", "risk2"],
            "recommendations": ["rec1", "rec2"],
            "immediate_action": <true|false>,
            "predicted_issues": ["issue1", "issue2"],
            "reasoning": "Brief explanation of analysis"
        }"""
        
        user_message = f"""Analyze this tourist safety data for Peru:

Tourist: {context['tourist_name']}
Tour: {context['tour_name']}
Time: {context['current_time']} on {context['date']}

Location:
- Coordinates: ({context['location']['latitude']}, {context['location']['longitude']})
- Altitude: {context['location']['altitude_m'] or 'Unknown'}m
- Terrain: {context['terrain_type'].upper()}

Status:
- Battery: {context['battery_level'] or 'Unknown'}%
- Distance from guide: {context['guide_distance_m'] or 'Unknown'}m
- Movement pattern: {context['movement']['pattern']}
- Average speed: {context['movement']['avg_speed_kmh']:.1f} km/h
- Stopped for: {context['movement']['stopped_minutes']:.1f} minutes
- Time until sunset: {context['sunset_minutes'] or 'Unknown'} minutes

Nearby danger zones:
{json.dumps(context['nearby_danger_zones'], indent=2)}

Base risk score: {context['base_risk_score']}/100
Base risk factors: {', '.join(context['base_risk_factors'])}

Weather: {json.dumps(context['weather'])}

Provide your risk assessment as JSON."""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.CLAUDE_API_URL,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 1024,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": user_message}
                        ],
                    },
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("content", [{}])[0].get("text", "{}")
                    
                    # Parse JSON response
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        # Try to extract JSON from response
                        import re
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group())
                        raise ValueError("Could not parse AI response as JSON")
                else:
                    logger.error(f"Claude API error: {response.status_code} - {response.text}")
                    raise Exception(f"API error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Claude API call failed: {e}")
            raise
    
    def _merge_analysis(
        self,
        base: SafetyAnalysis,
        ai_result: Dict,
    ) -> AIRiskAssessment:
        """Merge rule-based and AI analysis for final assessment."""
        
        # Weight: 40% rules, 60% AI
        base_score = base.risk_score
        ai_score = ai_result.get("risk_score", base_score)
        merged_score = int(base_score * 0.4 + ai_score * 0.6)
        
        # Determine final risk level
        if merged_score < 30:
            risk_level = "low"
        elif merged_score < 60:
            risk_level = "medium"
        elif merged_score < 80:
            risk_level = "high"
        else:
            risk_level = "critical"
        
        # Combine factors from both analyses
        all_risks = list(set(base.factors + ai_result.get("detected_risks", [])))
        all_recommendations = list(set(base.recommendations + ai_result.get("recommendations", [])))
        
        return AIRiskAssessment(
            risk_score=merged_score,
            risk_level=risk_level,
            confidence=ai_result.get("confidence", 0.7),
            detected_risks=all_risks,
            recommendations=all_recommendations,
            immediate_action=merged_score >= 80 or ai_result.get("immediate_action", False),
            predicted_issues=ai_result.get("predicted_issues", []),
            analysis_reasoning=ai_result.get("reasoning", "Análisis basado en reglas y patrones"),
        )
    
    def _convert_to_ai_assessment(self, base: SafetyAnalysis) -> AIRiskAssessment:
        """Convert rule-based analysis to AI assessment format (fallback)."""
        return AIRiskAssessment(
            risk_score=base.risk_score,
            risk_level=base.risk_level,
            confidence=0.6,  # Lower confidence for rule-based
            detected_risks=base.factors,
            recommendations=base.recommendations,
            immediate_action=base.immediate_action_required,
            predicted_issues=[],
            analysis_reasoning="Análisis basado en reglas de seguridad predefinidas",
        )
    
    async def quick_danger_check(
        self,
        latitude: float,
        longitude: float,
        altitude: Optional[float] = None,
        battery: Optional[int] = None,
    ) -> Dict:
        """
        Quick danger check without full AI analysis.
        Returns immediate safety status.
        """
        point = GeoPoint(
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            timestamp=datetime.utcnow(),
        )
        
        # Check danger zones
        danger_zones = GPSCalculator.check_danger_zones(point)
        
        # Check altitude
        altitude_risk, altitude_desc = GPSCalculator.calculate_altitude_risk(altitude)
        
        # Calculate quick risk
        risk_score = 0
        alerts = []
        
        for zone in danger_zones:
            risk_score += zone.danger_level * 5
            alerts.append(zone.recommendation)
        
        if altitude_risk > 30:
            risk_score += altitude_risk // 2
            alerts.append(altitude_desc)
        
        if battery and battery < 15:
            risk_score += 20
            alerts.append(f"Batería crítica: {battery}%")
        
        # Determine terrain
        terrain = GPSCalculator.determine_terrain(point)
        
        return {
            "risk_score": min(risk_score, 100),
            "alerts": alerts,
            "terrain": terrain.value,
            "danger_zones_nearby": len(danger_zones),
            "safe": risk_score < 50,
        }
    
    def should_trigger_alert(self, assessment: AIRiskAssessment) -> bool:
        """Determine if assessment should trigger automatic alert."""
        return (
            assessment.immediate_action or
            assessment.risk_score >= 70 or
            assessment.risk_level in ["high", "critical"]
        )
    
    def get_alert_message(self, assessment: AIRiskAssessment, tourist_name: str) -> str:
        """Generate alert message from assessment."""
        severity_emoji = {
            "low": "ℹ️",
            "medium": "⚠️",
            "high": "🔶",
            "critical": "🆘",
        }
        
        emoji = severity_emoji.get(assessment.risk_level, "⚠️")
        
        message = f"{emoji} ALERTA DE SEGURIDAD - {tourist_name}\n\n"
        message += f"Nivel de Riesgo: {assessment.risk_score}/100 ({assessment.risk_level.upper()})\n\n"
        
        if assessment.detected_risks:
            message += "Riesgos Detectados:\n"
            for risk in assessment.detected_risks[:3]:
                message += f"• {risk}\n"
        
        if assessment.recommendations:
            message += "\nRecomendaciones:\n"
            for rec in assessment.recommendations[:2]:
                message += f"• {rec}\n"
        
        if assessment.immediate_action:
            message += "\n⚡ REQUIERE ACCIÓN INMEDIATA"
        
        return message
