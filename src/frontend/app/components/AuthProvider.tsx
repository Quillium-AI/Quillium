"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLoggingOut: boolean;
  isDeletingAccount: boolean;
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
          // User is authenticated, show dashboard content
          setIsAuthenticated(true);
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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError(null);

      const response = await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important: include credentials to send cookies
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Redirect to signin page after successful logout
        router.push('/signin');
      } else {
        // Handle error
        const data = await response.json();
        setError(data.error || 'Failed to logout. Please try again.');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setError('Network error: Cannot connect to the server.');
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      setError(null);

      const response = await fetch('http://localhost:8080/api/user/delete', {
        method: 'DELETE',
        credentials: 'include', // Include credentials to send cookies
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Account deleted successfully, redirect to signup page
        router.push('/signup');
      } else {
        // Handle error
        const data = await response.json();
        setError(data.error || 'Failed to delete account. Please try again.');
        setIsDeletingAccount(false);
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setError('Network error: Cannot connect to the server.');
      setIsDeletingAccount(false);
      setShowConfirmation(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    error,
    isLoggingOut,
    isDeletingAccount,
    showConfirmation,
    setShowConfirmation,
    handleLogout,
    handleDeleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
