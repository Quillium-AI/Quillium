import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy webcrawler health check requests
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

    // Make requests to webcrawler health endpoints via backend proxy
    const healthChecks = {
      ready: { status: 'unknown' },
      live: { status: 'unknown' },
      version: { version: 'unknown' }
    };

    // Check readiness
    try {
      const readyUrl = new URL('/readyz', settings.webcrawler_url).toString();
      const readyResponse = await fetch(readyUrl);
      healthChecks.ready = { status: readyResponse.ok ? 'ok' : 'error' };
    } catch (error) {
      healthChecks.ready = { status: 'error' };
    }

    // Check liveness
    try {
      const liveUrl = new URL('/livez', settings.webcrawler_url).toString();
      const liveResponse = await fetch(liveUrl);
      healthChecks.live = { status: liveResponse.ok ? 'ok' : 'error' };
    } catch (error) {
      healthChecks.live = { status: 'error' };
    }

    // Get version
    try {
      const versionUrl = new URL('/version', settings.webcrawler_url).toString();
      const versionResponse = await fetch(versionUrl);
      if (versionResponse.ok) {
        healthChecks.version = await versionResponse.json();
      } else {
        healthChecks.version = { version: 'unknown' };
      }
    } catch (error) {
      healthChecks.version = { version: 'unknown' };
    }
    
    return NextResponse.json(healthChecks, { status: 200 });
  } catch (error) {
    console.error('Webcrawler health check error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the webcrawler service.' },
      { status: 500 }
    );
  }
}
