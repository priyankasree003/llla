const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/forecast/:productId
router.get('/:productId', async (req, res) => {
  try {
    // Call ML microservice for demand forecasting
    const mlResponse = await axios.get(
      `${process.env.ML_SERVER_URL}/forecast/${req.params.productId}`
    );

    res.json({
      success: true,
      data: {
        productId: req.params.productId,
        forecast: mlResponse.data.forecast,
        confidenceScore: mlResponse.data.confidenceScore,
        recommendedSafetyStock: mlResponse.data.recommendedSafetyStock,
        forecastPeriod: '30 days'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
