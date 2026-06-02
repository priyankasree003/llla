-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- admin, supplier, warehouse_manager, transporter, customer
  company_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- supplier, transporter, warehouse, retailer
  location POINT, -- latitude, longitude
  contact_email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price DECIMAL(10, 2),
  company_id INTEGER REFERENCES companies(id),
  weight_kg DECIMAL(10, 2),
  volume_m3 DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  warehouse_id INTEGER REFERENCES companies(id),
  quantity INTEGER DEFAULT 0,
  reorder_point INTEGER,
  safety_stock INTEGER,
  location VARCHAR(255), -- bin/aisle location
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Demand Forecast Table
CREATE TABLE demand_forecast (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  forecast_date DATE,
  predicted_quantity INTEGER,
  confidence_score DECIMAL(3, 2),
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  company_id INTEGER REFERENCES companies(id),
  vehicle_type VARCHAR(50), -- truck, van, bike, etc
  capacity_kg DECIMAL(10, 2),
  fuel_type VARCHAR(50), -- diesel, petrol, electric
  fuel_consumption_km DECIMAL(5, 2),
  last_service DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes Table
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  origin_location POINT,
  destination_location POINT,
  distance_km DECIMAL(10, 2),
  estimated_duration_hours DECIMAL(5, 2),
  actual_duration_hours DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  carbon_emissions_kg DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Route Waypoints
CREATE TABLE route_waypoints (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id),
  sequence INTEGER,
  location POINT,
  stop_type VARCHAR(50), -- pickup, delivery
  address VARCHAR(255),
  expected_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending'
);

-- Real-time Tracking
CREATE TABLE vehicle_tracking (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  route_id INTEGER REFERENCES routes(id),
  location POINT,
  speed_kmh DECIMAL(5, 2),
  fuel_level_percent INTEGER,
  temperature_celsius DECIMAL(5, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly Detection Results
CREATE TABLE anomalies (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  anomaly_type VARCHAR(50), -- breakdown, accident, delay, unusual_route
  risk_score DECIMAL(3, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES companies(id),
  supplier_id INTEGER REFERENCES companies(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, dispatched, delivered
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(12, 2)
);

-- Offline Sync Queue
CREATE TABLE sync_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entity_type VARCHAR(50), -- inventory, order, tracking, etc
  entity_id INTEGER,
  operation VARCHAR(50), -- create, update, delete
  data JSONB,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_routes_vehicle ON routes(vehicle_id);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_tracking_vehicle ON vehicle_tracking(vehicle_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_synced ON sync_queue(synced);
