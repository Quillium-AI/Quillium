// Client-side API utility functions

// Base URL for client-side API calls (will be empty since we're calling our own Next.js server)
// This is different from the getApiUrl.ts which was for direct backend access
export function getApiClientUrl() {
  return '';
}

// Helper for making API calls to our Next.js API routes
export async function fetchApi(endpoint: string, options?: RequestInit) {
  const url = `${getApiClientUrl()}${endpoint}`;
  
  // Default headers to include
  const headers = {
    'Accept': 'application/json',
    ...options?.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // Always include credentials for cookies
      credentials: 'include',
    });

    return response;
  } catch (error) {
    console.error(`Error calling API at ${url}:`, error);
    throw error;
  }
}
