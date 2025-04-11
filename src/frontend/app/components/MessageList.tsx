"use client";

import { useRef, useEffect } from 'react';
import { Message } from './ChatInterface';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Component that displays the chat messages
 */
export default function MessageList({ messages, isLoading, messagesEndRef: externalMessagesEndRef }: MessageListProps) {
  // Use provided ref or create our own if not provided
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
              }`}
          >
            <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 dark:bg-gray-700 dark:text-white">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
