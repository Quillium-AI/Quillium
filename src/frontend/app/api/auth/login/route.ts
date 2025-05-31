import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy login requests to the backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await proxyRequest('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const responseData = await response.json();
    
    // Create the response object
    const res = NextResponse.json(responseData, { status: response.status });
    
    // Forward any cookies from the backend response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        res.headers.append('Set-Cookie', value);
      }
    });
    
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Network error: Cannot connect to the server.' },
      { status: 500 }
    );
  }
}
