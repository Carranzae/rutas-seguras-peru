"""
Ruta Segura Perú - Safety Monitor Service
Real-time safety monitoring with automatic alerts
"""
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from dataclasses import dataclass, field
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.gps_calculator import GPSCalculator, GeoPoint, SafetyAnalysis
from app.services.ai_safety_service import AISafetyService, AIRiskAssessment
from app.core.websocket_manager import manager


@dataclass
class UserTrackingState:
    """Track state for a single user"""
    user_id: str
    user_name: str
    user_type: str  # 'guide' or 'tourist'
    tour_id: Optional[str] = None
    location_history: List[GeoPoint] = field(default_factory=list)
    last_location: Optional[GeoPoint] = None
    battery_level: Optional[int] = None
    last_analysis: Optional[AIRiskAssessment] = None
    last_analysis_time: Optional[datetime] = None
    alert_count: int = 0
    last_alert_time: Optional[datetime] = None


@dataclass
class SafetyAlert:
    """Automatic safety alert"""
    id: str
    user_id: str
    user_name: str
    alert_type: str  # 'ai_analysis', 'low_battery', 'deviation', 'sos', 'no_signal'
    severity: str    # 'info', 'warning', 'critical'
    risk_score: int
    message: str
    recommendations: List[str]
    location: Optional[GeoPoint] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    acknowledged: bool = False


