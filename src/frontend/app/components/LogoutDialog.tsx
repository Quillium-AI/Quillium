"use client";

import React from 'react';

interface LogoutDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoggingOut: boolean;
}

/**
 * Dialog for confirming logout action
 */
export default function LogoutDialog({ onConfirm, onCancel, isLoggingOut }: LogoutDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Confirm Logout</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to logout?</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
