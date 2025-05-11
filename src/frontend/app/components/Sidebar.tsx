"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { FiSettings, FiX, FiHome, FiMessageSquare, FiMenu, FiChevronLeft, FiZap, FiStar } from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const router = useRouter();
  const { userInfo } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Sidebar overlay for mobile - closes sidebar when clicking outside */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-all duration-300 ease-out"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu button - visible on small screens when sidebar is closed */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 rounded-full bg-gray-800/90 text-white shadow-xl hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all duration-200 border border-gray-700/50 backdrop-blur-sm"
        aria-label="Open menu"
      >
        <FiMenu size={24} className="text-[var(--primary)]" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${isCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-gray-800/95 via-gray-900/95 to-gray-950/95 shadow-2xl shadow-[var(--primary)]/10 border-r border-gray-700/50 backdrop-blur-md transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo and buttons */}
          <div className="flex items-center justify-between p-5 border-b border-gray-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/5 opacity-50"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[var(--primary)]/20 rounded-full blur-2xl"></div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[var(--secondary)]/20 rounded-full blur-2xl"></div>

            {!isCollapsed && (
              <div className="relative">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent flex items-center">
                  <FiZap className="mr-2 text-[var(--primary)]" />
                  Quillium
                </h1>
                <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
              </div>
            )}
            {isCollapsed && (
              <div className="mx-auto">
                <FiZap size={24} className="text-[var(--primary)]" />
              </div>
            )}
            <div className="flex items-center ml-auto relative z-10">
              {/* Close button - mobile only */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-full hover:bg-gray-700/70 hover:scale-110 active:scale-95 transition-all duration-200"
                aria-label="Close sidebar"
              >
                <FiX size={18} className="text-white/90" />
              </button>

              {/* Collapse button - desktop only */}
              <button
                onClick={handleCollapse}
                className="hidden lg:flex p-2 rounded-full hover:bg-gray-700/70 hover:scale-110 active:scale-95 transition-all duration-200 ml-2"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <FiChevronLeft size={18} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''} text-white/90`} />
              </button>
            </div>
          </div>

          {/* Sidebar content */}
          <nav className={`flex-grow overflow-y-auto py-8 ${isCollapsed ? 'px-3' : 'px-5'}`}>
            <div className="space-y-3">
              {/* Section title */}
              {!isCollapsed && (
                <div className="mb-4 pl-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Navigation</p>
                  <div className="mt-1 h-[1px] w-12 bg-gradient-to-r from-[var(--primary)]/50 to-transparent"></div>
                </div>
              )}

              <button
                onClick={() => router.push('/')}
                className={`group flex items-center w-full p-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-700/80 hover:to-gray-800/50 active:scale-95 transition-all duration-200 text-white ${isCollapsed ? 'justify-center' : ''}`}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-[var(--primary)]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <FiHome className={`${isCollapsed ? '' : 'mr-4'} text-[var(--primary)] relative z-10 transition-transform duration-200 group-hover:scale-110`} size={22} />
                </div>
                {!isCollapsed && <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">Home</span>}
              </button>

              <button
                onClick={() => router.push('/chats')}
                className={`group flex items-center w-full p-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-700/80 hover:to-gray-800/50 active:scale-95 transition-all duration-200 text-white ${isCollapsed ? 'justify-center' : ''}`}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-[var(--primary)]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <FiMessageSquare className={`${isCollapsed ? '' : 'mr-4'} text-[var(--primary)] relative z-10 transition-transform duration-200 group-hover:scale-110`} size={22} />
                </div>
                {!isCollapsed && <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">My Chats</span>}
              </button>
            </div>
          </nav>

          {/* User profile */}
          <div
            className={`p-5 border-t border-gray-700/50 transition-all duration-300 relative overflow-hidden ${isHovered ? 'bg-gray-800/80' : 'bg-gray-800/30'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-2xl opacity-70"></div>

            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-3 relative z-10">
                <div
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] p-[2px] shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 transition-shadow duration-300 cursor-pointer"
                  onClick={() => router.push('/profile')}
                >
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white font-bold">
                    {userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="p-2 rounded-full hover:bg-gray-700/70 hover:scale-110 active:scale-95 transition-all duration-200"
                  aria-label="Settings"
                >
                  <FiSettings size={18} className="text-[var(--primary)] hover:text-white transition-colors" />
                </button>
              </div>
            ) : (
              <div className="flex items-center relative z-10">
                <div
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] p-[2px] shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 transition-shadow duration-300 cursor-pointer group"
                  onClick={() => router.push('/profile')}
                >
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white font-bold group-hover:scale-95 transition-transform duration-200">
                    {userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="ml-4 flex-grow">
                  <p className="text-sm font-medium text-white">
                    {userInfo?.username
                      ? userInfo.username.length > 12
                        ? `${userInfo.username.substring(0, 12)}...`
                        : userInfo.username
                      : 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-[140px]">{userInfo?.email || 'user@example.com'}</p>
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="p-2 rounded-full hover:bg-gray-700/70 hover:scale-110 active:scale-95 transition-all duration-200"
                  aria-label="Settings"
                >
                  <FiSettings size={18} className="text-[var(--primary)] hover:text-white transition-colors" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
