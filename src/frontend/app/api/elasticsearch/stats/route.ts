import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy Elasticsearch node stats requests
export async function GET(request: NextRequest) {
  try {
    // Get cookies from the incoming request for authentication
    const cookies = request.headers.get('cookie') || '';

    // Get admin settings to find Elasticsearch URL and credentials
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
    
    if (!settings.elasticsearch_url || !settings.elasticsearch_username || !settings.elasticsearch_password) {
      return NextResponse.json(
        { error: 'Elasticsearch connection not properly configured' },
        { status: 400 }
      );
    }

    // Make request to Elasticsearch node stats endpoint
    const statsUrl = new URL('/_nodes/stats', settings.elasticsearch_url).toString();
    const response = await fetch(statsUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${settings.elasticsearch_username}:${settings.elasticsearch_password}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch Elasticsearch node stats: ${response.status}` },
        { status: response.status }
      );
    }

    const statsData = await response.json();
    
    return NextResponse.json(statsData, { status: 200 });
  } catch (error) {
    console.error('Elasticsearch stats error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the Elasticsearch service.' },
      { status: 500 }
    );
  }
}
