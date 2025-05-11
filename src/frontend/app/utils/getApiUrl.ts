// Utility to get the backend API URL from environment
export function getApiUrl() {
  if (!process.env.BACKEND_API_URL) {
    throw new Error('BACKEND_API_URL is not set in environment variables');
  }
  return process.env.BACKEND_API_URL;
}
