import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// GET handler - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    
    // Forward request to backend - this endpoint is correct as is
    const response = await proxyRequest('/api/admin/users', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
      }
    });

    // If not authenticated or not admin, pass through the status
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: response.status === 401 ? 'Not authenticated' : 'Not authorized' },
        { status: response.status }
      );
    }

    // Get response data
    let data = [];
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, use empty array
    }

    // Return response with same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
