"""
Ruta Segura Perú - Predictive Danger Algorithm
Advanced mathematical algorithms for predicting tourist danger

Uses:
- Kinematics for position prediction
- Probabilistic risk scoring
- Z-Score anomaly detection
- Fatigue estimation models
- Bayesian inference for danger zones
"""
import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from enum import Enum
import statistics


class DangerType(Enum):
    NONE = "none"
    FATIGUE = "fatigue"
    DEVIATION = "deviation"
    SPEED_ANOMALY = "speed_anomaly"
    PROLONGED_STOP = "prolonged_stop"
    NIGHT_TRAVEL = "night_travel"
    ALTITUDE_RISK = "altitude_risk"
    WEATHER_RISK = "weather_risk"
    BATTERY_CRITICAL = "battery_critical"


@dataclass
class PredictionResult:
    """Result of danger prediction"""
    probability: float           # 0.0 - 1.0
    confidence: float            # 0.0 - 1.0
    danger_type: DangerType
    time_to_danger_minutes: Optional[float]
    recommended_action: str
    mathematical_basis: str


@dataclass
class TouristState:
    """Current state of a tourist for prediction"""
    latitude: float
    longitude: float
    altitude: float
    speed_kmh: float
    heading: float
    battery_level: int
    distance_traveled_km: float
    time_traveling_hours: float
    last_rest_minutes: int
    current_time: datetime


