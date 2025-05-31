"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {  FiAlertCircle, FiUserPlus, FiLogIn } from 'react-icons/fi';
import '../globals.css';
import { fetchApi } from '../utils/apiClient';


interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email:'',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to validate password against backend requirements
  const isValidPassword = (password: string): boolean => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLongEnough = password.length > 8;

    return hasUppercase && hasLowercase && hasNumber && isLongEnough;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    
    // Username validation
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isValidPassword(formData.password)) {
      setError('Your Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);

      // For development/testing purposes - check if backend is available
      try {
        const healthResponse = await fetchApi('/api/healthz', {
          method: 'GET'
        });

        if (!healthResponse.ok) {
          console.warn('Backend health check failed:', healthResponse.status);
        }
      } catch (healthError) {
        console.error('Backend server may not be running:', healthError);
        setError('Cannot connect to the backend server. Please ensure it is running.');
        setLoading(false);
        return;
      }

      // API Endpoints defined
      const response = await fetchApi('/api/auth/signup', {
        method:'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      // Handle different response statuses
      if (response.status === 200 || response.status === 201) {
        // Signup successful
        router.push('/');
      } else {
        // Handle specific error cases
        if (response.status === 409) {
          setError('User already exists.');
        } else if (response.status === 400) {
          setError(data.error || 'Invalid input. Please check your information.');
        } else {
          setError(data.error || 'An error occurred. Please try again later.');
        }
      }
    } catch (err: Error | unknown) {
      console.error('Signup error:', err);
      setError('Network error: Cannot connect to the server.');
    } finally {
      setLoading(false);
    }
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
            <FiUserPlus className="text-[var(--primary)] mr-3" size={28} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Quillium</h1>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-center mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Create Your Account</h2>
        <p className="text-gray-400 text-center mb-8">
          Join Quillium and start your AI journey
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
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm text-white"
                placeholder="YourUsername"
                required
                minLength={3}
              />
              <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
            </div>
          </div>

          <div className="mb-5 group">
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm text-white"
                placeholder="examplepassword1234"
                required
              />
              <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
            </div>
            <p className="mt-2 text-xs text-gray-400">Must have uppercase, lowercase, number, and be 8+ characters</p>
          </div>

          <div className="mb-8 group">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-300 group-focus-within:text-[var(--primary)] transition-colors duration-200">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-gray-700/70 block w-full pl-4 pr-4 py-2 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 outline-none transition-all duration-200 backdrop-blur-sm text-white"
                placeholder="Repeat password"
                required
              />
              <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center"></div>
            </div>
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
                <span className="text-base">Creating account...</span>
              </span>
            ) : (
              <span className="flex items-center">
                <FiUserPlus className="mr-3 group-hover:translate-x-1 transition-transform duration-200" size={20} />
                <span className="text-base">Create Account</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-[var(--primary)] hover:text-[var(--secondary)] transition-colors duration-200 flex items-center justify-center mt-2">
              <FiLogIn className="mr-2" size={16} />
              <span>Sign in to your account</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
