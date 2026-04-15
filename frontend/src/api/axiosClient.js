import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// 1. Send the token on every request (Using sessionStorage for independent tabs)
axiosClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. Catch expired tokens globally
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired. Clear it and redirect to login.
            sessionStorage.removeItem('token');
            window.location.href = '/'; 
        }
        return Promise.reject(error);
    }
);

export default axiosClient;