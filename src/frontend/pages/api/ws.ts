// Import required modules
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocket } from 'ws';
import { getBackendUrl } from '../../app/lib/serverUtils';

// Keep track of Socket.IO server and WebSocket connections
let io: SocketIOServer;
let connections = new Map<string, WebSocket>();

// Define NextApiResponse with socket.server property
type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// Socket.IO handler for Next.js Pages API
const SocketHandler = async (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  // Only set up Socket.IO server if it doesn't exist yet
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    
    // Create new Socket.IO server attached to Next.js HTTP server
    io = new SocketIOServer(res.socket.server, {
      path: '/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Save Socket.IO server instance on Next.js server object
    res.socket.server.io = io;
    
    // Set up Socket.IO connection handler
    io.on('connection', (socket) => {
      console.log('New client connected via Socket.IO:', socket.id);
      
      // Create WebSocket connection to backend
      const backendUrl = getBackendUrl();
      const wsUrl = `${backendUrl.replace('http', 'ws')}/ws`;
      console.log(`Connecting to backend WebSocket at: ${wsUrl}`);
      
      try {
        // Connect to backend WebSocket with cookies
        const ws = new WebSocket(wsUrl, {
          headers: {
            'Cookie': socket.handshake.headers.cookie || ''
          }
        });
        
        // Store WebSocket connection
        connections.set(socket.id, ws);
        
        // Forward messages from backend to client
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            socket.emit('message', message);
          } catch (err) {
            console.error('Failed to parse backend message:', err);
          }
        });
        
        // Handle WebSocket errors
        ws.on('error', (err) => {
          console.error('Backend WebSocket error:', err);
          socket.emit('error', { message: 'Backend connection error' });
        });
        
        // Handle WebSocket close
        ws.on('close', () => {
          console.log(`Backend WebSocket closed for client: ${socket.id}`);
          socket.emit('backendDisconnected');
        });
        
        // Handle messages from client to backend
        socket.on('message', (message) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          } else {
            socket.emit('error', { message: 'Backend connection not ready' });
          }
        });
        
        // Handle client disconnect
        socket.on('disconnect', () => {
          console.log(`Client disconnected: ${socket.id}`);
          const ws = connections.get(socket.id);
          if (ws) {
            ws.close();
            connections.delete(socket.id);
          }
        });
      } catch (err) {
        console.error('Failed to connect to backend WebSocket:', err);
        socket.emit('error', { message: 'Failed to connect to backend' });
      }
    });
  }
  
  // Send success response and end
  res.status(200).end();
};

export default SocketHandler;

// Disable Next.js body parsing for WebSocket connections
export const config = {
  api: {
    bodyParser: false,
  },
};
