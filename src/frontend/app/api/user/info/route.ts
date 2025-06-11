import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy user info requests to the backend
export async function GET(request: NextRequest) {
  try {
    // Get cookies from the incoming request
    const cookies = request.headers.get('cookie') || '';

    const response = await proxyRequest('/api/user/info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
      }
    });

    // If not authenticated, pass through the 401 status
    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create the response object
    let responseData = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }
    
    const res = NextResponse.json(responseData, { status: response.status });
    
    // Forward any cookies from the backend response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        res.headers.append('Set-Cookie', value);
      }
    });
    
    return res;
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the server.' },
      { status: 500 }
    );
  }
}
