"use client"
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ProfileDropdownProps {
  activeProfile: string;
  setActiveProfile: (profile: string) => void;
}

// Icons for each of thr 3 profile types
const LightningIcon = () => (
  <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BalancedIcon = () => (
  <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const QualityIcon = () => (
  <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Profile option data
const profileOptions = [
  { id: 'speed', name: 'Speed', icon: <LightningIcon /> },
  { id: 'balanced', name: 'Balanced', icon: <BalancedIcon /> },
  { id: 'quality', name: 'Quality', icon: <QualityIcon /> }
];

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ activeProfile, setActiveProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  // Get the active profiles display information
  const getActiveProfileInfo = () => {
    return profileOptions.find(option => option.id === activeProfile) || profileOptions[1]; // Default to balanced
  };
  
  // A handler so you can get out of the profile section by simply clicking on anywhere of the main page
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle the dropdown
  const toggleDropdown = () => {
    setIsOpen( !isOpen);
  };
  
  // Handle profile selection
  const handleProfileSelect = (profileId: string) => {
setActiveProfile(profileId);
    setIsOpen(false);
  };
  
  const activeProfileInfo = getActiveProfileInfo();
  
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`px-3 py-1.5 rounded-lg flex items-center ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
        } border`}
      >
        {activeProfileInfo.icon}
        <span>{activeProfileInfo.name}</span>
        <svg className="ml-2" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className={`absolute z-10 mt-1 w-48 rounded-md shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          } border`}
        >
          <div className="py-1">
            {profileOptions.map(option => (
              <button
                key={option.id}
                onClick={() => handleProfileSelect(option.id)}
                className={`${
                  activeProfile === option.id
                    ? theme === 'dark' 
                      ? 'bg-gray-700 text-purple-400' 
                      : 'bg-purple-50 text-purple-700'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                } group flex w-full items-center px-4 py-2 text-sm`}
              >
                {option.icon}
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;