"use client";

import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { WebSocketProvider } from "./components/WebSocketProvider";
import HomePage from "./components/HomePage";
import { FiAlertCircle } from 'react-icons/fi';
import './globals.css';

// Main application component
export default function Home() {
  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--primary)]/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[var(--secondary)]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-[var(--secondary)]/10 rounded-full blur-3xl"></div>
        </div>
        <AppContent />
      </div>
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
      <div className="min-h-screen text-white flex items-center justify-center relative z-10">
        <div className="flex flex-col items-center bg-gray-800/50 p-8 rounded-2xl backdrop-blur-md border border-gray-700/50 shadow-xl">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[var(--primary)]/20 rounded-full blur-md"></div>
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin relative"></div>
          </div>
          <p className="text-lg font-medium">Checking authentication status...</p>
          <div className="mt-4 h-1 w-48 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (not authenticated or server error)
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative z-10">
        <div className="max-w-md w-full bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl border border-red-500/30 shadow-xl">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md"></div>
              <FiAlertCircle size={48} className="text-red-400 relative" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-4">Authentication Error</h2>
          <p className="text-red-400 text-center mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition duration-200 font-medium flex items-center justify-center group"
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200">Go to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    router.push('/signin');
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative z-10">
        <div className="flex flex-col items-center bg-gray-800/50 p-8 rounded-2xl backdrop-blur-md border border-gray-700/50 shadow-xl">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[var(--primary)]/20 rounded-full blur-md animate-pulse"></div>
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-r-transparent rounded-full animate-spin relative"></div>
          </div>
          <p className="text-lg font-medium">Redirecting to sign in...</p>
          <div className="mt-4 h-1 w-48 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] animate-pulse w-1/2"></div>
          </div>
        </div>
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
