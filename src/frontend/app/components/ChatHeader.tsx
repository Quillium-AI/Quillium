"use client";

import { useState } from 'react';
// Now that we've created these components, import them properly
import LogoutDialog from './LogoutDialog';
import DeleteAccountDialog from './DeleteAccountDialog';

interface ChatHeaderProps {
  isConnected: boolean;
  handleLogout: () => void;
  isLoggingOut: boolean;
  isDeletingAccount: boolean;
}

/**
 * Header component for the chat interface
 */
export default function ChatHeader({ isConnected, handleLogout, isLoggingOut, isDeletingAccount }: ChatHeaderProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Quillium</h1>
            <div className="ml-4 flex items-center">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition duration-200"
              disabled={isLoggingOut || isDeletingAccount}
            >
              Logout
            </button>
            <button
              onClick={() => setShowDeleteAccountDialog(true)}
              className="px-3 py-1 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-md transition duration-200"
              disabled={isLoggingOut || isDeletingAccount}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <LogoutDialog
          onConfirm={() => {
            setShowLogoutDialog(false);
            handleLogout();
          }}
          onCancel={() => setShowLogoutDialog(false)}
          isLoggingOut={isLoggingOut}
        />
      )}

      {/* Delete Account Dialog */}
      {showDeleteAccountDialog && (
        <DeleteAccountDialog
          onClose={() => setShowDeleteAccountDialog(false)}
        />
      )}
    </header>
  );
}
