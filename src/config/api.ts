/**
 * API Configuration
 * 
 * Supports environment-based API URL configuration for different environments.
 * Set VITE_API_URL environment variable to override the default.
 */

function getApiBaseUrlFromEnv(): string {
  // Check for environment variable first
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default based on current hostname
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  // Development defaults
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:9008'; // Default API port
  }

  // Production/staging - use same hostname with port 8080
  // This can be overridden with VITE_API_URL
  return `http://${hostname}:9008`;
}

export const API_CONFIG = {
  baseUrl: getApiBaseUrlFromEnv(),
} as const;

/**
 * Get the base URL for API requests
 */
export function getApiBaseUrl(): string {
  return API_CONFIG.baseUrl;
}

/**
 * Build a full API URL from a path
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

