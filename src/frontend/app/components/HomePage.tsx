"use client";

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SearchBox from './SearchBox';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      // Auto-close sidebar on small screens when resizing
      if (window.innerWidth < 1024 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleSearch = (query: string, profileId: string) => {
    // This would be implemented later to handle actual search functionality
    console.log(`Searching for: ${query} with profile: ${profileId}`);
    // For now, we could redirect to a chat page or similar
    // router.push(`/chat?query=${encodeURIComponent(query)}&profile=${profileId}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main content */}
      <div className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <main className="relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
          {/* Center container - adjusted to account for sidebar */}
          <div className={`w-full max-w-4xl mx-auto transition-all duration-300 ${isSidebarOpen ? 'lg:-ml-32' : ''}`}>
            {/* Logo */}
            <div className="mb-10 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Quillium</h1>
              <p className="mt-2 text-gray-400">Your AI-powered chat assistant</p>
            </div>
            
            {/* Search Box */}
            <div className="w-full max-w-2xl mx-auto">
              <SearchBox onSearch={handleSearch} />
            </div>
            
            {/* Additional content can be added here */}
            <div className="mt-10 text-center text-gray-400 text-sm">
              <p>Ask any question or start a conversation</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
