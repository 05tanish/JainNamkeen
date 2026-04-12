import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    withCredentials: true
});

// Handle successful responses instantly stripping the standard ApiResponse envelope
API.interceptors.response.use(
    (response) => {
        if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
            response.data = response.data.data;
        }
        return response;
    },
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong';
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
            }
        } else if (error.response?.status >= 400 && error.response?.status !== 404) {
            toast.error(message);
        }
        return Promise.reject(error);
    }
);

export default API;
