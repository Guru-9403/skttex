// Centralized API configuration
// Backend API server URL
const defaultBackendUrl = 'https://skttex.onrender.com';
let raw = (import.meta.env.VITE_API_BASE_URL || defaultBackendUrl).trim().replace(/\/+$/, '');

// If the env variable ended with /api, normalize it so API_BASE_URL is the root host
if (raw.endsWith('/api')) {
  raw = raw.slice(0, -4);
}

export const API_BASE_URL = raw;
export const API_URL = `${raw}/api`;

export default API_URL;
