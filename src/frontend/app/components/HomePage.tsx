"use client";

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SearchBox from './SearchBox';
import { FiZap, FiMessageSquare } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  
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
  
  const handleSearch = (query: string) => {
    router.push(`/chat?query=${query}`)
  };
  
  return (
    <div className="min-h-screen text-white relative">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main content */}
      <div className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
        <main className="relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
          {/* Center container - adjusted to account for sidebar */}
          <div className={`w-full max-w-4xl mx-auto transition-all duration-300 ${isSidebarOpen ? 'lg:-ml-36' : ''}`}>
            {/* Logo and Header */}
            <div className="mb-12 text-center relative">
              <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center justify-center mb-3">
                  <FiZap className="text-[var(--primary)] mr-3" size={32} />
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Quillium</h1>
                </div>
                <p className="mt-3 text-gray-300 text-lg">Your AI-powered chat assistant</p>
                <div className="mt-2 h-[2px] w-24 bg-gradient-to-r from-[var(--primary)]/50 to-transparent mx-auto"></div>
              </div>
            </div>
            
            {/* Search Box with enhanced container */}
            <div className="w-full max-w-2xl mx-auto relative">
              <div className="absolute -z-10 inset-0 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5 rounded-3xl blur-xl transform scale-105"></div>
              <div className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl">
                <SearchBox onSearch={handleSearch} />
              </div>
            </div>
            
            {/* Additional content - Features showcase */}
            <div className="mt-12 text-center">
              <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Powerful AI at your fingertips</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-800/30 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-[var(--primary)]/30 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/5 group">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center mx-auto mb-4">
                    <FiMessageSquare className="text-[var(--primary)] group-hover:scale-110 transition-transform duration-200" size={24} />
                  </div>
                  <h3 className="font-medium mb-2">Smart Conversations</h3>
                  <p className="text-gray-400 text-sm">Engage in natural, context-aware conversations</p>
                </div>
                
                <div className="bg-gray-800/30 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-[var(--secondary)]/30 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--secondary)]/5 group">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--secondary)]/5 flex items-center justify-center mx-auto mb-4">
                    <FiZap className="text-[var(--secondary)] group-hover:scale-110 transition-transform duration-200" size={24} />
                  </div>
                  <h3 className="font-medium mb-2">Lightning Fast</h3>
                  <p className="text-gray-400 text-sm">Get instant responses powered by advanced AI</p>
                </div>
                
                <div className="bg-gray-800/30 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-[var(--primary)]/30 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/5 group">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center mx-auto mb-4">
                    <svg className="text-[var(--primary)] group-hover:scale-110 transition-transform duration-200" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                    </svg>
                  </div>
                  <h3 className="font-medium mb-2">Personalized Experience</h3>
                  <p className="text-gray-400 text-sm">Tailored responses based on your preferences</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
