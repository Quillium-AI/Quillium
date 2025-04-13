"use client";

import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { WebSocketProvider } from "./components/WebSocketProvider";
import HomePage from "./components/HomePage";
import './globals.css';

// Note: Types are defined in the ChatInterface component

// Main application component
export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// App content with authentication state
function AppContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useAuth();

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4">Checking authentication status...</p>
          <div className="w-8 h-8 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Error state (not authenticated or server error)
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-200"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    router.push('/signin');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex items-center justify-center">
        <p>Redirecting to sign in...</p>
      </div>
    );
  }

  // Dashboard content (authenticated user) with homepage
  return (
    <WebSocketProvider>
      <HomePage />
    </WebSocketProvider>
  );
}
