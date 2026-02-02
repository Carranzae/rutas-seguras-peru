"""
Ruta Segura Perú - GPS Calculator Service
Advanced coordinate calculations for safety monitoring
"""
import math
from typing import List, Tuple, Optional, Dict
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum


class TerrainType(Enum):
    COSTA = "costa"     # Coast - sea level
    SIERRA = "sierra"   # Mountains - high altitude
    SELVA = "selva"     # Jungle - Amazon


@dataclass
class GeoPoint:
    """Geographic point with coordinates"""
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    timestamp: Optional[datetime] = None
    accuracy: Optional[float] = None


@dataclass
class SpeedAnalysis:
    """Speed calculation result"""
    speed_kmh: float
    speed_ms: float
    distance_m: float
    duration_seconds: float
    is_abnormal: bool  # Speed > 100 km/h or < 0
    

@dataclass
class DeviationAnalysis:
    """Route deviation analysis"""
    deviation_meters: float
    is_off_route: bool  # > 500m from planned route
    nearest_route_point: Optional[GeoPoint] = None


@dataclass
class ProximityAlert:
    """Proximity to danger zone"""
    zone_id: str
    zone_name: str
    zone_type: str  # 'criminal', 'geological', 'weather', 'wildlife'
    distance_meters: float
    danger_level: int  # 1-10
    recommendation: str


@dataclass
class SafetyAnalysis:
    """Complete safety analysis result"""
    risk_score: int  # 0-100
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    factors: List[str]
    recommendations: List[str]
    immediate_action_required: bool
    terrain_type: TerrainType
    estimated_sunset_minutes: Optional[int] = None


