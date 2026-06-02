import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

function Routes() {
  return (
    <Box>
      <Typography variant="h5" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Route Management & Optimization
      </Typography>

      <Card>
        <CardContent>
          <Typography color="textSecondary">
            📍 Route optimization with AI-powered recommendations coming soon!
          </Typography>
          <Typography sx={{ marginTop: '10px' }}>
            Features:
            <ul>
              <li>Optimize routes to reduce fuel consumption</li>
              <li>Real-time tracking with Google Maps</li>
              <li>Carbon footprint calculation</li>
              <li>Waypoint management</li>
              <li>ETA predictions</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Routes;
