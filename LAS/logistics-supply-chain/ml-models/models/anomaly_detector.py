import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import json

class AnomalyDetector:
    """
    Isolation Forest + Statistical Analysis for fleet anomaly detection
    Detects: breakdowns, accidents, unusual delays, fraud
    """
    
    def __init__(self, contamination=0.1):
        self.contamination = contamination
        self.scaler = StandardScaler()
        self.iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.is_trained = False
        self.feature_names = [
            'speed', 'fuel_level', 'temperature', 'rpm',
            'idle_time', 'acceleration', 'braking_intensity',
            'route_deviation', 'fuel_consumption'
        ]
    
    def train(self, historical_data):
        """Train anomaly detector on historical normal data"""
        X = np.array(historical_data)
        X_scaled = self.scaler.fit_transform(X)
        self.iso_forest.fit(X_scaled)
        self.is_trained = True
        return self
    
    def detect_anomalies(self, telemetry_data):
        """
        Detect anomalies in real-time telemetry
        Returns: anomaly_type, risk_score (0-1), confidence
        """
        if not self.is_trained:
            # Use pre-trained model or defaults
            self._initialize_defaults()
        
        features = self._extract_features(telemetry_data)
        X = np.array([features])
        X_scaled = self.scaler.transform(X)
        
        # Isolation Forest prediction
        anomaly_score = self.iso_forest.score_samples(X_scaled)[0]
        prediction = self.iso_forest.predict(X_scaled)[0]
        
        # Normalize anomaly score to risk score (0-1)
        risk_score = 1 / (1 + np.exp(anomaly_score))  # Sigmoid normalization
        
        # Detect specific anomaly types
        anomalies = []
        
        # Engine temperature anomaly
        if 'temperature' in telemetry_data:
            temp = telemetry_data['temperature']
            if temp > 95 or temp < 0:
                anomalies.append({
                    'type': 'temperature_anomaly',
                    'severity': 'high' if temp > 100 else 'medium',
                    'value': temp,
                    'normal_range': [60, 90]
                })
        
        # Fuel consumption anomaly
        if 'fuel_consumption_rate' in telemetry_data:
            fuel = telemetry_data['fuel_consumption_rate']
            normal_fuel = telemetry_data.get('expected_fuel_consumption', 0.1)
            if fuel > normal_fuel * 1.5:
                anomalies.append({
                    'type': 'high_fuel_consumption',
                    'severity': 'medium',
                    'actual': fuel,
                    'expected': normal_fuel
                })
        
        # Speed anomaly (idle, excessive speed)
        if 'speed' in telemetry_data:
            speed = telemetry_data['speed']
            if speed == 0 and telemetry_data.get('engine_on', True):
                anomalies.append({
                    'type': 'idling',
                    'severity': 'low',
                    'duration_minutes': telemetry_data.get('idle_duration', 0)
                })
            elif speed > 100:
                anomalies.append({
                    'type': 'excessive_speed',
                    'severity': 'high',
                    'current_speed': speed,
                    'speed_limit': 80
                })
        
        # Route deviation
        if 'gps_deviation_km' in telemetry_data:
            deviation = telemetry_data['gps_deviation_km']
            if deviation > 5:
                anomalies.append({
                    'type': 'route_deviation',
                    'severity': 'medium',
                    'deviation_km': deviation
                })
        
        return {
            'is_anomaly': prediction == -1,
            'risk_score': float(risk_score),
            'confidence': float(min(abs(anomaly_score), 1.0)),
            'detected_anomalies': anomalies,
            'recommendation': self._get_recommendation(risk_score, anomalies)
        }
    
    def _extract_features(self, telemetry_data):
        """Extract features from telemetry data"""
        features = []
        for feature_name in self.feature_names:
            features.append(telemetry_data.get(feature_name, 0))
        return features
    
    def _initialize_defaults(self):
        """Initialize with default/pre-trained model"""
        # Dummy training data for demonstration
        normal_data = np.random.normal(loc=50, scale=10, size=(100, len(self.feature_names)))
        self.train(normal_data)
    
    def _get_recommendation(self, risk_score, anomalies):
        """Generate recommendation based on risk score and anomalies"""
        if risk_score < 0.3:
            return "Normal operation. Continue as usual."
        elif risk_score < 0.6:
            return "Minor issues detected. Schedule maintenance within 48 hours."
        else:
            return "Critical anomalies detected. Stop vehicle and perform immediate inspection."


def predict_breakdown_risk(vehicle_telemetry_history, current_data):
    """
    Predict probability of breakdown in next 24 hours
    Using historical patterns and current health metrics
    """
    detector = AnomalyDetector()
    
    # Analyze trend
    temperatures = [d.get('temperature', 70) for d in vehicle_telemetry_history[-100:]]
    fuel_consumptions = [d.get('fuel_consumption_rate', 0.1) for d in vehicle_telemetry_history[-100:]]
    
    temp_trend = np.polyfit(range(len(temperatures)), temperatures, 1)[0]
    fuel_trend = np.polyfit(range(len(fuel_consumptions)), fuel_consumptions, 1)[0]
    
    breakdown_probability = 0.0
    
    # Temperature increasing trend
    if temp_trend > 0.5:
        breakdown_probability += 0.3
    
    # Fuel consumption increasing trend
    if fuel_trend > 0.01:
        breakdown_probability += 0.2
    
    # Current anomalies
    current_anomaly = detector.detect_anomalies(current_data)
    breakdown_probability += current_anomaly['risk_score'] * 0.5
    
    return {
        'breakdown_probability': min(breakdown_probability, 1.0),
        'risk_level': 'high' if breakdown_probability > 0.7 else 'medium' if breakdown_probability > 0.4 else 'low',
        'next_service_urgency': 'immediate' if breakdown_probability > 0.7 else 'soon' if breakdown_probability > 0.4 else 'scheduled'
    }


if __name__ == '__main__':
    # Test
    detector = AnomalyDetector()
    
    test_telemetry = {
        'speed': 85,
        'fuel_level': 60,
        'temperature': 75,
        'rpm': 2500,
        'idle_time': 5,
        'acceleration': 1.2,
        'braking_intensity': 0.3,
        'route_deviation_km': 0.5,
        'fuel_consumption_rate': 0.12
    }
    
    result = detector.detect_anomalies(test_telemetry)
    print(json.dumps(result, indent=2, default=str))
