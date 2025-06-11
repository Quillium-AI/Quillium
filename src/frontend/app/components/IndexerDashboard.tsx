"use client";

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { fetchApi } from '../utils/apiClient';

interface AdminSettings {
  elasticsearch_url: string;
  elasticsearch_username: string;
  elasticsearch_password: string;
}

interface ClusterHealth {
  cluster_name: string;
  status: string;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  active_shards_percent_as_number: number;
}

interface NodeStats {
  indices: {
    docs: {
      count: number;
      deleted: number;
    };
    store: {
      size_in_bytes: number;
    };
    indexing: {
      index_total: number;
      index_time_in_millis: number;
      index_current: number;
    };
    search: {
      query_total: number;
      query_time_in_millis: number;
      query_current: number;
    };
  };
  jvm: {
    mem: {
      heap_used_in_bytes: number;
      heap_used_percent: number;
      heap_max_in_bytes: number;
    };
  };
  os: {
    cpu: {
      percent: number;
    };
    mem: {
      total_in_bytes: number;
      used_in_bytes: number;
      free_in_bytes: number;
      used_percent: number;
    };
  };
}

interface IndexerMetrics {
  cluster_health: ClusterHealth | null;
  node_stats: NodeStats | null;
}

export default function IndexerDashboard() {
  const [settings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<IndexerMetrics | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial data fetch
  useEffect(() => {
    fetchElasticsearchData();
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchElasticsearchData();
    }, 60000); // Refresh every 60 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Fetch metrics from elasticsearch via backend proxy
  const fetchElasticsearchData = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Fetch cluster health through our Next.js API route proxy
      const healthResponse = await fetchApi('/api/elasticsearch/health');

      // Fetch node stats through our Next.js API route proxy
      const nodeStatsResponse = await fetchApi('/api/elasticsearch/stats');

      if (!healthResponse.ok) {
        throw new Error(`Failed to fetch cluster health: ${healthResponse.status}`);
      }

      if (!nodeStatsResponse.ok) {
        throw new Error(`Failed to fetch node stats: ${nodeStatsResponse.status}`);
      }

      const healthData = await healthResponse.json();
      const nodeStatsData = await nodeStatsResponse.json();

      // Extract the first node's stats (for simplicity)
      const firstNodeId = Object.keys(nodeStatsData.nodes)[0];
      const firstNodeStats = nodeStatsData.nodes[firstNodeId];

      setMetrics({
        cluster_health: healthData,
        node_stats: firstNodeStats
      });

      setLoading(false);
    } catch (err) {
      setError(`Error fetching elasticsearch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    if (settings?.elasticsearch_url) {
      fetchElasticsearchData();

      // Refresh every 30 seconds
      const timer = setInterval(() => {
        fetchElasticsearchData();
      }, 30000);

      setRefreshTimer(timer);

      return () => {
        if (refreshTimer) {
          clearInterval(refreshTimer);
        }
      };
    }
  }, [settings, refreshTimer]);

  const handleRefreshClick = () => {
    fetchElasticsearchData();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'green':
        return 'text-green-400';
      case 'yellow':
        return 'text-yellow-400';
      case 'red':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 p-8 relative">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="ml-3 text-lg font-medium">Loading Elasticsearch metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-red-500/30 p-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
        <div className="flex items-center mb-4">
          <FiAlertCircle className="text-red-400 mr-2" size={24} />
          <h2 className="text-xl font-semibold">Error Loading Elasticsearch Metrics</h2>
        </div>
        <p className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-4">{error}</p>
        <p className="text-gray-300 mb-4">
          Please check that Elasticsearch is running and accessible, and that the URL is correctly configured in the admin settings.
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleRefreshClick}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center transition-colors duration-200"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                Retry
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!settings?.elasticsearch_url) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-yellow-500/30 p-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-transparent"></div>
        <div className="flex items-center mb-4">
          <FiAlertCircle className="text-yellow-400 mr-2" size={24} />
          <h2 className="text-xl font-semibold">Elasticsearch URL Not Configured</h2>
        </div>
        <p className="text-gray-300 mb-4">
          Please configure the Elasticsearch URL in the system settings to view the indexer metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-transparent"></div>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <FiBarChart2 className="text-[var(--primary)] mr-3" size={24} />
            <h2 className="text-xl font-semibold">Elasticsearch Indexer Metrics</h2>
          </div>
          <button
            onClick={handleRefreshClick}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center transition-colors duration-200"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                Refresh
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cluster health card */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
            <h3 className="text-lg font-medium mb-4 border-b border-gray-600/30 pb-2">Cluster Health</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Cluster Name:</span>
                <span className="text-white">{metrics?.cluster_health?.cluster_name || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status:</span>
                <span className={`${metrics?.cluster_health?.status ? getStatusColor(metrics.cluster_health.status) : 'text-gray-400'}`}>
                  {metrics?.cluster_health?.status ? (
                    <>
                      {metrics.cluster_health.status === 'green' ? (
                        <><FiCheckCircle className="mr-1 inline" /> Green</>
                      ) : metrics.cluster_health.status === 'yellow' ? (
                        <><FiAlertCircle className="mr-1 inline" /> Yellow</>
                      ) : (
                        <><FiAlertCircle className="mr-1 inline" /> Red</>
                      )}
                    </>
                  ) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Connection:</span>
                <span className="text-white">via API proxy</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Nodes:</span>
                <span className="text-white">{metrics?.cluster_health?.number_of_nodes || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Data Nodes:</span>
                <span className="text-white">{metrics?.cluster_health?.number_of_data_nodes || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Shards Active:</span>
                <span className="text-white">
                  {metrics?.cluster_health ? formatNumber(metrics.cluster_health.active_shards) : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Index stats card */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
            <h3 className="text-lg font-medium mb-4 border-b border-gray-600/30 pb-2">Index Statistics</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Documents Count:</span>
                <span className="text-white">
                  {metrics?.node_stats?.indices.docs ? formatNumber(metrics.node_stats.indices.docs.count) : 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Documents Deleted:</span>
                <span className="text-white">
                  {metrics?.node_stats?.indices.docs ? formatNumber(metrics.node_stats.indices.docs.deleted) : 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Store Size:</span>
                <span className="text-white">
                  {metrics?.node_stats?.indices.store ? formatBytes(metrics.node_stats.indices.store.size_in_bytes) : '0 Bytes'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Shards Status:</span>
                <span className="text-white">
                  {metrics?.cluster_health ? (
                    <>
                      Active: {formatNumber(metrics.cluster_health.active_shards)},
                      Relocating: {formatNumber(metrics.cluster_health.relocating_shards)},
                      Initializing: {formatNumber(metrics.cluster_health.initializing_shards)},
                      Unassigned: {formatNumber(metrics.cluster_health.unassigned_shards)}
                    </>
                  ) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance metrics card */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
            <h3 className="text-lg font-medium mb-4 border-b border-gray-600/30 pb-2">Performance</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Indexing Operations:</span>
                <span className="text-white">
                  {metrics?.node_stats?.indices.indexing ? formatNumber(metrics.node_stats.indices.indexing.index_total) : 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Search Queries:</span>
                <span className="text-white">
                  {metrics?.node_stats?.indices.search ? formatNumber(metrics.node_stats.indices.search.query_total) : 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">CPU Usage:</span>
                <span className="text-white">
                  {metrics?.node_stats?.os.cpu ? formatPercentage(metrics.node_stats.os.cpu.percent) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">JVM Heap Usage:</span>
                <span className="text-white">
                  {metrics?.node_stats?.jvm.mem ? (
                    <>
                      {formatBytes(metrics.node_stats.jvm.mem.heap_used_in_bytes)} / {formatBytes(metrics.node_stats.jvm.mem.heap_max_in_bytes)}
                      ({formatPercentage(metrics.node_stats.jvm.mem.heap_used_percent)})
                    </>
                  ) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
