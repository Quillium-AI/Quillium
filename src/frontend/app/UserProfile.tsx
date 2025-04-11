"use client"
import React from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

interface UserProfileProps {
  username: string;
  email: string;
  searchesCount: number;
  maxSearches: number;
  accountType: string;
}

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserProfile: React.FC<UserProfileProps> = ({ 
  username, 
  email, 
  searchesCount, 
  maxSearches, 
  accountType 
}) => {
  const { theme } = useTheme();
  
  return (
    <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="relative group">
        <div className="flex items-center cursor-pointer">
          <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} flex items-center justify-center`}>
            <UserIcon />
          </div>
          <span className="ml-2 text-sm font-medium">{username}</span>
        </div>
        
        {/* Popup that appears on hover */}
        <div className={`invisible group-hover:visible absolute bottom-full left-0 w-60 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } border rounded-lg shadow-lg p-4 mb-3 z-10 transition-opacity opacity-0 group-hover:opacity-100`}>
          {/* Triangle pointer */}
          <div className={`absolute -bottom-2 left-4 w-4 h-4 rotate-45 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border-r border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}></div>
          
          {/* User info section */}
          <div className="flex items-center mb-4">
            <div className={`h-12 w-12 rounded-full ${
              theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'
            } flex items-center justify-center ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{username}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{email}</p>
            </div>
          </div>
          
          {/* Account info section */}
          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-3`}>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Account</p>
            <div className="text-sm flex justify-between mb-1">
              <span>Searches today</span>
              <span className="font-medium">{searchesCount}/{maxSearches}</span>
            </div>
            <Link href="/settings" className={`block text-sm ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} hover:text-purple-800 dark:hover:text-purple-300`}>
              Settings
            </Link>
            <Link href="/signout" className={`block text-sm ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} hover:text-purple-800 dark:hover:text-purple-300 mt-1`}>
              Sign out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;