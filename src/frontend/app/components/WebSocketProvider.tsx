"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { fetchApi } from '../utils/apiClient';
import { io, Socket } from 'socket.io-client';

// Define message types for better type safety
interface WebSocketMessage {
  type: string;
  payload: unknown;
}

type WebSocketContextType = {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
};

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => { }, // Empty function as default
});

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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const connectSocketIO = async () => {
      try {
        // First, ensure we're authenticated by making a request to the user info endpoint
        // This will set the cookie if it's not already set
        await fetchApi('/api/user/info');

        // Connect to Socket.IO server - using standard Socket.IO path
        const socket = io({
          path: '/socket.io',
          autoConnect: true,
          withCredentials: true,  // Important for passing cookies
          reconnection: true,
          reconnectionAttempts: 5,
          transports: ['polling', 'websocket'] // Start with polling (more compatible) then upgrade
        });

        socketRef.current = socket;

        // Handle connection events
        socket.on('connect', () => {
          console.log('Socket.IO connected');
          setIsConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('Socket.IO disconnected');
          setIsConnected(false);
        });

        socket.on('error', (error) => {
          console.error('Socket.IO error:', error);
        });

        socket.on('backendDisconnected', () => {
          console.log('Backend disconnected, waiting for reconnection');
        });

        // Handle incoming messages
        socket.on('message', (messageData) => {
          try {
            // Handle incoming messages from the server
            // The server already parsed the JSON for us
            setLastMessage(messageData as WebSocketMessage);
          } catch (e) {
            console.error('Error handling Socket.IO message:', e);
          }
        });
      } catch (error) {
        console.error('Socket.IO connection error:', error);
        // Socket.IO has built-in reconnection, but we can force it after errors
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.connect();
          } else {
            connectSocketIO();
          }
        }, 5000);
      }
    };

    // Start the Socket.IO connection
    connectSocketIO();

    // Cleanup when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Function to send messages through Socket.IO
  const sendMessage = (message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message', message);
    } else {
      console.warn('Socket not connected, message not sent');
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
