import axios from 'axios';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    withCredentials: true,
    timeout: 30000, // 30 second timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// Function to get CSRF token from cookie
const getCsrfToken = () => {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? match[1] : null;
};

// Request interceptor to add CSRF token to all state-changing requests
API.interceptors.request.use(
    (config) => {
        // Add CSRF token for non-GET requests
        if (!['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase() || '')) {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                config.headers['X-XSRF-TOKEN'] = csrfToken;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle successful responses instantly stripping the standard ApiResponse envelope
API.interceptors.response.use(
    (response) => {
        if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
            response.data = response.data.data;
        }
        return response;
    },
    (error) => {
        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            const message = 'Request timeout. Please check your connection and try again.';
            toast.error(message);
            logger.error('Request timeout', error);
            return Promise.reject(new Error(message));
        }

        // Handle network errors
        if (!error.response) {
            const message = 'Network error. Please check your internet connection.';
            toast.error(message);
            logger.error('Network error', error);
            return Promise.reject(new Error(message));
        }

        const message = error.response?.data?.message || 'Something went wrong';
        
        // Handle CSRF token errors
        if (error.response?.status === 403 && message.toLowerCase().includes('csrf')) {
            logger.warn('CSRF token error, fetching new token');
            // Fetch new CSRF token and retry
            return API.get('/csrf-token').then(() => {
                // Retry the original request
                return API.request(error.config);
            }).catch(() => {
                toast.error('Security validation failed. Please refresh the page.');
                return Promise.reject(error);
            });
        }
        
        if (error.response?.status === 401) {
            // Session expired - redirect to login
            if (window.location.pathname !== '/login') {
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
            }
        } else if (error.response?.status === 429) {
            toast.error('Too many requests. Please slow down and try again later.');
        } else if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
            logger.error('Server error', error);
        } else if (error.response?.status >= 400 && error.response?.status !== 404) {
            toast.error(message);
        }
        
        return Promise.reject(error);
    }
);

// Fetch CSRF token on app initialization
API.get('/csrf-token').catch(() => {
    console.warn('Failed to fetch CSRF token');
});

export default API;
