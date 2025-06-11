import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '../../../lib/serverUtils';

export async function GET() {
  const cookieStore = cookies();
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}/api/user/chats`;

  try {
    // Forward the request to the backend with cookies
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': cookieStore.toString(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    // Parse response data
    let data = [];
    try {
      data = await response.json();
    } catch {
      data = [];
    }

    // Return response with same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}
