import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { inventoryService, fleetService, forecastService, anomalyService } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [inventory, fleet, anomalies] = await Promise.all([
          inventoryService.getAll(),
          fleetService.getAll(),
          anomalyService.getHistory()
        ]);

        setDashboardData({
          totalInventoryItems: inventory.data.data.length,
          activeVehicles: fleet.data.data.length,
          anomalies: anomalies.data.data.length,
          inventoryData: inventory.data.data,
          fleetData: fleet.data.data
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const demandChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Predicted Demand',
      data: [650, 590, 800, 810],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const fleetStatusData = {
    labels: ['In Transit', 'Idle', 'Maintenance'],
    datasets: [{
      data: [60, 25, 15],
      backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
    }]
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ marginBottom: '30px' }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Total Inventory Items</Typography>
              <Typography variant="h4">{dashboardData.totalInventoryItems}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Active Vehicles</Typography>
              <Typography variant="h4">{dashboardData.activeVehicles}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Anomalies Detected</Typography>
              <Typography variant="h4" sx={{ color: '#F44336' }}>
                {dashboardData.anomalies}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Carbon Emissions (kg)</Typography>
              <Typography variant="h4">1,250</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ marginBottom: '15px' }}>
                Demand Forecast (30 Days)
              </Typography>
              <Line data={demandChartData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ marginBottom: '15px' }}>
                Fleet Status
              </Typography>
              <Pie data={fleetStatusData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
