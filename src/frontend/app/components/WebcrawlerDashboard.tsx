"use client";

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { fetchApi } from '../utils/apiClient';

interface MetricsData {
  pages_crawled: number;
  pages_failed: number;
  pages_skipped: number;
  bytes_downloaded: number;
  crawl_duration_seconds: number;
  requests_per_second: number;
  active_crawlers: number;
  queue_depth: number;
}

interface HealthStatus {
  status: string;
}

export default function WebcrawlerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [readyStatus, setReadyStatus] = useState<HealthStatus | null>(null);
  const [liveStatus, setLiveStatus] = useState<HealthStatus | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial data fetch
  useEffect(() => {
    fetchWebcrawlerData();
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchWebcrawlerData();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Parse Prometheus metrics text format
  const parsePrometheusMetrics = (metricsText: string): MetricsData => {
    const result: MetricsData = {
      pages_crawled: 0,
      pages_failed: 0,
      pages_skipped: 0,
      bytes_downloaded: 0,
      crawl_duration_seconds: 0,
      requests_per_second: 0,
      active_crawlers: 0,
      queue_depth: 0
    };

    const lines = metricsText.split('\n');

    // Extract metrics from the Prometheus format
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || line.trim() === '') continue;

      // Parse crawler_pages_crawled_total
      if (line.startsWith('crawler_pages_crawled_total')) {
        const match = line.match(/crawler_pages_crawled_total\s+(\d+)/);
        if (match && match[1]) {
          result.pages_crawled = parseInt(match[1], 10);
        }
      }

      // Parse crawler_request_errors_total for failed pages
      else if (line.startsWith('crawler_request_errors_total')) {
        const match = line.match(/crawler_request_errors_total\s+(\d+)/);
        if (match && match[1]) {
          result.pages_failed = parseInt(match[1], 10);
        }
      }

      // Parse crawler_active_crawlers
      else if (line.startsWith('crawler_active_crawlers')) {
        const match = line.match(/crawler_active_crawlers\s+(\d+)/);
        if (match && match[1]) {
          result.active_crawlers = parseInt(match[1], 10);
        }
      }

      // We can calculate requests per second based on other metrics if needed
      // For now, we'll leave it at 0 or implement a calculation later
    }

    return result;
  };

  // Fetch metrics from webcrawler via backend proxy
  const fetchWebcrawlerData = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Fetch metrics through our Next.js API route proxy
      const metricsResponse = await fetchApi('/api/webcrawler/metrics');
      if (metricsResponse.ok) {
        const metricsText = await metricsResponse.text();
        const parsedMetrics = parsePrometheusMetrics(metricsText);
        setMetrics(parsedMetrics);
      }

      // Fetch health checks through our Next.js API route proxy
      const healthResponse = await fetchApi('/api/webcrawler/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setReadyStatus(healthData.ready);
        setLiveStatus(healthData.live);
        setVersion(healthData.version);
      } else {
        setReadyStatus({ status: "error" });
        setLiveStatus({ status: "error" });
        setVersion("Unknown");
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching webcrawler data:', err);
      setError(`Failed to connect to webcrawler: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshClick = () => {
    fetchWebcrawlerData();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mr-3"></div>
          <p className="text-white">Loading webcrawler data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FiBarChart2 className="text-[var(--primary)] mr-2" size={20} />
              <h2 className="text-xl font-semibold">Webcrawler Status</h2>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-[var(--primary)]/80 hover:bg-[var(--primary)] text-white rounded-lg transition duration-200 flex items-center disabled:opacity-50"
              >
                {isRefreshing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                ) : (
                  <FiRefreshCw size={14} className="mr-1" />
                )}
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
              <p className="flex items-center"><FiAlertCircle className="mr-2" /> {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Health status card */}
            <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
              <h3 className="text-lg font-medium mb-4 border-b border-gray-600/30 pb-2">Health Status</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Liveness:</span>
                  <span className={`flex items-center ${liveStatus?.status === "ok" ? "text-green-400" : "text-red-400"}`}>
                    {liveStatus?.status === "ok" ?
                      <><FiCheckCircle className="mr-1" /> Healthy</> :
                      <><FiAlertCircle className="mr-1" /> Unhealthy</>
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Readiness:</span>
                  <span className={`flex items-center ${readyStatus?.status === "ok" ? "text-green-400" : "text-red-400"}`}>
                    {readyStatus?.status === "ok" ?
                      <><FiCheckCircle className="mr-1" /> Ready</> :
                      <><FiAlertCircle className="mr-1" /> Not Ready</>
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Version:</span>
                  <span className="text-white">{version || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Crawl stats card */}
            <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
              <h3 className="text-lg font-medium mb-4 border-b border-gray-600/30 pb-2">Crawl Statistics</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Pages Crawled:</span>
                  <span className="text-white">{metrics?.pages_crawled?.toLocaleString() || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Pages Failed:</span>
                  <span className="text-white">{metrics?.pages_failed?.toLocaleString() || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Pages Skipped:</span>
                  <span className="text-white">{metrics?.pages_skipped?.toLocaleString() || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Data Downloaded:</span>
                  <span className="text-white">{metrics ? formatBytes(metrics.bytes_downloaded) : "0 Bytes"}</span>
                </div>
              </div>
            </div>

            {/* Performance metrics card */}
            <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
              <h3 className="text-lg font-medium mb-4 border-b border-gray-600/30 pb-2">Performance</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Crawl Duration:</span>
                  <span className="text-white">{metrics?.crawl_duration_seconds ? `${metrics.crawl_duration_seconds.toFixed(2)}s` : "N/A"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Requests/Second:</span>
                  <span className="text-white">{metrics?.requests_per_second?.toFixed(2) || "0"}</span>
                </div>
              </div>
            </div>

            {/* Current state card */}
            <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
              <h3 className="text-lg font-medium mb-4 border-b border-gray-600/30 pb-2">Current State</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Active Crawlers:</span>
                  <span className="text-white">{metrics?.active_crawlers || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Queue Depth:</span>
                  <span className="text-white">{metrics?.queue_depth || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Connection:</span>
                  <span className="text-white">via API proxy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
