import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const inventoryService = {
  getAll: () => apiClient.get('/api/inventory'),
  getById: (id) => apiClient.get(`/api/inventory/${id}`),
  create: (data) => apiClient.post('/api/inventory', data),
  update: (id, data) => apiClient.put(`/api/inventory/${id}`, data),
  delete: (id) => apiClient.delete(`/api/inventory/${id}`)
};

export const fleetService = {
  getAll: () => apiClient.get('/api/fleet'),
  getLocation: (vehicleId) => apiClient.get(`/api/fleet/${vehicleId}/location`),
  updateLocation: (vehicleId, data) => apiClient.post(`/api/fleet/${vehicleId}/location`, data)
};

export const routeService = {
  getAll: () => apiClient.get('/api/routes'),
  optimize: (data) => apiClient.post('/api/routes/optimize', data),
  trackProgress: (routeId) => apiClient.get(`/api/routes/${routeId}/track`)
};

export const forecastService = {
  getByProduct: (productId) => apiClient.get(`/api/forecast/${productId}`)
};

export const anomalyService = {
  detect: (data) => apiClient.post('/api/anomalies/detect', data),
  getHistory: () => apiClient.get('/api/anomalies/history')
};

export const syncService = {
  pull: (lastSync) => apiClient.post('/api/sync/pull', { lastSyncTimestamp: lastSync }),
  push: (changes) => apiClient.post('/api/sync/push', { changes })
};

export default apiClient;
