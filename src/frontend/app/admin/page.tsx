"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { FiUsers, FiSettings, FiHome, FiShield, FiAlertCircle, FiServer, FiDatabase, FiSliders, FiActivity } from 'react-icons/fi';
import WebcrawlerDashboard from '../components/WebcrawlerDashboard';

// Main admin settings page component
export default function AdminSettingsPage() {
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
        <AdminSettingsContent />
      </div>
    </AuthProvider>
  );
}

// Admin settings content component with sidebar
function AdminSettingsContent() {
  const router = useRouter();
  const { userInfo, isAuthenticated, isLoading, error } = useAuth();
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState('users');

  // Define the sidebar items
  const sidebarItems = [
    { id: 'users', label: 'User Management', icon: <FiUsers /> },
    { id: 'system', label: 'System Settings', icon: <FiServer /> },
    { id: 'logs', label: 'Activity Logs', icon: <FiActivity /> },
    { id: 'webcrawler', label: 'Webcrawler', icon: <FiDatabase /> }
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

  // Redirect to home if not authenticated or not admin
  if (!isAuthenticated || !userInfo?.isAdmin) {
    router.push('/');
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative z-10">
        <div className="flex flex-col items-center bg-gray-800/50 p-8 rounded-2xl backdrop-blur-md border border-gray-700/50 shadow-xl">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-pulse"></div>
            <div className="w-12 h-12 border-4 border-red-500 border-r-transparent rounded-full animate-spin relative"></div>
          </div>
          <p className="text-lg font-medium">Access denied. Redirecting to home...</p>
          <div className="mt-4 h-1 w-48 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-600 animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Function to navigate back to home
  const navigateToHome = () => {
    router.push('/');
  };

  // Display notification message
  const displayMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header with back button */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-20 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={navigateToHome}
            className="flex items-center px-4 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-700/70 transition-colors duration-200 border border-gray-700/50 group"
          >
            <FiHome className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 px-4 py-2 rounded-xl border border-[var(--primary)]/30">
              <span className="font-medium flex items-center">
                <FiShield className="mr-2 text-[var(--primary)]" />
                Admin Dashboard
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Notification message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : message.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'} flex items-center justify-between`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : message.type === 'error' ? (
                <FiAlertCircle className="w-5 h-5 mr-3" />
              ) : (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage({ text: '', type: '' })}
              className="text-white/70 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}

        {/* Settings layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-700/50 sticky top-24">
              <div className="p-5 border-b border-gray-700/50 bg-gradient-to-r from-[var(--primary)]/10 to-transparent">
                <h2 className="font-bold text-xl flex items-center">
                  <FiSettings className="mr-3 text-[var(--primary)]" />
                  Admin Settings
                </h2>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  {sidebarItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center transition-all duration-200 ${activeSection === item.id ? 'bg-[var(--primary)]/20 text-white' : 'hover:bg-gray-700/50 text-gray-300'}`}
                      >
                        <span className={`mr-3 ${activeSection === item.id ? 'text-[var(--primary)]' : ''}`}>
                          {item.icon}
                        </span>
                        <span className="font-medium">{item.label}</span>
                        {activeSection === item.id && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Main settings content */}
          <div className="flex-grow">
            {activeSection === 'users' && (
              <div className="relative">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
                  <div className="mr-4 p-2 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-lg">
                    <FiUsers className="text-[var(--primary)]" size={24} />
                  </div>
                  User Management
                </h1>

                <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
                  <div className="p-8">
                    <h2 className="text-xl font-semibold mb-8 flex items-center">
                      <span className="text-[var(--primary)] mr-3"><FiUsers /></span>
                      Manage Users
                    </h2>

                    <div className="space-y-6">
                      <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 overflow-hidden">
                        <div className="p-6">
                          <p className="text-gray-300 mb-4">This section allows you to manage user accounts, permissions, and roles.</p>
                          <button
                            className="px-5 py-2.5 bg-[var(--primary)]/80 text-white rounded-xl hover:bg-[var(--primary)] active:scale-95 transition-all duration-200 flex items-center shadow-lg shadow-[var(--primary)]/20 group/btn"
                            onClick={() => displayMessage('User management feature will be implemented soon.', 'info')}
                          >
                            <span className="group-hover/btn:translate-x-1 transition-transform duration-200">View All Users</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'system' && (
              <div className="relative">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
                  <div className="mr-4 p-2 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-lg">
                    <FiServer className="text-[var(--primary)]" size={24} />
                  </div>
                  System Settings
                </h1>

                <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
                  <div className="p-8">
                    <h2 className="text-xl font-semibold mb-8 flex items-center">
                      <span className="text-[var(--primary)] mr-3"><FiSliders /></span>
                      System Configuration
                    </h2>

                    <div className="space-y-6">
                      <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 overflow-hidden">
                        <div className="p-6">
                          <p className="text-gray-300 mb-4">Configure system-wide settings, API limits, and application behavior.</p>
                          <button
                            className="px-5 py-2.5 bg-[var(--primary)]/80 text-white rounded-xl hover:bg-[var(--primary)] active:scale-95 transition-all duration-200 flex items-center shadow-lg shadow-[var(--primary)]/20 group/btn"
                            onClick={() => displayMessage('System configuration feature will be implemented soon.', 'info')}
                          >
                            <span className="group-hover/btn:translate-x-1 transition-transform duration-200">Configure System</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 overflow-hidden">
                        <div className="p-6">
                          <h3 className="font-medium mb-2 flex items-center">
                            <FiDatabase className="mr-2 text-[var(--secondary)]" />
                            Database Management
                          </h3>
                          <p className="text-gray-300 mb-4">Manage database settings, backups, and maintenance operations.</p>
                          <button
                            className="px-5 py-2.5 bg-[var(--secondary)]/80 text-white rounded-xl hover:bg-[var(--secondary)] active:scale-95 transition-all duration-200 flex items-center shadow-lg shadow-[var(--secondary)]/20 group/btn"
                            onClick={() => displayMessage('Database management feature will be implemented soon.', 'info')}
                          >
                            <span className="group-hover/btn:translate-x-1 transition-transform duration-200">Database Settings</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'logs' && (
              <div className="relative">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
                  <div className="mr-4 p-2 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-lg">
                    <FiActivity className="text-[var(--primary)]" size={24} />
                  </div>
                  Activity Logs
                </h1>

                <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
                  <div className="p-8">
                    <h2 className="text-xl font-semibold mb-8 flex items-center">
                      <span className="text-[var(--primary)] mr-3"><FiActivity /></span>
                      System Logs
                    </h2>

                    <div className="space-y-6">
                      <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 overflow-hidden">
                        <div className="p-6">
                          <p className="text-gray-300 mb-4">View system logs, user activity, and error reports.</p>
                          <button
                            className="px-5 py-2.5 bg-[var(--primary)]/80 text-white rounded-xl hover:bg-[var(--primary)] active:scale-95 transition-all duration-200 flex items-center shadow-lg shadow-[var(--primary)]/20 group/btn"
                            onClick={() => displayMessage('Activity logs feature will be implemented soon.', 'info')}
                          >
                            <span className="group-hover/btn:translate-x-1 transition-transform duration-200">View Logs</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'webcrawler' && (
              <div className="relative">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
                  <div className="mr-4 p-2 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-lg">
                    <FiDatabase className="text-[var(--primary)]" size={24} />
                  </div>
                  Webcrawler Dashboard
                </h1>

                <WebcrawlerDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
