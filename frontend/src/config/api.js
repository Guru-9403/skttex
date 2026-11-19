// Centralized API configuration
// Backend API server URL
const defaultBackendUrl = 'https://codelearnbackend.onrender.com';
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultBackendUrl).trim();
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api`;

export default API_URL;
