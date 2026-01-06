'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import OCRScanner from '@/components/OCRScanner';

export default function ScannerPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const tokens = useSelector((state: RootState) => state.auth.tokens);
  const isInitialized = useSelector((state: RootState) => state.auth.isInitialized);

  useEffect(() => {
    // Only redirect after TokenInitializer has completed restoration
    if (isInitialized && (!user || !tokens || !tokens.accessToken)) {
      router.push('/login');
    }
  }, [isInitialized, user, tokens, router]);

  // Show loading while TokenInitializer restores auth state
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if not authenticated after initialization
  if (!user || !tokens || !tokens.accessToken) {
    return null;
  }

  return <OCRScanner />;
}
