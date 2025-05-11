"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { FiUser, FiMail, FiLock, FiSave, FiSettings, FiHome } from 'react-icons/fi';

// Main settings page component
export default function SettingsPage() {
  return (
    <AuthProvider>
      <SettingsContent />
    </AuthProvider>
  );
}

// Settings content component with sidebar
function SettingsContent() {
  const router = useRouter();
  const { userInfo, isAuthenticated, isLoading, error, handleLogout } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  // Define the sidebar items
  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'account', label: 'Account', icon: <FiSettings /> }
  ];
  
  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <p className="mb-4">Checking authentication status...</p>
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Error state (not authenticated or server error)
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Redirecting to sign in...</p>
      </div>
    );
  }
  
  // Initialize form data from user info
  if (userInfo && username === '' && email === '') {
    setUsername(userInfo.username || '');
    setEmail(userInfo.email || '');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Validate passwords match if changing password
    if (password && password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      // Prepare update data
      const updateData: { username?: string; email?: string; password?: string } = {};
      
      if (username && username !== userInfo?.username) {
        updateData.username = username;
      }
      
      if (email && email !== userInfo?.email) {
        updateData.email = email;
      }
      
      if (password) {
        updateData.password = password;
      }

      // Only send request if there are changes
      if (Object.keys(updateData).length === 0) {
        setMessage({ text: 'No changes to save', type: 'info' });
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Clear password fields
      setPassword('');
      setConfirmPassword('');
      
      setMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message || 'An error occurred', type: 'error' });
      } else {
        setMessage({ text: 'An unknown error occurred', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogout = () => {
    handleLogout();
  };

  const navigateToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Settings sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Settings</h2>
        </div>
        <nav className="p-2">
          <ul className="space-y-1">
            {sidebarItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2 mt-4">
          <button
            onClick={navigateToHome}
            className="w-full flex items-center px-4 py-3 rounded-lg transition-colors text-gray-400 hover:bg-gray-700 hover:text-white"
            style={{ cursor: 'pointer' }}
          >
            <span className="mr-3"><FiHome /></span>
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeSection === 'profile' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-900/30 text-red-200' : message.type === 'success' ? 'bg-green-900/30 text-green-200' : 'bg-blue-900/30 text-blue-200'}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-gray-700 block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                      placeholder="Your username"
                      minLength={3}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-700 block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-gray-700 block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                          placeholder="Leave blank to keep current password"
                          minLength={8}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-gray-700 block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                          placeholder="Confirm new password"
                          minLength={8}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiSave className="mr-2" />
                        Save Changes
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'account' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Account Management</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                    <div>
                      <h3 className="font-medium">Sign out</h3>
                      <p className="text-sm text-gray-400">Sign out from all devices</p>
                    </div>
                    <button 
                      onClick={handleUserLogout}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                      style={{ cursor: 'pointer' }}
                    >
                      Sign out
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                    <div>
                      <h3 className="font-medium text-red-500">Delete account</h3>
                      <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                    </div>
                    <button 
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      onClick={() => setMessage({ text: 'Account deletion is not available in this version.', type: 'info' })}
                      style={{ cursor: 'pointer' }}
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
