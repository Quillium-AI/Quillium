"use client";

import { useState } from 'react';
import { FiSearch, FiChevronDown, FiZap } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { IoMdSwitch } from 'react-icons/io';

interface QualityProfile {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface SearchBoxProps {
  onSearch?: (query: string, profileId: string) => void;
}

export default function SearchBox({ onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const qualityProfiles: QualityProfile[] = [
    { 
      id: 'speed', 
      name: 'Speed', 
      icon: <FiZap className="text-yellow-400" size={18} />,
      description: 'Faster responses with good accuracy'
    },
    { 
      id: 'balanced', 
      name: 'Balanced', 
      icon: <IoMdSwitch className="text-blue-400" size={18} />,
      description: 'Optimal balance of speed and quality'
    },
    { 
      id: 'quality', 
      name: 'Quality', 
      icon: <BsStars className="text-purple-400" size={18} />,
      description: 'Highest accuracy and detail'
    },
  ];
  
  // Initialize selectedProfile with the balanced option
  const [selectedProfile, setSelectedProfile] = useState<QualityProfile>(qualityProfiles[1]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query, selectedProfile.id);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        {/* Search input */}
        <div className="relative shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to know?"
            className="w-full py-4 px-5 pr-16 rounded-full border-2 border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--primary)] shadow-inner transition-all duration-200"
          />
          
          {/* Search button */}
          <button 
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:from-[var(--primary-dark)] hover:to-[var(--secondary-dark)] text-white transition-all duration-200 shadow-md"
            aria-label="Search"
          >
            <FiSearch size={20} />
          </button>
        </div>
        
        {/* Quality profile dropdown - now below the search bar */}
        <div className="mt-3 flex justify-center">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-sm text-white hover:bg-gray-700 hover:border-gray-600 focus:outline-none transition-all duration-200 shadow-md"
              aria-label="Select quality profile"
            >
              {selectedProfile.icon}
              <span className="font-medium ml-2">
                {selectedProfile.name}
              </span>
              <FiChevronDown className="ml-2 text-gray-400" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden backdrop-blur-sm bg-opacity-95">
                <div className="p-2">
                  {qualityProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center w-full rounded-lg px-3 py-2.5 mb-1 last:mb-0 transition-all duration-200 ${
                        profile.id === selectedProfile.id 
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-opacity-20 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 mr-3">
                        {profile.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{profile.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
