import { NextApiRequest, NextApiResponse } from 'next';
import { proxyRequest } from '../../../app/lib/serverUtils';

// Handler for chat message sending
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward the chat message to the backend
    const response = await proxyRequest('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the authorization cookie
        'Cookie': req.headers.cookie || '',
      },
      body: JSON.stringify(req.body),
    });

    // Check if the backend request was successful
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error || 'Failed to send chat message to backend',
      });
    }

    // Return the successful response
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error sending chat message:', error);
    return res.status(500).json({
      error: 'An internal error occurred while processing your chat message',
    });
  }
}
