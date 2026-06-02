const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        vehicleId: 1,
        originLocation: { lat: 28.7041, lng: 77.1025 },
        destinationLocation: { lat: 28.5355, lng: 77.3910 },
        distanceKm: 25,
        estimatedDuration: 1.5,
        status: 'in_progress',
        carbonEmissionsKg: 8.5
      }
    ]
  });
});

// POST /api/routes/optimize - Optimize route using ML
router.post('/optimize', async (req, res) => {
  const { vehicleId, waypoints, constraints } = req.body;
  
  try {
    // Call ML microservice for route optimization
    const mlResponse = await axios.post(
      `${process.env.ML_SERVER_URL}/optimize`,
      { waypoints, constraints, vehicleId }
    );

    res.json({
      success: true,
      data: {
        optimizedRoute: mlResponse.data.route,
        estimatedSavings: mlResponse.data.savings,
        carbonReduction: mlResponse.data.carbonReduction
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/routes/:id/track - Track route progress
router.get('/:id/track', (req, res) => {
  res.json({
    success: true,
    data: {
      routeId: req.params.id,
      progress: 65,
      waypoints: [
        { sequence: 1, status: 'completed', arrivedAt: new Date() },
        { sequence: 2, status: 'in_progress', arrivedAt: null },
        { sequence: 3, status: 'pending', arrivedAt: null }
      ]
    }
  });
});

module.exports = router;
