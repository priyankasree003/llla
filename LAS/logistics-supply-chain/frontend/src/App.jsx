import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard as DashboardIcon, Inventory2 as InventoryIcon, LocalShipping as FleetIcon, Map as MapIcon } from '@mui/icons-material';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Fleet from './pages/Fleet';
import Routes from './pages/Routes';
import OfflineSyncService from './services/offlineSync';

import './App.css';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Initialize offline sync
    OfflineSyncService.init();

    // Handle online/offline events
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { label: 'Fleet Tracking', icon: <FleetIcon />, path: '/fleet' },
    { label: 'Routes', icon: <MapIcon />, path: '/routes' }
  ];

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        {/* Header */}
        <AppBar position="fixed" sx={{ zIndex: 1301 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              🚚 Logistics & Supply Chain Platform
            </Typography>
            <span style={{ fontSize: '12px', marginRight: '10px' }}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ width: 250 }}
        >
          <List sx={{ marginTop: '60px' }}>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.path}
                onClick={() => {
                  window.location.href = item.path;
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, marginTop: '60px', padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/routes" element={<Routes />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
