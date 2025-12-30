'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { setTokens, setUser } from '@/store/features/authSlice';

/**
 * TokenInitializer Component
 * 
 * Restores authentication state from localStorage on app startup.
 * This ensures that users remain logged in after page refresh.
 * 
 * Usage: Add once in root layout after ReduxProvider
 */
export function TokenInitializer() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Load tokens from localStorage on app startup
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && !isAuthenticated) {
      try {
        // Restore user data from localStorage
        if (userStr) {
          const user = JSON.parse(userStr);
          dispatch(setUser(user));
        }

        // Restore tokens
        dispatch(
          setTokens({
            accessToken,
            refreshToken,
            expiresAt: localStorage.getItem('tokenExpiry') || '',
            tokenType: 'Bearer',
          })
        );
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        // Clear corrupted data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
      }
    }
  }, [dispatch, isAuthenticated]);

  return null;
}
