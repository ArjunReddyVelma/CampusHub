import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to format errors cleanly for the frontend client
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const normalizedError = new Error(errorMessage);
    normalizedError.status = error.response ? error.response.status : null;
    normalizedError.data = error.response ? error.response.data : null;
    
    return Promise.reject(normalizedError);
  }
);

export default api;
