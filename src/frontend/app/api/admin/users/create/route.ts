import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../../lib/serverUtils';

// Proxy user creation requests to the backend
export async function POST(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    
    // Get the request body
    const body = await request.json();

    const response = await proxyRequest('/api/admin/users/create', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(body)
    });

    // If not authenticated or not admin, pass through the status
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: response.status === 401 ? 'Not authenticated' : 'Not authorized' },
        { status: response.status }
      );
    }

    let responseData = {};
    try {
      responseData = await response.json();
    } catch (e) {
      // If response is not JSON, use empty object
    }
    
    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('Admin user creation error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the server.' },
      { status: 500 }
    );
  }
}
