# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  React Web App (Responsive UI)                              │
│  ├─ Dashboard (Real-time metrics)                           │
│  ├─ Inventory Management                                    │
│  ├─ Fleet Tracking (Google Maps)                            │
│  ├─ Route Optimization                                      │
│  └─ Offline Support (Service Workers + IndexedDB)           │
│                                                              │
│  Electron Desktop App (Same UI)                             │
│  ├─ Full offline functionality                              │
│  ├─ Local storage for field operations                      │
│  └─ Cross-platform (Windows/Mac/Linux)                      │
└─────────────────────────────────────────────────────────────┘
           ↓ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│  • Request validation & authentication (JWT)                │
│  • Rate limiting & CORS                                     │
│  • Request/response compression                             │
│  • Error handling & logging                                 │
│  • WebSocket management (Socket.io)                         │
└─────────────────────────────────────────────────────────────┘
      ↓ API Routes     ↓ Services     ↓ ML Calls
┌─────────────────────────────────────────────────────────────┐
│              Business Logic Layer (Node.js)                │
├─────────────────────────────────────────────────────────────┤
│  Controllers (Request handlers)                             │
│  ├─ inventoryController                                     │
│  ├─ fleetController                                         │
│  ├─ routeController                                         │
│  ├─ forecastController                                      │
│  └─ anomalyController                                       │
│                                                              │
│  Services (Business logic)                                  │
│  ├─ inventoryService                                        │
│  ├─ routeService (calls ML)                                 │
│  ├─ forecastService (calls ML)                              │
│  ├─ trackingService (WebSocket)                             │
│  ├─ syncService (Offline sync)                              │
│  └─ notificationService (Alerts)                            │
│                                                              │
│  Middleware                                                 │
│  ├─ Authentication (JWT)                                    │
│  ├─ Authorization (RBAC)                                    │
│  ├─ Validation                                              │
│  └─ Error handling                                          │
└─────────────────────────────────────────────────────────────┘
           ↓ SQL/Cache
┌──────────────────────────────────────┬──────────────────────┐
│        PostgreSQL Primary DB         │  Redis Cache         │
│ • Companies                          │ • Session data       │
│ • Users & Roles                      │ • Forecast cache     │
│ • Inventory                          │ • Real-time tracking │
│ • Routes & Vehicles                  │ • Sync queue         │
│ • Orders                             │ • Rate limits        │
│ • Tracking data                      │                      │
│ • Anomalies                          │                      │
│ • Sync queue                         │                      │
└──────────────────────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              ML Microservices (Python/Flask)               │
├─────────────────────────────────────────────────────────────┤
│  1. Demand Forecasting                                      │
│     ├─ LSTM Neural Network                                  │
│     ├─ Exponential Smoothing                                │
│     └─ Seasonal Decomposition                               │
│                                                              │
│  2. Route Optimization                                      │
│     ├─ Genetic Algorithm                                    │
│     ├─ Constraint Satisfaction                              │
│     └─ Multi-objective optimization                         │
│                                                              │
│  3. Anomaly Detection                                       │
│     ├─ Isolation Forest                                     │
│     ├─ Statistical Analysis                                 │
│     └─ Breakdown Prediction                                 │
└─────────────────────────────────────────────────────────────┘
           ↓ Maps/Weather/External APIs
┌──────────────────────────────────────────────────────────────┐
│               External Services                             │
│ • Google Maps API (routing, ETA, geocoding)                 │
│ • Weather API (traffic prediction)                          │
│ • IoT/GPS providers (vehicle tracking)                       │
│ • Email/SMS (notifications)                                 │
└──────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Frontend (React)

**Key Components:**
- `Dashboard` - Real-time KPI display with charts
- `InventoryManager` - CRUD for inventory with low stock alerts
- `FleetTracker` - Real-time vehicle tracking with Google Maps
- `RouteOptimizer` - Route planning and optimization
- `OfflineSync` - Offline-first data synchronization

**State Management:**
- Redux for global state
- Local React state for UI state
- IndexedDB for offline data

### 2. Backend (Express.js)

**Architecture Pattern:** MVC + Service Layer

**Controllers:**
- Handle HTTP requests/responses
- Validate input
- Call services

**Services:**
- Business logic
- Database queries
- ML service calls
- External API calls

**Models:**
- Database schemas (Sequelize/TypeORM)
- API request/response types

**Middleware:**
- Authentication (JWT)
- Authorization (RBAC)
- Validation
- Error handling
- Logging

### 3. Database Design

**Primary DB:** PostgreSQL
- Normalized schema for consistency
- Indexes on frequently queried fields
- Foreign keys for referential integrity

