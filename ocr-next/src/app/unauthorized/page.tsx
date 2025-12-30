'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You don't have permission to access this resource.
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <p className="text-gray-300 text-sm mb-4">
            Your current role does not have access to this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row justify-center">
          <Link
            href="/"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Go to Home
          </Link>
          <Link
            href="/login"
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            Login Again
          </Link>
        </div>
      </div>
    </div>
  );
}
