"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../globals.css';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const SignIn: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password.length <= 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);

      // For development/testing purposes - check if backend is available
      try {
        const response = await fetch('http://localhost:8080/api/healthz', {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn('Backend health check failed:', response.status);
        }
      } catch (healthError) {
        console.error('Backend server may not be running:', healthError);
        setError('Cannot connect to the backend server. Please ensure it is running.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Important: include credentials to receive and send cookies
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
      });

      const data = await response.json();

      // Redirect to dashboard
      if (response.status === 200) {
        router.push('/');
      } else if (response.status === 401) {
        setError(data.message || 'Wrong email or password.');
      } else if (response.status === 500) {
        setError(data.message || 'Failed to invoke login endpoint');
      }
    } catch (err: Error | unknown) {
      console.error('Login error:', err);
      setError('Network error: Cannot connect to the server.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Quillium</h1>
        </div>
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-200">Login to Quillium</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Please enter your email and password to login.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              E-Mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="your password"
              required
            />
          </div>

          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No account yet?{' '}
            <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
