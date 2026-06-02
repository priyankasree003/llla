from flask import Flask, request, jsonify
import numpy as np
from datetime import datetime
import sys
import os

# Add models to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))

from demand_forecast import DemandForecaster
from route_optimizer import RouteOptimizer
from anomaly_detector import AnomalyDetector, predict_breakdown_risk

app = Flask(__name__)

# Initialize ML models
forecaster = DemandForecaster()
route_optimizer = RouteOptimizer()
anomaly_detector = AnomalyDetector()

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'ml-server',
        'timestamp': datetime.now().isoformat()
    })

# Demand Forecasting
@app.route('/forecast/<int:product_id>', methods=['GET'])
def forecast(product_id):
    """Get demand forecast for a product"""
    try:
        # In production, fetch historical data from database
        # For POC, use dummy data
        historical_data = np.array([100, 110, 105, 120, 115, 130, 125, 140, 135, 150] * 9)
        
        forecast_days = request.args.get('days', 30, type=int)
        result = forecaster.forecast(historical_data, forecast_days=forecast_days)
        
        return jsonify({
            'success': True,
            'data': {
                'productId': product_id,
                'forecast': result['daily_forecast'],
                'confidenceScore': float(np.mean(result['confidence_scores'])),
                'recommendedSafetyStock': result['recommended_safety_stock'],
                'averageDemand': result['average_demand'],
                'peakDemand': result['peak_demand'],
                'forecastPeriod': f"{forecast_days} days"
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Route Optimization
@app.route('/optimize', methods=['POST'])
def optimize_route():
    """Optimize delivery route"""
    try:
        data = request.json
        waypoints = data.get('waypoints', [])
        vehicle_capacity = data.get('constraints', {}).get('capacity', 5000)
        
        if not waypoints or len(waypoints) < 2:
            return jsonify({'success': False, 'error': 'At least 2 waypoints required'}), 400
        
        # Format waypoints for optimizer
        formatted_waypoints = [
            {
                'location': (wp['lat'], wp['lng']),
                'items': wp.get('items', 0)
            }
            for wp in waypoints
        ]
        
        result = route_optimizer.optimize(formatted_waypoints, vehicle_capacity)
        
        return jsonify({
            'success': True,
            'data': {
                'route': result['optimized_route'],
                'totalDistanceKm': result['total_distance_km'],
                'fuelSavings': result['fuel_savings'],
                'carbonReduction': result['carbon_reduction_kg'],
                'estimatedTimeHours': result['estimated_time_hours'],
                'savingsPercent': 15  # Typical savings
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Anomaly Detection
@app.route('/anomalies/detect', methods=['POST'])
def detect_anomalies():
    """Detect anomalies in vehicle telemetry"""
    try:
        data = request.json
        vehicle_id = data.get('vehicleId')
        telemetry = data.get('telemetryData', {})
        
        result = anomaly_detector.detect_anomalies(telemetry)
        
        return jsonify({
            'success': True,
            'data': {
                'vehicleId': vehicle_id,
                'isAnomaly': result['is_anomaly'],
                'riskScore': result['risk_score'],
                'confidence': result['confidence'],
                'anomalies': result['detected_anomalies'],
                'recommendation': result['recommendation']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Breakdown Prediction
@app.route('/predict/breakdown', methods=['POST'])
def predict_breakdown():
    """Predict breakdown risk for next 24 hours"""
    try:
        data = request.json
        vehicle_id = data.get('vehicleId')
        current_telemetry = data.get('currentTelemetry', {})
        history = data.get('history', [])
        
        result = predict_breakdown_risk(history or [], current_telemetry)
        
        return jsonify({
            'success': True,
            'data': {
                'vehicleId': vehicle_id,
                'breakdownProbability': result['breakdown_probability'],
                'riskLevel': result['risk_level'],
                'nextServiceUrgency': result['next_service_urgency'],
                'recommendation': f"Service urgency: {result['next_service_urgency'].upper()}"
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Batch predictions
@app.route('/batch/forecast', methods=['POST'])
def batch_forecast():
    """Forecast for multiple products"""
    try:
        data = request.json
        product_ids = data.get('productIds', [])
        
        results = []
        for product_id in product_ids:
            historical_data = np.array([100, 110, 105, 120, 115, 130, 125, 140, 135, 150] * 9)
            forecast_result = forecaster.forecast(historical_data, forecast_days=30)
            
            results.append({
                'productId': product_id,
                'forecast': forecast_result['daily_forecast'],
                'recommendedSafetyStock': forecast_result['recommended_safety_stock']
            })
        
        return jsonify({
            'success': True,
            'data': {
                'totalProducts': len(results),
                'forecasts': results
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print('🤖 Starting ML Server on port 5000...')
    app.run(host='0.0.0.0', port=5000, debug=True)
