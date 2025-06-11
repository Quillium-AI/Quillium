"use client";

import { useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface Source {
  title: string;
  url: string;
  snippet?: string;
}

interface MessageListProps {
  messages: Message[];
  currentResponse: string;
  isTyping: boolean;
  sources?: Source[];
}

export default function MessageList({ messages, currentResponse, isTyping, sources }: MessageListProps) {
  // Create a typing indicator effect
  const typingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTyping && typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping, currentResponse]);

  return (
    <div className="space-y-6 pb-4">
      {messages.length === 0 && !isTyping && (
        <div className="text-center text-gray-400 py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p>Ask Quillium anything...</p>
        </div>
      )}

      {messages.map((message, index) => (
        <div 
          key={index} 
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              message.role === 'user'
                ? 'bg-[var(--primary)]/20 text-white ml-auto'
                : message.role === 'system'
                ? 'bg-red-500/20 text-red-100'
                : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50'
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}

      {/* Current streaming response */}
      {isTyping && currentResponse && (
        <div className="flex justify-start" ref={typingRef}>
          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
            {currentResponse}
            <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Typing indicator when just starting */}
      {isTyping && !currentResponse && (
        <div className="flex justify-start" ref={typingRef}>
          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Sources section - only show after assistant has responded */}
      {sources && sources.length > 0 && messages.some(msg => msg.role === 'assistant') && (
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Sources</h3>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-2 text-sm">
                <a 
                  href={source.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)]/80 hover:text-[var(--primary)] font-medium break-all"
                >
                  {source.title || source.url}
                </a>
                {source.snippet && (
                  <p className="text-gray-400 mt-1 text-xs line-clamp-2">{source.snippet}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
