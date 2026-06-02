const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST /api/anomalies/detect
router.post('/detect', async (req, res) => {
  const { vehicleId, telemetryData } = req.body;
  
  try {
    // Call ML microservice for anomaly detection
    const mlResponse = await axios.post(
      `${process.env.ML_SERVER_URL}/anomalies/detect`,
      { vehicleId, telemetryData }
    );

    res.json({
      success: true,
      data: {
        vehicleId,
        anomalies: mlResponse.data.anomalies,
        riskScore: mlResponse.data.riskScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/anomalies/history
router.get('/history', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        vehicleId: 1,
        anomalyType: 'breakdown_risk',
        riskScore: 0.87,
        description: 'Engine temperature rising unusually',
        createdAt: new Date()
      }
    ]
  });
});

module.exports = router;
