import { NextApiRequest, NextApiResponse } from 'next';
import { proxyRequest } from '../../../app/lib/serverUtils';

// Function to create the Server-Sent Events (SSE) stream
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for event streaming
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId } = req.query;
  if (!chatId || typeof chatId !== 'string') {
    return res.status(400).json({ error: 'Chat ID is required' });
  }

  try {
    // Set up headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Prevents Nginx from buffering the response
    });

    // Function to send data to the client
    const sendData = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Keep the connection alive with a ping every 15 seconds
    const pingInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    // Create a connection to the backend streaming endpoint
    const backendUrl = `/api/chat/stream?chatId=${chatId}`;
    
    try {
      // Create a fetch request to the backend API
      const response = await proxyRequest(backendUrl, {
        headers: {
          // Forward the authorization cookie
          'Cookie': req.headers.cookie || '',
        },
      });

      // Ensure the response is ok
      if (!response.ok) {
        const errorText = await response.text();
        sendData({ 
          type: 'error',
          error: `Backend API error: ${response.status} ${errorText}` 
        });
        clearInterval(pingInterval);
        return res.end();
      }

      // Read the response body as a ReadableStream
      const reader = response.body?.getReader();
      if (!reader) {
        sendData({ type: 'error', error: 'Backend did not provide a readable stream' });
        clearInterval(pingInterval);
        return res.end();
      }

      // Process the stream from the backend
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        if (value) {
          // Convert the received bytes to text
          const text = new TextDecoder().decode(value);
          
          // Split by newlines in case we get multiple events
          const lines = text.split('\n');
          
          for (const line of lines) {
            // Skip empty lines and ping events
            if (!line.trim() || line.startsWith(':')) continue;
            
            // Parse the data
            if (line.startsWith('data:')) {
              try {
                const jsonStr = line.slice(5).trim();
                const eventData = JSON.parse(jsonStr);
                
                // Forward the event data to the client
                sendData(eventData);
                
                // If we received a "done" event, close the stream
                if (eventData.done) {
                  clearInterval(pingInterval);
                  return res.end();
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
                // Just forward the raw data if we can't parse it
                sendData({ type: 'raw', content: line.slice(5).trim() });
              }
            }
          }
        }
      }
      
      // End the response when the backend stream ends
      clearInterval(pingInterval);
      res.end();
    } catch (error) {
      console.error('Error streaming from backend:', error);
      sendData({ 
        type: 'error', 
        error: 'Error connecting to backend stream service' 
      });
      clearInterval(pingInterval);
      res.end();
    }
  } catch (error) {
    console.error('SSE setup error:', error);
    return res.status(500).json({ error: 'Failed to set up event stream' });
  }
}
