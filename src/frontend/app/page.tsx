"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated by verifying the auth token cookie
    const checkAuth = async () => {
      try {
        // Set a timeout to prevent hanging if the backend is unreachable
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });

        // Try to fetch user data from the backend using the cookie
        const fetchPromise = fetch('http://localhost:8080/api/user/info', {
          method: 'GET',
          credentials: 'include', // Important: include credentials to send cookies
          headers: {
            'Accept': 'application/json'
          }
        });

        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
        } else {
          // No valid token, redirect to signin
          setTimeout(() => router.push('/signin'), 1500);
          setError('Not authenticated. Redirecting to login...');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // If there's an error (e.g., backend not available), redirect to signin after a delay
        setError('Cannot connect to the server. Redirecting to login...');
        setTimeout(() => router.push('/signin'), 1500);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // This will briefly show while checking authentication and redirecting
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Welcome to Quillium</h1>
        {isLoading ? (
          <div className="flex flex-col items-center">
            <p className="mb-4">Checking authentication status...</p>
            <div className="w-8 h-8 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <p>Redirecting...</p>
        )}
      </main>
    </div>
  );
}