class SafetyMonitor:
    """
    Real-time safety monitoring service.
    
    Features:
    - Tracks all active users
    - Analyzes each GPS update
    - Triggers automatic alerts
    - Calculates coordinates and dangers
    - Integrates with Claude AI for intelligent analysis
    """
    
    # Analysis frequency limits
    AI_ANALYSIS_INTERVAL = timedelta(minutes=2)  # Full AI analysis every 2 min
    ALERT_COOLDOWN = timedelta(minutes=5)        # Minimum time between alerts per user
    
    # History limits
    MAX_HISTORY_POINTS = 50
    
    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.ai_service = AISafetyService()
        
        # Active user states
        self.user_states: Dict[str, UserTrackingState] = {}
        
        # Alert history
        self.alerts: List[SafetyAlert] = []
        
        # Tour route cache (would load from database)
        self.tour_routes: Dict[str, List[GeoPoint]] = {}
    
    async def process_location_update(
        self,
        user_id: str,
        user_name: str,
        user_type: str,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
        altitude: Optional[float] = None,
        battery: Optional[int] = None,
        tour_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process a location update and perform safety analysis.
        
        Returns analysis results and any triggered alerts.
        """
        now = datetime.now(timezone.utc)
        
        # Create GeoPoint
        current_point = GeoPoint(
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            timestamp=now,
            accuracy=accuracy,
        )
        
        # Get or create user state
        state = self._get_or_create_state(user_id, user_name, user_type, tour_id)
        
        # Update state
        state.last_location = current_point
        state.battery_level = battery
        state.location_history.append(current_point)
        
        # Keep history limited
        if len(state.location_history) > self.MAX_HISTORY_POINTS:
            state.location_history = state.location_history[-self.MAX_HISTORY_POINTS:]
        
        # Perform quick safety checks
        quick_checks = self._perform_quick_checks(state, current_point, battery)
        
        # Determine if full AI analysis is needed
        need_ai_analysis = self._should_perform_ai_analysis(state, quick_checks)
        
        analysis_result = None
        triggered_alerts = []
        
        if need_ai_analysis:
            # Perform full AI analysis
            try:
                analysis_result = await self._perform_ai_analysis(state, current_point)
                state.last_analysis = analysis_result
                state.last_analysis_time = now
                
                # Check if alert should be triggered
                if self.ai_service.should_trigger_alert(analysis_result):
                    alert = await self._trigger_alert(state, analysis_result, current_point)
                    if alert:
                        triggered_alerts.append(alert)
                        
            except Exception as e:
                logger.error(f"AI analysis failed for {user_id}: {e}")
        
        # Check for specific alert conditions
        specific_alerts = await self._check_specific_conditions(state, current_point, battery)
        triggered_alerts.extend(specific_alerts)
        
        # Prepare response
        result = {
            "user_id": user_id,
            "location_received": True,
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude,
                "altitude": altitude,
            },
            "quick_checks": quick_checks,
            "ai_analysis": {
                "performed": analysis_result is not None,
                "risk_score": analysis_result.risk_score if analysis_result else None,
                "risk_level": analysis_result.risk_level if analysis_result else None,
            },
            "alerts_triggered": len(triggered_alerts),
            "terrain": GPSCalculator.determine_terrain(current_point).value,
        }
        
        # Broadcast update to admin dashboards
        await self._broadcast_status_update(state, result, triggered_alerts)
        
        return result
    
    def _get_or_create_state(
        self,
        user_id: str,
        user_name: str,
        user_type: str,
        tour_id: Optional[str],
    ) -> UserTrackingState:
        """Get existing state or create new one."""
        if user_id not in self.user_states:
            self.user_states[user_id] = UserTrackingState(
                user_id=user_id,
                user_name=user_name,
                user_type=user_type,
                tour_id=tour_id,
            )
        return self.user_states[user_id]
    
    def _perform_quick_checks(
        self,
        state: UserTrackingState,
        current: GeoPoint,
        battery: Optional[int],
    ) -> Dict[str, Any]:
        """Perform quick rule-based safety checks."""
        checks = {
            "danger_zones": [],
            "altitude_risk": None,
            "speed_anomaly": False,
            "battery_critical": False,
            "prolonged_stop": False,
            "overall_concern": False,
        }
        
        # Check danger zones
        danger_zones = GPSCalculator.check_danger_zones(current)
        checks["danger_zones"] = [
            {"name": z.zone_name, "distance": z.distance_meters, "level": z.danger_level}
            for z in danger_zones
        ]
        
        # Check altitude
        altitude_risk, alt_desc = GPSCalculator.calculate_altitude_risk(current.altitude)
        if altitude_risk > 30:
            checks["altitude_risk"] = {"score": altitude_risk, "description": alt_desc}
        
        # Check battery
        if battery is not None and battery < 15:
            checks["battery_critical"] = True
        
        # Check speed if we have history
        if len(state.location_history) >= 2:
            try:
                prev = state.location_history[-2]
                speed_analysis = GPSCalculator.calculate_speed(prev, current)
                if speed_analysis.is_abnormal:
                    checks["speed_anomaly"] = True
            except Exception:
                pass
        
        # Check for prolonged stop
        if len(state.location_history) >= 10:
            movement = GPSCalculator.analyze_movement_pattern(state.location_history[-10:])
            if movement.get("stopped_duration_s", 0) > 1800:  # 30 min
                checks["prolonged_stop"] = True
        
        # Determine overall concern
        checks["overall_concern"] = any([
            len(checks["danger_zones"]) > 0,
            checks["altitude_risk"] is not None,
            checks["speed_anomaly"],
            checks["battery_critical"],
            checks["prolonged_stop"],
        ])
        
        return checks
    
    def _should_perform_ai_analysis(
        self,
        state: UserTrackingState,
        quick_checks: Dict,
    ) -> bool:
        """Determine if full AI analysis should be performed."""
        now = datetime.now(timezone.utc)
        
        # No previous analysis
        if state.last_analysis_time is None:
            return True
        
        # Time since last analysis
        time_since_analysis = now - state.last_analysis_time
        
        # Always analyze if enough time has passed
        if time_since_analysis >= self.AI_ANALYSIS_INTERVAL:
            return True
        
        # Analyze immediately if quick checks show concern
        if quick_checks.get("overall_concern"):
            return time_since_analysis >= timedelta(seconds=30)  # At least 30s apart
        
        return False
    
    async def _perform_ai_analysis(
        self,
        state: UserTrackingState,
        current: GeoPoint,
    ) -> AIRiskAssessment:
        """Perform full AI-powered analysis."""
        
        # Get route points if available
        route_points = self.tour_routes.get(state.tour_id) if state.tour_id else None
        
        return await self.ai_service.analyze_tourist_safety(
            tourist_id=state.user_id,
            tourist_name=state.user_name,
            current_location=current,
            location_history=state.location_history,
            battery_level=state.battery_level,
            tour_id=state.tour_id,
            route_points=route_points,
        )
    
    async def _trigger_alert(
        self,
        state: UserTrackingState,
        analysis: AIRiskAssessment,
        location: GeoPoint,
    ) -> Optional[SafetyAlert]:
        """Trigger an alert based on analysis."""
        now = datetime.now(timezone.utc)
        
        # Check cooldown
        if state.last_alert_time:
            if now - state.last_alert_time < self.ALERT_COOLDOWN:
                return None
        
        # Determine severity
        if analysis.risk_score >= 80:
            severity = "critical"
        elif analysis.risk_score >= 60:
            severity = "warning"
        else:
            severity = "info"
        
        # Create alert
        alert = SafetyAlert(
            id=f"alert-{uuid.uuid4().hex[:8]}",
            user_id=state.user_id,
            user_name=state.user_name,
            alert_type="ai_analysis",
            severity=severity,
            risk_score=analysis.risk_score,
            message=self.ai_service.get_alert_message(analysis, state.user_name),
            recommendations=analysis.recommendations,
            location=location,
        )
        
        # Update state
        state.alert_count += 1
        state.last_alert_time = now
        
        # Store alert
        self.alerts.append(alert)
        
        # Broadcast to admins
        await manager.broadcast_alert(
            alert_type="ai_analysis",
            user_id=state.user_id,
            user_name=state.user_name,
            message=f"🤖 IA detectó riesgo {analysis.risk_score}/100: {', '.join(analysis.detected_risks[:2])}",
            severity=severity,
            latitude=location.latitude,
            longitude=location.longitude,
            tour_id=state.tour_id,
        )
        
        logger.warning(f"Safety alert triggered for {state.user_name}: {analysis.risk_level} ({analysis.risk_score}/100)")
        
        return alert
    
    async def _check_specific_conditions(
        self,
        state: UserTrackingState,
        current: GeoPoint,
        battery: Optional[int],
    ) -> List[SafetyAlert]:
        """Check for specific alert conditions."""
        alerts = []
        now = datetime.now(timezone.utc)
        
        # Battery critical alert
        if battery is not None and battery < 10:
            # Only alert once per session
            existing = [a for a in self.alerts if a.user_id == state.user_id and a.alert_type == "low_battery"]
            if not existing:
                alert = SafetyAlert(
                    id=f"alert-{uuid.uuid4().hex[:8]}",
                    user_id=state.user_id,
                    user_name=state.user_name,
                    alert_type="low_battery",
                    severity="warning",
                    risk_score=60,
                    message=f"🔋 Batería crítica: {battery}%",
                    recommendations=["Conservar batería", "Buscar punto de carga"],
                    location=current,
                )
                alerts.append(alert)
                await manager.broadcast_alert(
                    alert_type="low_battery",
                    user_id=state.user_id,
                    user_name=state.user_name,
                    message=f"Batería crítica: {battery}%",
                    severity="warning",
                )
        
        return alerts
    
    async def _broadcast_status_update(
        self,
        state: UserTrackingState,
        result: Dict,
        alerts: List[SafetyAlert],
    ):
        """Broadcast user status update to admin dashboards."""
        
        status_data = {
            "user_id": state.user_id,
            "user_name": state.user_name,
            "user_type": state.user_type,
            "latitude": state.last_location.latitude if state.last_location else None,
            "longitude": state.last_location.longitude if state.last_location else None,
            "altitude": state.last_location.altitude if state.last_location else None,
            "battery": state.battery_level,
            "tour_id": state.tour_id,
            "terrain": result.get("terrain"),
            "risk_score": result["ai_analysis"].get("risk_score"),
            "risk_level": result["ai_analysis"].get("risk_level"),
            "status": self._determine_status(state),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        await manager.broadcast_location_update(
            user_id=state.user_id,
            user_type=state.user_type,
            latitude=status_data["latitude"],
            longitude=status_data["longitude"],
            altitude=status_data["altitude"],
            battery=status_data["battery"],
            tour_id=status_data["tour_id"],
            user_name=status_data["user_name"],
        )
    
    def _determine_status(self, state: UserTrackingState) -> str:
        """Determine user status based on state."""
        if state.last_analysis and state.last_analysis.risk_level == "critical":
            return "sos"
        if state.battery_level and state.battery_level < 15:
            return "low_battery"
        if state.last_analysis and state.last_analysis.risk_level == "high":
            return "alert"
        
        # Check if moving or idle
        if len(state.location_history) >= 2:
            try:
                speed = GPSCalculator.calculate_speed(
                    state.location_history[-2],
                    state.location_history[-1],
                )
                if speed.speed_kmh < 0.5:
                    return "idle"
            except Exception:
                pass
        
        return "active"
    
    def get_all_user_statuses(self) -> List[Dict]:
        """Get status of all tracked users."""
        statuses = []
        for user_id, state in self.user_states.items():
            statuses.append({
                "user_id": user_id,
                "user_name": state.user_name,
                "user_type": state.user_type,
                "location": {
                    "latitude": state.last_location.latitude,
                    "longitude": state.last_location.longitude,
                } if state.last_location else None,
                "battery": state.battery_level,
                "risk_score": state.last_analysis.risk_score if state.last_analysis else None,
                "status": self._determine_status(state),
                "alert_count": state.alert_count,
            })
        return statuses
    
    def get_recent_alerts(self, limit: int = 20) -> List[Dict]:
        """Get recent alerts."""
        recent = sorted(self.alerts, key=lambda a: a.timestamp, reverse=True)[:limit]
        return [
            {
                "id": a.id,
                "user_id": a.user_id,
                "user_name": a.user_name,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "risk_score": a.risk_score,
                "message": a.message,
                "timestamp": a.timestamp.isoformat(),
                "acknowledged": a.acknowledged,
            }
            for a in recent
        ]


# Global safety monitor instance
safety_monitor = SafetyMonitor()
