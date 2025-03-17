/**
 * API Service
 * 
 * This file contains functions for interacting with the Quillium backend API.
 */

// Base URLs for API and WebSocket requests
const API_BASE_URL = '/api';
const WS_URL = `ws://${window.location.host}/ws`;

/**
 * Fetch wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function fetchWithErrorHandling(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Example API function for sending a query to the AI
 * @param {string} query - User query
 * @returns {Promise<Object>} - AI response
 */
export async function sendQuery(query) {
  return fetchWithErrorHandling('/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

/**
 * Health check endpoint
 * @returns {Promise<Object>} - Health status
 */
export async function checkHealth() {
  return fetchWithErrorHandling('/health');
}

/**
 * Get WebSocket URL
 * @returns {string} - WebSocket URL
 */
export function getWebSocketUrl() {
  return WS_URL;
}

export default {
  sendQuery,
  checkHealth,
  getWebSocketUrl,
};