class GPSCalculator:
    """
    Advanced GPS calculations for tourist safety monitoring.
    Uses Haversine formula for accurate distance calculations.
    """
    
    # Earth radius in meters
    EARTH_RADIUS_M = 6371000
    
    # Peru danger zones (example - would come from database)
    DANGER_ZONES = [
        {
            "id": "zone-1",
            "name": "Huaycán - Alto riesgo criminal",
            "type": "criminal",
            "center": (-12.0167, -76.8833),
            "radius_m": 2000,
            "danger_level": 8,
        },
        {
            "id": "zone-2", 
            "name": "Volcán Ubinas - Zona volcánica",
            "type": "geological",
            "center": (-16.3553, -70.8969),
            "radius_m": 10000,
            "danger_level": 9,
        },
        {
            "id": "zone-3",
            "name": "Río Amazonas - Corrientes peligrosas",
            "type": "wildlife",
            "center": (-3.7489, -73.2538),
            "radius_m": 500,
            "danger_level": 6,
        },
        {
            "id": "zone-4",
            "name": "Nevado Huascarán - Avalanchas",
            "type": "geological",
            "center": (-9.1225, -77.6041),
            "radius_m": 5000,
            "danger_level": 7,
        },
    ]
    
    # Altitude thresholds for Peru
    ALTITUDE_THRESHOLDS = {
        "safe": 2500,        # Below this is generally safe
        "moderate": 3500,    # Altitude sickness possible
        "high": 4500,        # Significant altitude risk
        "extreme": 5000,     # Extreme altitude
    }
    
    @staticmethod
    def haversine_distance(point1: GeoPoint, point2: GeoPoint) -> float:
        """
        Calculate the great-circle distance between two points
        on the Earth using the Haversine formula.
        
        Returns: Distance in meters
        """
        lat1 = math.radians(point1.latitude)
        lat2 = math.radians(point2.latitude)
        dlat = math.radians(point2.latitude - point1.latitude)
        dlon = math.radians(point2.longitude - point1.longitude)
        
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return GPSCalculator.EARTH_RADIUS_M * c
    
    @staticmethod
    def calculate_bearing(point1: GeoPoint, point2: GeoPoint) -> float:
        """
        Calculate the bearing (direction) from point1 to point2.
        
        Returns: Bearing in degrees (0-360, where 0 is North)
        """
        lat1 = math.radians(point1.latitude)
        lat2 = math.radians(point2.latitude)
        dlon = math.radians(point2.longitude - point1.longitude)
        
        x = math.sin(dlon) * math.cos(lat2)
        y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        
        bearing = math.atan2(x, y)
        bearing = math.degrees(bearing)
        
        return (bearing + 360) % 360
    
    @classmethod
    def calculate_speed(cls, point1: GeoPoint, point2: GeoPoint) -> SpeedAnalysis:
        """
        Calculate speed between two GPS points.
        
        Returns: SpeedAnalysis with speed in km/h and m/s
        """
        if not point1.timestamp or not point2.timestamp:
            raise ValueError("Both points must have timestamps")
        
        distance = cls.haversine_distance(point1, point2)
        duration = (point2.timestamp - point1.timestamp).total_seconds()
        
        if duration <= 0:
            return SpeedAnalysis(
                speed_kmh=0,
                speed_ms=0,
                distance_m=distance,
                duration_seconds=0,
                is_abnormal=True,
            )
        
        speed_ms = distance / duration
        speed_kmh = speed_ms * 3.6
        
        # Check if speed is abnormal (too fast for walking/vehicle)
        is_abnormal = speed_kmh > 150 or speed_kmh < 0
        
        return SpeedAnalysis(
            speed_kmh=speed_kmh,
            speed_ms=speed_ms,
            distance_m=distance,
            duration_seconds=duration,
            is_abnormal=is_abnormal,
        )
    
    @classmethod
    def calculate_route_deviation(
        cls,
        current_point: GeoPoint,
        route_points: List[GeoPoint],
    ) -> DeviationAnalysis:
        """
        Calculate how far the current point is from the planned route.
        Uses perpendicular distance to route segments.
        
        Returns: DeviationAnalysis with distance to nearest route point
        """
        if not route_points:
            return DeviationAnalysis(deviation_meters=0, is_off_route=False)
        
        min_distance = float('inf')
        nearest_point = None
        
        # Find nearest point on route
        for route_point in route_points:
            distance = cls.haversine_distance(current_point, route_point)
            if distance < min_distance:
                min_distance = distance
                nearest_point = route_point
        
        # Also check segments between points
        for i in range(len(route_points) - 1):
            segment_distance = cls._point_to_segment_distance(
                current_point,
                route_points[i],
                route_points[i + 1],
            )
            if segment_distance < min_distance:
                min_distance = segment_distance
        
        return DeviationAnalysis(
            deviation_meters=min_distance,
            is_off_route=min_distance > 500,  # 500m threshold
            nearest_route_point=nearest_point,
        )
    
    @classmethod
    def _point_to_segment_distance(
        cls,
        point: GeoPoint,
        segment_start: GeoPoint,
        segment_end: GeoPoint,
    ) -> float:
        """Calculate perpendicular distance from point to line segment."""
        # Simplified approach using projection
        d_start = cls.haversine_distance(point, segment_start)
        d_end = cls.haversine_distance(point, segment_end)
        d_segment = cls.haversine_distance(segment_start, segment_end)
        
        if d_segment == 0:
            return d_start
        
        # Use minimum of distances to endpoints and midpoint
        mid = GeoPoint(
            latitude=(segment_start.latitude + segment_end.latitude) / 2,
            longitude=(segment_start.longitude + segment_end.longitude) / 2,
        )
        d_mid = cls.haversine_distance(point, mid)
        
        return min(d_start, d_end, d_mid)
    
    @classmethod
    def check_danger_zones(cls, point: GeoPoint) -> List[ProximityAlert]:
        """
        Check if point is near any known danger zones.
        
        Returns: List of ProximityAlerts for nearby zones
        """
        alerts = []
        
        for zone in cls.DANGER_ZONES:
            zone_center = GeoPoint(
                latitude=zone["center"][0],
                longitude=zone["center"][1],
            )
            
            distance = cls.haversine_distance(point, zone_center)
            
            # Alert if within 2x the zone radius
            if distance < zone["radius_m"] * 2:
                alerts.append(ProximityAlert(
                    zone_id=zone["id"],
                    zone_name=zone["name"],
                    zone_type=zone["type"],
                    distance_meters=distance,
                    danger_level=zone["danger_level"],
                    recommendation=cls._get_zone_recommendation(zone["type"], distance, zone["radius_m"]),
                ))
        
        return alerts
    
    @staticmethod
    def _get_zone_recommendation(zone_type: str, distance: float, radius: float) -> str:
        """Generate safety recommendation based on zone type."""
        if distance < radius:
            inside = True
            status = "DENTRO de"
        else:
            inside = False
            status = f"a {int(distance - radius)}m de"
        
        recommendations = {
            "criminal": f"⚠️ Estás {status} zona de alto riesgo criminal. {'¡SALIR INMEDIATAMENTE!' if inside else 'Evitar ingresar.'}",
            "geological": f"🌋 Estás {status} zona de riesgo geológico. {'Evacuar área.' if inside else 'Mantener distancia.'}",
            "weather": f"🌧️ Estás {status} zona de clima peligroso. {'Buscar refugio.' if inside else 'Monitorear condiciones.'}",
            "wildlife": f"🐊 Estás {status} zona de fauna peligrosa. {'Extremar precaución.' if inside else 'Proceder con cuidado.'}",
        }
        
        return recommendations.get(zone_type, "Proceder con precaución.")
    
    @classmethod
    def determine_terrain(cls, point: GeoPoint) -> TerrainType:
        """
        Determine terrain type based on coordinates.
        Peru is divided into Costa, Sierra, and Selva.
        """
        lat, lon = point.latitude, point.longitude
        
        # Simplified terrain detection based on coordinates
        # Costa: Western coast
        if lon > -77.5:
            if lat > -6:
                return TerrainType.SELVA if lon > -76 else TerrainType.COSTA
            elif lat > -18:
                return TerrainType.COSTA if lon > -76 else TerrainType.SIERRA
            else:
                return TerrainType.COSTA
        
        # Sierra: Andes mountains
        if -77.5 >= lon > -73.5:
            return TerrainType.SIERRA
        
        # Selva: Amazon
        return TerrainType.SELVA
    
    @classmethod
    def calculate_altitude_risk(cls, altitude: Optional[float]) -> Tuple[int, str]:
        """
        Calculate risk level based on altitude.
        
        Returns: (risk_score 0-100, risk_description)
        """
        if altitude is None:
            return 0, "Altitud desconocida"
        
        if altitude < cls.ALTITUDE_THRESHOLDS["safe"]:
            return 0, "Altitud segura"
        elif altitude < cls.ALTITUDE_THRESHOLDS["moderate"]:
            return 20, "Altitud moderada - posible mal de altura leve"
        elif altitude < cls.ALTITUDE_THRESHOLDS["high"]:
            return 45, "Altitud alta - riesgo de soroche"
        elif altitude < cls.ALTITUDE_THRESHOLDS["extreme"]:
            return 70, "Altitud muy alta - riesgo significativo"
        else:
            return 90, "Altitud extrema - peligro de hipoxia"
    
    @classmethod
    def analyze_movement_pattern(
        cls,
        history: List[GeoPoint],
    ) -> Dict:
        """
        Analyze movement pattern from GPS history.
        Detects: stopped too long, erratic movement, impossible speeds.
        
        Returns: Dict with analysis results
        """
        if len(history) < 2:
            return {"pattern": "insufficient_data", "concern": False}
        
        analysis = {
            "total_distance_m": 0,
            "total_time_s": 0,
            "avg_speed_kmh": 0,
            "max_speed_kmh": 0,
            "stopped_duration_s": 0,
            "erratic_movements": 0,
            "pattern": "normal",
            "concern": False,
        }
        
        prev_point = history[0]
        for point in history[1:]:
            if point.timestamp and prev_point.timestamp:
                speed_result = cls.calculate_speed(prev_point, point)
                
                analysis["total_distance_m"] += speed_result.distance_m
                analysis["total_time_s"] += speed_result.duration_seconds
                
                if speed_result.speed_kmh > analysis["max_speed_kmh"]:
                    analysis["max_speed_kmh"] = speed_result.speed_kmh
                
                # Detect erratic movement (sudden direction changes)
                if speed_result.speed_kmh < 0.5:
                    analysis["stopped_duration_s"] += speed_result.duration_seconds
                
                if speed_result.is_abnormal:
                    analysis["erratic_movements"] += 1
            
            prev_point = point
        
        if analysis["total_time_s"] > 0:
            analysis["avg_speed_kmh"] = (analysis["total_distance_m"] / analysis["total_time_s"]) * 3.6
        
        # Determine pattern
        if analysis["stopped_duration_s"] > 1800:  # 30 minutes
            analysis["pattern"] = "prolonged_stop"
            analysis["concern"] = True
        elif analysis["erratic_movements"] > 3:
            analysis["pattern"] = "erratic"
            analysis["concern"] = True
        elif analysis["max_speed_kmh"] > 150:
            analysis["pattern"] = "impossible_speed"
            analysis["concern"] = True
        
        return analysis
    
    @classmethod
    def estimate_sunset_time(cls, point: GeoPoint, current_time: datetime) -> int:
        """
        Estimate minutes until sunset based on location and date.
        
        Returns: Minutes until sunset (negative if already dark)
        """
        # Simplified sunset calculation for Peru (around -12 latitude)
        # Average sunset in Peru is around 6:00-6:30 PM
        
        month = current_time.month
        
        # Sunset time varies by month (summer vs winter in southern hemisphere)
        if month in [12, 1, 2, 3]:  # Summer
            sunset_hour = 18.5  # 6:30 PM
        elif month in [6, 7, 8]:  # Winter
            sunset_hour = 17.8  # 5:48 PM
        else:  # Spring/Fall
            sunset_hour = 18.0  # 6:00 PM
        
        current_decimal_hour = current_time.hour + current_time.minute / 60
        minutes_until_sunset = (sunset_hour - current_decimal_hour) * 60
        
        return int(minutes_until_sunset)
    
    @classmethod
    def comprehensive_safety_analysis(
        cls,
        current_point: GeoPoint,
        history: List[GeoPoint],
        route_points: Optional[List[GeoPoint]] = None,
        battery_level: Optional[int] = None,
        current_time: Optional[datetime] = None,
    ) -> SafetyAnalysis:
        """
        Perform comprehensive safety analysis combining all factors.
        
        Returns: SafetyAnalysis with risk score and recommendations
        """
        risk_score = 0
        factors = []
        recommendations = []
        
        # 1. Check danger zones
        danger_zones = cls.check_danger_zones(current_point)
        for zone in danger_zones:
            zone_risk = zone.danger_level * 8  # Scale to 0-80
            if zone.distance_meters < 500:
                zone_risk = min(zone_risk * 1.5, 100)
            risk_score += zone_risk / (len(danger_zones) + 1)
            factors.append(f"Cerca de {zone.zone_name}")
            recommendations.append(zone.recommendation)
        
        # 2. Check altitude
        altitude_risk, altitude_desc = cls.calculate_altitude_risk(current_point.altitude)
        risk_score += altitude_risk * 0.2
        if altitude_risk > 30:
            factors.append(altitude_desc)
            recommendations.append("Monitorear síntomas de mal de altura")
        
        # 3. Check route deviation
        if route_points:
            deviation = cls.calculate_route_deviation(current_point, route_points)
            if deviation.is_off_route:
                risk_score += 20
                factors.append(f"Desviación de ruta: {int(deviation.deviation_meters)}m")
                recommendations.append("Regresar a ruta planificada")
        
        # 4. Check movement pattern
        pattern_analysis = cls.analyze_movement_pattern(history)
        if pattern_analysis["concern"]:
            risk_score += 25
            factors.append(f"Patrón de movimiento: {pattern_analysis['pattern']}")
            if pattern_analysis["pattern"] == "prolonged_stop":
                recommendations.append("Verificar estado del turista")
        
        # 5. Check battery
        if battery_level is not None:
            if battery_level < 10:
                risk_score += 30
                factors.append(f"Batería crítica: {battery_level}%")
                recommendations.append("Conservar batería - reducir uso")
            elif battery_level < 20:
                risk_score += 15
                factors.append(f"Batería baja: {battery_level}%")
        
        # 6. Check time of day
        if current_time:
            sunset_mins = cls.estimate_sunset_time(current_point, current_time)
            if sunset_mins < 0:
                risk_score += 25
                factors.append("Oscuridad - noche")
                recommendations.append("Buscar lugar seguro para pernoctar")
            elif sunset_mins < 60:
                risk_score += 15
                factors.append(f"Poco tiempo hasta oscurecer: {sunset_mins} min")
                recommendations.append("Acelerar retorno a zona segura")
        
        # Determine terrain
        terrain = cls.determine_terrain(current_point)
        
        # Cap risk score at 100
        risk_score = min(int(risk_score), 100)
        
        # Determine risk level
        if risk_score < 30:
            risk_level = "low"
        elif risk_score < 60:
            risk_level = "medium"
        elif risk_score < 80:
            risk_level = "high"
        else:
            risk_level = "critical"
        
        return SafetyAnalysis(
            risk_score=risk_score,
            risk_level=risk_level,
            factors=factors if factors else ["Sin factores de riesgo detectados"],
            recommendations=recommendations if recommendations else ["Continuar con precaución normal"],
            immediate_action_required=risk_score >= 80,
            terrain_type=terrain,
            estimated_sunset_minutes=cls.estimate_sunset_time(current_point, current_time) if current_time else None,
        )