**Key Tables:**
```
Companies ─┐
           ├─ Users
Inventory ─┤─ Products ─┬─ Orders
           │            ├─ Forecast
Vehicles ──┼─ Routes    ├─ Tracking
           │
Warehouses─┘─ Orders
```

**Caching Layer:** Redis
- Session management
- Real-time tracking data (TTL: 5 min)
- Cached forecasts (TTL: 24 hours)
- Rate limiting counters

### 4. ML Pipeline

**Demand Forecasting:**
```
Historical Sales Data (90 days)
         ↓
    Data Preprocessing (normalization, detrending)
         ↓
    LSTM/Exponential Smoothing Model
         ↓
    30-Day Forecast + Confidence Scores
         ↓
    Safety Stock Recommendation
```

**Route Optimization:**
```
Waypoints + Constraints
         ↓
    Genetic Algorithm Population Init
         ↓
    Fitness Evaluation (distance, time, fuel, capacity)
         ↓
    Evolution (selection, crossover, mutation)
         ↓
    Optimized Route Order
         ↓
    Carbon Footprint Calculation
```

**Anomaly Detection:**
```
Real-time Telemetry (speed, temp, fuel, RPM)
         ↓
    Feature Extraction & Normalization
         ↓
    Isolation Forest + Statistical Analysis
         ↓
    Anomaly Scoring & Classification
         ↓
    Alerts + Recommendations
```

### 5. Offline-First Architecture

**Data Flow:**

**Online → Offline:**
```
API Server
    ↓ (fetch data)
Network
    ↓
ServiceWorker (Network First strategy)
    ↓
Cache (HTTP caching)
    ↓
IndexedDB (persistent local storage)
    ↓
React Application
```

**Offline → Online:**
```
React Application
    ↓ (user makes changes)
IndexedDB (local storage)
    ↓ (sync queue)
ServiceWorker
    ↓ (queues requests)
Network
    ↓ (when online)
API Server
    ↓
Response
    ↓
Update IndexedDB
    ↓
Update UI
```

### 6. Real-Time Updates

**WebSocket Architecture:**
```
Client                    Server
   │                        │
   ├─ Connect ─────────────→│
   │                    ┌───┴─ Create socket session
   │                    │
   ├─ emit('track:vehicle', id) ─→│
   │                    │
   ├─────────────────────────────────ack
   │                    │
   │ (Vehicle location updated on server)
   │
   │←──── broadcast vehicle:update
   │ (WebSocket from any source)
   │
   └─ Update map ◀─────────
```

## Security Architecture

### Authentication & Authorization

**JWT Token Flow:**
```
Login Request (email, password)
        ↓
Verify credentials against bcrypt hash
        ↓
Generate JWT (header.payload.signature)
        ↓
JWT includes: userId, role, permissions, expiry
        ↓
Client stores in localStorage/secure cookie
        ↓
Attach to Authorization header: "Bearer <token>"
        ↓
Middleware verifies signature and expiry
```

**RBAC (Role-Based Access Control):**
- Admin: Full system access
- Supplier: Inventory & order management
- Warehouse Manager: Inventory & space management
- Transporter: Fleet & route management
- Customer: Order tracking & notifications

### Data Security

- **At Rest:** Encrypted database backups
- **In Transit:** HTTPS/TLS
- **Passwords:** bcrypt hashing (salt rounds: 10)
- **Sensitive Data:** Environment variables
- **SQL Injection Prevention:** Parameterized queries
- **CSRF Protection:** Token validation
- **CORS:** Whitelist allowed origins

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (multiple instances)
- Load balancer (nginx/AWS ALB)
- Session storage in Redis
- Database connection pooling

### Vertical Scaling
- Database indexing optimization
- Query optimization (EXPLAIN ANALYZE)
- Caching strategy (Redis)
- Response compression (gzip)

### Performance Optimization
- Lazy loading of routes
- Image optimization
- API response pagination
- Database query batching
- CDN for static assets

## Deployment Architecture

```
GitHub/GitLab
    ↓ (push)
CI/CD Pipeline
    ├─ Tests
    ├─ Linting
    └─ Build
    ↓
Docker Registry
    ↓
Kubernetes Cluster (or Docker Swarm)
    ├─ Backend pods (replicas)
    ├─ Frontend pods
    ├─ ML server pods
    ├─ PostgreSQL (stateful)
    └─ Redis (stateful)
    ↓
Load Balancer
    ↓
CDN (CloudFlare/AWS CloudFront)
    ↓
Clients
```

## Monitoring & Logging

**Monitoring Stack:**
- Application logs: Winston/Bunyan
- System metrics: Prometheus
- Visualization: Grafana
- Tracing: Jaeger
- Error tracking: Sentry

**Key Metrics:**
- API response time
- Error rates
- Database query time
- Cache hit/miss ratio
- WebSocket connection count
- ML model inference time
