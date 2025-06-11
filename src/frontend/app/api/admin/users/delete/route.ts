import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../../lib/serverUtils';

// Proxy user deletion requests to the backend
// Supporting both GET and DELETE methods for better compatibility
export async function GET(request: NextRequest) {
  return handleDeleteRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleDeleteRequest(request);
}

async function handleDeleteRequest(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    
    // Get the id query parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const response = await proxyRequest(`/api/admin/users/delete?id=${id}`, {
      method: 'DELETE',
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
    } catch {
      responseData = {};
    }
    
    return NextResponse.json(responseData || { success: true }, { status: response.status });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the server.' },
      { status: 500 }
    );
  }
}
