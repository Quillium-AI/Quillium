"use client";

import { getApiUrl } from "../utils/getApiUrl";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

// Define message types for better type safety
type WebSocketMessage = {
  type: string;
  content: Record<string, unknown>;
};

type WebSocketContextType = {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

type WebSocketProviderProps = {
  children: ReactNode;
};

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // First, ensure we're authenticated by making a request to the user info endpoint
        // This will set the cookie if it's not already set
        await fetch(`${getApiUrl()}/api/user/info`, {
          credentials: 'include'
        });
        
        // Now connect to WebSocket - cookies will be sent automatically
        const ws = new WebSocket(`${getApiUrl()}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          // Minimal logging
          setIsConnected(true);
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ws.onerror = (_error) => {
          // Error handling without logging
        };

        ws.onmessage = (event) => {
          try {
            // Trim any extra characters that might cause parsing issues
            const trimmedData = String(event.data).trim();
            
            // Skip empty messages
            if (!trimmedData) return;
            
            const data = JSON.parse(trimmedData) as WebSocketMessage;
            // Set the message without any logging
            setLastMessage(data);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // Silent error handling - no logging
          }
        };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Error handling without logging
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Clean up WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Debug what we're sending
      console.log('Sending WebSocket message:', message);
      
      // Check if messages array is being sent correctly
      if (message.type === 'chat_request') {
        console.log('Messages array:', message.content.messages);
      }
      
      wsRef.current.send(JSON.stringify(message));
    } else {
      // WebSocket not connected - no logging
      console.warn('WebSocket not connected when trying to send message');
    }
  };

  const value = {
    isConnected,
    sendMessage,
    lastMessage,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
