const express = require('express');
const router = express.Router();

// GET /api/fleet
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        registrationNumber: 'TRK-001',
        vehicleType: 'truck',
        capacityKg: 5000,
        fuelType: 'diesel',
        currentLocation: { lat: 28.7041, lng: 77.1025 },
        currentStatus: 'in_transit',
        fuelLevel: 75,
        temperature: 22
      }
    ]
  });
});

// GET /api/fleet/:id/location - Real-time tracking
router.get('/:id/location', (req, res) => {
  res.json({
    success: true,
    data: {
      vehicleId: req.params.id,
      location: { lat: 28.7041, lng: 77.1025 },
      speed: 60,
      heading: 45,
      timestamp: new Date().toISOString()
    }
  });
});

// POST /api/fleet/:id/location - Update location
router.post('/:id/location', (req, res) => {
  const { location, speed, fuelLevel, temperature } = req.body;
  // TODO: Save tracking data
  res.json({ success: true, message: 'Location updated' });
});

module.exports = router;
