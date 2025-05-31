import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy webcrawler metrics requests
export async function GET(request: NextRequest) {
  try {
    // Get cookies from the incoming request for authentication
    const cookies = request.headers.get('cookie') || '';

    // Get admin settings to find webcrawler URL
    const settingsResponse = await proxyRequest('/api/admin/settings/get', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
      }
    });

    if (!settingsResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch admin settings: ${settingsResponse.status}` },
        { status: settingsResponse.status }
      );
    }

    const settings = await settingsResponse.json();
    
    if (!settings.webcrawler_url) {
      return NextResponse.json(
        { error: 'Webcrawler URL not configured' },
        { status: 400 }
      );
    }

    // Make request to webcrawler metrics endpoint via backend proxy
    const webcrawlerUrl = new URL('/metrics', settings.webcrawler_url).toString();
    const response = await fetch(webcrawlerUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch webcrawler metrics: ${response.status}` },
        { status: response.status }
      );
    }

    // Metrics endpoint returns text in Prometheus format
    const metricsText = await response.text();
    
    return new NextResponse(metricsText, { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    console.error('Webcrawler metrics error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the webcrawler service.' },
      { status: 500 }
    );
  }
}
