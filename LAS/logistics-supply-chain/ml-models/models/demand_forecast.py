import numpy as np
from sklearn.preprocessing import StandardScaler
import json

class DemandForecaster:
    """
    LSTM-like demand forecasting using numpy
    Predicts inventory demand for next 30 days
    """
    
    def __init__(self, sequence_length=30):
        self.sequence_length = sequence_length
        self.scaler = StandardScaler()
        self.weights = None
        self.is_trained = False
    
    def prepare_data(self, historical_data):
        """Prepare time series data for forecasting"""
        if len(historical_data) < self.sequence_length:
            raise ValueError(f"Need at least {self.sequence_length} data points")
        
        data = np.array(historical_data, dtype=float)
        data_scaled = self.scaler.fit_transform(data.reshape(-1, 1)).flatten()
        
        X, y = [], []
        for i in range(len(data_scaled) - self.sequence_length):
            X.append(data_scaled[i:i+self.sequence_length])
            y.append(data_scaled[i+self.sequence_length])
        
        return np.array(X), np.array(y)
    
    def simple_forecast(self, historical_data, forecast_days=30):
        """
        Simple forecasting using exponential smoothing
        Returns: predictions, confidence scores
        """
        data = np.array(historical_data, dtype=float)
        
        # Exponential smoothing
        alpha = 0.3  # Smoothing factor
        forecast = []
        
        # Initialize
        level = data[0]
        trend = (data[1] - data[0]) / 30 if len(data) > 1 else 0
        
        # Fit to historical data
        for i in range(1, len(data)):
            level_prev = level
            level = alpha * data[i] + (1 - alpha) * (level + trend)
            trend = 0.1 * (level - level_prev) + 0.9 * trend
        
        # Forecast
        for i in range(forecast_days):
            forecast.append(level + (i + 1) * trend)
            # Update level for next iteration
            level = level + trend
        
        # Calculate confidence based on historical volatility
        volatility = np.std(np.diff(data))
        base_confidence = max(0.5, 1.0 - (volatility / np.mean(data)))
        
        confidence_scores = [base_confidence * (1 - i * 0.01) for i in range(forecast_days)]
        
        # Inverse transform
        forecast_original = self.scaler.inverse_transform(
            np.array(forecast).reshape(-1, 1)
        ).flatten()
        
        return forecast_original, np.clip(confidence_scores, 0.5, 0.99)
    
    def forecast(self, historical_data, forecast_days=30):
        """
        Main forecasting method
        Returns: daily predictions for next N days with confidence scores
        """
        forecast, confidence = self.simple_forecast(historical_data, forecast_days)
        
        # Ensure positive quantities
        forecast = np.maximum(forecast, 0)
        
        # Round to integers
        forecast = np.round(forecast).astype(int)
        
        return {
            'daily_forecast': forecast.tolist(),
            'confidence_scores': confidence.tolist(),
            'average_demand': float(np.mean(forecast)),
            'peak_demand': int(np.max(forecast)),
            'recommended_safety_stock': int(np.mean(forecast) + 2 * np.std(forecast))
        }


if __name__ == '__main__':
    # Test
    forecaster = DemandForecaster()
    
    # Simulated historical data (90 days)
    historical = np.array([100, 110, 105, 120, 115, 130, 125, 140, 135, 150] * 9)
    
    result = forecaster.forecast(historical, forecast_days=30)
    print(json.dumps(result, indent=2))
