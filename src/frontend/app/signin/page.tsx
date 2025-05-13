"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiAlertCircle, FiLogIn, FiUserPlus, FiCheckSquare } from 'react-icons/fi';
import '../globals.css';
import { getApiUrl } from '../utils/getApiUrl';

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

      try {
        const response = await fetch(`${getApiUrl()}/api/healthz`, {
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

      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
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
          remember_me: formData.rememberMe
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
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--primary)]/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[var(--secondary)]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-[var(--secondary)]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full p-8 bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 relative z-10">
        <div className="flex justify-center mb-8 relative">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-[var(--primary)]/10 rounded-full blur-2xl opacity-70"></div>
          <div className="flex items-center relative">
            <FiLogIn className="text-[var(--primary)] mr-3" size={28} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Quillium</h1>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-center mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Login to Your Account</h2>
        <p className="text-gray-400 text-center mb-8">
          Please enter your email and password to continue
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-start bg-red-900/30 text-red-200 border border-red-500/30">
            <span className="mr-3 mt-0.5">
              <FiAlertCircle className="text-red-400" size={20} />
            </span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5 group">
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">
              E-Mail Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm text-white"
                placeholder="example@domain.com"
                required
              />
              <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
            </div>
          </div>

          <div className="mb-5 group">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm text-[var(--primary)] hover:text-[var(--secondary)] transition-colors duration-200">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm text-white"
                placeholder="your password"
                required
              />
              <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
            </div>
          </div>

          <div className="mb-8 flex items-center">
            <label className="relative flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="peer absolute opacity-0 h-5 w-5 cursor-pointer"
                tabIndex={0}
              />
              <div className="h-5 w-5 rounded border border-gray-500 peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] flex items-center justify-center transition-all duration-200">
                {formData.rememberMe && <FiCheckSquare className="text-white" size={14} />}
              </div>
              <span className="ml-3 block text-sm text-gray-300">Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-6 rounded-xl font-medium shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[var(--primary)]/20 group"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-base">Logging in...</span>
              </span>
            ) : (
              <span className="flex items-center">
                <FiLogIn className="mr-3 group-hover:translate-x-1 transition-transform duration-200" size={20} />
                <span className="text-base">Login</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            No account yet?{' '}
            <Link href="/signup" className="text-[var(--primary)] hover:text-[var(--secondary)] transition-colors duration-200 flex items-center justify-center mt-2">
              <FiUserPlus className="mr-2" size={16} />
              <span>Create an account</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
