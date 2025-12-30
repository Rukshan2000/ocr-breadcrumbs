'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import OCRScanner from '@/components/OCRScanner';

export default function ScannerPage() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const tokens = useSelector((state: any) => state.auth.tokens);

  useEffect(() => {
    // Check if user is authenticated
    if (!user || !tokens || !tokens.accessToken) {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }, [user, tokens, router]);

  // Don't render scanner until authentication is verified
  if (!user || !tokens || !tokens.accessToken) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <OCRScanner />;
}
