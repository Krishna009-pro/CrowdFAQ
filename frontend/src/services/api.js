import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Maps to backend via Vite reverse proxy
});

// Interceptor to inject token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
