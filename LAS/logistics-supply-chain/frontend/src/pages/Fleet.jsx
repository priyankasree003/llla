import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, Chip } from '@mui/material';
import { fleetService } from '../services/api';

function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const response = await fleetService.getAll();
        setVehicles(response.data.data);
      } catch (error) {
        console.error('Error fetching fleet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFleet();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Fleet Tracking
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Registration</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Fuel %</strong></TableCell>
                  <TableCell align="right"><strong>Capacity (kg)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.registrationNumber}</TableCell>
                    <TableCell>{vehicle.vehicleType}</TableCell>
                    <TableCell>
                      <Chip
                        label={vehicle.currentStatus}
                        color={vehicle.currentStatus === 'in_transit' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{vehicle.fuelLevel}%</TableCell>
                    <TableCell align="right">{vehicle.capacityKg}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Fleet;
