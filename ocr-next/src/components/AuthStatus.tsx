'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

/**
 * AuthStatus Component
 * 
 * Displays the current authentication status and user information.
 * Useful for debugging and monitoring auth state.
 * 
 * Displays:
 * - Authentication status (logged in / logged out)
 * - User name and email
 * - User role
 * - Token expiry time
 */
export function AuthStatus() {
  const { isAuthenticated, user, tokens, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return <div className="p-4 text-gray-400">Loading auth state...</div>;
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="text-sm font-semibold text-white mb-3">Authentication Status</h3>

      <div className="space-y-2 text-sm">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Status:</span>
          <span
            className={`px-2 py-1 rounded font-medium ${
              isAuthenticated
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>

        {/* User Info */}
        {user && (
          <>
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="ml-2 text-white">
                {user.first_name} {user.last_name}
              </span>
            </div>

            <div>
              <span className="text-gray-400">Email:</span>
              <span className="ml-2 text-white">{user.email}</span>
            </div>

            <div>
              <span className="text-gray-400">Role:</span>
              <span className="ml-2 text-white capitalize">{user.role}</span>
            </div>

            <div>
              <span className="text-gray-400">Status:</span>
              <span className="ml-2 text-white capitalize">{user.status}</span>
            </div>

            <div>
              <span className="text-gray-400">Verified:</span>
              <span className="ml-2 text-white">
                {user.is_verified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </>
        )}

        {/* Token Info */}
        {tokens && (
          <>
            <div className="pt-2 border-t border-slate-700">
              <span className="text-gray-400 text-xs">Token Expires:</span>
              <div className="mt-1 text-xs text-gray-300 break-all">
                {new Date(tokens.expiresAt).toLocaleString()}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-gray-400 text-xs">Access Token (first 50 chars):</span>
              <div className="mt-1 text-xs text-gray-500 break-all font-mono">
                {tokens.accessToken.substring(0, 50)}...
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
