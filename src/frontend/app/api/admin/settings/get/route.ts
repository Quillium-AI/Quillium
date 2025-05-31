import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../../lib/serverUtils';

// Proxy admin settings requests to the backend
export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';

    const response = await proxyRequest('/api/admin/settings/get', {
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

    let responseData = {};
    try {
      responseData = await response.json();
    } catch (e) {
      // If response is not JSON, use empty object
    }
    
    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('Admin settings error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the server.' },
      { status: 500 }
    );
  }
}