class PredictiveDangerAlgorithm:
    """
    Advanced predictive algorithms for tourist safety.
    
    Based on principles from physics, probability theory, and human factors engineering.
    """
    
    # Human fatigue model constants (based on research)
    FATIGUE_ONSET_HOURS = 4.0        # Hours before fatigue significantly increases
    CRITICAL_FATIGUE_HOURS = 8.0     # Hours when fatigue becomes dangerous
    REST_RECOVERY_RATE = 0.3         # Fatigue recovery per hour of rest
    
    # Speed anomaly thresholds
    WALKING_SPEED_RANGE = (3.0, 6.0)     # km/h
    VEHICLE_SPEED_RANGE = (30.0, 80.0)   # km/h
    
    # Altitude constants (based on physiology)
    ALTITUDE_ACCLIMATIZATION_RATE = 300  # meters per day safe
    ALTITUDE_DANGER_THRESHOLD = 3500     # meters
    
    @classmethod
    def predict_position(
        cls,
        current_lat: float,
        current_lon: float,
        speed_kmh: float,
        heading_degrees: float,
        time_minutes: float,
        acceleration_kmh2: float = 0.0,
    ) -> Tuple[float, float]:
        """
        Predict future position using kinematics.
        
        Uses the equation of motion:
        x(t) = x₀ + v₀t + ½at²
        
        Applied to geodetic coordinates with proper conversions.
        """
        # Convert time to hours
        t = time_minutes / 60.0
        
        # Calculate displacement in km
        # s = v₀t + ½at²
        displacement_km = speed_kmh * t + 0.5 * acceleration_kmh2 * t * t
        
        # Convert heading to radians (0 = North)
        heading_rad = math.radians(heading_degrees)
        
        # Calculate lat/lon displacement
        # 1 degree latitude ≈ 111 km
        # 1 degree longitude ≈ 111 * cos(latitude) km
        lat_displacement = displacement_km * math.cos(heading_rad) / 111.0
        lon_displacement = displacement_km * math.sin(heading_rad) / (111.0 * math.cos(math.radians(current_lat)))
        
        predicted_lat = current_lat + lat_displacement
        predicted_lon = current_lon + lon_displacement
        
        return (predicted_lat, predicted_lon)
    
    @classmethod
    def calculate_fatigue_probability(
        cls,
        hours_traveling: float,
        distance_km: float,
        altitude_m: float,
        minutes_since_rest: int,
    ) -> Tuple[float, str]:
        """
        Calculate probability of fatigue-related danger.
        
        Uses exponential fatigue model:
        F(t) = 1 - e^(-λt)
        
        Where λ is the fatigue rate constant.
        """
        # Base fatigue from travel time
        lambda_time = 0.15  # Fatigue rate constant
        fatigue_time = 1 - math.exp(-lambda_time * hours_traveling)
        
        # Distance fatigue (hiking is more tiring)
        fatigue_distance = min(1.0, distance_km / 20.0)  # 20km is high fatigue
        
        # Altitude fatigue (exponential increase above threshold)
        if altitude_m > cls.ALTITUDE_DANGER_THRESHOLD:
            fatigue_altitude = 1 - math.exp(-0.001 * (altitude_m - cls.ALTITUDE_DANGER_THRESHOLD))
        else:
            fatigue_altitude = 0.0
        
        # Rest recovery
        rest_factor = max(0, 1 - (minutes_since_rest / (cls.FATIGUE_ONSET_HOURS * 60)))
        
        # Combined fatigue score (weighted average)
        weights = [0.4, 0.25, 0.25, 0.1]
        factors = [fatigue_time, fatigue_distance, fatigue_altitude, rest_factor]
        
        fatigue_probability = sum(w * f for w, f in zip(weights, factors))
        fatigue_probability = min(1.0, max(0.0, fatigue_probability))
        
        # Mathematical explanation
        explanation = f"F(t) = 1 - e^(-{lambda_time:.2f}×{hours_traveling:.1f}) = {fatigue_time:.2f}"
        
        return (fatigue_probability, explanation)
    
    @classmethod
    def detect_anomaly_zscore(
        cls,
        current_value: float,
        historical_values: List[float],
        threshold: float = 2.0,
    ) -> Tuple[bool, float, str]:
        """
        Detect anomalies using Z-Score method.
        
        Z = (x - μ) / σ
        
        If |Z| > threshold, the value is an anomaly.
        """
        if len(historical_values) < 3:
            return (False, 0.0, "Insufficient data")
        
        mean = statistics.mean(historical_values)
        stdev = statistics.stdev(historical_values)
        
        if stdev == 0:
            return (False, 0.0, "No variance in data")
        
        z_score = (current_value - mean) / stdev
        is_anomaly = abs(z_score) > threshold
        
        explanation = f"Z = ({current_value:.2f} - {mean:.2f}) / {stdev:.2f} = {z_score:.2f}"
        
        return (is_anomaly, z_score, explanation)
    
    @classmethod
    def bayesian_danger_update(
        cls,
        prior_probability: float,
        evidence_probability: float,
        false_positive_rate: float = 0.1,
    ) -> Tuple[float, str]:
        """
        Update danger probability using Bayes' Theorem.
        
        P(D|E) = P(E|D) × P(D) / P(E)
        
        Where:
        - P(D|E) = Probability of danger given evidence
        - P(E|D) = Probability of evidence given danger (sensitivity)
        - P(D) = Prior probability of danger
        - P(E) = Total probability of evidence
        """
        # Sensitivity (true positive rate)
        sensitivity = evidence_probability
        
        # P(E) = P(E|D)×P(D) + P(E|¬D)×P(¬D)
        p_evidence = sensitivity * prior_probability + false_positive_rate * (1 - prior_probability)
        
        if p_evidence == 0:
            return (prior_probability, "No update - zero evidence probability")
        
        # Bayes' Theorem
        posterior = (sensitivity * prior_probability) / p_evidence
        
        explanation = f"P(D|E) = ({sensitivity:.2f} × {prior_probability:.2f}) / {p_evidence:.2f} = {posterior:.2f}"
        
        return (posterior, explanation)
    
    @classmethod
    def calculate_risk_score(
        cls,
        factors: Dict[str, float],
        weights: Optional[Dict[str, float]] = None,
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate weighted risk score.
        
        Risk = Σ(wᵢ × fᵢ) / Σwᵢ
        
        Normalized to 0-100 scale.
        """
        default_weights = {
            "fatigue": 0.20,
            "altitude": 0.15,
            "speed_anomaly": 0.15,
            "deviation": 0.15,
            "battery": 0.10,
            "night_travel": 0.10,
            "weather": 0.10,
            "zone_danger": 0.05,
        }
        
        weights = weights or default_weights
        
        weighted_sum = 0.0
        total_weight = 0.0
        contributions = {}
        
        for factor_name, factor_value in factors.items():
            weight = weights.get(factor_name, 0.0)
            contribution = weight * factor_value
            weighted_sum += contribution
            total_weight += weight
            contributions[factor_name] = contribution * 100
        
        if total_weight == 0:
            return (0.0, {})
        
        risk_score = (weighted_sum / total_weight) * 100
        
        return (min(100.0, max(0.0, risk_score)), contributions)
    
    @classmethod
    def estimate_time_to_danger(
        cls,
        current_risk: float,
        risk_change_rate: float,  # Per hour
        danger_threshold: float = 70.0,
    ) -> Optional[float]:
        """
        Estimate time until risk reaches danger threshold.
        
        Using linear extrapolation:
        t = (threshold - current) / rate
        """
        if risk_change_rate <= 0:
            return None  # Risk not increasing
        
        if current_risk >= danger_threshold:
            return 0.0  # Already dangerous
        
        time_hours = (danger_threshold - current_risk) / risk_change_rate
        time_minutes = time_hours * 60
        
        return time_minutes
    
    @classmethod
    def predict_danger(
        cls,
        state: TouristState,
        speed_history: List[float],
        previous_risk_scores: List[float],
    ) -> List[PredictionResult]:
        """
        Comprehensive danger prediction combining all algorithms.
        
        Returns prioritized list of potential dangers.
        """
        predictions = []
        
        # 1. Fatigue prediction
        fatigue_prob, fatigue_math = cls.calculate_fatigue_probability(
            hours_traveling=state.time_traveling_hours,
            distance_km=state.distance_traveled_km,
            altitude_m=state.altitude,
            minutes_since_rest=state.last_rest_minutes,
        )
        
        if fatigue_prob > 0.4:
            predictions.append(PredictionResult(
                probability=fatigue_prob,
                confidence=0.85,
                danger_type=DangerType.FATIGUE,
                time_to_danger_minutes=max(0, (0.7 - fatigue_prob) * 120),  # Estimate
                recommended_action="Sugerir descanso de 15-30 minutos",
                mathematical_basis=fatigue_math,
            ))
        
        # 2. Speed anomaly detection
        if len(speed_history) >= 5:
            is_anomaly, z_score, z_math = cls.detect_anomaly_zscore(
                current_value=state.speed_kmh,
                historical_values=speed_history[-20:],
            )
            
            if is_anomaly:
                predictions.append(PredictionResult(
                    probability=min(1.0, abs(z_score) / 3.0),
                    confidence=0.75,
                    danger_type=DangerType.SPEED_ANOMALY,
                    time_to_danger_minutes=5.0 if z_score > 0 else 15.0,
                    recommended_action="Verificar velocidad anormal - posible vehículo o caída",
                    mathematical_basis=z_math,
                ))
        
        # 3. Battery critical prediction
        if state.battery_level < 30:
            # Exponential decay model for battery
            battery_prob = 1 - math.exp(-0.05 * (30 - state.battery_level))
            
            predictions.append(PredictionResult(
                probability=battery_prob,
                confidence=0.95,
                danger_type=DangerType.BATTERY_CRITICAL,
                time_to_danger_minutes=state.battery_level * 5,  # Rough estimate
                recommended_action="Reducir uso de GPS - conservar batería",
                mathematical_basis=f"P = 1 - e^(-0.05×{30-state.battery_level}) = {battery_prob:.2f}",
            ))
        
        # 4. Night travel danger
        hour = state.current_time.hour
        if hour >= 18 or hour < 6:
            night_prob = 0.3 if hour >= 18 and hour < 20 else 0.6 if hour >= 20 or hour < 5 else 0.4
            
            predictions.append(PredictionResult(
                probability=night_prob,
                confidence=0.90,
                danger_type=DangerType.NIGHT_TRAVEL,
                time_to_danger_minutes=0.0,
                recommended_action="Buscar lugar seguro para pernoctar",
                mathematical_basis=f"Hora actual: {hour}:00 - Factor nocturno activo",
            ))
        
        # 5. Risk trend prediction
        if len(previous_risk_scores) >= 3:
            # Calculate trend using linear regression slope
            n = len(previous_risk_scores)
            x_mean = (n - 1) / 2.0
            y_mean = statistics.mean(previous_risk_scores)
            
            numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(previous_risk_scores))
            denominator = sum((i - x_mean) ** 2 for i in range(n))
            
            if denominator > 0:
                slope = numerator / denominator  # Risk change per reading
                # Assume readings every 10 seconds, convert to per hour
                risk_change_per_hour = slope * 360
                
                if risk_change_per_hour > 5:  # Risk increasing
                    time_to_danger = cls.estimate_time_to_danger(
                        current_risk=previous_risk_scores[-1],
                        risk_change_rate=risk_change_per_hour,
                    )
                    
                    if time_to_danger is not None and time_to_danger < 60:
                        predictions.append(PredictionResult(
                            probability=min(1.0, risk_change_per_hour / 20.0),
                            confidence=0.70,
                            danger_type=DangerType.DEVIATION,
                            time_to_danger_minutes=time_to_danger,
                            recommended_action="Riesgo en aumento - tomar precauciones",
                            mathematical_basis=f"Slope = {slope:.3f}, ΔR/h = {risk_change_per_hour:.1f}",
                        ))
        
        # Sort by probability descending
        predictions.sort(key=lambda p: p.probability, reverse=True)
        
        return predictions
    
    @classmethod
    def generate_mitigation_plan(
        cls,
        predictions: List[PredictionResult],
    ) -> Dict[str, any]:
        """
        Generate an actionable mitigation plan based on predictions.
        """
        if not predictions:
            return {
                "status": "safe",
                "message": "Sin peligros detectados",
                "actions": [],
                "monitoring_level": "normal",
            }
        
        # Prioritize by probability and danger type
        critical_types = [DangerType.BATTERY_CRITICAL, DangerType.SPEED_ANOMALY]
        
        actions = []
        monitoring_level = "normal"
        
        for pred in predictions[:3]:  # Top 3 predictions
            action = {
                "type": pred.danger_type.value,
                "probability": f"{pred.probability*100:.0f}%",
                "action": pred.recommended_action,
                "urgency": "alta" if pred.probability > 0.7 else "media" if pred.probability > 0.4 else "baja",
                "math": pred.mathematical_basis,
            }
            actions.append(action)
            
            if pred.probability > 0.7:
                monitoring_level = "critical"
            elif pred.probability > 0.4 and monitoring_level != "critical":
                monitoring_level = "elevated"
        
        max_prob = max(p.probability for p in predictions)
        
        return {
            "status": "danger" if max_prob > 0.7 else "warning" if max_prob > 0.4 else "caution",
            "message": f"Detectados {len(predictions)} factores de riesgo potenciales",
            "actions": actions,
            "monitoring_level": monitoring_level,
            "highest_risk": predictions[0].danger_type.value,
            "eta_danger_minutes": predictions[0].time_to_danger_minutes,
        }
