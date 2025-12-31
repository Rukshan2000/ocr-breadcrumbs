'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/store/services/authApi';
import { setUser, setTokens } from '@/store/features/authSlice';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      if (response.success && response.data?.user && response.data?.tokens) {
        // Store user and tokens in Redux
        dispatch(setUser(response.data.user));
        dispatch(setTokens(response.data.tokens));

        // Store tokens and user data in localStorage for persistence
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('tokenExpiry', response.data.tokens.expiresAt);

        // Small delay to ensure Redux state is updated before navigation
        setTimeout(() => {
          // Redirect to scanner page
          router.push('/scanner');
        }, 100);
      } else {
        setError('Login response invalid. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row md:items-center md:justify-center">
      {/* Mobile/Desktop Container */}
      <div className="w-full md:max-w-md">
        {/* Cover Image Section */}
        <div 
          className="w-full h-56 md:h-72 bg-cover bg-center relative rounded-b-3xl md:rounded-3xl overflow-hidden shadow-lg"
          style={{
            backgroundImage: `url(/bg.jpeg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>
          
          {/* Logo in top left */}
          <div className="absolute top-4 left-6">
            <img src="/logo_2.png" alt="OCR Logo" className="h-8 w-auto" />
          </div>
        </div>

        {/* Form Section - White Card */}
        <form onSubmit={handleSubmit} className="px-6 md:px-8 py-8 md:py-10 bg-white rounded-b-3xl md:rounded-3xl shadow-lg">
          
          {/* Header Text */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-base md:text-lg">Enter your details below</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-5 py-4 rounded-xl text-sm flex items-start gap-3 mb-6 animate-shake">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 pl-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="nicholas@example.com"
              disabled={isLoading}
              className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 font-medium focus:outline-none focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>

          {/* Password Field */}
          <div className="mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 pl-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 font-medium focus:outline-none focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition duration-200 pr-12 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

         
          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-base md:text-lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>

        </form>
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
