// Utility to get the backend API URL from environment
export function getApiUrl() {
  if (!process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    throw new Error('NEXT_PUBLIC_BACKEND_API_URL is not set in environment variables');
  }
  return process.env.NEXT_PUBLIC_BACKEND_API_URL;
}
