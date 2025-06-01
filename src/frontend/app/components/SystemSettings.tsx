"use client";

import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { fetchApi } from '../utils/apiClient';

// Define system settings interface based on backend types
interface SystemSettings {
  openai_base_url: string;
  openai_api_key_encrypt?: string;
  openai_api_key?: string; // For frontend use only, not stored in backend
  llm_profile_speed: string;
  llm_profile_balanced: string;
  llm_profile_quality: string;
  enable_sign_ups: boolean;
  webcrawler_url: string;
  elasticsearch_url: string;
  elasticsearch_username: string;
  elasticsearch_password: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    openai_base_url: '',
    openai_api_key: '',
    llm_profile_speed: '',
    llm_profile_balanced: '',
    llm_profile_quality: '',
    enable_sign_ups: false,
    webcrawler_url: '',
    elasticsearch_url: '',
    elasticsearch_username: '',
    elasticsearch_password: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch system settings on component mount
  useEffect(() => {
    fetchSystemSettings();
  }, []);

  // Function to fetch system settings
  const fetchSystemSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchApi('/api/admin/settings/get', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to save system settings
  const saveSystemSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Create a copy of settings that will be sent to the server
      // We want to avoid sending API key fields directly
      const settingsToSend = {...settings};
      
      // If API keys are provided, include them in the request
      // The backend will handle encryption
      if (settings.openai_api_key) {
        settingsToSend.openai_api_key = settings.openai_api_key;
        // Remove the encrypted version if it exists to avoid confusion
        delete settingsToSend.openai_api_key_encrypt;
      } else {
        // If no new API key is provided, don't send anything to keep the existing one
        delete settingsToSend.openai_api_key;
      }

      const response = await fetchApi('/api/admin/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to save system settings');
      }

      // Clear sensitive data from form
      setSettings(prev => ({
        ...prev,
        openai_api_key: '',
      }));

      // Refresh settings to get updated data
      fetchSystemSettings();
      
      setSuccess('System settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-center space-x-3">
          <FiRefreshCw className="animate-spin text-[var(--primary)]" />
          <span className="text-gray-300">Loading system settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-500/20 text-red-300 p-4 rounded-xl flex items-center border border-red-500/30">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/20 text-green-300 p-4 rounded-xl flex items-center border border-green-500/30">
            <FiCheckCircle className="mr-2 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Configuration Section */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5 col-span-1 md:col-span-2">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-600/50 pb-2">API Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">OpenAI Compatiable Base URL</label>
                <input
                  type="text"
                  name="openai_comp_base_url"
                  value={settings.openai_base_url}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">OpenAI Compatiable API Key</label>
                <input
                  type="password"
                  name="openai_comp_api_key"
                  value={settings.openai_api_key || ''}
                  onChange={handleInputChange}
                  placeholder={settings.openai_api_key_encrypt ? '••••••••••••••••••••••' : 'Enter API key'}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                />
                {settings.openai_api_key_encrypt && (
                  <p className="text-xs text-gray-400 mt-1">API key is stored securely. Enter a new key only if you want to change it.</p>
                )}
              </div>
            </div>
          </div>

          {/* LLM Profiles Section */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5 col-span-1 md:col-span-2">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-600/50 pb-2">LLM Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Speed Profile</label>
                <input
                  type="text"
                  name="llm_profile_speed"
                  value={settings.llm_profile_speed}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                  placeholder="e.g., gpt-4-turbo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Balanced Profile</label>
                <input
                  type="text"
                  name="llm_profile_balanced"
                  value={settings.llm_profile_balanced}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                  placeholder="e.g., gpt-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quality Profile</label>
                <input
                  type="text"
                  name="llm_profile_quality"
                  value={settings.llm_profile_quality}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                  placeholder="e.g., claude-3-opus"
                />
              </div>
            </div>
          </div>

          {/* Webcrawler Configuration */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-600/50 pb-2">Webcrawler</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Webcrawler URL</label>
                <input
                  type="text"
                  name="webcrawler_url"
                  value={settings.webcrawler_url}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Elasticsearch Configuration */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-600/50 pb-2">Elasticsearch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Elasticsearch URL</label>
                <input
                  type="text"
                  name="elasticsearch_url"
                  value={settings.elasticsearch_url}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  name="elasticsearch_username"
                  value={settings.elasticsearch_username}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  name="elasticsearch_password"
                  value={settings.elasticsearch_password}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/70 text-white rounded-lg border border-gray-600/50 p-2.5 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* User Registration Section */}
          <div className="bg-gray-700/40 rounded-xl border border-gray-600/30 p-5 col-span-1 md:col-span-2">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-600/50 pb-2">User Management</h3>
            <div className="flex items-center">
              <input
                id="enable_sign_ups"
                name="enable_sign_ups"
                type="checkbox"
                checked={settings.enable_sign_ups}
                onChange={handleInputChange}
                className="w-4 h-4 text-[var(--primary)] bg-gray-800 border-gray-600 rounded focus:ring-[var(--primary)] focus:ring-opacity-25"
              />
              <label htmlFor="enable_sign_ups" className="ml-2 text-sm font-medium text-gray-300">
                Enable user sign-ups
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveSystemSettings}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white rounded-xl hover:from-[var(--primary)]/90 hover:to-[var(--primary)]/70 active:scale-95 transition-all duration-200 flex items-center shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FiRefreshCw className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
