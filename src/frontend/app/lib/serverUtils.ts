// Server-side utilities for backend communication

// Get the backend API URL from environment variables
export function getBackendUrl() {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  return backendUrl;
}

// Helper to proxy a request to the backend and return the response
export async function proxyRequest(url: string, options?: RequestInit) {
  const backendUrl = getBackendUrl();
  const fullUrl = `${backendUrl}${url}`;
  
  // Default headers to include
  const headers = {
    'Accept': 'application/json',
    ...options?.headers,
  };

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error(`Error proxying request to ${fullUrl}:`, error);
    throw error;
  }
}
