"use client";

import { useAuth } from './AuthProvider';

interface DeleteAccountDialogProps {
  onClose: () => void;
}

export default function DeleteAccountDialog({ onClose }: DeleteAccountDialogProps) {
  const { isDeletingAccount, handleDeleteAccount } = useAuth();

  // No need to check showConfirmation since we're controlling visibility from the parent

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Confirm Account Deletion</h2>
        <p className="mb-6">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
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
  );
}
