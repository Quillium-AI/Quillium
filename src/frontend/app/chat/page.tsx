"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { ChatAPIProvider } from '../components/ChatAPIProvider';
import ChatInterface from './components/ChatInterface';
import ChatSidebar from './components/ChatSidebar';

export default function ChatPage() {
  return (
    <AuthProvider>
      <ChatPageWithAuth />
    </AuthProvider>
  );
}

function ChatPageWithAuth() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

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
              <svg className="text-red-400 relative w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    router.push('/signin');
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative z-10">
        <div className="flex flex-col items-center bg-gray-800/50 p-8 rounded-2xl backdrop-blur-md border border-gray-700/50 shadow-xl">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[var(--primary)]/20 rounded-full blur-md animate-pulse"></div>
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-r-transparent rounded-full animate-spin relative"></div>
          </div>
          <p className="text-lg font-medium">Redirecting to sign in...</p>
          <div className="mt-4 h-1 w-48 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render the chat content
  return (
    <ChatAPIProvider>
      <ChatPageContent />
    </ChatAPIProvider>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chatId, setChatId] = useState<string | null>(null);
  const initialQueryRef = useRef<string | null>(searchParams?.get('query') ?? null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Close sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  
  // Handle chat ID changes - redirect to specific chat URL when a chatId is assigned
  useEffect(() => {
    if (chatId) {
      router.push(`/chat/${chatId}`);
    }
  }, [chatId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Background decorative elements like on the home page */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--primary)]/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[var(--secondary)]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-[var(--secondary)]/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Sidebar */}
      <ChatSidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-5xl relative z-10">
        {/* Chat header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleSidebar}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>Home</span>
              </div>
            </button>
          </div>
          
          <h1 className="text-xl font-semibold hidden sm:block">New Chat</h1>
          
          <div className="w-6"></div> {/* Spacer to balance the flex layout */}
        </div>

        {/* Chat interface */}
        <ChatInterface initialQuery={initialQueryRef.current} chatId={chatId} onChatIdChange={setChatId} />
      </div>
    </div>
  );
}
