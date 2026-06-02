# API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All endpoints (except `/auth/login` and `/auth/register`) require JWT token in header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register new user
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "fullName": "John Doe",
  "role": "supplier", // admin, supplier, warehouse_manager, transporter, customer
  "companyId": 1
}
```

#### POST /auth/login
Login and get JWT token
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```
Response:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "email": "user@example.com",
    "role": "supplier"
  }
}
```

### Inventory Management

#### GET /inventory
Get all inventory items
**Query Parameters:**
- `warehouseId` (optional): Filter by warehouse
- `productId` (optional): Filter by product
- `limit` (optional): Default 50

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Widget A",
      "quantity": 500,
      "reorderPoint": 100,
      "safetyStock": 150,
      "warehouse": "Central Warehouse",
      "location": "Aisle B, Shelf 3"
    }
  ]
}
```

#### POST /inventory
Create new inventory item
```json
{
  "productId": 1,
  "warehouseId": 1,
  "quantity": 500,
  "reorderPoint": 100,
  "safetyStock": 150
}
```

#### PUT /inventory/:id
Update inventory
```json
{
  "quantity": 450,
  "reorderPoint": 120
}
```

#### DELETE /inventory/:id
Delete inventory item

### Demand Forecasting

#### GET /forecast/:productId
Get demand forecast for 30 days
**Query Parameters:**
- `days` (optional): Number of days to forecast (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "forecast": [100, 105, 110, 115, 120, ...],
    "confidenceScore": 0.87,
    "recommendedSafetyStock": 250,
    "averageDemand": 110,
    "peakDemand": 150,
    "forecastPeriod": "30 days"
  }
}
```

### Fleet & Vehicle Management

#### GET /fleet
Get all vehicles
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "registrationNumber": "TRK-001",
      "vehicleType": "truck",
      "capacityKg": 5000,
      "fuelType": "diesel",
      "currentLocation": {"lat": 28.7041, "lng": 77.1025},
      "currentStatus": "in_transit",
      "fuelLevel": 75,
      "temperature": 22
    }
  ]
}
```

#### GET /fleet/:id/location
Get real-time vehicle location
**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": 1,
    "location": {"lat": 28.7041, "lng": 77.1025},
    "speed": 60,
    "heading": 45,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /fleet/:id/location
Update vehicle location (from GPS/IoT devices)
```json
{
  "location": {"lat": 28.7041, "lng": 77.1025},
  "speed": 60,
  "fuelLevel": 72,
  "temperature": 23
}
```

### Route Optimization

#### GET /routes
Get all routes
**Query Parameters:**
- `status` (optional): planned, in_progress, completed
- `vehicleId` (optional): Filter by vehicle

#### POST /routes/optimize
Optimize route for multiple waypoints
```json
{
  "vehicleId": 1,
  "waypoints": [
    {"lat": 28.7041, "lng": 77.1025, "items": 100},
    {"lat": 28.5355, "lng": 77.3910, "items": 150},
    {"lat": 28.6139, "lng": 77.2090, "items": 200}
  ],
  "constraints": {
    "capacity": 5000,
    "maxDuration": 8
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimizedRoute": [0, 2, 1],
    "estimatedSavings": 250,
    "carbonReduction": 15.5,
    "estimatedTimeHours": 2.5,
    "totalDistanceKm": 45
  }
}
```

#### GET /routes/:id/track
Track route progress
**Response:**
```json
{
  "success": true,
  "data": {
    "routeId": 1,
    "progress": 65,
    "waypoints": [
      {"sequence": 1, "status": "completed", "arrivedAt": "2024-01-15T09:30:00Z"},
      {"sequence": 2, "status": "in_progress"},
      {"sequence": 3, "status": "pending"}
    ]
  }
}
```

### Anomaly Detection

#### POST /anomalies/detect
Detect anomalies in vehicle telemetry
```json
{
  "vehicleId": 1,
  "telemetryData": {
    "speed": 85,
    "temperature": 95,
    "fuel_level": 60,
    "rpm": 2500,
    "fuel_consumption_rate": 0.15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": 1,
    "isAnomaly": true,
    "riskScore": 0.78,
    "anomalies": [
      {
        "type": "high_fuel_consumption",
        "severity": "medium",
        "actual": 0.15,
        "expected": 0.1
      }
    ],
    "recommendation": "Schedule maintenance within 48 hours"
  }
}
```

#### GET /anomalies/history
Get anomaly history
**Query Parameters:**
- `vehicleId` (optional): Filter by vehicle
- `days` (optional): Last N days (default: 30)

### Offline Sync

#### POST /sync/pull
Pull data for offline use
```json
{
  "lastSyncTimestamp": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inventory": [...],
    "orders": [...],
    "routes": [...],
    "forecast": [...],
    "timestamp": "2024-01-15T10:05:00Z"
  }
}
```

#### POST /sync/push
Push offline changes
```json
{
  "changes": [
    {
      "entityType": "inventory",
      "entityId": 1,
      "operation": "update",
      "data": {"quantity": 450}
    }
  ]
}
```

## WebSocket Events (Real-time)

### Connection
```javascript
const socket = io('http://localhost:3000');
```

### Events

**Track Vehicle:**
```javascript
socket.emit('track:vehicle', vehicleId);
socket.on('vehicle:update', (data) => {
  // Receive real-time location updates
  console.log(data);
});
```

**Watch Inventory:**
```javascript
socket.emit('inventory:watch', productId);
socket.on('inventory:change', (data) => {
  console.log(data);
});
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Rate Limiting
- 1000 requests per hour per IP
- Header: `X-RateLimit-Remaining`

## Pagination
Most list endpoints support pagination:
- `?page=1` - Page number (default: 1)
- `?limit=50` - Items per page (default: 50)

## Filtering & Sorting
- `?sort=createdAt` - Sort field
- `?order=asc` - Sort order (asc/desc)
- `?search=text` - Text search
