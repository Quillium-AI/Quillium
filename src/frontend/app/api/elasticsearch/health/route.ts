import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '../../../lib/serverUtils';

// Proxy Elasticsearch cluster health check requests
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

    // Make request to Elasticsearch cluster health endpoint
    const healthUrl = new URL('/_cluster/health', settings.elasticsearch_url).toString();
    const response = await fetch(healthUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${settings.elasticsearch_username}:${settings.elasticsearch_password}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch Elasticsearch cluster health: ${response.status}` },
        { status: response.status }
      );
    }

    const healthData = await response.json();
    
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Elasticsearch health check error:', error);
    return NextResponse.json(
      { error: 'Network error: Cannot connect to the Elasticsearch service.' },
      { status: 500 }
    );
  }
}
