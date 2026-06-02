const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventory');
const fleetRoutes = require('./routes/fleet');
const routeRoutes = require('./routes/routes');
const forecastRoutes = require('./routes/forecast');
const anomalyRoutes = require('./routes/anomaly');
const syncRoutes = require('./routes/sync');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'logistics-backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/sync', syncRoutes);

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('track:vehicle', (vehicleId) => {
    socket.join(`vehicle:${vehicleId}`);
    console.log(`Client tracking vehicle: ${vehicleId}`);
  });

  socket.on('inventory:watch', (productId) => {
    socket.join(`inventory:${productId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing
module.exports = app;
