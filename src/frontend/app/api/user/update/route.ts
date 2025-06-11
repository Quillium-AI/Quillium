import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy user update requests to the backend
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const cookies = request.headers.get('cookie') || '';

    const response = await proxyRequest('/api/user/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(body)
    });

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
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the server.' },
      { status: 500 }
    );
  }
}

// Also support POST requests for backward compatibility
export async function POST(request: NextRequest) {
  return PUT(request);
}
