"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { fetchApi } from '../utils/apiClient';

// Define message types for better type safety
export interface ChatMessage {
  type: string;
  payload: unknown;
}

type ChatResponseType = {
  lastMessage: ChatMessage | null;
  sendMessage: (message: ChatMessage) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  startEventStream: (chatId: string) => void;
  endEventStream: () => void;
};

const ChatAPIContext = createContext<ChatResponseType>({
  lastMessage: null,
  sendMessage: async () => {},
  isLoading: false,
  isError: false,
  error: null,
  startEventStream: () => {},
  endEventStream: () => {},
});

export function useChatAPI() {
  const context = useContext(ChatAPIContext);
  if (context === undefined) {
    throw new Error('useChatAPI must be used within a ChatAPIProvider');
  }
  return context;
}

type ChatAPIProviderProps = {
  children: ReactNode;
};

export function ChatAPIProvider({ children }: ChatAPIProviderProps) {
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  
  // Function to send chat messages via REST API
  const sendMessage = async (message: ChatMessage) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      // Send the message to the chat endpoint
      const response = await fetchApi('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const data = await response.json();
      
      // If the message was sent successfully but doesn't require streaming
      if (data && !data.streaming) {
        setLastMessage({
          type: 'chat_response',
          payload: data
        });
      }
      
      setIsLoading(false);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
      
      // Set an error message that can be consumed by components
      setLastMessage({
        type: 'error',
        payload: { error: err instanceof Error ? err.message : 'Message could not be sent' }
      });
    }
  };
  
  // Start Server-Sent Events stream for a specific chat
  const startEventStream = (chatId: string) => {
    // Close any existing event stream first
    if (eventSource) {
      eventSource.close();
    }
    
    try {
      // Create a new EventSource connection
      const newEventSource = new EventSource(`/api/chat/stream?chatId=${chatId}`);
      
      // Set up event handlers
      newEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage({
            type: 'chat_stream',
            payload: data
          });
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };
      
      newEventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        setIsError(true);
        setError('Connection to chat stream failed');
        newEventSource.close();
        setEventSource(null);
      };
      
      setEventSource(newEventSource);
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setIsError(true);
      setError('Failed to start chat stream');
    }
  };
  
  // End the event stream
  const endEventStream = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };
  
  const value = {
    lastMessage,
    sendMessage,
    isLoading,
    isError,
    error,
    startEventStream,
    endEventStream,
  };
  
  return <ChatAPIContext.Provider value={value}>{children}</ChatAPIContext.Provider>;
}
