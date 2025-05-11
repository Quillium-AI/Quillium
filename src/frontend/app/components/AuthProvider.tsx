"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../utils/getApiUrl";

// User information type
type UserInfo = {
  id?: number;
  email: string;
  username: string;
  isAdmin?: boolean;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLoggingOut: boolean;
  isDeletingAccount: boolean;
  showConfirmation: boolean;
  userInfo: UserInfo | null;
  setShowConfirmation: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
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
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Refresh token function - attempts to get a new access token using the refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: include credentials to send cookies
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Token refreshed successfully
        console.log('Token refreshed successfully');
        return true;
      } else {
        // Failed to refresh token, user needs to log in again
        console.error('Failed to refresh token:', response.status);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (isAuthenticated && tokenRefreshTimer === null) {
      // Refresh the token every 14 minutes (before the 15-minute expiration)
      const timer = setInterval(() => {
        refreshToken().catch(error => {
          console.error('Scheduled token refresh failed:', error);
        });
      }, 14 * 60 * 1000); // 14 minutes in milliseconds
      
      setTokenRefreshTimer(timer);
    }

    return () => {
      // Clear the timer when the component unmounts or auth state changes
      if (tokenRefreshTimer !== null) {
        clearInterval(tokenRefreshTimer);
        setTokenRefreshTimer(null);
      }
    };
  }, [isAuthenticated, refreshToken, tokenRefreshTimer]);

  useEffect(() => {
    // Check if user is authenticated by verifying the auth token cookie
    const checkAuth = async () => {
      try {
        // Set a timeout to prevent hanging if the backend is unreachable
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });

        // Try to fetch user data from the backend using the cookie
        const fetchPromise = fetch(`${getApiUrl()}/api/user/info`, {
          method: 'GET',
          credentials: 'include', // Important: include credentials to send cookies
          headers: {
            'Accept': 'application/json'
          }
        });

        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (response.ok) {
          // User is authenticated, parse user data
          const userData = await response.json();
          setUserInfo({
            id: userData.id,
            email: userData.email,
            username: userData.username || 'User', // Fallback if username is not available
            isAdmin: userData.is_admin
          });
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          // Token expired, try to refresh it
          const refreshed = await refreshToken();
          if (refreshed) {
            setIsAuthenticated(true);
          } else {
            // Refresh failed, redirect to signin
            setTimeout(() => router.push('/signin'), 1500);
            setError('Session expired. Please login again.');
          }
        } else {
          // Other error, redirect to signin
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
  }, [router, refreshToken]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError(null);

      const response = await fetch(`${getApiUrl()}/api/auth/logout`, {
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

      const response = await fetch(`${getApiUrl()}/api/user/delete`, {
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
    userInfo,
    setShowConfirmation,
    handleLogout,
    handleDeleteAccount,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
