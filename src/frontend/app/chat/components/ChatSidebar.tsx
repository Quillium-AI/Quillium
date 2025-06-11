"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchUserChats, ChatData, formatTimestamp } from '../../utils/chatService';

interface ChatSidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function ChatSidebar({ isOpen, closeSidebar }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const loadChats = async () => {
      setIsLoading(true);
      try {
        const userChats = await fetchUserChats();
        setChats(userChats);
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChats();
  }, []);
  
  // On mobile, close sidebar when navigating
  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  // Create a new chat
  const handleNewChat = () => {
    router.push('/chat');
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 shadow-xl transition-all duration-300 z-20 ${
        isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 -translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Chats</h2>
          <button
            onClick={closeSidebar}
            className="p-1 hover:bg-gray-800 rounded-md lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="mb-4 w-full flex items-center justify-center py-2 px-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>New Chat</span>
        </button>
        
        {/* Chat List */}
        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No chats yet</p>
              <p className="text-sm mt-2">Start a new conversation</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {chats.map((chat) => {
                const isActive = pathname === `/chat/${chat.id}`;
                return (
                  <li key={chat.id}>
                    <button
                      onClick={() => handleChatClick(chat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[var(--primary)]/20 text-white'
                          : 'hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      <div className="truncate font-medium">{chat.title || 'Untitled Chat'}</div>
                      {chat.updatedAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(new Date(chat.updatedAt).getTime())}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
