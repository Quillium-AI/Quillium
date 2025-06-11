import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy logout requests to the backend
export async function POST(request: NextRequest) {
  try {
    // Get cookies from the incoming request
    const cookies = request.headers.get('cookie') || '';

    const response = await proxyRequest('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
      }
    });

    // Create the response object
    let responseData = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }

    const res = NextResponse.json(responseData, { status: response.status });

    // Forward any cookies from the backend response (including cookie clearing)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        res.headers.append('Set-Cookie', value);
      }
    });

    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the server.' },
      { status: 500 }
    );
  }
}
