'use client';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useLogoutMutation } from '@/store/services/authApi';
import { logout } from '@/store/features/authSlice';
import { useRouter } from 'next/navigation';

/**
 * LogoutButton Component
 * 
 * Handles user logout by:
 * 1. Calling the logout API endpoint
 * 2. Clearing Redux state
 * 3. Clearing localStorage
 * 4. Redirecting to login page
 */
export function LogoutButton() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [logoutMutation, { isLoading }] = useLogoutMutation();
  const { tokens } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      // Call logout API if token exists
      if (tokens?.accessToken) {
        await logoutMutation({
          accessToken: tokens.accessToken,
        }).unwrap();
      }

      // Clear Redux state
      dispatch(logout());

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');

      // Clear cookies if using them
      document.cookie = 'accessToken=; Max-Age=-99999999;';
      document.cookie = 'refreshToken=; Max-Age=-99999999;';

      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      dispatch(logout());
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
