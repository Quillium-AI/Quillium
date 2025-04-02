"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function Dashboard() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Dashboard</h1>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut || isDeletingAccount}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Your Dashboard</h2>
          <p className="mb-4">You are successfully logged in to Quillium.</p>
          <p>This is a simple dashboard with logout functionality.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
          <p className="mb-4">Permanently delete your account and all associated data.</p>
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={isDeletingAccount || isLoggingOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
          >
            Delete Account
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Confirm Account Deletion</h2>
              <p className="mb-6">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
