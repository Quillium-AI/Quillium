import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebSocketUrl } from '../services/api';

/**
 * Custom hook for WebSocket communication
 * @returns {Object} - WebSocket state and methods
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Connect to WebSocket
  useEffect(() => {
    // Get WebSocket URL
    const url = getWebSocketUrl();
    
    // Create WebSocket connection
    const socket = new WebSocket(url);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connection established');
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, data]);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setMessages((prevMessages) => [...prevMessages, event.data]);
      }
    });

    // Listen for errors
    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
    });

    // Connection closed
    socket.addEventListener('close', (event) => {
      setIsConnected(false);
      if (event.wasClean) {
        console.log(`WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        console.error('WebSocket connection died');
        setError(`WebSocket connection died. Code: ${event.code}`);
      }
    });

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socketRef.current.send(message);
      return true;
    }
    return false;
  }, []);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState !== WebSocket.CLOSED) {
        socketRef.current.close();
      }
      socketRef.current = new WebSocket(getWebSocketUrl());
    }
  }, []);

  return { isConnected, messages, error, sendMessage, reconnect };
}

export default useWebSocket;
