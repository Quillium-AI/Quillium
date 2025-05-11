"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isDropdownOpen && dropdownBtnRef.current) {
      const rect = dropdownBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 12, // 12px below the button
      });
    } else if (!isDropdownOpen) {
      setDropdownPos(null);
    }
  }, [isDropdownOpen]);
  const [query, setQuery] = useState('');

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
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)]/50 to-[var(--secondary)]/50 rounded-full opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-300"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 rounded-full blur-md opacity-70"></div>

          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to know?"
              className="w-full py-4 px-6 pr-16 rounded-full border border-gray-700/70 bg-gray-800/70 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 shadow-inner shadow-black/10 transition-all duration-300"
            />

            {/* Animated focus effect */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] group-focus-within:w-[90%] transition-all duration-300"></div>

            {/* Search button */}
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:shadow-lg hover:shadow-[var(--primary)]/20 text-white transition-all duration-200 active:scale-95"
              aria-label="Search"
            >
              <FiSearch size={18} />
            </button>
          </div>
        </div>

        {/* Quality profile dropdown*/}
        <div className="mt-2 flex justify-center">
          <div className="relative">
            <button
              ref={dropdownBtnRef}
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-5 py-2.5 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 text-sm text-white hover:bg-gray-700/80 hover:border-gray-600/70 focus:outline-none transition-all duration-200 shadow-md group"
              aria-label="Select quality profile"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">{selectedProfile.icon}</div>
              </div>
              <span className="font-medium ml-2.5">
                {selectedProfile.name}
              </span>
              <FiChevronDown className="ml-2 text-gray-400 group-hover:text-white transition-colors duration-200" />
            </button>

            {isDropdownOpen && dropdownPos && createPortal(
              <div
                style={{
                  position: 'fixed',
                  left: dropdownPos.left - 144, // 144 = half of dropdown width (w-72 = 288px)
                  top: dropdownPos.top,
                  zIndex: 9999,
                  width: 288,
                }}
                className="bg-gray-800/90 border border-gray-700/70 rounded-xl shadow-xl overflow-hidden backdrop-blur-md animate-fadeIn"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-[var(--secondary)]/5 opacity-70"></div>
                <div className="p-3 relative">
                  {qualityProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center w-full rounded-lg px-4 py-3 mb-1.5 last:mb-0 transition-all duration-200 group/item ${profile.id === selectedProfile.id
                          ? 'bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/10 text-white border-l-2 border-[var(--primary)]'
                          : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700/80 mr-4 group-hover/item:scale-110 transition-transform duration-200">
                        {profile.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium group-hover/item:translate-x-1 transition-transform duration-200">{profile.name}</div>
                        <div className="text-xs text-gray-400 mt-1 group-hover/item:translate-x-1 transition-transform duration-200">{profile.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}

          </div>
        </div>
      </form>
    </div>
  );
}
