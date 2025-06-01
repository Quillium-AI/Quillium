"use client";

import { useState, useEffect } from 'react';
import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../utils/apiClient';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { FiUsers, FiSettings, FiHome, FiShield, FiAlertCircle, FiServer, FiDatabase, FiSearch } from 'react-icons/fi';
import WebcrawlerDashboard from '../components/WebcrawlerDashboard';
import IndexerDashboard from '../components/IndexerDashboard';
import SystemSettings from '../components/SystemSettings';

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
  // Define user type
  interface User {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    isSso: boolean;
  }
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', isAdmin: false });
  const [newPassword, setNewPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Fetch users when the active section is 'users'
  useEffect(() => {
    if (activeSection === 'users' && isAuthenticated && userInfo?.isAdmin) {
      fetchUsers();
    }
  }, [activeSection, isAuthenticated, userInfo]);

  // Function to fetch users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetchApi('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      
      // Ensure correct casing for isAdmin property
      const processedUsers = data.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin === true || user.is_admin === true || user.IsAdmin === true,
        isSso: user.isSso || user.is_sso || user.IsSso || false
      }));
      
      setUsers(processedUsers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      displayMessage(`Error fetching users: ${errorMessage}`, 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Function to handle user creation
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const response = await fetchApi('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      
      setUsers([...users, data as User]);
      setNewUser({ username: '', email: '', password: '', isAdmin: false });
      setShowCreateUserModal(false);
      displayMessage('User created successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      displayMessage(errorMessage, 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Function to handle password change
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsChangingPassword(true);
    try {
      const response = await fetchApi('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedUser.id,
          password: newPassword,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      
      setShowChangePasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
      displayMessage('Password updated successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      displayMessage(errorMessage, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Function to handle delete user action
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Function to confirm user deletion
  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsDeletingUser(true);
    try {
      const response = await fetchApi(`/api/admin/users/delete?id=${selectedUser.id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Refresh user list
      fetchUsers();
      setShowDeleteModal(false);
      displayMessage('User deleted successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      displayMessage(`Error deleting user: ${errorMessage}`, 'error');
    } finally {
      setIsDeletingUser(false);
      setSelectedUser(null);
    }
  };

  // Function to toggle admin status
  const toggleAdminStatus = async (user: User) => {
    try {
      const newAdminStatus = !user.isAdmin;
      
      // If trying to demote an admin, check if they're the only admin
      if (user.isAdmin && !newAdminStatus) {
        // Count how many admins there are
        const adminCount = users.filter(u => u.isAdmin).length;
        
        if (adminCount <= 1) {
          displayMessage('Cannot remove admin status from the only admin user', 'error');
          return;
        }
      }
      
      const response = await fetchApi('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          is_admin: newAdminStatus,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update admin status');
      }
      
      // Refresh user list
      fetchUsers();
      displayMessage(`User ${user.username} ${newAdminStatus ? 'is now an admin' : 'is no longer an admin'}`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      displayMessage(`Error updating admin status: ${errorMessage}`, 'error');
    }
  };

  // Define the sidebar items
  const sidebarItems = [
    { id: 'users', label: 'User Management', icon: <FiUsers /> },
    { id: 'system', label: 'System Settings', icon: <FiServer /> },
    { id: 'webcrawler', label: 'Webcrawler', icon: <FiDatabase /> },
    { id: 'indexer', label: 'Elasticsearch Indexer', icon: <FiSearch /> }
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
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-semibold flex items-center">
                        <span className="text-[var(--primary)] mr-3"><FiUsers /></span>
                        Manage Users
                      </h2>
                      
                      {/* Create User Button */}
                      <button
                        onClick={() => setShowCreateUserModal(true)}
                        className="px-4 py-2 bg-[var(--primary)]/80 text-white rounded-xl hover:bg-[var(--primary)] active:scale-95 transition-all duration-200 flex items-center shadow-lg shadow-[var(--primary)]/20 text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create User
                      </button>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-700/40 text-gray-300">
                            <th className="px-4 py-3 text-left rounded-tl-lg">Username</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Admin</th>
                            <th className="px-4 py-3 text-center rounded-tr-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                          {isLoadingUsers ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                <div className="flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mr-3"></div>
                                  Loading users...
                                </div>
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                No users found.
                              </td>
                            </tr>
                          ) : (
                            users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-700/20 transition-colors duration-150">
                                <td className="px-4 py-3">{user.username}</td>
                                <td className="px-4 py-3">{user.email}</td>
                                <td className="px-4 py-3">
                                  {user.isAdmin ? (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Admin</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">User</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 flex items-center justify-center space-x-2">
                                  <button 
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowChangePasswordModal(true);
                                    }}
                                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-200" 
                                    title="Change Password"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => toggleAdminStatus(user)}
                                    className={`p-2 ${user.isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-indigo-500/20 text-indigo-400'} rounded-lg hover:${user.isAdmin ? 'bg-purple-500/30' : 'bg-indigo-500/30'} transition-colors duration-200`} 
                                    title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user)}
                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-200" 
                                    title="Delete User"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Create User Modal */}
                {showCreateUserModal && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-700 animate-fade-in-up">
                      <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-white flex items-center">
                            <span className="text-[var(--primary)] mr-3"><FiUsers /></span>
                            Create New User
                          </h3>
                          <button 
                            onClick={() => setShowCreateUserModal(false)}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleCreateUser}>
                        <div className="p-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                            <input 
                              type="text" 
                              value={newUser.username}
                              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]/50 transition-all duration-200 text-white"
                              placeholder="Enter username"
                              required
                              minLength={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input 
                              type="email" 
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]/50 transition-all duration-200 text-white"
                              placeholder="Enter email address"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <input 
                              type="password" 
                              value={newUser.password}
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]/50 transition-all duration-200 text-white"
                              placeholder="Enter password"
                              required
                              minLength={8}
                            />
                          </div>
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="is-admin" 
                              checked={newUser.isAdmin}
                              onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                              className="w-4 h-4 text-[var(--primary)] bg-gray-700 border-gray-600 rounded focus:ring-[var(--primary)]/50"
                            />
                            <label htmlFor="is-admin" className="ml-2 text-sm text-gray-300">Admin privileges</label>
                          </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                          <button 
                            type="button"
                            onClick={() => setShowCreateUserModal(false)}
                            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-4 py-2 bg-[var(--primary)]/80 text-white rounded-lg hover:bg-[var(--primary)] transition-colors duration-200 flex items-center"
                          >
                            {isCreatingUser && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                            Create User
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Change Password Modal */}
                {showChangePasswordModal && selectedUser && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-700 animate-fade-in-up">
                      <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-white flex items-center">
                            <span className="text-[var(--primary)] mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </span>
                            Change Password for {selectedUser.username}
                          </h3>
                          <button 
                            onClick={() => setShowChangePasswordModal(false)}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleChangePassword}>
                        <div className="p-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                            <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]/50 transition-all duration-200 text-white"
                              placeholder="Enter new password"
                              required
                              minLength={8}
                            />
                            <p className="mt-1 text-xs text-gray-400">Password must be at least 8 characters and contain uppercase, lowercase, and numbers.</p>
                          </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                          <button 
                            type="button"
                            onClick={() => setShowChangePasswordModal(false)}
                            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-4 py-2 bg-[var(--primary)]/80 text-white rounded-lg hover:bg-[var(--primary)] transition-colors duration-200 flex items-center"
                          >
                            {isChangingPassword && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedUser && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-700 animate-fade-in-up">
                      <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-white flex items-center">
                            <span className="text-red-500 mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </span>
                            Confirm Delete User
                          </h3>
                          <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="p-6">
                        <p className="text-gray-300">Are you sure you want to delete the user <span className="font-semibold text-white">{selectedUser.username}</span>? This action cannot be undone.</p>
                      </div>

                      <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                        <button 
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={confirmDeleteUser}
                          className="px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors duration-200 flex items-center"
                        >
                          {isDeletingUser && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                          Delete User
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                
                <SystemSettings />
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

            {activeSection === 'indexer' && (
              <div className="relative">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center">
                  <div className="mr-4 p-2 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 rounded-lg">
                    <FiSearch className="text-[var(--primary)]" size={24} />
                  </div>
                  Elasticsearch Indexer Dashboard
                </h1>

                <IndexerDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
