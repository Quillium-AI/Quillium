import React from 'react';
import useWebSocket from '../../hooks/useWebSocket';
import './WebSocketStatus.css';

const WebSocketStatus = () => {
  const { isConnected, messages, error, sendMessage } = useWebSocket();

  const handlePing = () => {
    sendMessage(JSON.stringify({ type: 'ping', payload: { timestamp: new Date().toISOString() } }));
  };

  return (
    <div className="websocket-status">
      <div className="status-indicator">
        <span>WebSocket Status: </span>
        {isConnected ? (
          <span className="connected">Connected</span>
        ) : (
          <span className="disconnected">Disconnected</span>
        )}
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button 
        className="ping-button" 
        onClick={handlePing} 
        disabled={!isConnected}
      >
        Send Ping
      </button>
      
      <div className="messages">
        <h3>Messages ({messages.length}):</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              {typeof msg === 'string' ? msg : JSON.stringify(msg)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketStatus;
