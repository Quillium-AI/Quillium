import { NextResponse } from 'next/server';
import { proxyRequest } from '../../lib/serverUtils';

// Health check endpoint to verify backend connectivity
export async function GET() {
  try {
    const response = await proxyRequest('/api/healthz');
    
    if (response.ok) {
      return NextResponse.json(
        { status: 'ok' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Backend health check failed' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Cannot connect to backend server' },
      { status: 500 }
    );
  }
}
