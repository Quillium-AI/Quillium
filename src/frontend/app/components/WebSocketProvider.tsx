"use client";

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
        await fetch('http://localhost:8080/api/user/info', {
          credentials: 'include'
        });
        
        // Now connect to WebSocket - cookies will be sent automatically
        const ws = new WebSocket('ws://localhost:8080/ws');
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            console.log('Received message:', data);
            setLastMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
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
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  };

  const value = {
    isConnected,
    sendMessage,
    lastMessage,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
