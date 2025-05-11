"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { FiUser, FiMail, FiLock, FiSave, FiSettings, FiHome, FiShield, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

// Main settings page component
export default function SettingsPage() {
  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--primary)]/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[var(--secondary)]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-[var(--secondary)]/10 rounded-full blur-3xl"></div>
        </div>
        <SettingsContent />
      </div>
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
    <div className="min-h-screen text-white flex relative z-10">
      {/* Settings sidebar */}
      <div className="w-72 h-screen bg-gray-800/80 backdrop-blur-md border-r border-gray-700/50 shadow-xl relative flex flex-col overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-transparent"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[var(--primary)]/10 rounded-full blur-3xl opacity-70"></div>
        
        <div className="p-6 border-b border-gray-700/50 relative">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
            <FiSettings className="mr-3 text-[var(--primary)]" />
            Settings
          </h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 min-h-0">
          <ul className="space-y-2">
            {sidebarItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`group w-full flex items-center px-5 py-3 rounded-xl transition-all duration-200 ${
                    activeSection === item.id 
                      ? 'bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 text-white border-l-2 border-[var(--primary)]' 
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <span className={`mr-3 ${activeSection === item.id ? 'text-[var(--primary)]' : 'group-hover:text-[var(--primary)] transition-colors duration-200'}`}>{item.icon}</span>
                  <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 mt-6">
          <button
            onClick={navigateToHome}
            className="relative z-10 w-full flex items-center px-5 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-700/50 hover:text-white group"
          >
            <span className="mr-3 group-hover:text-[var(--primary)] transition-colors duration-200"><FiHome /></span>
            <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-10 relative">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[var(--secondary)]/5 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-[var(--primary)]/5 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
        
        {activeSection === 'profile' && (
          <div className="relative">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
              <div className="mr-4 p-2 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-lg">
                <FiUser className="text-[var(--primary)]" size={24} />
              </div>
              Profile Settings
            </h1>
            <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
              <div className="p-8">
                <h2 className="text-xl font-semibold mb-8 flex items-center">
                  <span className="text-[var(--primary)] mr-3"><FiUser /></span>
                  Personal Information
                </h2>
            
            {message.text && (
              <div className={`mb-8 p-5 rounded-xl flex items-start ${
                message.type === 'error' 
                  ? 'bg-red-900/30 text-red-200 border border-red-500/30' 
                  : message.type === 'success' 
                    ? 'bg-green-900/30 text-green-200 border border-green-500/30' 
                    : 'bg-blue-900/30 text-blue-200 border border-blue-500/30'
              }`}>
                <span className="mr-3 mt-0.5">
                  {message.type === 'error' && <FiAlertCircle className="text-red-400" size={20} />}
                  {message.type === 'success' && <FiCheckCircle className="text-green-400" size={20} />}
                  {message.type === 'info' && <FiInfo className="text-blue-400" size={20} />}
                </span>
                <span>{message.text}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                <div className="group">
                  <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[var(--primary)] transition-colors duration-200">
                      <FiUser className="text-gray-400 group-focus-within:text-[var(--primary)] transition-colors duration-200" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm"
                      placeholder="Your username"
                      minLength={3}
                    />
                    <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
                  </div>
                </div>
                
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400 group-focus-within:text-[var(--primary)] transition-colors duration-200" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm"
                      placeholder="your.email@example.com"
                    />
                    <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
                  </div>
                </div>
                
                <div className="pt-8 mt-8 border-t border-gray-700/50 relative">
                  <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-[var(--primary)]/30 via-transparent to-transparent"></div>
                  
                  <h3 className="text-lg font-medium mb-6 flex items-center">
                    <span className="text-[var(--primary)] mr-3"><FiShield /></span>
                    Change Password
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400 group-focus-within:text-[var(--primary)] transition-colors duration-200" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm"
                          placeholder="Leave blank to keep current password"
                          minLength={8}
                        />
                        <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">Must be at least 8 characters</p>
                    </div>
                    
                    <div className="group">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400 group-focus-within:text-[var(--primary)] transition-colors duration-200" />
                        </div>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm"
                          placeholder="Confirm new password"
                          minLength={8}
                        />
                        <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-6 rounded-xl font-medium shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[var(--primary)]/20 group"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-base">Saving Changes...</span>
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiSave className="mr-3 group-hover:rotate-12 transition-transform duration-200" size={20} />
                        <span className="text-base group-hover:translate-x-1 transition-transform duration-200">Save Changes</span>
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
          <div className="relative">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
              <div className="mr-4 p-2 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-lg">
                <FiSettings className="text-[var(--primary)]" size={24} />
              </div>
              Account Settings
            </h1>
            
            <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
              <div className="p-8">
                <h2 className="text-xl font-semibold mb-8 flex items-center">
                  <span className="text-[var(--primary)] mr-3"><FiSettings /></span>
                  Account Management
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gray-700/40 rounded-xl border border-gray-600/30 hover:border-gray-600/50 transition-colors duration-200 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <h3 className="font-medium text-lg">Sign out</h3>
                      <p className="text-sm text-gray-400 mt-1">Sign out from all devices</p>
                    </div>
                    <button 
                      onClick={handleUserLogout}
                      className="relative z-10 px-5 py-2.5 border-2 border-blue-500/70 text-blue-400 rounded-xl hover:bg-blue-500/20 active:scale-95 transition-all duration-200 flex items-center group/btn"
                    >
                      <span className="group-hover/btn:translate-x-1 transition-transform duration-200">Sign out</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-gray-700/40 rounded-xl border border-gray-600/30 hover:border-red-500/30 transition-colors duration-200 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <h3 className="font-medium text-lg text-red-400">Delete account</h3>
                      <p className="text-sm text-gray-400 mt-1">Permanently delete your account and all data</p>
                    </div>
                    <button 
                      className="relative z-10 px-5 py-2.5 bg-red-500/80 text-white rounded-xl hover:bg-red-600/80 active:scale-95 transition-all duration-200 flex items-center shadow-lg shadow-red-500/20 group/btn"
                      onClick={() => setMessage({ text: 'Account deletion is not available in this version.', type: 'info' })}
                    >
                      <span className="group-hover/btn:translate-x-1 transition-transform duration-200">Delete account</span>
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
