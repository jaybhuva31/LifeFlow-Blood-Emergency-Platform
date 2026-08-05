import axios from 'axios';

// Create a configured Axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the JWT auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors like token expiry (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If response status is 401 Unauthorized, it means the token is expired/invalid
    if (error.response && error.response.status === 401) {
      // Clear token and reload or redirect if necessary (handled by AuthContext state)
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    return Promise.reject(error);
  }
);

export default api;
