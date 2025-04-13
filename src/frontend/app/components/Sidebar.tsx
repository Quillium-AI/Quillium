"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { FiSettings, FiX, FiHome, FiMessageSquare, FiMenu, FiChevronLeft } from 'react-icons/fi';

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
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile menu button - visible on small screens when sidebar is closed */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-colors"
        aria-label="Open menu"
      >
        <FiMenu size={24} />
      </button>
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 ${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl border-r border-gray-700 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and buttons */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Quillium</h1>
            )}
            <div className="flex items-center ml-auto">
              {/* Close button - mobile only */}
              <button 
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Close sidebar"
              >
                <FiX size={18} />
              </button>
              
              {/* Collapse button - desktop only */}
              <button
                onClick={handleCollapse}
                className="hidden lg:flex p-2 rounded-full hover:bg-gray-700 transition-colors ml-2"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <FiChevronLeft size={18} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Sidebar content */}
          <nav className={`flex-grow overflow-y-auto py-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            <div className="space-y-1">
              <button 
                onClick={() => router.push('/')}
                className={`flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors text-white ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <FiHome className={`${isCollapsed ? '' : 'mr-3'} text-[var(--primary)]`} size={20} />
                {!isCollapsed && <span>Home</span>}
              </button>
              <button 
                onClick={() => router.push('/chats')}
                className={`flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors text-white ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <FiMessageSquare className={`${isCollapsed ? '' : 'mr-3'} text-[var(--primary)]`} size={20} />
                {!isCollapsed && <span>My Chats</span>}
              </button>
            </div>
          </nav>
          
          {/* User profile */}
          <div 
            className={`p-4 border-t border-gray-700 transition-colors duration-200 ${isHovered ? 'bg-gray-700' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-2">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold shadow-md"
                >
                  {userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <button 
                  onClick={() => router.push('/settings')}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label="Settings"
                  style={{ cursor: 'pointer' }}
                >
                  <FiSettings size={18} className="text-gray-400 hover:text-white transition-colors" />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold shadow-md">
                  {userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-white">{userInfo?.username || 'User'}</p>
                  <p className="text-xs text-gray-400">{userInfo?.email || 'user@example.com'}</p>
                </div>
                <button 
                  onClick={() => router.push('/settings')}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label="Settings"
                  style={{ cursor: 'pointer' }}
                >
                  <FiSettings size={18} className="text-gray-400 hover:text-white transition-colors" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
