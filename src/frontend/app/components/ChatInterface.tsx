"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
import { useAuth } from './AuthProvider';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import ChatMessageProcessor from './ChatMessageProcessor';

// Types for WebSocket messages
export type Message = {
  content: string;
  role: 'user' | 'assistant';
  msgNum: number;
  sources?: Source[];

};

export type Source = {
  title: string;
  url: string;
  description: string;
  msgNum: number;
};

/**
 * Main chat interface component that combines all the smaller components
 */
export default function ChatInterface() {
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const { handleLogout, isLoggingOut, isDeletingAccount } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [qualityProfile] = useState('balanced');
  const [sources, setSources] = useState<Source[]>([]);

  
  // Reference to scroll to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = (message: string) => {
    if (!message.trim() || !isConnected || isLoading) return;

    // Add user message to the chat
    const newMessage: Message = {
      content: message,
      role: 'user',
      msgNum: messages.length + 1
    };
    setMessages(prev => [...prev, newMessage]);

    // Clear input and set loading state
    setInputValue('');
    setIsLoading(true);

    // Create the messages array with the current message and previous messages
    const updatedMessages = [...messages, newMessage];
    
    // Send message to the server
    sendMessage({
      type: 'chat_request',
      content: {
        message: message,
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          msgNum: msg.msgNum
        })),
        chatId: chatId,
        qualityProfile: qualityProfile
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <ChatHeader 
        isConnected={isConnected}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isDeletingAccount={isDeletingAccount}
      />

      {/* Message Processor - handles WebSocket messages */}
      <ChatMessageProcessor
        lastMessage={lastMessage}
        chatId={chatId}
        setChatId={setChatId}
        setMessages={setMessages}
        setIsLoading={setIsLoading}
        setSources={setSources}

      />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chat Area */}
          <div className="lg:w-2/3 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Messages */}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-8">
                <h2 className="text-xl font-semibold mb-2">Welcome to Quillium!</h2>
                <p>Ask any question to get started.</p>
              </div>
            ) : (
              <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
              />
            )}

            {/* Input Area */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isConnected={isConnected}
              inputValue={inputValue}
              setInputValue={setInputValue}
            />
          </div>

          {/* Sources Sidebar */}
          <ChatSidebar
            sources={sources}
          />
        </div>
      </main>
    </div>
  );
}